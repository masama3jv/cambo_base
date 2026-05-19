import express, { Router } from 'express';
import { query } from '../db/connection.js';
import { verifyToken, AuthRequest, requireRole } from '../middleware/auth.js';

const router: Router = express.Router();

// GET /api/admin/dashboard - Get admin dashboard
router.get('/dashboard', verifyToken, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    // Get pending inscriptions count
    const pendingInscriptions = await query(`
      SELECT COUNT(*) as count FROM teams 
      WHERE status IN ('pendent_docs', 'pendent_pagament', 'pendent_validacio')
    `) as any[];

    // Get total teams
    const totalTeams = await query('SELECT COUNT(*) as count FROM teams') as any[];

    // Get pending documents
    const pendingDocuments = await query(`
      SELECT COUNT(*) as count FROM documents WHERE status IN ('pendent', 'rebutjat')
    `) as any[];

    // Get active tournaments
    const activeTournaments = await query('SELECT COUNT(*) as count FROM tournaments') as any[];

    res.json({
      pendingInscriptions: pendingInscriptions[0]?.count || 0,
      totalTeams: totalTeams[0]?.count || 0,
      pendingDocuments: pendingDocuments[0]?.count || 0,
      activeTournaments: activeTournaments[0]?.count || 0
    });
  } catch (error) {
    console.error('Error fetching admin dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard' });
  }
});

// GET /api/admin/inscriptions - Get all pending inscriptions
router.get('/inscriptions', verifyToken, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const inscriptions = await query(`
      SELECT 
        t.id,
        t.name,
        t.sport,
        t.status,
        u.name as capita_name,
        u.email as capita_email,
        COUNT(DISTINCT tp.user_id) as player_count,
        COUNT(DISTINCT CASE WHEN d.status = 'aprovat' THEN d.id END) as approved_docs,
        COUNT(DISTINCT d.id) as total_docs
      FROM teams t
      JOIN users u ON t.capita_id = u.id
      LEFT JOIN team_players tp ON t.id = tp.team_id
      LEFT JOIN documents d ON t.id = d.team_id
      WHERE t.status IN ('pendent_docs', 'pendent_pagament', 'pendent_validacio')
      GROUP BY t.id
      ORDER BY t.created_at DESC
    `);

    res.json(inscriptions);
  } catch (error) {
    console.error('Error fetching inscriptions:', error);
    res.status(500).json({ error: 'Failed to fetch inscriptions' });
  }
});

// GET /api/admin/inscriptions/:teamId - Get team documents
router.get('/inscriptions/:teamId', verifyToken, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { teamId } = req.params;

    // Get team info
    const teams = await query('SELECT * FROM teams WHERE id = ?', [teamId]) as any[];
    if (teams.length === 0) {
      return res.status(404).json({ error: 'Team not found' });
    }

    // Get all players and their documents
    const players = await query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        GROUP_CONCAT(
          JSON_OBJECT('type', d.document_type, 'status', d.status, 'id', d.id, 'rejection_reason', d.rejection_reason)
          SEPARATOR ','
        ) as documents
      FROM team_players tp
      JOIN users u ON tp.user_id = u.id
      LEFT JOIN documents d ON d.user_id = tp.user_id AND d.team_id = ?
      WHERE tp.team_id = ?
      GROUP BY tp.user_id
    `, [teamId, teamId]) as any[];

    res.json({
      team: teams[0],
      players: players.map((p: any) => ({
        ...p,
        documents: p.documents ? JSON.parse('[' + p.documents + ']') : []
      }))
    });
  } catch (error) {
    console.error('Error fetching team documents:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// POST /api/admin/inscriptions/:teamId/approve-document - Approve document
router.post('/inscriptions/:teamId/approve-document', verifyToken, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { teamId } = req.params;
    const { documentId } = req.body;

    if (!documentId) {
      return res.status(400).json({ error: 'Document ID required' });
    }

    await query(
      'UPDATE documents SET status = ? WHERE id = ? AND team_id = ?',
      ['aprovat', documentId, teamId]
    );

    // Check if all documents for team are approved
    const pendingDocs = await query(`
      SELECT COUNT(*) as count FROM documents
      WHERE team_id = ? AND status != 'aprovat'
    `, [teamId]) as any[];

    if (pendingDocs[0]?.count === 0) {
      // Update team status to inscrit
      await query('UPDATE teams SET status = ? WHERE id = ?', ['inscrit', teamId]);
    }

    res.json({ message: 'Document approved' });
  } catch (error) {
    console.error('Error approving document:', error);
    res.status(500).json({ error: 'Failed to approve document' });
  }
});

// POST /api/admin/inscriptions/:teamId/reject-document - Reject document
router.post('/inscriptions/:teamId/reject-document', verifyToken, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { teamId } = req.params;
    const { documentId, reason } = req.body;

    if (!documentId) {
      return res.status(400).json({ error: 'Document ID required' });
    }

    await query(
      'UPDATE documents SET status = ?, rejection_reason = ? WHERE id = ? AND team_id = ?',
      ['rebutjat', reason || 'No reason provided', documentId, teamId]
    );

    res.json({ message: 'Document rejected' });
  } catch (error) {
    console.error('Error rejecting document:', error);
    res.status(500).json({ error: 'Failed to reject document' });
  }
});

// POST /api/admin/generate-calendar - Generate tournament calendar
router.post('/generate-calendar', verifyToken, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { 
      tournamentConfig: { 
        format, 
        numTeams, 
        courts, 
        timeSlots, 
        matchDuration,
        pointsWin,
        pointsDraw,
        pointsLoss 
      } 
    } = req.body;

    if (!format || !numTeams || !courts || !timeSlots) {
      return res.status(400).json({ error: 'Missing configuration' });
    }

    // Get inscribed teams
    const teams = await query(`
      SELECT id FROM teams WHERE status IN ('inscrit', 'pendent_validacio')
      LIMIT ?
    `, [numTeams]) as any[];

    if (teams.length < numTeams) {
      return res.status(400).json({ error: 'Not enough teams' });
    }

    // Create tournament
    const result = await query(
      `INSERT INTO tournaments (name, format, points_win, points_draw, points_loss, match_duration)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [`Tournament-${Date.now()}`, format, pointsWin, pointsDraw, pointsLoss, matchDuration]
    ) as any;

    const tournamentId = result.insertId;

    // TODO: Generate matches based on format
    // For now, just create a simple round-robin if format is 'lliga'

    // Insert courts
    for (const court of courts) {
      await query(
        'INSERT INTO courts (tournament_id, name, location) VALUES (?, ?, ?)',
        [tournamentId, court.name, court.location]
      );
    }

    // Update teams to 'actiu'
    await query(
      'UPDATE teams SET status = ? WHERE id IN (?)',
      ['actiu', teams.map((t: any) => t.id)]
    );

    res.json({
      message: 'Calendar generated successfully',
      tournamentId,
      teamsCount: teams.length
    });
  } catch (error) {
    console.error('Error generating calendar:', error);
    res.status(500).json({ error: 'Failed to generate calendar' });
  }
});

export default router;
