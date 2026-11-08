# Schema version 1

`app.main.initialize()` creates the baseline tables using SQLAlchemy metadata and records version `1` in `schema_migrations`. It is idempotent for fresh or already initialized version-1 databases. No destructive migrations run at startup.

Tables: users, sessions, duties, attendance, audit, settings, schema_migrations.

- users: unique email, Argon2 password hash, role, department, hourly rate, active flag.
- sessions: SHA-256 of opaque cookie, user FK, CSRF token, expiry (UTC ISO timestamp).
- duties: user FK, date, shift, start/end local time, break; unique (user_id, date).
- attendance: user FK, date, UTC check-in/out, break; unique (user_id, date).
- audit: actor ID, timestamp, message. Deactivation retains history.
- settings: configurable key/value data, including external file server address.

SQLAlchemy generates platform-appropriate DDL for SQLite and PostgreSQL. For future upgrades introduce explicit, reviewed, versioned upgrade scripts (or Alembic) after a verified backup. `create_all` does **not** upgrade existing columns or constraints. Version 1 is an initial schema migration, not a full migration framework.
