import express, { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { query } from '../db/connection.js';
import { verifyToken, AuthRequest, requireRole } from '../middleware/auth.js';

const router: Router = express.Router();

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), 'uploads', 'documents');

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate filename: userId_documentType_timestamp.ext
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const name = `${req.body.userId}_${req.body.documentType}_${timestamp}${ext}`;
    cb(null, name);
  }
});

const fileFilter = (req: any, file: any, cb: any) => {
  // Allowed file types
  const allowedMimes = ['application/pdf', 'image/jpeg', 'image/png'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos PDF, JPG o PNG'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// GET /api/team/inscription-data - Get inscription summary for a team
router.get('/inscription-data', verifyToken, async (req: AuthRequest, res) => {
  try {
    // Get user's team (assumes one team per capita)
    const teams = await query('SELECT * FROM teams WHERE capita_id = ?', [req.userId]) as any[];

    if (teams.length === 0) {
      return res.status(404).json({ error: 'No team found' });
    }

    const team = teams[0];

    // Get team players count
    const players = await query(`
      SELECT u.id, u.name FROM team_players tp
      JOIN users u ON tp.user_id = u.id
      WHERE tp.team_id = ? AND u.id != ?
    `, [team.id, req.userId]) as any[];

    // Get documents status
    const documents = await query(`
      SELECT 
        tp.user_id,
        u.name,
        GROUP_CONCAT(d.document_type, ':', d.status SEPARATOR ';') as doc_status
      FROM team_players tp
      JOIN users u ON tp.user_id = u.id
      LEFT JOIN documents d ON d.user_id = tp.user_id AND d.team_id = ?
      WHERE tp.team_id = ?
      GROUP BY tp.user_id
    `, [team.id, team.id]) as any[];

    // Check if all documents are ready
    const allDocsReady = documents.every(doc => {
      if (!doc.doc_status) return false;
      const statuses = doc.doc_status.split(';');
      return statuses.includes('dni:aprovat') && statuses.includes('asseguranca:aprovat');
    });

    // Get inscription data if exists
    const inscriptions = await query(
      'SELECT * FROM inscriptions WHERE team_id = ?',
      [team.id]
    ) as any[];
    
    const inscription = inscriptions.length > 0 ? inscriptions[0] : null;

    res.json({
      teamData: {
        teamName: team.name,
        sport: team.sport,
        players: players.map((p: any) => p.name),
        amount: inscription?.amount || 150,
        status: team.status,
        documentsReady: allDocsReady
      },
      inscription,
      documents
    });
  } catch (error) {
    console.error('Error fetching inscription data:', error);
    res.status(500).json({ error: 'Failed to fetch inscription data' });
  }
});

// POST /api/team/process-payment - Process simulated payment
router.post('/process-payment', verifyToken, async (req: AuthRequest, res) => {
  try {
    const { teamId, amount } = req.body;

    if (!teamId || !amount) {
      return res.status(400).json({ error: 'Team ID and amount required' });
    }

    // Get team and verify ownership
    const teams = await query('SELECT * FROM teams WHERE id = ? AND capita_id = ?', [teamId, req.userId]) as any[];
    if (teams.length === 0) {
      return res.status(403).json({ error: 'Team not found or access denied' });
    }

    // Update team status
    await query('UPDATE teams SET status = ? WHERE id = ?', ['pendent_validacio', teamId]);

    // Create/update inscription
    const inscriptions = await query(
      'SELECT * FROM inscriptions WHERE team_id = ?',
      [teamId]
    ) as any[];

    if (inscriptions.length > 0) {
      await query(
        'UPDATE inscriptions SET status = ?, amount = ?, payment_date = NOW() WHERE team_id = ?',
        ['pendent_validacio', amount, teamId]
      );
    } else {
      // Assuming tournament_id = 1 for now
      await query(
        'INSERT INTO inscriptions (team_id, tournament_id, status, amount, payment_date) VALUES (?, ?, ?, ?, NOW())',
        [teamId, 1, 'pendent_validacio', amount]
      );
    }

    res.json({ message: 'Payment processed successfully', status: 'pendent_validacio' });
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({ error: 'Failed to process payment' });
  }
});

// GET /api/team/documents - Get team documents status
router.get('/documents', verifyToken, async (req: AuthRequest, res) => {
  try {
    const teams = await query('SELECT * FROM teams WHERE capita_id = ?', [req.userId]) as any[];

    if (teams.length === 0) {
      return res.json({ 
        documents: [],
        noTeam: true,
        message: 'Primer has de crear un equip'
      });
    }

    const teamId = teams[0].id;
    
    // Get team players count
    const players = await query(`
      SELECT COUNT(*) as count FROM team_players
      WHERE team_id = ? AND user_id != ?
    `, [teamId, req.userId]) as any[];

    if (players.length > 0 && players[0].count === 0) {
      return res.json({
        documents: [],
        noPlayers: true,
        message: 'Afegeix jugadors abans de pujar documents'
      });
    }

    const documents = await query(`
      SELECT 
        d.id,
        d.user_id,
        u.name,
        d.document_type,
        d.status,
        d.rejection_reason,
        d.file_path,
        d.created_at
      FROM documents d
      JOIN users u ON d.user_id = u.id
      WHERE d.team_id = ?
      ORDER BY d.user_id, d.document_type
    `, [teamId]);

    res.json({
      documents: documents || [],
      noTeam: false,
      noPlayers: false
    });
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// POST /api/team/upload-document - Upload player document (multipart/form-data)
router.post('/upload-document', verifyToken, upload.single('file'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { teamId, userId, documentType } = req.body;

    if (!teamId || !userId || !documentType) {
      // Delete uploaded file if validation fails
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Missing required fields: teamId, userId, documentType' });
    }

    // Verify team ownership (capita can only upload for their team)
    const teams = await query('SELECT * FROM teams WHERE id = ? AND capita_id = ?', [teamId, req.userId]) as any[];
    if (teams.length === 0) {
      // Delete uploaded file if access denied
      fs.unlinkSync(req.file.path);
      return res.status(403).json({ error: 'Access denied or team not found' });
    }

    // Verify userId belongs to the team
    const teamPlayers = await query(
      'SELECT * FROM team_players WHERE team_id = ? AND user_id = ?',
      [teamId, userId]
    ) as any[];

    if (teamPlayers.length === 0) {
      fs.unlinkSync(req.file.path);
      return res.status(403).json({ error: 'User is not part of this team' });
    }

    // Relative path for database storage (e.g., "documents/userId_docType_timestamp.pdf")
    const relativePath = path.relative(path.join(process.cwd()), req.file.path).replace(/\\/g, '/');

    // Check if document exists
    const existing = await query(
      'SELECT * FROM documents WHERE team_id = ? AND user_id = ? AND document_type = ?',
      [teamId, userId, documentType]
    ) as any[];

    if (existing.length > 0) {
      // Delete old file if exists
      const oldFile = path.join(process.cwd(), existing[0].file_path);
      if (fs.existsSync(oldFile)) {
        fs.unlinkSync(oldFile);
      }
      
      // Update existing document
      await query(
        'UPDATE documents SET file_path = ?, status = ?, updated_at = NOW() WHERE team_id = ? AND user_id = ? AND document_type = ?',
        [relativePath, 'pendent', teamId, userId, documentType]
      );
    } else {
      // Create new document
      await query(
        'INSERT INTO documents (team_id, user_id, document_type, file_path, status, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
        [teamId, userId, documentType, relativePath, 'pendent']
      );
    }

    res.json({ 
      message: 'Document uploaded successfully',
      file: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        path: relativePath
      }
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    // Try to clean up file if error occurs
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {}
    }
    res.status(500).json({ error: 'Failed to upload document' });
  }
});

// GET /api/team/download-document/:documentId - Download a document file
router.get('/download-document/:documentId', verifyToken, async (req: AuthRequest, res) => {
  try {
    const { documentId } = req.params;

    // Get document details
    const docs = await query(
      'SELECT * FROM documents WHERE id = ?',
      [documentId]
    ) as any[];

    if (docs.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const doc = docs[0];

    // Verify user has access (either capita of team or owner)
    const teams = await query(
      'SELECT * FROM teams WHERE id = ? AND capita_id = ?',
      [doc.team_id, req.userId]
    ) as any[];

    if (teams.length === 0 && doc.user_id !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if file exists
    const filePath = path.join(process.cwd(), doc.file_path);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Download file
    res.download(filePath, doc.document_type + path.extname(doc.file_path));
  } catch (error) {
    console.error('Error downloading document:', error);
    res.status(500).json({ error: 'Failed to download document' });
  }
});

export default router;
