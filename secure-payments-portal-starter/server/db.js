import pkg from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
dotenv.config();
const { Pool } = pkg;

export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : false
});

export async function initDb() {
    await pool.query(`
    create table if not exists users(
      id serial primary key,
      email varchar(255) unique not null,
      password_hash varchar(255) not null,
      created_at timestamptz default now()
    );
    create table if not exists employees(
      id serial primary key,
      username varchar(100) unique not null,
      password_hash varchar(255) not null,
      full_name varchar(100) not null,
      created_at timestamptz default now()
    );
    create table if not exists payments(
      id serial primary key,
      user_id int references users(id) on delete cascade,
      beneficiary_name varchar(120) not null,
      beneficiary_iban varchar(34) not null,
      beneficiary_bic varchar(11) not null,
      amount numeric(14,2) not null check (amount>0),
      currency char(3) not null,
      reference varchar(140),
      created_at timestamptz default now(),
      verified boolean not null default false,
      verified_by int references employees(id),
      verified_at timestamptz,
      submitted boolean not null default false,
      submitted_at timestamptz,
      rejected boolean not null default false,
      rejected_by int references employees(id),
      rejected_at timestamptz,
      rejection_reason varchar(255)
    );
    `);

    // --- Add a default employee ---
    const username = 'employee1';
    const password = 'Password123!';
    const fullName = 'Default Employee';
    const saltRounds = 12;
    const hash = await bcrypt.hash(password, saltRounds);

    await pool.query(
      `INSERT INTO employees (username, password_hash, full_name)
       VALUES ($1, $2, $3)
       ON CONFLICT (username) DO NOTHING`,
      [username, hash, fullName]
    );

    // --- Add a default user for payment ownership ---
    const userEmail = 'user1@example.com';
    const userPassword = 'UserPassword123!';
    const userHash = await bcrypt.hash(userPassword, saltRounds);

    // Insert user if not exists and get their id
    const userResult = await pool.query(
      `INSERT INTO users (email, password_hash)
       VALUES ($1, $2)
       ON CONFLICT (email) DO NOTHING
       RETURNING id`,
      [userEmail, userHash]
    );
    let userId;
    if (userResult.rows.length > 0) {
      userId = userResult.rows[0].id;
    } else {
      // User already exists, fetch id
      const existing = await pool.query('SELECT id FROM users WHERE email=$1', [userEmail]);
      userId = existing.rows[0].id;
    }

    // --- Insert sample payments (if not already present) ---
    const payments = [
      {
        beneficiary_name: "Alice Example",
        beneficiary_iban: "GB29NWBK60161331926819",
        beneficiary_bic: "NWBKGB2L",
        amount: 1000.00,
        currency: "USD",
        reference: "Invoice 1001"
      },
      {
        beneficiary_name: "Bob O'Connor",
        beneficiary_iban: "DE89370400440532013000",
        beneficiary_bic: "COBADEFF",
        amount: 250.50,
        currency: "EUR",
        reference: "Consulting"
      },
      {
        beneficiary_name: "Carol Smith",
        beneficiary_iban: "FR1420041010050500013M02606",
        beneficiary_bic: "BNPAFRPP",
        amount: 5000.00,
        currency: "GBP",
        reference: "Project Payment"
      }
    ];

    for (const p of payments) {
      await pool.query(
        `INSERT INTO payments
          (user_id, beneficiary_name, beneficiary_iban, beneficiary_bic, amount, currency, reference)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT DO NOTHING`,
        [userId, p.beneficiary_name, p.beneficiary_iban, p.beneficiary_bic, p.amount, p.currency, p.reference]
      );
    }
}
