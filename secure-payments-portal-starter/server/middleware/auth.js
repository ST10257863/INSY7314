import jwt from 'jsonwebtoken';

export function issueJwt(res, payload, cookieName = 'session') {
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '2h' });
  res.cookie(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development',
    sameSite: 'strict',
    maxAge: 2 * 60 * 60 * 1000
  });
}

export function requireAuth(req, res, next){
  // Try both cookies
  const token = req.cookies?.client_session || req.cookies?.employee_session;
  if (!token) return res.status(401).json({ ok:false, error:'unauthorized' });
  try{
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  }catch(e){
    return res.status(401).json({ ok:false, error:'invalid token' });
  }
}

export function clearSession(res, cookieName = 'session') {
  res.clearCookie(cookieName, { httpOnly:true, secure: process.env.NODE_ENV !== 'development', sameSite:'strict' });
}

export function requireRole(role) {
  return function(req, res, next) {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ ok: false, error: 'forbidden' });
    }
    next();
  };
}
