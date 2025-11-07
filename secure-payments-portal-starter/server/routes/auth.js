import express from 'express';
import bcrypt from 'bcrypt';
import { pool } from '../db.js';
import { registerSchema, loginSchema } from '../schemas/validation.js';
import { validate } from '../middleware/validate.js';
import { issueJwt, clearSession } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', validate(registerSchema), async (req,res) => {
  const { email, password } = req.body;
  const saltRounds = 12;
  const hash = await bcrypt.hash(password, saltRounds);
  try{
    const { rows } = await pool.query(
      'insert into users(email, password_hash) values($1,$2) returning id, email, created_at',
      [email, hash]
    );
    // For client login
    issueJwt(res, { id: rows[0].id, email: rows[0].email, role: 'user' }, 'client_session');
    return res.json({ ok:true, user: { id: rows[0].id, email: rows[0].email, role: 'user' } });
  }catch(e){
    if (e.code === '23505'){ // unique_violation
      return res.status(409).json({ ok:false, error:'Email already registered' });
    }
    console.error(e);
    return res.status(500).json({ ok:false, error:'server_error' });
  }
});

// For client login
router.post('/login', validate(loginSchema), async (req,res) => {
  const { email, password } = req.body;
  const { rows } = await pool.query('select id, email, password_hash from users where email=$1',[email]);
  if (!rows.length) return res.status(401).json({ ok:false, error:'invalid credentials' });
  const ok = await bcrypt.compare(password, rows[0].password_hash);
  if (!ok) return res.status(401).json({ ok:false, error:'invalid credentials' });
  // For client login
  issueJwt(res, { id: rows[0].id, email: rows[0].email, role: 'user' }, 'client_session');
  return res.json({ ok:true, user: { id: rows[0].id, email: rows[0].email, role: 'user' } });
});

// For employee login
router.post('/employee-login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ ok: false, error: 'Username and password required' });
  }
  try {
    const { rows } = await pool.query(
      'select id, username, password_hash, full_name from employees where username=$1',
      [username]
    );
    if (!rows.length) return res.status(401).json({ ok: false, error: 'invalid credentials' });
    const ok = await bcrypt.compare(password, rows[0].password_hash);
    if (!ok) return res.status(401).json({ ok: false, error: 'invalid credentials' });
    // For employee login
    issueJwt(res, { id: rows[0].id, username: rows[0].username, role: 'employee' }, 'employee_session');
    return res.json({
      ok: true,
      user: {
        id: rows[0].id,
        username: rows[0].username,
        full_name: rows[0].full_name,
        role: 'employee'
      }
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: 'server_error' });
  }
});

// For logout, clear both cookies
router.post('/logout', (req,res)=>{
  clearSession(res, 'client_session');
  clearSession(res, 'employee_session');
  res.json({ ok:true });
});

export default router;
