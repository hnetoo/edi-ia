/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import cors from 'cors';
import { Database } from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from "url";
import crypto from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple in-memory rate limiting
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

function hashPin(pin: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(pin, salt, 1000, 64, 'sha512').toString('hex');
  return `$pbkdf2$1000$${salt}$${hash}`;
}

function verifyPin(pin: string, stored: string): boolean {
  // Legacy plaintext PIN support
  if (!stored.startsWith('$pbkdf2$')) {
    return pin === stored;
  }
  try {
    const parts = stored.split('$');
    const iterations = parseInt(parts[2], 10);
    const salt = parts[3];
    const hash = parts[4];
    const computedHash = crypto.pbkdf2Sync(pin, salt, iterations, 64, 'sha512').toString('hex');
    return computedHash === hash;
  } catch {
    return false;
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
      ? ['http://localhost:3000', process.env.APP_URL].filter(Boolean)
      : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

  // --- SQLite Setup ---
  const db = new Database("condo_management.db");
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

    CREATE TABLE IF NOT EXISTS fixed_expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      description TEXT,
      amount REAL,
      due_date TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS extra_fees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      description TEXT,
      amount REAL,
      due_date TEXT,
      unit TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS residents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      unit TEXT,
      contact TEXT,
      type TEXT,
      phone TEXT,
      balance REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Migration for older schemas
  try {
    db.exec("ALTER TABLE residents ADD COLUMN type TEXT");
  } catch (e) {}
  try {
    db.exec("ALTER TABLE residents ADD COLUMN phone TEXT");
  } catch (e) {}
  try {
    db.exec("ALTER TABLE users ADD COLUMN display_name TEXT");
  } catch (e) {}
  try {
    db.exec("ALTER TABLE users ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP");
  } catch (e) {}

  db.exec(`
    CREATE TABLE IF NOT EXISTS resident_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      resident_id INTEGER NULL,
      type TEXT,
      description TEXT,
      amount REAL,
      status TEXT,
      date TEXT,
      FOREIGN KEY (resident_id) REFERENCES residents (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS maintenance_tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      status TEXT,
      type TEXT,
      priority TEXT,
      description TEXT,
      date TEXT DEFAULT (date('now')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      position TEXT,
      salary REAL,
      hiring_date TEXT,
      status TEXT DEFAULT 'Ativo'
    );

    CREATE TABLE IF NOT EXISTS vacations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER,
      start_date TEXT,
      end_date TEXT,
      status TEXT DEFAULT 'Agendado',
      FOREIGN KEY (employee_id) REFERENCES employees (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS payroll (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER,
      month TEXT,
      year INTEGER,
      base_salary REAL,
      bonus REAL DEFAULT 0,
      deductions REAL DEFAULT 0,
      net_salary REAL,
      payment_date TEXT,
      FOREIGN KEY (employee_id) REFERENCES employees (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      type TEXT,
      category TEXT,
      description TEXT,
      file_path TEXT,
      uploaded_by TEXT,
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS reservations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      resident_id INTEGER,
      resource TEXT,
      start_date TEXT,
      end_date TEXT,
      purpose TEXT,
      status TEXT DEFAULT 'Confirmed',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (resident_id) REFERENCES residents (id) ON DELETE CASCADE
    );
  `);

  // Initialize default settings
  const defaultSettings = [
    { key: 'building_name', value: 'EDI IA' },
    { key: 'currency', value: 'AOA' },
    { key: 'admin_email', value: 'admin@condo.ao' }
  ];

  for (const s of defaultSettings) {
    const exists = db.prepare("SELECT * FROM settings WHERE key = ?").get(s.key);
    if (!exists) {
      db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)").run(s.key, s.value);
    }
  }

  // Create default admin if not exists
  const checkAdmin = db.prepare("SELECT * FROM users WHERE username = ?").get("admin");
  if (!checkAdmin) {
    const hashedPin = hashPin("1234");
    db.prepare("INSERT INTO users (username, pin, role) VALUES (?, ?, ?)").run("admin", hashedPin, "administrator");
  }

  // --- API Routes ---

  app.get("/api/settings", (req, res) => {
    try {
      const settings = db.prepare("SELECT * FROM settings").all() as any[];
      const settingsObj = settings.reduce((acc: any, curr: any) => {
        acc[curr.key] = curr.value;
        return acc;
      }, {});
      res.json({ success: true, settings: settingsObj });
    } catch (error) {
      res.status(500).json({ success: false, message: "Erro ao carregar definições" });
    }
  });

  app.put("/api/settings", (req, res) => {
    const updates = req.body;
    try {
      const db_transaction = db.transaction(() => {
        for (const [key, value] of Object.entries(updates)) {
          db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").run(key, value as string);
        }
      });
      db_transaction();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, message: "Erro ao atualizar definições" });
    }
  });

  app.post("/api/residents", (req, res) => {
    const { name, unit, contact, balance, type, phone } = req.body;
    
    // Validação de inputs
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ success: false, message: "Nome é obrigatório e deve ter pelo menos 2 caracteres" });
    }
    if (!unit || typeof unit !== 'string' || unit.trim().length < 1) {
      return res.status(400).json({ success: false, message: "Unidade é obrigatória" });
    }
    if (!contact || typeof contact !== 'string' || contact.trim().length < 3) {
      return res.status(400).json({ success: false, message: "Contato é obrigatório" });
    }
    if (balance !== undefined && (isNaN(balance) || balance < 0)) {
      return res.status(400).json({ success: false, message: "Saldo deve ser um número válido" });
    }
    
    try {
      const stmt = db.prepare("INSERT INTO residents (name, unit, contact, balance, type, phone) VALUES (?, ?, ?, ?, ?, ?)");
      const result = stmt.run(name.trim(), unit.trim(), contact.trim(), balance || 0, type || 'Residente', phone?.trim() || contact.trim());
      res.json({ success: true, id: result.lastInsertRowid });
    } catch (error: any) {
      if (error?.message?.includes?.('UNIQUE')) {
        return res.status(409).json({ success: false, message: "Já existe um morador nesta unidade" });
      }
      res.status(500).json({ success: false, message: "Erro ao criar morador" });
    }
  });

  app.get("/api/residents", (req, res) => {
    try {
      const residents = db.prepare("SELECT * FROM residents ORDER BY unit ASC").all();
      res.json({ success: true, residents });
    } catch (error) {
      res.status(500).json({ success: false, message: "Erro ao procurar moradores" });
    }
  });

  app.put("/api/residents/:id", (req, res) => {
    const { id } = req.params;
    const { name, unit, contact, balance, type, phone } = req.body;
    try {
      db.prepare("UPDATE residents SET name = ?, unit = ?, contact = ?, balance = ?, type = ?, phone = ? WHERE id = ?")
        .run(name, unit, contact, balance, type, phone || contact, id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, message: "Erro ao atualizar morador" });
    }
  });

  app.delete("/api/residents/:id", (req, res) => {
    const { id } = req.params;
    try {
      // With PRAGMA foreign_keys = ON and ON DELETE CASCADE, this should handle it
      db.prepare("DELETE FROM residents WHERE id = ?").run(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, message: "Erro ao remover morador" });
    }
  });
  
  app.post("/api/finance/fixed-expenses", (req, res) => {
    const { description, amount, due_date } = req.body;
    try {
      const stmt = db.prepare("INSERT INTO fixed_expenses (description, amount, due_date) VALUES (?, ?, ?)");
      const result = stmt.run(description, amount, due_date);
      res.json({ success: true, id: result.lastInsertRowid });
    } catch (error) {
      res.status(500).json({ success: false, message: "Erro ao guardar despesa" });
    }
  });

  app.get("/api/finance/fixed-expenses", (req, res) => {
    try {
      const expenses = db.prepare("SELECT * FROM fixed_expenses ORDER BY id DESC").all();
      res.json({ success: true, expenses });
    } catch (error) {
      res.status(500).json({ success: false, message: "Erro ao procurar despesas" });
    }
  });

  app.put("/api/finance/fixed-expenses/:id", (req, res) => {
    const { id } = req.params;
    const { description, amount, due_date } = req.body;
    try {
      db.prepare("UPDATE fixed_expenses SET description = ?, amount = ?, due_date = ? WHERE id = ?")
        .run(description, amount, due_date, id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, message: "Erro ao atualizar despesa" });
    }
  });

  app.post("/api/finance/extra-fees", (req, res) => {
    const { description, amount, due_date, unit } = req.body;
    try {
      const stmt = db.prepare("INSERT INTO extra_fees (description, amount, due_date, unit) VALUES (?, ?, ?, ?)");
      const result = stmt.run(description, amount, due_date, unit);
      res.json({ success: true, id: result.lastInsertRowid });
    } catch (error) {
      res.status(500).json({ success: false, message: "Erro ao guardar taxa extra" });
    }
  });

  app.get("/api/finance/extra-fees", (req, res) => {
    try {
      const fees = db.prepare("SELECT * FROM extra_fees ORDER BY id DESC").all();
      res.json({ success: true, fees });
    } catch (error) {
      res.status(500).json({ success: false, message: "Erro ao procurar taxas extras" });
    }
  });

  app.get("/api/residents/:id/transactions", (req, res) => {
    const { id } = req.params;
    try {
      const transactions = db.prepare("SELECT * FROM resident_transactions WHERE resident_id = ? ORDER BY date DESC").all(id);
      res.json({ success: true, transactions });
    } catch (error) {
      res.status(500).json({ success: false, message: "Erro ao procurar transações" });
    }
  });

  // Helper to seed transaction for a resident if they have none
  app.post("/api/residents/:id/seed-transactions", (req, res) => {
    const { id } = req.params;
    try {
      const count = db.prepare("SELECT COUNT(*) as count FROM resident_transactions WHERE resident_id = ?").get(id) as any;
      if (count.count === 0) {
        const stmt = db.prepare("INSERT INTO resident_transactions (resident_id, type, description, amount, status, date) VALUES (?, ?, ?, ?, ?, ?)");
        stmt.run(id, 'Taxa', 'Taxa Condomínio Maio', 150000, 'Pago', '2026-05-01');
        stmt.run(id, 'Taxa', 'Fundo de Reserva', 25000, 'Pago', '2026-05-01');
        stmt.run(id, 'Multa', 'Multa Atraso Pagamento Março', 45000, 'Pendente', '2026-04-15');
        stmt.run(id, 'Taxa', 'Taxa Condomínio Junho', 150000, 'Pendente', '2026-06-01');
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, message: "Erro ao semear dados" });
    }
  });

  app.get("/api/finance/all-transactions", (req, res) => {
    try {
      // Fetch both resident transactions and other expenses/revenues
      const residentTx = db.prepare(`
        SELECT t.*, r.name as resident_name, r.unit 
        FROM resident_transactions t 
        LEFT JOIN residents r ON t.resident_id = r.id 
        ORDER BY t.date DESC
      `).all();
      res.json({ success: true, transactions: residentTx });
    } catch (error) {
      res.status(500).json({ success: false, message: "Erro ao procurar transações globais" });
    }
  });

  app.post("/api/finance/transactions", (req, res) => {
    const { type, description, amount, status, date } = req.body;
    try {
      const stmt = db.prepare("INSERT INTO resident_transactions (type, description, amount, status, date) VALUES (?, ?, ?, ?, ?)");
      const result = stmt.run(type, description, amount, status, date);
      res.json({ success: true, id: result.lastInsertRowid });
    } catch (error) {
      res.status(500).json({ success: false, message: "Erro ao registrar transação" });
    }
  });

  app.post("/api/residents/:id/pay", (req, res) => {
    const { id } = req.params;
    const { amount, description, date } = req.body;
    try {
      const db_transaction = db.transaction(() => {
        // Update balance
        db.prepare("UPDATE residents SET balance = balance - ? WHERE id = ?").run(amount, id);
        
        // Record transaction
        const stmt = db.prepare("INSERT INTO resident_transactions (resident_id, type, description, amount, status, date) VALUES (?, ?, ?, ?, ?, ?)");
        stmt.run(id, 'Pagamento', description, amount, 'Pago', date);
      });
      
      db_transaction();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, message: "Erro ao processar pagamento" });
    }
  });

  app.post("/api/notifications/send", (req, res) => {
    const { residentId, type } = req.body;
    // Mock notification logic
    console.log(`Notificação enviada para o morador ${residentId} do tipo ${type}`);
    res.json({ success: true, message: "Notificação enviada com sucesso" });
  });

  app.post("/api/maintenance/tickets", (req, res) => {
    const { title, status, type, priority, description } = req.body;
    try {
      const stmt = db.prepare("INSERT INTO maintenance_tickets (title, status, type, priority, description) VALUES (?, ?, ?, ?, ?)");
      const result = stmt.run(title, status || 'Pendente', type, priority, description);
      res.json({ success: true, id: result.lastInsertRowid });
    } catch (error) {
      res.status(500).json({ success: false, message: "Erro ao criar ticket" });
    }
  });

  app.get("/api/maintenance/tickets", (req, res) => {
    try {
      const tickets = db.prepare("SELECT * FROM maintenance_tickets ORDER BY id DESC").all();
      res.json({ success: true, tickets });
    } catch (error) {
      res.status(500).json({ success: false, message: "Erro ao procurar tickets" });
    }
  });

  app.put("/api/maintenance/tickets/:id", (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
      db.prepare("UPDATE maintenance_tickets SET status = ? WHERE id = ?").run(status, id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, message: "Erro ao atualizar ticket" });
    }
  });

  // Employees
  app.get("/api/employees", (req, res) => {
    try {
      const employees = db.prepare("SELECT * FROM employees ORDER BY name").all();
      res.json({ success: true, employees });
    } catch (error) {
      res.status(500).json({ success: false, message: "Erro ao procurar funcionários" });
    }
  });

  app.post("/api/employees", (req, res) => {
    const { name, position, salary, hiring_date } = req.body;
    
    // Validação de inputs
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ success: false, message: "Nome é obrigatório e deve ter pelo menos 2 caracteres" });
    }
    if (!position || typeof position !== 'string' || position.trim().length < 2) {
      return res.status(400).json({ success: false, message: "Cargo é obrigatório" });
    }
    if (!salary || isNaN(salary) || salary <= 0) {
      return res.status(400).json({ success: false, message: "Salário deve ser um número positivo" });
    }
    if (!hiring_date || typeof hiring_date !== 'string') {
      return res.status(400).json({ success: false, message: "Data de contratação é obrigatória" });
    }
    
    try {
      const stmt = db.prepare("INSERT INTO employees (name, position, salary, hiring_date) VALUES (?, ?, ?, ?)");
      const result = stmt.run(name.trim(), position.trim(), salary, hiring_date);
      res.json({ success: true, id: result.lastInsertRowid });
    } catch (error: any) {
      res.status(500).json({ success: false, message: "Erro ao criar funcionário" });
    }
  });

  app.put("/api/employees/:id", (req, res) => {
    const { id } = req.params;
    const { name, position, salary, hiring_date, status } = req.body;
    try {
      db.prepare("UPDATE employees SET name = ?, position = ?, salary = ?, hiring_date = ?, status = ? WHERE id = ?")
        .run(name, position, salary, hiring_date, status, id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, message: "Erro ao atualizar funcionário" });
    }
  });

  app.delete("/api/employees/:id", (req, res) => {
    const { id } = req.params;
    try {
      db.prepare("DELETE FROM employees WHERE id = ?").run(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, message: "Erro ao eliminar funcionário" });
    }
  });

  // Vacations
  app.get("/api/vacations", (req, res) => {
    try {
      const vacations = db.prepare(`
        SELECT v.*, e.name as employee_name 
        FROM vacations v 
        JOIN employees e ON v.employee_id = e.id 
        ORDER BY v.start_date DESC
      `).all();
      res.json({ success: true, vacations });
    } catch (error) {
      res.status(500).json({ success: false, message: "Erro ao procurar férias" });
    }
  });

  app.post("/api/vacations", (req, res) => {
    const { employee_id, start_date, end_date } = req.body;
    try {
      const stmt = db.prepare("INSERT INTO vacations (employee_id, start_date, end_date) VALUES (?, ?, ?)");
      const result = stmt.run(employee_id, start_date, end_date);
      res.json({ success: true, id: result.lastInsertRowid });
    } catch (error) {
      res.status(500).json({ success: false, message: "Erro ao agendar férias" });
    }
  });

  // Payroll
  app.get("/api/payroll", (req, res) => {
    try {
      const payroll = db.prepare(`
        SELECT p.*, e.name as employee_name, e.position 
        FROM payroll p 
        JOIN employees e ON p.employee_id = e.id 
        ORDER BY p.year DESC, p.month DESC
      `).all();
      res.json({ success: true, payroll });
    } catch (error) {
      res.status(500).json({ success: false, message: "Erro ao procurar folha salarial" });
    }
  });

  app.post("/api/payroll", (req, res) => {
    const { employee_id, month, year, base_salary, bonus, deductions, payment_date } = req.body;
    const net_salary = base_salary + (bonus || 0) - (deductions || 0);
    try {
      const stmt = db.prepare("INSERT INTO payroll (employee_id, month, year, base_salary, bonus, deductions, net_salary, payment_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
      const result = stmt.run(employee_id, month, year, base_salary, bonus, deductions, net_salary, payment_date);
      res.json({ success: true, id: result.lastInsertRowid });
    } catch (error) {
      res.status(500).json({ success: false, message: "Erro ao gerar folha salarial" });
    }
  });

  app.post("/api/auth/login", (req, res) => {
    const { pin } = req.body;
    
    // Rate limiting
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const attempt = loginAttempts.get(ip);
    
    if (attempt && attempt.count >= RATE_LIMIT_MAX && now < attempt.resetAt) {
      return res.status(429).json({ success: false, message: "Demasiadas tentativas. Tente novamente mais tarde." });
    }
    
    // Clear expired entries
    if (attempt && now >= attempt.resetAt) {
      loginAttempts.delete(ip);
    }
    
    // Try PIN lookup - have to check all users
    const allUsers = db.prepare("SELECT * FROM users").all() as any[];
    const foundUser = allUsers.find((u: any) => verifyPin(pin, u.pin));
    
    // Record attempt
    const currentAttempt = loginAttempts.get(ip) || { count: 0, resetAt: now + RATE_LIMIT_WINDOW };
    currentAttempt.count++;
    loginAttempts.set(ip, currentAttempt);
    
    if (foundUser) {
      // Upgrade legacy plaintext PIN to hashed
      if (!foundUser.pin.startsWith('$pbkdf2$')) {
        const hashedPin = hashPin(pin);
        db.prepare("UPDATE users SET pin = ? WHERE id = ?").run(hashedPin, foundUser.id);
      }
      res.json({ success: true, user: { username: foundUser.username, role: foundUser.role } });
    } else {
      res.status(401).json({ success: false, message: "PIN incorreto" });
    }
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // --- User Management Routes ---

  app.get("/api/users", (req, res) => {
    try {
      const users = db.prepare("SELECT id, username, display_name, role, created_at FROM users ORDER BY id ASC").all();
      res.json({ success: true, users });
    } catch (error) {
      res.status(500).json({ success: false, message: "Erro ao carregar utilizadores" });
    }
  });

  app.post("/api/users", (req, res) => {
    const { username, display_name, pin, role } = req.body;
    if (!username || !pin) {
      return res.status(400).json({ success: false, message: "Username e PIN são obrigatórios" });
    }
    try {
      const hashedPin = hashPin(pin);
      const stmt = db.prepare("INSERT INTO users (username, display_name, pin, role) VALUES (?, ?, ?, ?)");
      const result = stmt.run(username, display_name || username, hashedPin, role || 'operador');
      res.json({ success: true, id: result.lastInsertRowid });
    } catch (error: any) {
      if (error?.message?.includes?.('UNIQUE')) {
        return res.status(409).json({ success: false, message: "Este username já existe" });
      }
      res.status(500).json({ success: false, message: "Erro ao criar utilizador" });
    }
  });

  app.put("/api/users/:id", (req, res) => {
    const { id } = req.params;
    const { username, display_name, pin, role } = req.body;
    try {
      if (pin) {
        const hashedPin = hashPin(pin);
        db.prepare("UPDATE users SET username = ?, display_name = ?, pin = ?, role = ? WHERE id = ?")
          .run(username, display_name || username, hashedPin, role, id);
      } else {
        db.prepare("UPDATE users SET username = ?, display_name = ?, role = ? WHERE id = ?")
          .run(username, display_name || username, role, id);
      }
      res.json({ success: true });
    } catch (error: any) {
      if (error?.message?.includes?.('UNIQUE')) {
        return res.status(409).json({ success: false, message: "Este username já existe" });
      }
      res.status(500).json({ success: false, message: "Erro ao atualizar utilizador" });
    }
  });

  app.delete("/api/users/:id", (req, res) => {
    const { id } = req.params;
    try {
      // Prevent deleting the last administrator
      const user = db.prepare("SELECT * FROM users WHERE id = ?").get(id) as any;
      if (!user) {
        return res.status(404).json({ success: false, message: "Utilizador não encontrado" });
      }
      if (user.role === 'administrator') {
        const adminCount = (db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'administrator'").get() as any).count;
        if (adminCount <= 1) {
          return res.status(400).json({ success: false, message: "Não é possível eliminar o último administrador" });
        }
      }
      db.prepare("DELETE FROM users WHERE id = ?").run(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, message: "Erro ao eliminar utilizador" });
    }
  });

  // Reset total do sistema
  app.delete("/api/reset-all", (req, res) => {
    try {
      const db_transaction = db.transaction(() => {
        // Limpar todas as tabelas exceto users e settings
        db.prepare("DELETE FROM resident_transactions").run();
        db.prepare("DELETE FROM maintenance_tickets").run();
        db.prepare("DELETE FROM payroll").run();
        db.prepare("DELETE FROM vacations").run();
        db.prepare("DELETE FROM employees").run();
        db.prepare("DELETE FROM extra_fees").run();
        db.prepare("DELETE FROM fixed_expenses").run();
        db.prepare("DELETE FROM residents").run();
        
        // Resetar saldos dos moradores para 0 (se houver algum)
        db.prepare("UPDATE residents SET balance = 0").run();
      });
      
      db_transaction();
      res.json({ success: true, message: "Todos os dados foram limpos com sucesso" });
    } catch (error) {
      console.error("Error resetting database:", error);
      res.status(500).json({ success: false, message: "Erro ao limpar dados do sistema" });
    }
  });

  // Comunicações WhatsApp
  app.post("/api/whatsapp/send", async (req, res) => {
    try {
      const { message, recipients, type = 'notification' } = req.body;
      
      if (!message || !recipients || recipients.length === 0) {
        return res.status(400).json({ success: false, message: "Mensagem e destinatários são obrigatórios" });
      }

      // Simular envio WhatsApp (em produção usar API real)
      const results = recipients.map(recipient => ({
        to: recipient.phone || recipient.contact,
        status: 'sent',
        messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString()
      }));

      // Log da comunicação
      console.log(`WhatsApp enviado: ${message} para ${recipients.length} destinatários`);

      res.json({ 
        success: true, 
        message: "Mensagens enviadas com sucesso",
        results,
        sentCount: results.length
      });
    } catch (error) {
      console.error("Error sending WhatsApp:", error);
      res.status(500).json({ success: false, message: "Erro ao enviar mensagens WhatsApp" });
    }
  });

  // Upload de documentos
  app.post("/api/documents/upload", (req, res) => {
    try {
      const { title, type, category, description } = req.body;
      
      if (!title || !type) {
        return res.status(400).json({ success: false, message: "Título e tipo são obrigatórios" });
      }

      // Inserir documento no banco
      const stmt = db.prepare(`
        INSERT INTO documents (title, type, category, description, file_path, uploaded_by, uploaded_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        title,
        type,
        category || 'Geral',
        description || '',
        `/uploads/documents/${Date.now()}_${title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
        'admin',
        new Date().toISOString()
      );

      res.json({ 
        success: true, 
        message: "Documento uploaded com sucesso",
        documentId: result.lastInsertRowid
      });
    } catch (error) {
      console.error("Error uploading document:", error);
      res.status(500).json({ success: false, message: "Erro ao fazer upload do documento" });
    }
  });

  // Sistema de reservas
  app.post("/api/reservations", (req, res) => {
    try {
      const { resident_id, resource, start_date, end_date, purpose } = req.body;
      
      if (!resident_id || !resource || !start_date || !end_date) {
        return res.status(400).json({ success: false, message: "Dados obrigatórios faltando" });
      }

      // Verificar disponibilidade
      const existing = db.prepare(`
        SELECT * FROM reservations 
        WHERE resource = ? 
        AND ((start_date <= ? AND end_date >= ?) OR (start_date <= ? AND end_date >= ?))
        AND status != 'Cancelled'
      `).get(resource, start_date, start_date, end_date, end_date);

      if (existing) {
        return res.status(400).json({ success: false, message: "Recurso já reservado neste período" });
      }

      // Criar reserva
      const stmt = db.prepare(`
        INSERT INTO reservations (resident_id, resource, start_date, end_date, purpose, status, created_at)
        VALUES (?, ?, ?, ?, ?, 'Confirmed', ?)
      `);

      const result = stmt.run(
        resident_id,
        resource,
        start_date,
        end_date,
        purpose || 'Reserva de espaço',
        new Date().toISOString()
      );

      res.json({ 
        success: true, 
        message: "Reserva criada com sucesso",
        reservationId: result.lastInsertRowid
      });
    } catch (error) {
      console.error("Error creating reservation:", error);
      res.status(500).json({ success: false, message: "Erro ao criar reserva" });
    }
  });

  // Backup automático na nuvem
  app.post("/api/backup/create", async (req, res) => {
    try {
      const { type = 'full', include_documents = true } = req.body;
      
      // Simular backup para nuvem (em produção usar AWS S3, Google Drive, etc)
      const backupData = {
        timestamp: new Date().toISOString(),
        type,
        tables: [],
        size: '2.4 MB',
        location: 'cloud_storage/edi_ia_backups',
        filename: `backup_${type}_${Date.now()}.json`
      };

      // Coletar dados das tabelas principais
      const tables = ['residents', 'resident_transactions', 'maintenance_tickets', 'employees', 'payroll', 'documents', 'reservations'];
      
      for (const table of tables) {
        try {
          const data = db.prepare(`SELECT * FROM ${table}`).all();
          backupData.tables.push({
            name: table,
            count: data.length,
            size: JSON.stringify(data).length
          });
        } catch (error) {
          console.log(`Table ${table} not found or empty`);
        }
      }

      // Simular upload para nuvem
      console.log(`Backup criado: ${backupData.filename}`);
      
      res.json({ 
        success: true, 
        message: "Backup criado com sucesso",
        backup: backupData
      });
    } catch (error) {
      console.error("Error creating backup:", error);
      res.status(500).json({ success: false, message: "Erro ao criar backup" });
    }
  });

  app.get("/api/backup/list", (req, res) => {
    try {
      // Simular lista de backups existentes
      const backups = [
        {
          id: 1,
          filename: 'backup_full_1715168400000.json',
          type: 'full',
          size: '2.4 MB',
          created_at: '2026-05-08T10:00:00Z',
          location: 'cloud_storage/edi_ia_backups',
          status: 'completed'
        },
        {
          id: 2,
          filename: 'backup_incremental_1715082000000.json',
          type: 'incremental',
          size: '0.8 MB',
          created_at: '2026-05-07T10:00:00Z',
          location: 'cloud_storage/edi_ia_backups',
          status: 'completed'
        }
      ];

      res.json({ 
        success: true, 
        backups,
        total: backups.length
      });
    } catch (error) {
      console.error("Error listing backups:", error);
      res.status(500).json({ success: false, message: "Erro ao listar backups" });
    }
  });

  app.post("/api/backup/restore", async (req, res) => {
    try {
      const { backupId } = req.body;
      
      if (!backupId) {
        return res.status(400).json({ success: false, message: "ID do backup é obrigatório" });
      }

      // Simular restauração do backup
      console.log(`Restaurando backup ID: ${backupId}`);
      
      res.json({ 
        success: true, 
        message: "Backup restaurado com sucesso",
        restoredAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error restoring backup:", error);
      res.status(500).json({ success: false, message: "Erro ao restaurar backup" });
    }
  });

  // --- Vite Middleware ---
  });
}

// API server for mobile app synchronization
const mobileApp = express();
const mobilePort = process.env.PORT || 3002;

// Middleware
mobileApp.use(cors());
mobileApp.use(express.json());

// ... (mobile API routes and logic)

// Start mobile API server
mobileApp.listen(mobilePort, () => {
  console.log(`🚀 EDI IA Mobile API Server running on port ${mobilePort}`);
  console.log(`📱 Mobile endpoints available at http://localhost:${mobilePort}/api/mobile`);
  console.log(`🔗 Health check: http://localhost:${mobilePort}/api/mobile/health`);
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
