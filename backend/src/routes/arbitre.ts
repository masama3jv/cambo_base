import express, { Router } from 'express';
import { query } from '../db/connection.js';
import { verifyToken, AuthRequest, requireRole } from '../middleware/auth.js';

const router: Router = express.Router();

// GET /api/arbitre/matches - Get referee's assigned matches
router.get('/matches', verifyToken, requireRole(['arbitre']), async (req: AuthRequest, res) => {
  try {
    const matches = await query(`
      SELECT 
        m.*,
        t1.name as home_team_name,
        t2.name as away_team_name,
        c.name as court_name,
        ms.id as sheet_id,
        ms.status as sheet_status
      FROM matches m
      LEFT JOIN teams t1 ON m.home_team_id = t1.id
      LEFT JOIN teams t2 ON m.away_team_id = t2.id
      LEFT JOIN courts c ON m.court_id = c.id
      LEFT JOIN match_sheets ms ON m.id = ms.match_id
      WHERE m.arbitre_id = ?
      ORDER BY m.match_date DESC
    `, [req.userId]);

    res.json(matches);
  } catch (error) {
    console.error('Error fetching referee matches:', error);
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
});

// GET /api/arbitre/match/:matchId - Get specific match details
router.get('/match/:matchId', verifyToken, requireRole(['arbitre']), async (req: AuthRequest, res) => {
  try {
    const { matchId } = req.params;

    const matches = await query(`
      SELECT 
        m.*,
        t1.name as home_team_name,
        t1.sport,
        t2.name as away_team_name,
        c.name as court_name
      FROM matches m
      LEFT JOIN teams t1 ON m.home_team_id = t1.id
      LEFT JOIN teams t2 ON m.away_team_id = t2.id
      LEFT JOIN courts c ON m.court_id = c.id
      WHERE m.id = ? AND m.arbitre_id = ?
    `, [matchId, req.userId]) as any[];

    if (matches.length === 0) {
      return res.status(404).json({ error: 'Match not found' });
    }

    const match = matches[0];

    // Get match sheet if exists
    const sheets = await query(
      'SELECT * FROM match_sheets WHERE match_id = ?',
      [matchId]
    ) as any[];

    // Get team players
    const homePlayers = await query(`
      SELECT u.id, u.name FROM team_players tp
      JOIN users u ON tp.user_id = u.id
      WHERE tp.team_id = ?
    `, [match.home_team_id]);

    const awayPlayers = await query(`
      SELECT u.id, u.name FROM team_players tp
      JOIN users u ON tp.user_id = u.id
      WHERE tp.team_id = ?
    `, [match.away_team_id]);

    res.json({
      match,
      sheet: sheets.length > 0 ? sheets[0] : null,
      homePlayers,
      awayPlayers
    });
  } catch (error) {
    console.error('Error fetching match:', error);
    res.status(500).json({ error: 'Failed to fetch match' });
  }
});

// POST /api/arbitre/match/:matchId/sheet - Create or update match sheet
router.post('/match/:matchId/sheet', verifyToken, requireRole(['arbitre']), async (req: AuthRequest, res) => {
  try {
    const { matchId } = req.params;
    const { incidents, status } = req.body;

    // Check if sheet exists
    const existing = await query(
      'SELECT * FROM match_sheets WHERE match_id = ?',
      [matchId]
    ) as any[];

    if (existing.length > 0) {
      await query(
        'UPDATE match_sheets SET incidents = ?, status = ? WHERE match_id = ?',
        [JSON.stringify(incidents), status, matchId]
      );
    } else {
      await query(
        'INSERT INTO match_sheets (match_id, incidents, status) VALUES (?, ?, ?)',
        [matchId, JSON.stringify(incidents), status]
      );
    }

    // If closing sheet, update match status
    if (status === 'tancada' || status === 'immutable') {
      await query('UPDATE matches SET status = ? WHERE id = ?', ['finalitzat', matchId]);
    }

    res.json({ message: 'Match sheet updated' });
  } catch (error) {
    console.error('Error updating match sheet:', error);
    res.status(500).json({ error: 'Failed to update match sheet' });
  }
});

// GET /api/arbitre/match/:matchId/sheet - Get match sheet
router.get('/match/:matchId/sheet', verifyToken, requireRole(['arbitre']), async (req: AuthRequest, res) => {
  try {
    const { matchId } = req.params;

    const sheets = await query(
      'SELECT * FROM match_sheets WHERE match_id = ?',
      [matchId]
    ) as any[];

    if (sheets.length === 0) {
      return res.status(404).json({ error: 'Match sheet not found' });
    }

    res.json(sheets[0]);
  } catch (error) {
    console.error('Error fetching match sheet:', error);
    res.status(500).json({ error: 'Failed to fetch match sheet' });
  }
});

export default router;
