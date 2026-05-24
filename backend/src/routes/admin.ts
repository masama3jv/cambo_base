import express, { Router } from 'express';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import { query } from '../db/connection.js';
import { verifyToken, AuthRequest, requireRole } from '../middleware/auth.js';
import { generateCalendar, saveMatchesToDatabase } from '../services/calendarService.js';

const router: Router = express.Router();

// GET /api/admin/dashboard - Get admin dashboard
router.get('/dashboard', verifyToken, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const totalTeams = await query('SELECT COUNT(*) as count FROM teams') as any[];
    const pendingInscriptions = await query(`
      SELECT COUNT(*) as count FROM teams 
      WHERE status IN ('pendent_docs', 'pendent_pagament', 'pendent_validacio')
    `) as any[];
    const pendingDocuments = await query(`
      SELECT COUNT(*) as count FROM documents WHERE status IN ('pendent', 'rebutjat')
    `) as any[];
    const activeTournaments = await query('SELECT COUNT(*) as count FROM tournaments') as any[];
    const totalUsers = await query('SELECT COUNT(*) as count FROM users') as any[];
    const totalMatches = await query('SELECT COUNT(*) as count FROM matches') as any[];
    const activeCourts = await query('SELECT COUNT(*) as count FROM courts') as any[];

    res.json({
      totalTeams: totalTeams[0]?.count || 0,
      pendingValidations: pendingInscriptions[0]?.count || 0,
      pendingDocuments: pendingDocuments[0]?.count || 0,
      activeTournaments: activeTournaments[0]?.count || 0,
      totalUsers: totalUsers[0]?.count || 0,
      scheduledMatches: totalMatches[0]?.count || 0,
      activeCourts: activeCourts[0]?.count || 0
    });
  } catch (error) {
    console.error('Error fetching admin dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard' });
  }
});

// GET /api/admin/tournaments - List all tournaments with match info
router.get('/tournaments', verifyToken, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const tournaments = await query(`
      SELECT 
        t.*,
        (SELECT COUNT(*) FROM matches WHERE tournament_id = t.id) as total_matches,
        (SELECT COUNT(*) FROM matches WHERE tournament_id = t.id AND status = 'finalitzat') as completed_matches,
        (SELECT COUNT(*) FROM courts WHERE tournament_id = t.id) as court_count
      FROM tournaments t
      ORDER BY t.created_at DESC
    `);
    res.json(tournaments);
  } catch (error) {
    console.error('Error fetching tournaments:', error);
    res.status(500).json({ error: 'Failed to fetch tournaments' });
  }
});

// GET /api/admin/tournaments/:id/matches - Get matches for a tournament
router.get('/tournaments/:id/matches', verifyToken, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const matches = await query(`
      SELECT 
        m.*,
        t1.name as home_team_name,
        t2.name as away_team_name,
        c.name as court_name,
        ar.name as arbitre_name
      FROM matches m
      LEFT JOIN teams t1 ON m.home_team_id = t1.id
      LEFT JOIN teams t2 ON m.away_team_id = t2.id
      LEFT JOIN courts c ON m.court_id = c.id
      LEFT JOIN users ar ON m.arbitre_id = ar.id
      WHERE m.tournament_id = ?
      ORDER BY m.match_date ASC
    `, [req.params.id]);

    res.json(matches);
  } catch (error) {
    console.error('Error fetching tournament matches:', error);
    res.status(500).json({ error: 'Failed to fetch tournament matches' });
  }
});

// POST /api/admin/matches/:id/assign-referee - Assign a referee to a match
router.post('/matches/:id/assign-referee', verifyToken, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { arbitreId } = req.body;
    if (!arbitreId) {
      return res.status(400).json({ error: 'Referee ID required' });
    }
    await query('UPDATE matches SET arbitre_id = ? WHERE id = ?', [arbitreId, req.params.id]);
    res.json({ message: 'Àrbitre assignat correctament' });
  } catch (error) {
    console.error('Error assigning referee:', error);
    res.status(500).json({ error: 'Failed to assign referee' });
  }
});

