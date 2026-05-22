import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { connectDatabase, query } from './db/connection.js';
import { verifyToken, requireRole, AuthRequest } from './middleware/auth.js';
import authRoutes from './routes/auth.js';
import teamsRoutes from './routes/teams.js';
import inscriptionsRoutes from './routes/inscriptions.js';
import capitaRoutes from './routes/capita.js';
import adminRoutes from './routes/admin.js';
import arbitreRoutes from './routes/arbitre.js';
import publicRoutes from './routes/public.js';
import jugadorRoutes from './routes/jugador.js';
import { initEmailOnStartup } from './services/emailService.js';
import { constructWebhookEvent } from './services/stripeService.js';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));

// Stripe webhook needs raw body — must come BEFORE express.json()
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
  try {
    const signature = req.headers['stripe-signature'] as string;
    if (!signature) {
      return res.status(400).json({ error: 'Missing stripe-signature header' });
    }

    const event = constructWebhookEvent(Buffer.from(req.body), signature);

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as any;
      const teamId = paymentIntent.metadata?.teamId;
      if (teamId) {
        // Payment confirmed — mark as pending validation
        await query('UPDATE teams SET status = ? WHERE id = ?', ['pendent_validacio', teamId]);
        const inscriptions = await query('SELECT * FROM inscriptions WHERE team_id = ?', [teamId]) as any[];
        if (inscriptions.length > 0) {
          await query(
            'UPDATE inscriptions SET status = ?, payment_date = NOW() WHERE team_id = ?',
            ['pendent_validacio', teamId]
          );
        } else {
          await query(
            'INSERT INTO inscriptions (team_id, tournament_id, status, amount, payment_date) VALUES (?, ?, ?, ?, NOW())',
            [teamId, 1, 'pendent_validacio', paymentIntent.amount / 100]
          );
        }
        console.log(`Payment succeeded for team ${teamId}`);
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: 'Webhook Error' });
  }
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
const uploadsDir = path.resolve(process.cwd(), fs.existsSync(path.join(process.cwd(), 'backend', 'uploads')) ? 'backend/uploads' : 'uploads');
app.use('/uploads', express.static(uploadsDir));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/teams', teamsRoutes);
app.use('/api/team', inscriptionsRoutes);
app.use('/api', capitaRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/arbitre', arbitreRoutes);
app.use('/api/jugador', jugadorRoutes);
app.use('/api/public', publicRoutes);

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// GET /api/match-sheets/:matchId/pdf - Serve generated PDF
app.get('/api/match-sheets/:matchId/pdf', verifyToken, requireRole(['arbitre']), async (req: AuthRequest, res: Response) => {
  try {
    const { matchId } = req.params;

    const sheets = await query(
      'SELECT pdf_url FROM match_sheets WHERE match_id = ? AND status = ?',
      [matchId, 'immutable']
    ) as any[];

    if (sheets.length === 0 || !sheets[0].pdf_url) {
      return res.status(404).json({ error: true, message: 'PDF not found' });
    }

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

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not Found' });
});

// Start server
async function startServer() {
  try {
    // Initialize database
    await connectDatabase();
    console.log('✓ Database connected');

    // Initialize email transporter (non-blocking — errors are logged, not fatal)
    initEmailOnStartup();

    app.listen(PORT, () => {
      console.log(`✓ Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
