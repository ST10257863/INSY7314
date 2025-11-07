# Secure Customer International Payments Portal

React front‑end + Node/Express API with PostgreSQL. Implements:
- Password hashing + salting (bcrypt)
- Strict input whitelisting using Joi + regex (IBAN/BIC, names, currency)
- All traffic over SSL (HTTP→HTTPS redirect in production; set behind CDN/WAF)
- Protection against OWASP Top risks: CSP/Helmet (clickjacking/XSS), CSRF, CORS, SameSite/HttpOnly cookies,
  rate‑limiting + slowdown (brute force & DDoS), XSS clean, HPP, parameterized SQL queries.

## Quick start

### Option 1: Manual (local install)
1. **Database**: create Postgres db `secure_payments` and set `DATABASE_URL` in `server/.env`.
2. **Server**
    ```sh
    cd server
    cp .env.example .env
    npm i
    npm run start
    ```
3. **Client**
    ```sh
    cd ../client
    npm i
    VITE_API_URL=http://localhost:8443 npm run dev
    ```

### Option 2: Docker Compose (recommended)
1. **Ensure Docker and Docker Compose are installed** on your machine.
2. *(Optional but recommended)* Clean up any previous containers, images, and volumes:
    ```sh
    docker-compose down -v --rmi all
    ```
3. **Start all services (database, server, client):**
    ```sh
    docker-compose up --build
    ```
4. **Access the app:**
    - Client: [http://localhost:5173](http://localhost:5173)
    - API: [http://localhost:8443](http://localhost:8443)

> The first build may take a few minutes as images are downloaded and dependencies installed.

**Note:**
- No manual database setup is required; the Postgres container is automatically initialized.
- The client and server will hot-reload on code changes if you mount your source as a volume (see Docker docs for advanced usage).

In production, put the API behind HTTPS (reverse proxy / CDN).

## Notes for the screencast
- Show registration (bcrypt hash created), login (HttpOnly cookie set), and create a payment (regex/whitelist enforced).
- Demonstrate headers: `X-Frame-Options: DENY`, CSP, `Set-Cookie` flags (`HttpOnly; Secure; SameSite=Strict`).
- Show rate limiting by firing repeated login attempts and the 429 response.
- Show CSRF protection by missing/invalid token => 403.
- Explain how WAF/CDN + mTLS with SWIFT gateway would be configured (stubbed in this starter).