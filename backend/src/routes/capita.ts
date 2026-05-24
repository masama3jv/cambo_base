import express, { Router } from 'express';
import { query } from '../db/connection.js';
import { verifyToken, AuthRequest } from '../middleware/auth.js';

const router: Router = express.Router();

// GET /api/dashboard - Get capita dashboard data
router.get('/dashboard', verifyToken, async (req: AuthRequest, res) => {
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
        COUNT(CASE WHEN (m.home_team_id = ? AND ms.home_score > ms.away_score) OR (m.away_team_id = ? AND ms.away_score > ms.home_score) THEN 1 END) as wins,
        COUNT(CASE WHEN ms.home_score = ms.away_score THEN 1 END) as draws,
        COUNT(CASE WHEN (m.home_team_id = ? AND ms.home_score < ms.away_score) OR (m.away_team_id = ? AND ms.away_score < ms.home_score) THEN 1 END) as losses,
        COUNT(*) as matches_played
      FROM matches m
      JOIN match_sheets ms ON m.id = ms.match_id
      WHERE (m.home_team_id = ? OR m.away_team_id = ?)
      AND m.status = 'finalitzat'
    `, [team.id, team.id, team.id, team.id, team.id, team.id]) as any[];

    // Get pending documents count (docs that are pendent or rebutjat)
    const pendingDocs = await query(`
      SELECT COUNT(*) as count FROM documents
      WHERE team_id = ? AND status IN ('pendent', 'rebutjat')
    `, [team.id]) as any[];

    // Get goals for/against from match_sheets
    const goals = await query(`
      SELECT 
        COALESCE(SUM(CASE WHEN m.home_team_id = ? THEN ms.home_score WHEN m.away_team_id = ? THEN ms.away_score END), 0) as goalsFor,
        COALESCE(SUM(CASE WHEN m.home_team_id = ? THEN ms.away_score WHEN m.away_team_id = ? THEN ms.home_score END), 0) as goalsAgainst
      FROM matches m
      JOIN match_sheets ms ON m.id = ms.match_id
      WHERE (m.home_team_id = ? OR m.away_team_id = ?) AND m.status = 'finalitzat'
    `, [team.id, team.id, team.id, team.id, team.id, team.id]) as any[];

    // Get classification position
    const classification = await query(`
      SELECT team_id, points, RANK() OVER (ORDER BY points DESC) as position
      FROM (
        SELECT 
          CASE WHEN m.home_team_id = ? THEN m.home_team_id ELSE m.away_team_id END as team_id,
          SUM(CASE 
            WHEN (m.home_team_id = ? AND ms.home_score > ms.away_score) OR (m.away_team_id = ? AND ms.away_score > ms.home_score) THEN 3
            WHEN ms.home_score = ms.away_score THEN 1
            ELSE 0
          END) as points
        FROM matches m
        JOIN match_sheets ms ON m.id = ms.match_id
        WHERE (m.home_team_id = ? OR m.away_team_id = ?) AND m.status = 'finalitzat'
        GROUP BY team_id
      ) as standings
    `, [team.id, team.id, team.id, team.id, team.id]) as any[];

    let position = classification.length > 0 ? classification[0].position : null;
    // If no classification data, check if there are any finalitzat matches in the system
    if (!position) {
      const anyMatches = await query(
        "SELECT COUNT(*) as cnt FROM matches WHERE status = 'finalitzat'", []
      ) as any[];
      position = anyMatches[0]?.cnt > 0 ? '-' : null;
    }

    // Get team invite_code
    const invite_code = team.invite_code || null;

    const statsRow = stats[0] || { wins: 0, draws: 0, losses: 0, matches_played: 0 };
    const goalsRow = goals[0] || { goalsFor: 0, goalsAgainst: 0 };

    // Determine which step is active
    const stepIndex = team.status === 'pendent_docs' ? 0
      : team.status === 'pendent_pagament' ? 1
      : team.status === 'pendent_validacio' ? 2
      : team.status === 'inscrit' ? 3
      : team.status === 'actiu' ? 4 : 0;

    const inscriptionSteps = [
      { label: 'Pendent docs', active: stepIndex === 0, completed: stepIndex > 0 },
      { label: 'Pendent pagament', active: stepIndex === 1, completed: stepIndex > 1 },
      { label: 'Pendent validació', active: stepIndex === 2, completed: stepIndex > 2 },
      { label: 'Inscrit', active: stepIndex === 3, completed: stepIndex > 3 },
      { label: 'Actiu', active: stepIndex === 4, completed: stepIndex > 4 },
    ];

    res.json({
      stats: {
        nextMatchDate: nextMatch ? new Date(nextMatch.match_date).toLocaleDateString('ca-ES', { day: 'numeric', month: 'long' }) : null,
        nextMatchTime: nextMatch ? new Date(nextMatch.match_date).toLocaleTimeString('ca-ES', { hour: '2-digit', minute: '2-digit' }) : null,
        nextMatchCourt: nextMatch?.court_name || null,
        classificationPosition: position ? `#${position}` : null,
        pendingDocuments: pendingDocs[0]?.count || 0,
        matchesPlayed: statsRow.matches_played,
        wins: statsRow.wins,
        draws: statsRow.draws,
        losses: statsRow.losses,
        goalsFor: goalsRow.goalsFor,
        goalsAgainst: goalsRow.goalsAgainst,
      },
      inscriptionSteps,
      team: {
        id: team.id,
        name: team.name,
        sport: team.sport,
        status: team.status,
        invite_code: invite_code,
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// GET /api/team/players - Get team players
router.get('/team/players', verifyToken, async (req: AuthRequest, res) => {
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
router.get('/team/matches', verifyToken, async (req: AuthRequest, res) => {
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
router.get('/team/statistics', verifyToken, async (req: AuthRequest, res) => {
  try {
    const teams = await query('SELECT * FROM teams WHERE capita_id = ?', [req.userId]) as any[];

    if (teams.length === 0) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const teamId = teams[0].id;

    // Get overall stats
    const overallStats = await query(`
      SELECT 
        COUNT(*) as matchesPlayed,
        COUNT(CASE WHEN (m.home_team_id = ? AND ms.home_score > ms.away_score) OR (m.away_team_id = ? AND ms.away_score > ms.home_score) THEN 1 END) as wins,
        COUNT(CASE WHEN ms.home_score = ms.away_score THEN 1 END) as draws,
        COUNT(CASE WHEN (m.home_team_id = ? AND ms.home_score < ms.away_score) OR (m.away_team_id = ? AND ms.away_score < ms.home_score) THEN 1 END) as losses,
        COALESCE(SUM(CASE WHEN m.home_team_id = ? THEN ms.home_score WHEN m.away_team_id = ? THEN ms.away_score END), 0) as goalsFor,
        COALESCE(SUM(CASE WHEN m.home_team_id = ? THEN ms.away_score WHEN m.away_team_id = ? THEN ms.home_score END), 0) as goalsAgainst
      FROM matches m
      JOIN match_sheets ms ON m.id = ms.match_id
      WHERE (m.home_team_id = ? OR m.away_team_id = ?) AND m.status = 'finalitzat'
    `, [teamId, teamId, teamId, teamId, teamId, teamId, teamId, teamId, teamId, teamId]) as any[];

    // Get player statistics
    const playerStats = await query(`
      SELECT 
        u.id,
        u.name,
        COUNT(DISTINCT CASE WHEN (m.home_team_id = tp.team_id AND ms.home_score > ms.away_score) OR (m.away_team_id = tp.team_id AND ms.away_score > ms.home_score) THEN m.id END) as wins,
        COUNT(DISTINCT m.id) as matches_played
      FROM team_players tp
      JOIN users u ON tp.user_id = u.id
      LEFT JOIN matches m ON (m.home_team_id = tp.team_id OR m.away_team_id = tp.team_id) AND m.status = 'finalitzat'
      LEFT JOIN match_sheets ms ON m.id = ms.match_id
      WHERE tp.team_id = ?
      GROUP BY tp.user_id
      ORDER BY wins DESC
    `, [teamId]) as any[];

    res.json({
      statistics: overallStats[0] || { matchesPlayed: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0 },
      players: playerStats
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

export default router;
