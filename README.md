# Secure Customer International Payments Portal

React front‑end + Node/Express API with PostgreSQL. Implements:
- Password hashing + salting (bcrypt)
- Strict input whitelisting using Joi + regex (IBAN/BIC, names, currency)
- All traffic over SSL (HTTP→HTTPS redirect in production; set behind CDN/WAF)
- Protection against OWASP Top risks: CSP/Helmet (clickjacking/XSS), CSRF, CORS, SameSite/HttpOnly cookies,
  rate‑limiting + slowdown (brute force & DDoS), XSS clean, HPP, parameterized SQL queries.

## Quick start

### Option 1: Run with Docker Compose

You can launch the entire stack (database, server, client, and employee portal) using Docker Compose.

1. **Ensure Docker is installed and running.**
2. **From the `secure-payments-portal-starter` directory, run:**
```
docker-compose up --build
```
This will build and start the following services:
- **db** (PostgreSQL, port 5432)
- **server** (API, port 8443)
- **client** (React app, port 5173)
- **employee** (Employee portal, port 5174)

3. **Access the applications:**
- Client: [http://localhost:5173](http://localhost:5173)
- Employee portal: [http://localhost:5174](http://localhost:5174)
- API: [http://localhost:8443](http://localhost:8443)

4. **To stop and remove containers:**
1) **Database**: create Postgres db `secure_payments` and set `DATABASE_URL` in `server/.env`.
2) **Server**
```
docker-compose down -v --rmi all
```
---

### Option 2: Manual (Local) Run

1. **Database:** Create Postgres db `secure_payments` and set `DATABASE_URL` in `server/.env`.
2. **Server**

```
cd server
cp .env.example .env
npm i
npm run start
```
3) **Client**
```
cd ../client
npm i
VITE_API_URL=http://localhost:8443 npm run dev
```

In production, put the API behind HTTPS (reverse proxy / CDN).

## Notes for the screencast
- Show registration (bcrypt hash created), login (HttpOnly cookie set), and create a payment (regex/whitelist enforced).
- Demonstrate headers: `X-Frame-Options: DENY`, CSP, `Set-Cookie` flags (`HttpOnly; Secure; SameSite=Strict`). 
- Show rate limiting by firing repeated login attempts and the 429 response.
- Show CSRF protection by missing/invalid token => 403.
- Explain how WAF/CDN + mTLS with SWIFT gateway would be configured (stubbed in this starter).
