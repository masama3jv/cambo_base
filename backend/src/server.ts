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

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3001;

// Middleware
const allowedOrigins = [
  'http://localhost:5173',
  process.env.FRONTEND_URL || ''
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins.length > 0 ? allowedOrigins : '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

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

    app.listen(PORT, () => {
      console.log(`✓ Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
