import express, { Router } from 'express';
import { query } from '../db/connection.js';
import { verifyToken, AuthRequest } from '../middleware/auth.js';

const router: Router = express.Router();

// GET /api/dashboard - Get capita dashboard data
router.get('/', verifyToken, async (req: AuthRequest, res) => {
  try {
    if (req.userRole !== 'capita') {
      return res.status(403).json({ error: 'Only for capita role' });
    }

    // Get team info
    const teams = await query('SELECT * FROM teams WHERE capita_id = ?', [req.userId]) as any[];
    const team = teams.length > 0 ? teams[0] : null;

    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    // Get next match
    const matches = await query(`
      SELECT m.*, c.name as court_name, u.name as arbitre_name
      FROM matches m
      LEFT JOIN courts c ON m.court_id = c.id
      LEFT JOIN users u ON m.arbitre_id = u.id
      WHERE (m.home_team_id = ? OR m.away_team_id = ?)
      AND m.status IN ('pendent', 'en_curs')
      ORDER BY m.match_date
      LIMIT 1
    `, [team.id, team.id]) as any[];

    const nextMatch = matches.length > 0 ? matches[0] : null;

    // Get team statistics
    const stats = await query(`
      SELECT 
        COUNT(CASE WHEN (home_team_id = ? AND home_score > away_score) OR (away_team_id = ? AND away_score > home_score) THEN 1 END) as wins,
        COUNT(CASE WHEN home_score = away_score THEN 1 END) as draws,
        COUNT(CASE WHEN (home_team_id = ? AND home_score < away_score) OR (away_team_id = ? AND away_score < home_score) THEN 1 END) as losses,
        COUNT(*) as matches_played
      FROM matches
      WHERE (home_team_id = ? OR away_team_id = ?)
      AND status = 'finalitzat'
    `, [team.id, team.id, team.id, team.id, team.id, team.id]) as any[];

    // Get pending documents
    const pendingDocs = await query(`
      SELECT COUNT(*) as count FROM documents
      WHERE team_id = ? AND status IN ('pendent', 'rebutjat')
    `, [team.id]) as any[];

    // Get inscription steps
    const inscriptionSteps = [
      { label: 'Pendent docs', completed: team.status !== 'pendent_docs' },
      { label: 'Pendent pagament', completed: team.status !== 'pendent_pagament' && team.status !== 'pendent_docs' },
      { label: 'Pendent validació', completed: team.status !== 'pendent_validacio' && team.status !== 'pendent_pagament' && team.status !== 'pendent_docs' },
      { label: 'Inscrit', completed: team.status === 'inscrit' || team.status === 'actiu' },
      { label: 'Actiu', completed: team.status === 'actiu' }
    ];

    res.json({
      teamName: team.name,
      sport: team.sport,
      status: team.status,
      nextMatch: nextMatch ? {
        date: nextMatch.match_date,
        court: nextMatch.court_name,
        opponent: nextMatch.home_team_id === team.id ? 'Away Team' : 'Home Team',
        arbitre: nextMatch.arbitre_name
      } : null,
      statistics: stats[0] || { wins: 0, draws: 0, losses: 0, matches_played: 0 },
      pendingDocuments: pendingDocs[0]?.count || 0,
      inscriptionSteps
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// GET /api/team/players - Get team players
router.get('/players', verifyToken, async (req: AuthRequest, res) => {
  try {
    const teams = await query('SELECT * FROM teams WHERE capita_id = ?', [req.userId]) as any[];

    if (teams.length === 0) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const players = await query(`
      SELECT u.id, u.name, u.email, tp.dorsal, tp.position
      FROM team_players tp
      JOIN users u ON tp.user_id = u.id
      WHERE tp.team_id = ?
    `, [teams[0].id]);

    res.json(players);
  } catch (error) {
    console.error('Error fetching players:', error);
    res.status(500).json({ error: 'Failed to fetch players' });
  }
});

// GET /api/team/matches - Get team matches
router.get('/matches', verifyToken, async (req: AuthRequest, res) => {
  try {
    const teams = await query('SELECT * FROM teams WHERE capita_id = ?', [req.userId]) as any[];

    if (teams.length === 0) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const matches = await query(`
      SELECT 
        m.*,
        c.name as court_name,
        u.name as arbitre_name,
        t1.name as home_team_name,
        t2.name as away_team_name
      FROM matches m
      LEFT JOIN courts c ON m.court_id = c.id
      LEFT JOIN users u ON m.arbitre_id = u.id
      LEFT JOIN teams t1 ON m.home_team_id = t1.id
      LEFT JOIN teams t2 ON m.away_team_id = t2.id
      WHERE m.home_team_id = ? OR m.away_team_id = ?
      ORDER BY m.match_date DESC
    `, [teams[0].id, teams[0].id]);

    res.json(matches);
  } catch (error) {
    console.error('Error fetching matches:', error);
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
});

// GET /api/team/statistics - Get team statistics
router.get('/statistics', verifyToken, async (req: AuthRequest, res) => {
  try {
    const teams = await query('SELECT * FROM teams WHERE capita_id = ?', [req.userId]) as any[];

    if (teams.length === 0) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const teamId = teams[0].id;

    // Get overall stats
    const overallStats = await query(`
      SELECT 
        COUNT(CASE WHEN (home_team_id = ? AND home_score > away_score) OR (away_team_id = ? AND away_score > home_score) THEN 1 END) as wins,
        COUNT(CASE WHEN home_score = away_score THEN 1 END) as draws,
        COUNT(CASE WHEN (home_team_id = ? AND home_score < away_score) OR (away_team_id = ? AND away_score < home_score) THEN 1 END) as losses
      FROM matches
      WHERE (home_team_id = ? OR away_team_id = ?) AND status = 'finalitzat'
    `, [teamId, teamId, teamId, teamId, teamId, teamId]) as any[];

    // Get player statistics
    const playerStats = await query(`
      SELECT 
        u.id,
        u.name,
        COUNT(DISTINCT CASE WHEN (m.home_team_id = tp.team_id AND m.home_score > m.away_score) OR (m.away_team_id = tp.team_id AND m.away_score > m.home_score) THEN m.id END) as wins,
        COUNT(DISTINCT m.id) as matches_played
      FROM team_players tp
      JOIN users u ON tp.user_id = u.id
      LEFT JOIN matches m ON (m.home_team_id = tp.team_id OR m.away_team_id = tp.team_id) AND m.status = 'finalitzat'
      WHERE tp.team_id = ?
      GROUP BY tp.user_id
      ORDER BY wins DESC
    `, [teamId]) as any[];

    res.json({
      overall: overallStats[0] || { wins: 0, draws: 0, losses: 0 },
      players: playerStats
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// GET /api/notifications - Get user notifications
router.get('/notifications', verifyToken, async (req: AuthRequest, res) => {
  try {
    const notifications = await query(`
      SELECT 
        id,
        type,
        title,
        message,
        is_read,
        created_at
      FROM notifications
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `, [req.userId]) as any[];

    res.json({
      notifications: notifications || [],
      total: notifications ? notifications.length : 0,
      unread: notifications ? notifications.filter((n: any) => !n.is_read).length : 0
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.json({
      notifications: [],
      total: 0,
      unread: 0
    });
  }
});

export default router;