// GET /api/admin/inscriptions - Get all pending inscriptions
router.get('/inscriptions', verifyToken, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const rows = await query(`
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
    `) as any[];

    const teams = rows.map((row: any) => ({
      id: String(row.id),
      name: row.name,
      sport: row.sport,
      captain: row.capita_name,
      status: row.status === 'inscrit' || row.status === 'actiu' ? 'approved' : 'pending',
      playerCount: row.player_count || 0,
      approvedDocs: row.approved_docs || 0,
      totalDocs: row.total_docs || 0
    }));

    res.json({ teams });
  } catch (error) {
    console.error('Error fetching inscriptions:', error);
    res.status(500).json({ error: 'Failed to fetch inscriptions' });
  }
});

// GET /api/admin/inscriptions/:teamId - Get team documents
router.get('/inscriptions/:teamId', verifyToken, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { teamId } = req.params;

    const teams = await query('SELECT * FROM teams WHERE id = ?', [teamId]) as any[];
    if (teams.length === 0) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const players = await query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        GROUP_CONCAT(
          JSON_OBJECT('type', d.document_type, 'status', d.status, 'id', d.id, 'file_path', d.file_path, 'rejection_reason', d.rejection_reason)
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

// GET /api/admin/download-document/:documentId - Admin downloads a document
// Also accepts ?token= for direct link access from browser
router.get('/download-document/:documentId', async (req: AuthRequest, res) => {
  const queryToken = req.query.token as string;
  if (queryToken) {
    try {
      const decoded = jwt.verify(queryToken, process.env.JWT_SECRET || 'secret') as any;
      req.userId = decoded.id;
      req.userRole = decoded.role;
    } catch (e: any) {
      console.error('Download-doc query-token verify error:', e?.message);
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (req.userRole !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
  } else {
    const headerToken = req.headers.authorization?.replace('Bearer ', '');
    if (!headerToken) {
      return res.status(401).json({ error: 'No token provided' });
    }
    try {
      const decoded = jwt.verify(headerToken, process.env.JWT_SECRET || 'secret') as any;
      req.userId = decoded.id;
      req.userRole = decoded.role;
    } catch (e: any) {
      console.error('Download-doc header-token verify error:', e?.message);
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (req.userRole !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
  }

  try {
    const docs = await query('SELECT * FROM documents WHERE id = ?', [req.params.documentId]) as any[];
    if (docs.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }
    const doc = docs[0];
    // Try to serve from file_data (DB) first, fall back to disk
    if (doc.file_data) {
      const buf = Buffer.from(doc.file_data, 'base64');
      res.writeHead(200, {
        'Content-Type': doc.file_path?.endsWith('.pdf') ? 'application/pdf' :
                        doc.file_path?.endsWith('.png') ? 'image/png' :
                        doc.file_path?.endsWith('.jpg') || doc.file_path?.endsWith('.jpeg') ? 'image/jpeg' : 'application/octet-stream',
        'Content-Length': buf.length,
        'Content-Disposition': `inline; filename="${path.basename(doc.file_path || 'document')}"`
      });
      res.end(buf);
      return;
    }
    const filePath = path.resolve(doc.file_path);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not available (uploaded file no longer exists on server)' });
    }
    res.download(filePath);
  } catch (error) {
    console.error('Error downloading document:', error);
    res.status(500).json({ error: 'Failed to download document' });
  }
});

// POST /api/admin/inscriptions/:teamId/approve-all - Approve and mark team as inscrit
router.post('/inscriptions/:teamId/approve-all', verifyToken, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { teamId } = req.params;
    await query('UPDATE teams SET status = ? WHERE id = ?', ['pendent_pagament', teamId]);
    res.json({ message: 'Inscripció aprovada' });
  } catch (error) {
    console.error('Error approving inscription:', error);
    res.status(500).json({ error: 'Failed to approve inscription' });
  }
});

// POST /api/admin/inscriptions/:teamId/reject - Reject inscription
router.post('/inscriptions/:teamId/reject', verifyToken, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { teamId } = req.params;
    await query('UPDATE teams SET status = ? WHERE id = ?', ['rebutjat', teamId]);
    res.json({ message: 'Inscripció rebutjada' });
  } catch (error) {
    console.error('Error rejecting inscription:', error);
    res.status(500).json({ error: 'Failed to reject inscription' });
  }
});

// ===== REFEREES =====

// GET /api/admin/users?role=arbitre - List referees
router.get('/users', verifyToken, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const role = req.query.role as string || 'arbitre';
    const users = await query(
      'SELECT id, name, email, role, email_verified, created_at FROM users WHERE role = ? ORDER BY created_at DESC',
      [role]
    );
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// POST /api/admin/invite-referee - Create/register a referee
router.post('/invite-referee', verifyToken, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email required' });
    }

    const existing = await query('SELECT id FROM users WHERE email = ?', [email]) as any[];
    if (existing.length > 0) {
      return res.status(409).json({ error: 'A user with this email already exists' });
    }

    const bcrypt = await import('bcrypt');
    const defaultPassword = 'referee123';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    const result = await query(
      'INSERT INTO users (name, email, password, role, email_verified) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashedPassword, 'arbitre', true]
    ) as any;

    res.status(201).json({
      id: result.insertId,
      name,
      email,
      role: 'arbitre',
      message: 'Àrbitre creat correctament'
    });
  } catch (error) {
    console.error('Error inviting referee:', error);
    res.status(500).json({ error: 'Failed to invite referee' });
  }
});

