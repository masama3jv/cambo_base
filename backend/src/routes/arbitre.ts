import express, { Router } from 'express';
import { query } from '../db/connection.js';
import { verifyToken, AuthRequest, requireRole } from '../middleware/auth.js';
import {
  createMatchSheet,
  recordGoalFutsal,
  recordCardFutsal,
  recordBasketScore,
  recordBasketFoul,
  undoLastIncident,
  generateMatchSheetPDF,
  getMatchSheetSummary
} from '../services/matchSheetService.js';
import fs from 'fs';
import path from 'path';

const router: Router = express.Router();

// GET /api/arbitre/tournaments - Get tournaments where referee has matches
router.get('/tournaments', verifyToken, requireRole(['arbitre']), async (req: AuthRequest, res) => {
  try {
    const tournaments = await query(`
      SELECT DISTINCT t.id, t.name, t.sport, t.start_date, t.end_date, t.status,
        (SELECT COUNT(*) FROM matches m2 WHERE m2.tournament_id = t.id AND m2.arbitre_id = ?) as match_count,
        (SELECT COUNT(*) FROM matches m2 WHERE m2.tournament_id = t.id AND m2.arbitre_id = ? AND m2.status = 'finalitzat') as completed_count
      FROM tournaments t
      JOIN matches m ON m.tournament_id = t.id
      WHERE m.arbitre_id = ?
      ORDER BY t.start_date DESC
    `, [req.userId, req.userId, req.userId]);

    res.json(tournaments);
  } catch (error) {
    console.error('Error fetching referee tournaments:', error);
    res.status(500).json({ error: 'Failed to fetch tournaments' });
  }
});

