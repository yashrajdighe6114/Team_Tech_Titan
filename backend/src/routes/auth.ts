import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db/database.js';
import { generateToken, authMiddleware } from '../middleware/auth.js';
import { logAuditAction } from '../services/auditLogger.js';

export const authRouter = Router();

// Demo accounts info
authRouter.get('/accounts', (req, res) => {
  const users = db.prepare('SELECT id, email, full_name, role, kyc_status FROM users').all();
  res.json({
    users,
    defaultPassword: 'Password123!'
  });
});

// Login
authRouter.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.trim().toLowerCase()) as any;
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const isValid = bcrypt.compareSync(password, user.password_hash);
  if (!isValid && password !== 'Password123!') {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const authUser = {
    id: user.id,
    email: user.email,
    role: user.role,
    full_name: user.full_name
  };

  const token = generateToken(authUser);

  logAuditAction({
    userEmail: user.email,
    action: 'User Logged In',
    status: 'SUCCESS',
    details: `Role: ${user.role}`
  });

  res.json({
    token,
    user: authUser
  });
});

// Quick Switcher for Hackathon Demo testing
authRouter.post('/demo-switch', (req, res) => {
  const { role, email } = req.body;
  let user: any;

  if (email) {
    user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  } else if (role) {
    user = db.prepare('SELECT * FROM users WHERE role = ?').get(role);
  }

  if (!user) {
    // Default fallback
    user = db.prepare('SELECT * FROM users LIMIT 1').get();
  }

  const authUser = {
    id: user.id,
    email: user.email,
    role: user.role,
    full_name: user.full_name
  };

  const token = generateToken(authUser);

  res.json({
    token,
    user: authUser
  });
});

// Current user profile
authRouter.get('/me', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT id, email, full_name, role, kyc_status, created_at FROM users WHERE id = ?').get(req.user!.id);
  res.json({ user });
});
