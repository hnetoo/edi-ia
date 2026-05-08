import express from 'express';
import cors from 'cors';
import { Database } from 'sqlite3';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 3002;

// Database setup
const db = new Database(path.join(__dirname, 'condo_management.db'), (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database.');
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

// Initialize tables
db.serialize(() => {
  // Residents table
  db.run(`
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
    )
  `);

  // Communications table
  db.run(`
    CREATE TABLE IF NOT EXISTS communications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      type TEXT DEFAULT 'general',
      priority TEXT DEFAULT 'normal',
      target_units TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Payments table
  db.run(`
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
    )
  `);

  // Reservations table
  db.run(`
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
    )
  `);

  // Maintenance tickets table
  db.run(`
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
    )
  `);

  console.log('Database tables initialized');
});

// API Routes

// Get all residents for mobile app
app.get('/api/mobile/residents', (req, res) => {
  try {
    const residents = db.prepare('SELECT * FROM residents WHERE status = ?').all('active');
    res.json({ success: true, residents });
  } catch (error) {
    console.error('Error fetching residents:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get specific resident for login
app.get('/api/mobile/residents/:unit', (req, res) => {
  try {
    const { unit } = req.params;
    const resident = db.prepare('SELECT * FROM residents WHERE unit = ? AND status = ?').get(unit, 'active');
    
    if (resident) {
      res.json({ success: true, resident });
    } else {
      res.status(404).json({ success: false, error: 'Resident not found' });
    }
  } catch (error) {
    console.error('Error fetching resident:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get communications for mobile app
app.get('/api/mobile/communications', (req, res) => {
  try {
    const communications = db.prepare(`
      SELECT * FROM communications 
      ORDER BY created_at DESC 
      LIMIT 50
    `).all();
    
    res.json({ success: true, communications });
  } catch (error) {
    console.error('Error fetching communications:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get payments for mobile app
app.get('/api/mobile/payments/:residentId', (req, res) => {
  try {
    const { residentId } = req.params;
    const payments = db.prepare(`
      SELECT * FROM payments 
      WHERE resident_id = ? 
      ORDER BY created_at DESC 
      LIMIT 50
    `).all(residentId);
    
    res.json({ success: true, payments });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get reservations for mobile app
app.get('/api/mobile/reservations/:residentId', (req, res) => {
  try {
    const { residentId } = req.params;
    const reservations = db.prepare(`
      SELECT * FROM reservations 
      WHERE resident_id = ? AND date >= date('now')
      ORDER BY date ASC, time_start ASC
    `).all(residentId);
    
    res.json({ success: true, reservations });
  } catch (error) {
    console.error('Error fetching reservations:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get maintenance tickets for mobile app
app.get('/api/mobile/maintenance/:residentId', (req, res) => {
  try {
    const { residentId } = req.params;
    const tickets = db.prepare(`
      SELECT * FROM maintenance_tickets 
      WHERE resident_id = ? 
      ORDER BY created_at DESC 
      LIMIT 50
    `).all(residentId);
    
    res.json({ success: true, tickets });
  } catch (error) {
    console.error('Error fetching maintenance tickets:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get building info for mobile app
app.get('/api/mobile/building', (req, res) => {
  try {
    // Get first resident to extract building info
    const firstResident = db.prepare('SELECT * FROM residents LIMIT 1').get();
    
    if (firstResident) {
      const building = {
        name: firstResident.building,
        address: firstResident.address,
        currency: 'AOA',
        admin_email: 'admin@edi-ia.ao'
      };
      
      res.json({ success: true, building });
    } else {
      res.json({ 
        success: true, 
        building: {
          name: 'EDI IA Condomínio',
          address: 'Luanda, Angola',
          currency: 'AOA',
          admin_email: 'admin@edi-ia.ao'
        }
      });
    }
  } catch (error) {
    console.error('Error fetching building info:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Sync residents from main app to mobile
app.post('/api/mobile/sync', (req, res) => {
  try {
    const { residents } = req.body;
    
    if (!Array.isArray(residents)) {
      return res.status(400).json({ success: false, error: 'Invalid data format' });
    }

    // Begin transaction
    db.serialize(() => {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO residents 
        (id, name, unit, email, phone, password, balance, building, address, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      residents.forEach((resident: any) => {
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
          resident.status || 'active',
          resident.created_at || new Date().toISOString()
        ]);
      });

      stmt.finalize();
    });

    res.json({ success: true, message: 'Residents synchronized successfully' });
  } catch (error) {
    console.error('Error syncing residents:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/api/mobile/health', (req, res) => {
  res.json({ 
    success: true, 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 EDI IA Mobile API Server running on port ${PORT}`);
  console.log(`📱 Mobile endpoints available at http://localhost:${PORT}/api/mobile`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/mobile/health`);
});

export default app;
