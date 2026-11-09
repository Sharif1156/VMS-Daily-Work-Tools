# NAFi iT — VMS Enterprise

**One Dashboard • All Essential Tools • Always Accessible.**

A working initial release of an office management workspace: FastAPI, SQLAlchemy, PostgreSQL-compatible models, and a dependency-free responsive HTML/CSS/JavaScript frontend. This is **not yet the entire enterprise specification**; the exact implemented scope and remaining requirements are listed below.

## Quick start (Linux / macOS)

```bash
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
cp .env.example .env
# Set strong ADMIN_PASSWORD and EMPLOYEE_PASSWORD in .env
.venv/bin/python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --env-file .env
```

Sign in as `admin@nafi.it` or `employee@nafi.it` with your configured initial passwords. If unset, cryptographically generated passwords are printed on the first startup. No hardcoded production password. The database is initialized only once. Never ship the sample identities as real employee records.

Windows: [installation and operations guide](docs/WINDOWS.md).

## Implemented

- Responsive navy/blue dashboard, light/dark preferences, searchable navigation, a 60-second dashboard refresh, real database statistics (empty attendance stays empty, not fabricated), recent audit events.
- Argon2 authentication, opaque HttpOnly SameSite sessions, 12-hour expiry, session revocation on account disable/logout, CSRF checks on authenticated mutations, input validation, security headers, basic in-process IP rate limiting (8 login requests/minute, 120 other API requests/minute).
- Admin employee creation/deactivation, role assignment at creation, system dependency health, file server configuration. Deactivation retains employee history.
- Employee-only data scope enforced on backend dashboard, schedule and attendance/Excel/CSV exports. Employees cannot call administrative APIs.
- Admin duty assignment/upsert, day/night/custom/off shifts, 14-day seed roster, transactional CSV/XLSX roster imports, CSV/Excel exports.
- Check-in/check-out, break duration validation, monthly net hours and overtime above 8 hours per completed day. Bangladesh calendar dates, UTC timestamps; overnight elapsed work supported.
- Salary estimate with regular/overtime pay, multiplier, allowance, bonus and deductions, copy/download TXT. Estimates are not persisted payroll records.
- Bengali navigation, welcome text and dashboard intro; English remains for most detailed tool forms. Full translation is not complete.
- Image OCR endpoint (requires Tesseract + English/Bengali language packs), QR PNG generator, browser QR image scanner where supported.
- PDF merge, lossless compression, first-page extraction, full per-page split ZIP, PDF-to-JPG ZIP, JPG/PNG-to-PDF. Downloads are actual processed files.
- Local video player, speed presets, approximate 30fps stepping, timestamp/duration calculator; FFmpeg MP4 conversion/compression with resolution, FPS and bitrate controls and before/after size (requires FFmpeg).
- Safe DNS resolver with domain validation, browser connectivity information (not fabricated ISP or LAN details).
- Configurable external file server link/copy. Connection is explicitly unverified; no credentials stored in frontend and no proxy to arbitrary server addresses.
- Date difference/add-subtract, Dhaka/New York/Dublin/UTC time conversion, local SHA-256 duplicate file reports without destructive deletion.
- Windows install/start/backup/task-registration scripts, initial versioned schema, environment example, automated API tests.

- **Tools Hub (44 browser-side tools)** in `app/static/tools.js`, shown under *Other Tools* with search: text (word counter, case converter, diff, extractors…), encoding (Base64, URL, HTML, hex, JWT, Morse), developer (JSON, regex, timestamp, minifier, UUID), security (SHA-1/256/512, HMAC, password generator/strength), colour (converter, contrast, gradient, shades), calculators (age, BMI, EMI, percentage, GPA, units, random), date (week number, countdown) and an image compressor/converter. Everything runs locally; nothing is uploaded. Add a tool by appending one object to the `tools` array.
- **Public Tools site at `/tools`** (no login): DailyUseTools-style header, search, category pills, popular tools and per-tool links like `/tools#json`. Files: `tools.html`, `tools-site.css`, `tools-site.js`.
- DailyUseTools-style blue theme (primary `#2B6CB0`) with light and dark modes.

## Not implemented / not production-certified

This release does **not** claim to implement: full Bengali localization; employee profile editing or self-service password reset; editable role/compensation management after creation; persisted payroll/salary history and custom salary rules; late-arrival/early-leave policies; full month calendar UI or roster PDF export; tool enable/disable permissions; notification delivery; audited backup/restore web administration; WAN speed test, public IP/ISP/geolocation lookup, ping, traceroute or HTTP probing; PDF preview UI; arbitrary-frame-accurate video stepping; asynchronous video job queues or measured progress percentages; distributed rate limits; malware scanning; SSO/MFA; comprehensive operations monitoring. These need additional implementation and acceptance testing before enterprise rollout.

Browser networking restrictions prevent direct access to local gateway/Wi-Fi configuration. External file-server authentication/TLS is the external server operator's responsibility. No fake network results or fabricated successful server status are shown.

## API and schema

- Interactive OpenAPI: `/docs`; machine-readable schema: `/openapi.json`.
- Login: `POST /api/login {email,password}` returns current user and CSRF token and sets a session cookie.
- Send `X-CSRF-Token` for authenticated POST/PUT/DELETE requests. Frontend does this automatically.
- Main data: `/api/me`, `/api/dashboard`, `/api/attendance/{in|out}`, `/api/schedule`, `/api/schedule/import`, `/api/employees`, `/api/settings/server`, `/api/health`.
- Reports: `/api/reports/{attendance|schedule}` (CSV), append `/excel` for XLSX.
- Processing: `/api/tools/ocr`, `/api/tools/qr`, `/api/tools/pdf/{operation}`, `/api/tools/pdf-archive/{split|jpg}`, `/api/tools/video`, `/api/tools/dns`.
- [Version-1 database schema](migrations/001_initial.md).

## Validation

```bash
.venv/bin/python -m pytest -q
node --check app/static/app.js
npm ci && npm test
```

See [testing scope and acceptance checklist](docs/TESTING.md). This sandbox validates SQLite API behavior; no Windows/PostgreSQL/browser E2E or external processing-engine certification is implied.

`requirements-lock.txt` captures the tested Linux dependency versions. Use `requirements.txt` on Windows; Linux-only transitive wheels in the snapshot are not a Windows installation manifest.
