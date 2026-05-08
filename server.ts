/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from "url";
import crypto from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple in-memory rate limiting
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Database setup
const dbPath = path.join(__dirname, 'condo_management.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    pin TEXT,
    role TEXT
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS residents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    unit TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL,
    phone TEXT,
    password TEXT NOT NULL,
    balance REAL DEFAULT 0,
    building TEXT NOT NULL,
    address TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS communications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT DEFAULT 'general',
    priority TEXT DEFAULT 'normal',
    target_units TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    resident_id INTEGER,
    amount REAL NOT NULL,
    description TEXT NOT NULL,
    type TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    due_date DATETIME,
    paid_date DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (resident_id) REFERENCES residents (id)
  );

  CREATE TABLE IF NOT EXISTS reservations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    resident_id INTEGER,
    resource TEXT NOT NULL,
    date DATE NOT NULL,
    time_start TIME NOT NULL,
    time_end TIME NOT NULL,
    status TEXT DEFAULT 'confirmed',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (resident_id) REFERENCES residents (id)
  );

  CREATE TABLE IF NOT EXISTS maintenance_tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    resident_id INTEGER,
    type TEXT NOT NULL,
    priority TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT DEFAULT 'open',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (resident_id) REFERENCES residents (id)
  );
`);

console.log('Database initialized and tables created');

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rate limiting middleware
const rateLimitMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  const attempts = loginAttempts.get(clientIp);

  if (attempts) {
    if (now - attempts.resetAt > RATE_LIMIT_WINDOW) {
      loginAttempts.set(clientIp, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    } else if (attempts.count >= RATE_LIMIT_MAX) {
      return res.status(429).json({ 
        success: false, 
        message: 'Muitas tentativas. Tente novamente mais tarde.' 
      });
    } else {
      attempts.count++;
    }
  } else {
    loginAttempts.set(clientIp, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
  }

  next();
};

// Helper functions
const generateToken = () => crypto.randomBytes(32).toString('hex');

const validatePin = (pin: string): boolean => {
  return /^\d{4}$/.test(pin);
};

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Authentication
app.post('/api/auth/login', rateLimitMiddleware, (req, res) => {
  try {
    const { pin } = req.body;

    if (!pin || !validatePin(pin)) {
      return res.status(400).json({ 
        success: false, 
        message: 'PIN inválido. Use 4 dígitos.' 
      });
    }

    // Check if user exists
    const user = db.prepare('SELECT * FROM users WHERE pin = ?').get(pin) as any;
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'PIN incorreto.' 
      });
    }

    // Generate token
    const token = generateToken();
    
    // Store token in memory (in production, use Redis or database)
    const sessions = (global as any).sessions || new Map();
    sessions.set(token, user);
    (global as any).sessions = sessions;

    res.json({
      success: true,
      message: 'Login realizado com sucesso!',
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      },
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  try {
    const { token } = req.body;
    
    if (token) {
      const sessions = (global as any).sessions || new Map();
      sessions.delete(token);
      (global as any).sessions = sessions;
    }

    res.json({
      success: true,
      message: 'Logout realizado com sucesso!'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
});

// Settings
app.get('/api/settings', (req, res) => {
  try {
    const settings = db.prepare('SELECT * FROM settings').all();
    const settingsObj: Record<string, any> = {};
    
    settings.forEach((setting: any) => {
      settingsObj[setting.key] = setting.value;
    });

    res.json({
      success: true,
      settings: settingsObj
    });

  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao buscar configurações' 
    });
  }
});

app.post('/api/settings', (req, res) => {
  try {
    const { settings } = req.body;
    
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ 
        success: false, 
        message: 'Configurações inválidas' 
      });
    }

    const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
    
    Object.entries(settings).forEach(([key, value]) => {
      stmt.run(key, String(value));
    });

    res.json({
      success: true,
      message: 'Configurações salvas com sucesso!'
    });

  } catch (error) {
    console.error('Save settings error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao salvar configurações' 
    });
  }
});

// Residents
app.get('/api/residents', (req, res) => {
  try {
    const residents = db.prepare('SELECT * FROM residents ORDER BY created_at DESC').all();
    
    res.json({
      success: true,
      residents
    });

  } catch (error) {
    console.error('Get residents error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao buscar moradores' 
    });
  }
});

app.post('/api/residents', (req, res) => {
  try {
    const { name, unit, email, phone, password, building, address } = req.body;
    
    if (!name || !unit || !email || !password || !building || !address) {
      return res.status(400).json({ 
        success: false, 
        message: 'Todos os campos são obrigatórios' 
      });
    }

    // Check if unit already exists
    const existingResident = db.prepare('SELECT id FROM residents WHERE unit = ?').get(unit);
    
    if (existingResident) {
      return res.status(400).json({ 
        success: false, 
        message: 'Unidade já cadastrada' 
      });
    }

    const stmt = db.prepare(`
      INSERT INTO residents (name, unit, email, phone, password, building, address)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(name, unit, email, phone, password, building, address);
    
    res.json({
      success: true,
      message: 'Morador cadastrado com sucesso!',
      resident: {
        id: result.lastInsertRowid,
        name,
        unit,
        email,
        phone,
        building,
        address,
        status: 'active',
        balance: 0
      }
    });

  } catch (error) {
    console.error('Create resident error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao cadastrar morador' 
    });
  }
});

