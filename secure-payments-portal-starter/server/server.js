import express from 'express';
import helmet from 'helmet';
import hpp from 'hpp';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import csrf from 'csurf';
import xssClean from 'xss-clean';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { requireHttps } from './middleware/requireHttps.js';
import authRoutes from './routes/auth.js';
import paymentRoutes from './routes/payments.js';
import { initDb } from './db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8443;

await initDb();

// Trust proxy when behind CDN/WAF
app.set('trust proxy', 1);

// Security headers + CSP
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      "default-src": ["'self'"],
      "script-src": ["'self'"],
      "connect-src": ["'self'", process.env.CORS_ORIGIN],
      "img-src": ["'self'","data:"],
      "style-src": ["'self'","'unsafe-inline'"]
    }
  },
  frameguard: { action: 'deny' }, // against clickjacking
  referrerPolicy: { policy: 'no-referrer' }
}));

// Prevent HTTP Parameter Pollution
app.use(hpp());
// Basic XSS sanitization
app.use(xssClean());

// Logging (avoid logging sensitive data)
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));

// Strict CORS (API only used by our client)
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
}));

app.use(requireHttps);
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

// Rate limiting & slow down to deter brute-force/DDOS
const authLimiter = rateLimit({ windowMs: 15*60*1000, max: 20, standardHeaders: true, legacyHeaders: false });
const speedLimiter = slowDown({ windowMs: 15*60*1000, delayAfter: 50, delayMs: 250 });

app.use('/api/auth', authLimiter);

// CSRF using double-submit cookie
const csrfProtection = csrf({ cookie: { httpOnly: false, sameSite: 'strict', secure: process.env.NODE_ENV !== 'development' } });
app.use(csrfProtection);

// Expose CSRF token route
app.get('/api/csrf-token', (req,res)=>{
  res.cookie('XSRF-TOKEN', req.csrfToken(), { httpOnly:false, sameSite:'strict', secure: process.env.NODE_ENV !== 'development' });
  res.json({ ok:true });
});

app.use('/api/auth', authRoutes);
app.use('/api/payments', speedLimiter, paymentRoutes);

// Health
app.get('/api/health', (req,res)=>res.json({ ok:true }));

// Error handler
app.use((err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({ ok:false, error:'invalid_csrf_token' });
  }
  console.error(err);
  res.status(500).json({ ok:false, error:'server_error' });
});

app.listen(PORT, () => {
  console.log(`Secure API listening on port ${PORT}`);
});
