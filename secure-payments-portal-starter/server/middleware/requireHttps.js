export function requireHttps(req, res, next){
  if (process.env.NODE_ENV === 'production'){
    const proto = req.get('x-forwarded-proto');
    if (proto && proto !== 'https'){
      return res.redirect(301, 'https://' + req.get('host') + req.originalUrl);
    }
  }
  next();
}