app.put('/api/residents/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, unit, email, phone, building, address, status } = req.body;
    
    if (!name || !unit || !email || !building || !address) {
      return res.status(400).json({ 
        success: false, 
        message: 'Todos os campos são obrigatórios' 
      });
    }

    const stmt = db.prepare(`
      UPDATE residents 
      SET name = ?, unit = ?, email = ?, phone = ?, building = ?, address = ?, status = ?
      WHERE id = ?
    `);

    const result = stmt.run(name, unit, email, phone, building, address, status || 'active', id);
    
    if (result.changes === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Morador não encontrado' 
      });
    }

    res.json({
      success: true,
      message: 'Morador atualizado com sucesso!'
    });

  } catch (error) {
    console.error('Update resident error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao atualizar morador' 
    });
  }
});

app.delete('/api/residents/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    const stmt = db.prepare('DELETE FROM residents WHERE id = ?');
    const result = stmt.run(id);
    
    if (result.changes === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Morador não encontrado' 
      });
    }

    res.json({
      success: true,
      message: 'Morador removido com sucesso!'
    });

  } catch (error) {
    console.error('Delete resident error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao remover morador' 
    });
  }
});

// Communications
app.get('/api/communications', (req, res) => {
  try {
    const communications = db.prepare('SELECT * FROM communications ORDER BY created_at DESC').all();
    
    res.json({
      success: true,
      communications
    });

  } catch (error) {
    console.error('Get communications error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao buscar comunicados' 
    });
  }
});

app.post('/api/communications', (req, res) => {
  try {
    const { title, content, type, priority, target_units } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ 
        success: false, 
        message: 'Título e conteúdo são obrigatórios' 
      });
    }

    const stmt = db.prepare(`
      INSERT INTO communications (title, content, type, priority, target_units)
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = stmt.run(title, content, type || 'general', priority || 'normal', target_units);
    
    res.json({
      success: true,
      message: 'Comunicado criado com sucesso!',
      communication: {
        id: result.lastInsertRowid,
        title,
        content,
        type: type || 'general',
        priority: priority || 'normal',
        target_units
      }
    });

  } catch (error) {
    console.error('Create communication error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao criar comunicado' 
    });
  }
});

// Payments
app.get('/api/payments', (req, res) => {
  try {
    const payments = db.prepare(`
      SELECT p.*, r.name as resident_name, r.unit
      FROM payments p
      LEFT JOIN residents r ON p.resident_id = r.id
      ORDER BY p.created_at DESC
    `).all();
    
    res.json({
      success: true,
      payments
    });

  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao buscar pagamentos' 
    });
  }
});

app.post('/api/payments', (req, res) => {
  try {
    const { resident_id, amount, description, type, due_date } = req.body;
    
    if (!resident_id || !amount || !description || !type) {
      return res.status(400).json({ 
        success: false, 
        message: 'Todos os campos são obrigatórios' 
      });
    }

    const stmt = db.prepare(`
      INSERT INTO payments (resident_id, amount, description, type, due_date)
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = stmt.run(resident_id, amount, description, type, due_date);
    
    res.json({
      success: true,
      message: 'Pagamento registrado com sucesso!',
      payment: {
        id: result.lastInsertRowid,
        resident_id,
        amount,
        description,
        type,
        due_date,
        status: 'pending'
      }
    });

  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao registrar pagamento' 
    });
  }
});

