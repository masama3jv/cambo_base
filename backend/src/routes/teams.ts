import express, { Router } from 'express';
import { randomUUID, randomInt } from 'crypto';
import { query } from '../db/connection.js';
import { verifyToken, AuthRequest, requireRole } from '../middleware/auth.js';
import { sendInvitationEmail, sendInvitationEmailFireAndForget } from '../services/emailService.js';

const router: Router = express.Router();

function generateInviteCode(): string {
  const num = randomInt(1000, 9999);
  return `CB-${num}`;
}

// GET /api/teams - Get user's teams
router.get('/', verifyToken, async (req: AuthRequest, res) => {
  try {
    if (req.userRole === 'capita') {
      const teams = await query(
        'SELECT * FROM teams WHERE capita_id = ?',
        [req.userId]
      );
      res.json(teams);
    } else {
      // For jugador role, get teams they belong to
      const teams = await query(`
        SELECT DISTINCT t.* FROM teams t
        JOIN team_players tp ON t.id = tp.team_id
        WHERE tp.user_id = ?
      `, [req.userId]);
      res.json(teams);
    }
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

// POST /api/teams - Create a new team
router.post('/', verifyToken, requireRole(['capita']), async (req: AuthRequest, res) => {
  try {
    const { name, sport } = req.body;

    if (!name || !sport) {
      return res.status(400).json({ error: 'Team name and sport are required' });
    }

    // Generate unique invite code
    let inviteCode = generateInviteCode();
    const existing = await query('SELECT id FROM teams WHERE invite_code = ?', [inviteCode]) as any[];
    if (existing.length > 0) {
      inviteCode = generateInviteCode();
    }

    const result = await query(
      'INSERT INTO teams (name, sport, capita_id, status, invite_code) VALUES (?, ?, ?, ?, ?)',
      [name, sport, req.userId, 'pendent_docs', inviteCode]
    ) as any;

    // Add capita as team player
    await query(
      'INSERT INTO team_players (team_id, user_id) VALUES (?, ?)',
      [result.insertId, req.userId]
    );

    res.status(201).json({
      id: result.insertId,
      name,
      sport,
      capita_id: req.userId,
      status: 'pendent_docs',
      invite_code: inviteCode
    });
  } catch (error) {
    console.error('Error creating team:', error);
    res.status(500).json({ error: 'Failed to create team' });
  }
});

// GET /api/teams/:id - Get team details
router.get('/:id', verifyToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const teams = await query('SELECT * FROM teams WHERE id = ?', [id]) as any[];

    if (teams.length === 0) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const team = teams[0];
    
    // Check if user has access
    if (team.capita_id !== req.userId && req.userRole !== 'admin') {
      // For jugador, check if they're in the team
      if (req.userRole === 'jugador') {
        const isMember = await query(
          'SELECT * FROM team_players WHERE team_id = ? AND user_id = ?',
          [id, req.userId]
        );
        if (!isMember || isMember.length === 0) {
          return res.status(403).json({ error: 'Access denied' });
        }
      } else {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    res.json(team);
  } catch (error) {
    console.error('Error fetching team:', error);
    res.status(500).json({ error: 'Failed to fetch team' });
  }
});

// GET /api/teams/:id/players - Get team players
router.get('/:id/players', verifyToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const players = await query(`
      SELECT u.id, u.name, u.email, tp.dorsal, tp.position
      FROM team_players tp
      JOIN users u ON tp.user_id = u.id
      WHERE tp.team_id = ?
    `, [id]);

    res.json(players);
  } catch (error) {
    console.error('Error fetching team players:', error);
    res.status(500).json({ error: 'Failed to fetch team players' });
  }
});

// POST /api/teams/:id/invite-player - Invite a player by email
router.post('/:id/invite-player', verifyToken, requireRole(['capita']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check team ownership
    const teams = await query('SELECT * FROM teams WHERE id = ? AND capita_id = ?', [id, req.userId]) as any[];
    if (teams.length === 0) {
      return res.status(403).json({ error: 'Not team owner' });
    }

    const teamName = teams[0].name;
    const capitaUser = await query('SELECT name FROM users WHERE id = ?', [req.userId]) as any[];
    const inviterName = capitaUser.length > 0 ? capitaUser[0].name : 'Un capità';

    // Check if user exists
    const users = await query('SELECT id FROM users WHERE email = ?', [email]) as any[];
    
    if (users.length > 0) {
      // User exists - check if already in team
      const userId = users[0].id;
      const existing = await query(
        'SELECT * FROM team_players WHERE team_id = ? AND user_id = ?',
        [id, userId]
      );
      if (existing && existing.length > 0) {
        return res.status(400).json({ error: 'Aquest usuari ja està registrat' });
      }

      // Add player to team
      await query(
        'INSERT INTO team_players (team_id, user_id) VALUES (?, ?)',
        [id, userId]
      );

      res.json({ message: 'Jugador afegit amb èxit', success: true });
    } else {
      // User doesn't exist - create invitation token and send email
      const token = randomUUID();
      const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours from now

      await query(
        'INSERT INTO invitations (team_id, email, token, expires_at) VALUES (?, ?, ?, ?)',
        [id, email, token, expiresAt]
      );

      // Send invitation email in background (don't block response)
      sendInvitationEmailFireAndForget(email, teamName, token, inviterName);

      res.json({ 
        message: `Invitació enviada a ${email}`, 
        success: true,
        token,
        emailSent: true
      });
    }
  } catch (error) {
    console.error('Error inviting player:', error);
    res.status(500).json({ error: 'Failed to invite player' });
  }
});

// POST /api/teams/join-by-code - Join a team by invite code
router.post('/join-by-code', verifyToken, async (req: AuthRequest, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Codi obligatori' });
    }

    // Find team by invite code
    const teams = await query('SELECT * FROM teams WHERE invite_code = ?', [code.toUpperCase()]) as any[];

    if (teams.length === 0) {
      return res.status(404).json({ error: 'Codi no vàlid' });
    }

    const team = teams[0];

    // Check if player is already in team
    const existing = await query(
      'SELECT * FROM team_players WHERE team_id = ? AND user_id = ?',
      [team.id, req.userId]
    ) as any[];

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Ja ets membre d\'aquest equip' });
    }

    // Add player to team
    await query(
      'INSERT INTO team_players (team_id, user_id) VALUES (?, ?)',
      [team.id, req.userId]
    );

    res.json({ message: 'T\'has unit a l\'equip correctament', team: { id: team.id, name: team.name, sport: team.sport } });
  } catch (error) {
    console.error('Error joining team by code:', error);
    res.status(500).json({ error: 'Error en unir-se a l\'equip' });
  }
});

// GET /api/teams/check-code/:code - Check if an invite code is valid
router.get('/check-code/:code', async (req: AuthRequest, res) => {
  try {
    const { code } = req.params;
    const teams = await query('SELECT id, name, sport FROM teams WHERE invite_code = ?', [code.toUpperCase()]) as any[];

    if (teams.length === 0) {
      return res.status(404).json({ error: 'Codi no vàlid' });
    }

    res.json({ team: teams[0] });
  } catch (error) {
    console.error('Error checking invite code:', error);
    res.status(500).json({ error: 'Error en verificar el codi' });
  }
});

export default router;
