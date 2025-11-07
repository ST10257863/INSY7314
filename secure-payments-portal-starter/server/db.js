import pkg from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt'; // <-- Add this import
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
      submitted_at timestamptz
    );
  `);

  // --- Add this block to insert a default employee ---
  const username = 'employee1';
  const password = 'Password123!'; // Change this to a secure password
  const fullName = 'Default Employee';
  const saltRounds = 12;
  const hash = await bcrypt.hash(password, saltRounds);

  await pool.query(
    `INSERT INTO employees (username, password_hash, full_name)
     VALUES ($1, $2, $3)
     ON CONFLICT (username) DO NOTHING`,
    [username, hash, fullName]
  );
}