// DELETE /api/admin/users/:id - Remove user
router.delete('/users/:id', verifyToken, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const existing = await query('SELECT id FROM users WHERE id = ?', [id]) as any[];
    if (existing.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    await query('DELETE FROM users WHERE id = ?', [id]);
    res.json({ message: 'Usuari eliminat correctament' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// ===== VENUES / COURTS =====

// GET /api/admin/venues - List all courts
router.get('/venues', verifyToken, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const courts = await query(`
      SELECT c.*, t.name as tournament_name 
      FROM courts c 
      LEFT JOIN tournaments t ON c.tournament_id = t.id 
      ORDER BY c.created_at DESC
    `);
    res.json(courts);
  } catch (error) {
    console.error('Error fetching venues:', error);
    res.status(500).json({ error: 'Failed to fetch venues' });
  }
});

// POST /api/admin/venues - Create a new court/venue
router.post('/venues', verifyToken, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { name, location } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Name required' });
    }
    const result = await query(
      'INSERT INTO courts (name, location) VALUES (?, ?)',
      [name, location || 'Campo Base']
    ) as any;
    res.status(201).json({ id: result.insertId, name, location: location || 'Campo Base' });
  } catch (error) {
    console.error('Error creating venue:', error);
    res.status(500).json({ error: 'Failed to create venue' });
  }
});

// PUT /api/admin/venues/:id - Update a court/venue
router.put('/venues/:id', verifyToken, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { name, location } = req.body;
    await query('UPDATE courts SET name = ?, location = ? WHERE id = ?', [name, location, id]);
    res.json({ message: 'Venue updated' });
  } catch (error) {
    console.error('Error updating venue:', error);
    res.status(500).json({ error: 'Failed to update venue' });
  }
});

