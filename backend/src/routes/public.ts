import express, { Router } from 'express';
import { query } from '../db/connection.js';
import { verifyToken, AuthRequest } from '../middleware/auth.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const router: Router = express.Router();

// GET /api/public/matches - Get upcoming matches (public, no auth)
router.get('/matches', async (req, res) => {
  try {
    const matches = await query(`
      SELECT 
        m.*,
        t1.name as home_team_name,
        t2.name as away_team_name,
        c.name as court_name
      FROM matches m
      LEFT JOIN teams t1 ON m.home_team_id = t1.id
      LEFT JOIN teams t2 ON m.away_team_id = t2.id
      LEFT JOIN courts c ON m.court_id = c.id
      WHERE m.status IN ('pendent', 'en_curs')
      ORDER BY m.match_date
      LIMIT 10
    `);

    res.json(matches);
  } catch (error) {
    console.error('Error fetching public matches:', error);
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
});

// GET /api/public/invitations/:token - Get invitation details
router.get('/invitations/:token', async (req, res) => {
  try {
    const { token } = req.params;

    // Get invitation from database
    const invitations = await query(
      'SELECT i.*, t.name as team_name, t.sport, u.name as capita_name FROM invitations i JOIN teams t ON i.team_id = t.id JOIN users u ON t.capita_id = u.id WHERE i.token = ?',
      [token]
    ) as any[];

    if (invitations.length === 0) {
      return res.status(404).json({ error: 'Invitation not found' });
    }

    const invitation = invitations[0];

    // Check if invitation has expired
    if (new Date(invitation.expires_at) < new Date()) {
      return res.status(410).json({ error: 'Invitation has expired' });
    }

    // Check if invitation has been used
    if (invitation.used) {
      return res.status(410).json({ error: 'Invitation has already been used' });
    }

    res.json({
      teamId: invitation.team_id,
      teamName: invitation.team_name,
      sport: invitation.sport,
      capitaName: invitation.capita_name,
      email: invitation.email
    });
  } catch (error) {
    console.error('Error fetching invitation:', error);
    res.status(500).json({ error: 'Failed to fetch invitation' });
  }
});
});

// POST /api/auth/register-invited-player - Register a player via invitation
router.post('/auth/register-invited-player', async (req, res) => {
  try {
    const { name, email, password, confirmPassword, teamId } = req.body;

    if (!name || !email || !password || !confirmPassword || !teamId) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    // Check if user already exists
    const existing = await query('SELECT id FROM users WHERE email = ?', [email]) as any[];
    if (existing.length > 0) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user as 'jugador'
    const result = await query(
      'INSERT INTO users (name, email, password, role, email_verified) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashedPassword, 'jugador', true]
    ) as any;

    // Add to team
    await query(
      'INSERT INTO team_players (team_id, user_id) VALUES (?, ?)',
      [teamId, result.insertId]
    );

    // Generate JWT token
    const token = jwt.sign(
      { id: result.insertId, email, role: 'jugador' },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.status(201).json({
      message: 'Player registered successfully',
      userId: result.insertId,
      token
    });
  } catch (error) {
    console.error('Error registering invited player:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

export default router;
