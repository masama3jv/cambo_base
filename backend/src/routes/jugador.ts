import express, { Router } from 'express';
import { query } from '../db/connection.js';
import { verifyToken, AuthRequest } from '../middleware/auth.js';

const router: Router = express.Router();

function getOpponent(teamId: number, homeId: number, homeName: string, awayName: string): string {
  return homeId === teamId ? awayName : homeName;
}

function didWin(teamId: number, homeId: number, homeScore: number, awayScore: number): boolean | null {
  if (homeScore == null || awayScore == null) return null;
  return homeId === teamId ? homeScore > awayScore : awayScore > homeScore;
}

router.get('/dashboard', verifyToken, async (req: AuthRequest, res) => {
  try {
    const teams = await query(`
      SELECT t.* FROM teams t
      JOIN team_players tp ON t.id = tp.team_id
      WHERE tp.user_id = ?
    `, [req.userId]) as any[];

    const team = teams.length > 0 ? teams[0] : null;

    if (!team) {
      return res.json({ team: null, upcomingMatches: [], recentMatches: [], personalStats: { goals: 0, assists: 0, matchesPlayed: 0, yellowCards: 0, redCards: 0 } });
    }

    const [upcomingMatches, recentMatches, matchSheets] = await Promise.all([
      query(`
        SELECT m.*, c.name as court_name, t1.name as home_team_name, t2.name as away_team_name
        FROM matches m
        LEFT JOIN courts c ON m.court_id = c.id
        LEFT JOIN teams t1 ON m.home_team_id = t1.id
        LEFT JOIN teams t2 ON m.away_team_id = t2.id
        WHERE (m.home_team_id = ? OR m.away_team_id = ?) AND m.status IN ('pendent', 'en_curs')
        ORDER BY m.match_date LIMIT 5
      `, [team.id, team.id]),
      query(`
        SELECT m.*, ms.home_score, ms.away_score, t1.name as home_team_name, t2.name as away_team_name
        FROM matches m
        LEFT JOIN match_sheets ms ON m.id = ms.match_id
        LEFT JOIN teams t1 ON m.home_team_id = t1.id
        LEFT JOIN teams t2 ON m.away_team_id = t2.id
        WHERE (m.home_team_id = ? OR m.away_team_id = ?) AND m.status = 'finalitzat'
        ORDER BY m.match_date DESC LIMIT 5
      `, [team.id, team.id]),
      query(`
        SELECT ms.incidents, m.home_team_id, m.away_team_id
        FROM match_sheets ms
        JOIN matches m ON ms.match_id = m.id
        WHERE (m.home_team_id = ? OR m.away_team_id = ?) AND m.status = 'finalitzat'
      `, [team.id, team.id])
    ]) as any[];

    const users = await query('SELECT name FROM users WHERE id = ?', [req.userId]) as any[];
    const playerName = users.length > 0 ? users[0].name : '';

    let goals = 0, yellowCards = 0, redCards = 0;
    for (const sheet of matchSheets) {
      let incidents;
      try { incidents = JSON.parse(sheet.incidents || '{}'); } catch { continue; }
      const list = incidents.incidents || incidents;
      if (!Array.isArray(list)) continue;
      for (const inc of list) {
        if (inc.playerName !== playerName) continue;
        if (inc.type === 'goal') goals++;
        else if (inc.type === 'yellow_card') yellowCards++;
        else if (inc.type === 'red_card') redCards++;
      }
    }

    res.json({
      team: { id: team.id, name: team.name, sport: team.sport, status: team.status },
      upcomingMatches: (upcomingMatches as any[]).map(m => ({
        id: m.id, date: m.match_date, court: m.court_name || '',
        opponent: getOpponent(team.id, m.home_team_id, m.home_team_name, m.away_team_name),
        status: m.status === 'en_curs' ? 'confirmed' : 'pending'
      })),
      recentMatches: (recentMatches as any[]).map(m => ({
        id: m.id, date: m.match_date,
        opponent: getOpponent(team.id, m.home_team_id, m.home_team_name, m.away_team_name),
        result: `${m.home_score ?? 0} - ${m.away_score ?? 0}`,
        won: didWin(team.id, m.home_team_id, m.home_score, m.away_score)
      })),
      personalStats: { goals, assists: 0, matchesPlayed: matchSheets.length, yellowCards, redCards }
    });
  } catch (error) {
    console.error('Error fetching jugador dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

router.get('/matches', verifyToken, async (req: AuthRequest, res) => {
  try {
    const teams = await query(`
      SELECT t.id FROM teams t JOIN team_players tp ON t.id = tp.team_id WHERE tp.user_id = ?
    `, [req.userId]) as any[];
    if (teams.length === 0) return res.json([]);

    const matches = await query(`
      SELECT m.*, c.name as court_name, u2.name as arbitre_name,
        t1.name as home_team_name, t2.name as away_team_name,
        ms.home_score, ms.away_score
      FROM matches m
      LEFT JOIN courts c ON m.court_id = c.id
      LEFT JOIN users u2 ON m.arbitre_id = u2.id
      LEFT JOIN teams t1 ON m.home_team_id = t1.id
      LEFT JOIN teams t2 ON m.away_team_id = t2.id
      LEFT JOIN match_sheets ms ON m.id = ms.match_id
      WHERE m.home_team_id = ? OR m.away_team_id = ?
      ORDER BY m.match_date DESC
    `, [teams[0].id, teams[0].id]);

    res.json(matches);
  } catch (error) {
    console.error('Error fetching jugador matches:', error);
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
});

router.get('/stats', verifyToken, async (req: AuthRequest, res) => {
  try {
    const teams = await query(`
      SELECT t.* FROM teams t JOIN team_players tp ON t.id = tp.team_id WHERE tp.user_id = ?
    `, [req.userId]) as any[];
    if (teams.length === 0) return res.json({ team: null, personalStats: { goals: 0, assists: 0, matchesPlayed: 0, yellowCards: 0, redCards: 0 }, matchHistory: [] });

    const team = teams[0];
    const [matchSheets, matches] = await Promise.all([
      query(`
        SELECT ms.incidents, m.home_team_id, m.away_team_id, m.match_date,
          t1.name as home_team_name, t2.name as away_team_name,
          ms.home_score, ms.away_score
        FROM match_sheets ms
        JOIN matches m ON ms.match_id = m.id
        LEFT JOIN teams t1 ON m.home_team_id = t1.id
        LEFT JOIN teams t2 ON m.away_team_id = t2.id
        WHERE (m.home_team_id = ? OR m.away_team_id = ?) AND m.status = 'finalitzat'
        ORDER BY m.match_date DESC
      `, [team.id, team.id]),
      query(`
        SELECT COUNT(*) as total FROM matches
        WHERE (home_team_id = ? OR away_team_id = ?) AND status = 'finalitzat'
      `, [team.id, team.id])
    ]) as any[];

    const users = await query('SELECT name FROM users WHERE id = ?', [req.userId]) as any[];
    const playerName = users.length > 0 ? users[0].name : '';

    const matchHistory: any[] = [];
    let goals = 0, yellowCards = 0, redCards = 0;

    for (const sheet of matchSheets) {
      let incidents;
      try { incidents = JSON.parse(sheet.incidents || '{}'); } catch { continue; }
      const list = incidents.incidents || incidents;
      if (!Array.isArray(list)) continue;

      let matchGoals = 0, matchYellow = 0, matchRed = 0;
      for (const inc of list) {
        if (inc.playerName !== playerName) continue;
        if (inc.type === 'goal') { goals++; matchGoals++; }
        else if (inc.type === 'yellow_card') { yellowCards++; matchYellow++; }
        else if (inc.type === 'red_card') { redCards++; matchRed++; }
      }

      matchHistory.push({
        date: sheet.match_date,
        opponent: getOpponent(team.id, sheet.home_team_id, sheet.home_team_name, sheet.away_team_name),
        result: `${sheet.home_score ?? 0} - ${sheet.away_score ?? 0}`,
        won: didWin(team.id, sheet.home_team_id, sheet.home_score, sheet.away_score),
        goals: matchGoals,
        yellowCards: matchYellow,
        redCards: matchRed
      });
    }

    res.json({
      team: { id: team.id, name: team.name, sport: team.sport },
      totalMatches: matches[0]?.total || 0,
      personalStats: { goals, assists: 0, matchesPlayed: matchSheets.length, yellowCards, redCards },
      matchHistory
    });
  } catch (error) {
    console.error('Error fetching jugador stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

export default router;