// DELETE /api/admin/venues/:id - Delete a court/venue
router.delete('/venues/:id', verifyToken, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM courts WHERE id = ?', [id]);
    res.json({ message: 'Venue deleted' });
  } catch (error) {
    console.error('Error deleting venue:', error);
    res.status(500).json({ error: 'Failed to delete venue' });
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
      // Update team status to pendent_pagament
      await query('UPDATE teams SET status = ? WHERE id = ?', ['pendent_pagament', teamId]);
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

// GET /api/admin/inscrit-teams - Get teams eligible for tournament (status = inscrit)
router.get('/inscrit-teams', verifyToken, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const teams = await query(`SELECT id, name, sport FROM teams WHERE status = 'inscrit' ORDER BY name`);
    res.json(teams);
  } catch (error) {
    console.error('Error fetching inscrit teams:', error);
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

// POST /api/admin/generate-calendar - Generate tournament calendar
router.post('/generate-calendar', verifyToken, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { 
      tournamentName,
      sport,
      format,
      startDate,
      endDate,
      matchDurationMinutes,
      breakMinutes,
      courts: courtNames,
      matchesPerDay,
      winPoints,
      drawPoints,
      lossPoints,
      tiebreaker,
      teamIds
    } = req.body;

    if (!format || !startDate || !endDate || !matchDurationMinutes || !courtNames || courtNames.length === 0) {
      return res.status(400).json({ error: 'Missing required fields: format, startDate, endDate, matchDurationMinutes, courts' });
    }

    // Get selected teams (or all inscrit if not specified)
    let teams: any[];
    if (teamIds && teamIds.length > 0) {
      const placeholders = teamIds.map(() => '?').join(',');
      teams = await query(`SELECT id, name FROM teams WHERE id IN (${placeholders})`, teamIds) as any[];
    } else {
      teams = await query(`SELECT id, name FROM teams WHERE status = 'inscrit'`) as any[];
    }

    if (teams.length < 2) {
      return res.status(400).json({ error: 'Need at least 2 teams to generate calendar' });
    }

    // Create tournament first (courts need a tournament_id)
    const tournamentNameStr = tournamentName || `Torneig-${Date.now()}`;
    const tournamentResult = await query(
      `INSERT INTO tournaments (name, sport, format, status, start_date, end_date, match_duration, match_duration_minutes, points_win, points_draw, points_loss, tiebreaker) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [tournamentNameStr, sport || 'futsal', format, 'actiu', startDate, endDate, matchDurationMinutes, matchDurationMinutes, winPoints || 3, drawPoints || 1, lossPoints || 0, tiebreaker || 'goal_difference']
    ) as any;

    const tournamentId = tournamentResult.insertId;

    // Create courts with tournament_id
    const courtsData = [];
    for (const courtName of courtNames) {
      const result = await query(
        'INSERT INTO courts (name, location, tournament_id) VALUES (?, ?, ?)',
        [courtName, 'Campo Base', tournamentId]
      ) as any;
      courtsData.push({ id: result.insertId, name: courtName });
    }

    // Map Catalan format values to calendar service format names
    const formatMap: Record<string, string> = {
      lliga: 'round_robin', grups: 'groups', eliminatoria: 'elimination', mixt: 'mixed'
    };
    const calendarFormat = formatMap[format] || format;

    // Generate calendar using calendar service
    const config = {
      tournamentId,
      format: calendarFormat as 'round_robin' | 'groups' | 'elimination' | 'mixed',
      teams,
      courts: courtsData,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      matchDurationMinutes,
      breakMinutes: breakMinutes || 5,
      datesAvailable: [],
      matchesPerDay: matchesPerDay || 4
    };

    const scheduledMatches = await generateCalendar(config);
    const savedCount = await saveMatchesToDatabase(tournamentId, scheduledMatches);

    // Update teams to 'actiu' (only those with inscrit status)
    await query(
      'UPDATE teams SET status = ? WHERE status = ?',
      ['actiu', 'inscrit']
    );

    // Update tournament status to 'generat'
    await query(
      'UPDATE tournaments SET status = ? WHERE id = ?',
      ['generat', tournamentId]
    );

    res.json({
      message: 'Calendar generated successfully',
      tournamentId,
      teamsCount: teams.length,
      matchesCount: savedCount,
      courtsCount: courtsData.length,
      startDate,
      endDate,
      format
    });
  } catch (error) {
    console.error('Error generating calendar:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to generate calendar' });
  }
});

// POST /api/admin/reset-db - Reset database for testing (keeps only the calling admin)
router.post('/reset-db', verifyToken, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    // Disable FK checks for clean deletion
    await query('SET FOREIGN_KEY_CHECKS = 0');
    const tables = ['match_sheets', 'matches', 'documents', 'notifications', 'invitations', 'team_players', 'inscriptions', 'teams', 'tournaments', 'courts', 'venues'];
    for (const t of tables) {
      try { await query(`DELETE FROM \`${t}\``); } catch { /* table may not exist */ }
    }
    await query('SET FOREIGN_KEY_CHECKS = 1');
    await query('DELETE FROM users WHERE id != ?', [req.userId]);
    res.json({ message: 'Base de dades reiniciada. Només es manté el teu usuari admin.' });
  } catch (error) {
    console.error('Error resetting database:', error);
    res.status(500).json({ error: 'Error reiniciant la base de dades' });
  }
});

export default router;