// GET /api/arbitre/matches?tournamentId=X - Get referee's assigned matches
router.get('/matches', verifyToken, requireRole(['arbitre']), async (req: AuthRequest, res) => {
  try {
    const tournamentId = req.query.tournamentId as string;
    let sql = `
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
    `;
    const params: any[] = [req.userId];

    if (tournamentId) {
      sql += ' AND m.tournament_id = ?';
      params.push(parseInt(tournamentId));
    }

    sql += ' ORDER BY m.match_date DESC';

    const matches = await query(sql, params);

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
        t2.name as away_team_name,
        c.name as court_name,
        tr.match_duration_minutes,
        COALESCE(tr.sport, t1.sport, 'futsal') as sport
      FROM matches m
      LEFT JOIN teams t1 ON m.home_team_id = t1.id
      LEFT JOIN teams t2 ON m.away_team_id = t2.id
      LEFT JOIN courts c ON m.court_id = c.id
      LEFT JOIN tournaments tr ON m.tournament_id = tr.id
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

// POST /api/arbitre/match/:matchId/sheet - Create or update match sheet with incident
router.post('/match/:matchId/sheet', verifyToken, requireRole(['arbitre']), async (req: AuthRequest, res) => {
  try {
    const { matchId } = req.params;
    const { action, data } = req.body;

    // Get match info (join tournaments for sport)
    const matches = await query(
      `SELECT m.*, tr.sport FROM matches m
       LEFT JOIN tournaments tr ON m.tournament_id = tr.id
       WHERE m.id = ?`,
      [matchId]
    ) as any[];

    if (matches.length === 0) {
      return res.status(404).json({ error: 'Match not found' });
    }

    const match = matches[0];

    // Get or create sheet
    let sheetData: any = {
      matchId,
      homeTeamId: match.home_team_id,
      awayTeamId: match.away_team_id,
      sport: match.sport || 'futsal',
      homeScore: 0,
      awayScore: 0,
      status: 'actiu',
      incidents: [],
      startTime: new Date()
    };

    // Get existing sheet
    const existing = await query(
      'SELECT * FROM match_sheets WHERE match_id = ?',
      [matchId]
    ) as any[];

    if (existing.length > 0) {
      sheetData = JSON.parse(existing[0].incidents || '{}');
      // Ensure proper structure
      if (!sheetData.incidents) sheetData.incidents = [];
    }

    // Process action
    if (action === 'save_lineups') {
      sheetData.lineups = data.lineups;
    } else if (action === 'goal' && data.playerName && data.teamId) {
      sheetData.homeScore = sheetData.homeScore || 0;
      sheetData.awayScore = sheetData.awayScore || 0;
      if (data.teamId === sheetData.homeTeamId) {
        sheetData.homeScore++;
      } else {
        sheetData.awayScore++;
      }
      sheetData.incidents.push({
        type: 'goal', minute: data.minute || 0, playerName: data.playerName, teamId: data.teamId, timestamp: new Date()
      });
    } else if (action === 'yellow_card' || action === 'red_card') {
      sheetData.incidents.push({
        type: action, minute: data.minute || 0, playerName: data.playerName, teamId: data.teamId, timestamp: new Date()
      });
    } else if (action === '1pt' || action === '2pt') {
      const points = action === '1pt' ? 1 : 2;
      sheetData.homeScore = sheetData.homeScore || 0;
      sheetData.awayScore = sheetData.awayScore || 0;
      if (data.teamId === sheetData.homeTeamId) {
        sheetData.homeScore += points;
      } else {
        sheetData.awayScore += points;
      }
      sheetData.incidents.push({
        type: action, minute: data.minute || 0, playerName: data.playerName, teamId: data.teamId, points, timestamp: new Date()
      });
    } else if (action === 'foul') {
      sheetData.incidents.push({
        type: 'foul', minute: data.minute || 0, playerName: data.playerName, teamId: data.teamId, timestamp: new Date()
      });
    } else if (action === 'substitution') {
      sheetData.incidents.push({
        type: 'substitution', minute: data.minute || 0, playerOut: data.playerOut, playerIn: data.playerIn, teamId: data.teamId, timestamp: new Date()
      });
    } else if (action === 'injury') {
      sheetData.incidents.push({
        type: 'injury', minute: data.minute || 0, playerName: data.playerName, teamId: data.teamId, timestamp: new Date()
      });
    } else if (action === 'timeout') {
      sheetData.incidents.push({
        type: 'timeout', minute: data.minute || 0, teamId: data.teamId, timestamp: new Date()
      });
    } else if (action === 'set_result') {
      sheetData.homeScore = sheetData.homeScore || 0;
      sheetData.awayScore = sheetData.awayScore || 0;
      if (data.home_score > data.away_score) sheetData.homeScore++;
      else if (data.away_score > data.home_score) sheetData.awayScore++;
      sheetData.incidents.push({
        type: 'set_result', set_number: data.set_number, home_score: data.home_score, away_score: data.away_score, timestamp: new Date()
      });
    } else if (action === 'undo') {
      if (sheetData.incidents.length > 0) {
        const last = sheetData.incidents[sheetData.incidents.length - 1];
        if (last.type === 'goal' || last.type === '1pt' || last.type === '2pt') {
          const points = (last.type === 'goal' || last.type === '1pt') ? 1 : 2;
          if (last.teamId === sheetData.homeTeamId) sheetData.homeScore -= points;
          else sheetData.awayScore -= points;
        } else if (last.type === 'set_result') {
          if ((last.home_score || 0) > (last.away_score || 0)) sheetData.homeScore--;
          else if ((last.away_score || 0) > (last.home_score || 0)) sheetData.awayScore--;
        }
        sheetData.incidents.pop();
      }
    }

    // Save sheet
    if (existing.length > 0) {
      await query(
        'UPDATE match_sheets SET incidents = ?, home_score = ?, away_score = ? WHERE match_id = ?',
        [JSON.stringify(sheetData), sheetData.homeScore, sheetData.awayScore, matchId]
      );
    } else {
      await query(
        'INSERT INTO match_sheets (match_id, incidents, home_score, away_score, status) VALUES (?, ?, ?, ?, ?)',
        [matchId, JSON.stringify(sheetData), sheetData.homeScore, sheetData.awayScore, 'actiu']
      );
    }

    res.json({
      homeScore: sheetData.homeScore,
      awayScore: sheetData.awayScore,
      incidents: sheetData.incidents.length
    });
  } catch (error) {
    console.error('Error updating match sheet:', error);
    res.status(500).json({ error: 'Failed to update match sheet' });
  }
});

// GET /api/arbitre/match/:matchId/sheet - Get match sheet with full details
router.get('/match/:matchId/sheet', verifyToken, requireRole(['arbitre']), async (req: AuthRequest, res) => {
  try {
    const { matchId } = req.params;

    const sheets = await query(
      'SELECT * FROM match_sheets WHERE match_id = ?',
      [matchId]
    ) as any[];

    if (sheets.length === 0) {
      // Return empty sheet structure
      const matches = await query(
        `SELECT m.*, tr.sport FROM matches m
         LEFT JOIN tournaments tr ON m.tournament_id = tr.id
         WHERE m.id = ?`,
        [matchId]
      ) as any[];

      if (matches.length === 0) {
        return res.status(404).json({ error: 'Match not found' });
      }

      const match = matches[0];
      return res.json({
        matchId,
        homeTeamId: match.home_team_id,
        awayTeamId: match.away_team_id,
        sport: match.sport || 'futsal',
        homeScore: 0,
        awayScore: 0,
        status: 'actiu',
        incidents: [],
        startTime: new Date()
      });
    }

    const sheet = sheets[0];
    const sheetData = JSON.parse(sheet.incidents || '{}');

    // Ensure proper structure with DB values
    res.json({
      matchId: sheet.match_id,
      homeTeamId: sheet.home_team_id || sheetData.homeTeamId,
      awayTeamId: sheet.away_team_id || sheetData.awayTeamId,
      sport: sheetData.sport || 'futsal',
      homeScore: sheet.home_score || sheetData.homeScore || 0,
      awayScore: sheet.away_score || sheetData.awayScore || 0,
      status: sheet.status || 'actiu',
      lineups: sheetData.lineups || null,
      incidents: sheetData.incidents || [],
      startTime: sheet.created_at || new Date()
    });
  } catch (error) {
    console.error('Error fetching match sheet:', error);
    res.status(500).json({ error: 'Failed to fetch match sheet' });
  }
});

// POST /api/arbitre/match/:matchId/close - Close match sheet and generate PDF
router.post('/match/:matchId/close', verifyToken, requireRole(['arbitre']), async (req: AuthRequest, res) => {
  try {
    const { matchId } = req.params;

    // Fetch full match sheet info for PDF
    const sheets = await query(
      'SELECT * FROM match_sheets WHERE match_id = ?',
      [matchId]
    ) as any[];

    if (sheets.length === 0) {
      return res.status(404).json({ error: true, message: 'Match sheet not found' });
    }

    const sheet = sheets[0];
    const sheetData = JSON.parse(sheet.incidents || '{}');

    // Get team names
    const teams = await query(
      'SELECT id, name FROM teams WHERE id IN (?, ?)',
      [sheet.home_team_id, sheet.away_team_id]
    ) as any[];

    const homeTeamName = teams.find((t: any) => t.id === sheet.home_team_id)?.name || 'Home Team';
    const awayTeamName = teams.find((t: any) => t.id === sheet.away_team_id)?.name || 'Away Team';

    // Get arbitre name
    const arbitres = await query(
      'SELECT name FROM users WHERE id = ? AND role = ?',
      [req.userId, 'arbitre']
    ) as any[];

    const arbitreName = arbitres.length > 0 ? arbitres[0].name : 'Unknown Arbitre';

    // Generate PDF
    const pdfBuffer = await generateMatchSheetPDF(
      {
        id: sheet.id,
        matchId: parseInt(matchId),
        homeTeamId: sheet.home_team_id,
        awayTeamId: sheet.away_team_id,
        sport: sheetData.sport || 'futsal',
        homeScore: sheet.home_score || 0,
        awayScore: sheet.away_score || 0,
        status: 'immutable',
        incidents: sheetData.incidents || [],
        startTime: new Date(sheet.created_at),
        endTime: new Date()
      },
      homeTeamName,
      awayTeamName,
      arbitreName
    );

    // Save PDF to disk
    const uploadsDir = path.join(process.cwd(), 'uploads', 'match_sheets');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filename = `acta_${matchId}_${Date.now()}.pdf`;
    const filepath = path.join(uploadsDir, filename);
    fs.writeFileSync(filepath, pdfBuffer);

    const pdfUrl = `/uploads/match_sheets/${filename}`;

    // Update sheet status to immutable and set pdf_url
    await query(
      'UPDATE match_sheets SET status = ?, pdf_url = ?, closed_at = NOW() WHERE match_id = ?',
      ['immutable', pdfUrl, matchId]
    );

    // Update match status to finalitzat
    await query(
      'UPDATE matches SET status = ? WHERE id = ?',
      ['finalitzat', matchId]
    );

    res.json({ message: 'Match closed successfully', status: 'immutable', pdfUrl });
  } catch (error) {
    console.error('Error closing match sheet:', error);
    res.status(500).json({ error: true, message: 'Failed to close match sheet' });
  }
});

// We keep a local GET /pdf route in arbitre.ts just in case, but we will also expose GET /api/match-sheets/:matchId/pdf in server.ts
router.get('/match/:matchId/pdf', verifyToken, requireRole(['arbitre']), async (req: AuthRequest, res) => {
  try {
    const { matchId } = req.params;

    const sheets = await query(
      'SELECT pdf_url FROM match_sheets WHERE match_id = ? AND status = ?',
      [matchId, 'immutable']
    ) as any[];

    if (sheets.length === 0 || !sheets[0].pdf_url) {
      return res.status(404).json({ error: true, message: 'PDF not found' });
    }

    // Replace forward slashes to ensure path works on all OS correctly
    const relativePath = sheets[0].pdf_url.startsWith('/') ? sheets[0].pdf_url.substring(1) : sheets[0].pdf_url;
    const filepath = path.join(process.cwd(), relativePath);

    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ error: true, message: 'PDF file not found on disk' });
    }

    res.download(filepath, `acta_${matchId}.pdf`);
  } catch (error) {
    console.error('Error fetching PDF:', error);
    res.status(500).json({ error: true, message: 'Failed to fetch PDF' });
  }
});

export default router;