// Reservations
app.get('/api/reservations', (req, res) => {
  try {
    const reservations = db.prepare(`
      SELECT r.*, res.name as resident_name, res.unit
      FROM reservations r
      LEFT JOIN residents res ON r.resident_id = res.id
      ORDER BY r.date ASC, r.time_start ASC
    `).all();
    
    res.json({
      success: true,
      reservations
    });

  } catch (error) {
    console.error('Get reservations error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao buscar reservas' 
    });
  }
});

app.post('/api/reservations', (req, res) => {
  try {
    const { resident_id, resource, date, time_start, time_end, notes } = req.body;
    
    if (!resident_id || !resource || !date || !time_start || !time_end) {
      return res.status(400).json({ 
        success: false, 
        message: 'Todos os campos são obrigatórios' 
      });
    }

    const stmt = db.prepare(`
      INSERT INTO reservations (resident_id, resource, date, time_start, time_end, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(resident_id, resource, date, time_start, time_end, notes);
    
    res.json({
      success: true,
      message: 'Reserva criada com sucesso!',
      reservation: {
        id: result.lastInsertRowid,
        resident_id,
        resource,
        date,
        time_start,
        time_end,
        notes,
        status: 'confirmed'
      }
    });

  } catch (error) {
    console.error('Create reservation error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao criar reserva' 
    });
  }
});

// Maintenance tickets
app.get('/api/maintenance', (req, res) => {
  try {
    const tickets = db.prepare(`
      SELECT m.*, r.name as resident_name, r.unit
      FROM maintenance_tickets m
      LEFT JOIN residents r ON m.resident_id = r.id
      ORDER BY m.created_at DESC
    `).all();
    
    res.json({
      success: true,
      tickets
    });

  } catch (error) {
    console.error('Get maintenance tickets error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao buscar chamados de manutenção' 
    });
  }
});

app.post('/api/maintenance', (req, res) => {
  try {
    const { resident_id, type, priority, description } = req.body;
    
    if (!resident_id || !type || !priority || !description) {
      return res.status(400).json({ 
        success: false, 
        message: 'Todos os campos são obrigatórios' 
      });
    }

    const stmt = db.prepare(`
      INSERT INTO maintenance_tickets (resident_id, type, priority, description)
      VALUES (?, ?, ?, ?)
    `);

    const result = stmt.run(resident_id, type, priority, description);
    
    res.json({
      success: true,
      message: 'Chamado de manutenção criado com sucesso!',
      ticket: {
        id: result.lastInsertRowid,
        resident_id,
        type,
        priority,
        description,
        status: 'open'
      }
    });

  } catch (error) {
    console.error('Create maintenance ticket error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao criar chamado de manutenção' 
    });
  }
});

// Backup and restore
app.post('/api/backup', (req, res) => {
  try {
    const backup = db.prepare('SELECT * FROM residents').all();
    
    res.json({
      success: true,
      message: 'Backup criado com sucesso!',
      backup,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Backup error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao criar backup' 
    });
  }
});

app.post('/api/restore', (req, res) => {
  try {
    const { backup } = req.body;
    
    if (!Array.isArray(backup)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Dados de backup inválidos' 
      });
    }

    // Clear existing data
    db.prepare('DELETE FROM residents').run();
    
    // Restore data
    const stmt = db.prepare(`
      INSERT INTO residents (id, name, unit, email, phone, password, balance, building, address, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    backup.forEach((resident: any) => {
      stmt.run([
        resident.id,
        resident.name,
        resident.unit,
        resident.email,
        resident.phone,
        resident.password,
        resident.balance,
        resident.building,
        resident.address,
        resident.status,
        resident.created_at
      ]);
    });

    res.json({
      success: true,
      message: 'Backup restaurado com sucesso',
      restoredAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error restoring backup:', error);
    res.status(500).json({ success: false, message: 'Erro ao restaurar backup' });
  }
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    success: false, 
    message: 'Erro interno do servidor' 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Endpoint não encontrado' 
  });
});

// Start server
const serverPort = typeof PORT === 'string' ? parseInt(PORT, 10) : PORT;
app.listen(serverPort, "0.0.0.0", () => {
  console.log(`🚀 EDI IA Server running on port ${serverPort}`);
  console.log(`📱 App Principal: http://localhost:${serverPort}`);
  console.log(`🔗 Health check: http://localhost:${serverPort}/api/health`);
});

export default app;
