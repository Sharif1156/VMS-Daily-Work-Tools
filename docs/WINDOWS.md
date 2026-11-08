# Windows Server / Windows 10 / Windows 11 setup

## Development / LAN pilot

1. Install Python 3.11+ (64-bit), Git and optionally PostgreSQL 16+.
2. Clone this repository to `C:\NAFi-VMS`. Open PowerShell there.
3. Run `powershell -NoProfile -File .\scripts\install.ps1`. The installer creates a virtual environment, dependencies, and unique initial passwords in `.env`. Keep these out of source control.
4. Run `.\scripts\start.ps1`. Browse `http://localhost:8000`. Sign in with `admin@nafi.it` or `employee@nafi.it`, using the passwords printed by installation. Initial sample users and a 14-day roster are created only on an empty database. Employee data is illustrative, not actual company data.
5. Port is configured through `PORT` in `.env`. The service binds all interfaces for LAN access. Restrict Windows Firewall to the approved LAN subnet; do not expose port 8000 publicly.

## Production checklist

- Use a dedicated, non-administrator Windows service account with read access to application files and write access only where needed. Restrict `.env`, logs, and backups with NTFS ACLs.
- Create a restricted PostgreSQL login and dedicated database. Set `DATABASE_URL=postgresql+psycopg://vms:URL_ENCODED_PASSWORD@dbhost:5432/vms`. An empty database receives the version-1 schema on first start. SQLite is for development only. PostgreSQL integration is not validated in this sandbox.
- Place IIS (ARR + URL Rewrite) or a supported reverse proxy in front of Uvicorn. Terminate TLS with a valid certificate; redirect HTTP to HTTPS, enforce HSTS at the proxy, and set `COOKIE_SECURE=true`. Do not enable proxy-header trust without limiting trusted proxy IPs.
- Configure request-body limits at the reverse proxy (e.g. 25 MB for single-file processing), header limits, timeouts, and per-user/IP request limits. PDF merge allows multiple 20 MB files; choose your policy accordingly.
- There are no external frontend CDN dependencies. All app requests are same-origin.
- Run `scripts/register-tasks.ps1` from elevated PowerShell under the dedicated account. In Task Scheduler configure “Run whether user is logged on or not”, restrict task edit permissions, test reboot recovery, and capture stdout/stderr using your operational logging agent. The script does not silently install a Windows service or grant privileges.
- Restrict access through a VPN / Zero Trust gateway for remote employees. Do not use plain HTTP over the internet.
- Remove or deactivate sample employee accounts before launch. Initial admin password is set at creation; changing `.env` does not rotate an existing database password. Account self-service password rotation is not implemented; follow your approved database-admin reset procedure until added.

## Processing engines

- FFmpeg: install an actively maintained build and put `ffmpeg.exe` on the service account PATH. Conversion accepts up to 20 MB, outputs MP4/H.264, processes the first 5 minutes and times out after 120 seconds. Media decoding should run in a hardened low-privilege isolated worker before accepting untrusted internet uploads at scale. Current processing is in-process / synchronous and not a production job queue.
- Tesseract 5+: put `tesseract.exe` on PATH and install `eng.traineddata` and `ben.traineddata`. Verify `tesseract --list-langs`. OCR returns an actionable error when dependencies are missing.
- QR scanning requires a browser supporting `BarcodeDetector`; use supported Chromium/Edge. Secure contexts (HTTPS) are required for clipboard and file hashing APIs.
- PDF processing uses pypdf, Pillow and PyMuPDF. Review PyMuPDF's AGPL/commercial licensing before proprietary distribution.

## Backup and restore

Run `.\scripts\backup.ps1`. SQLite uses its online backup API; PostgreSQL uses `pg_dump` (install PostgreSQL client tools on PATH). No passwords are passed as shell command arguments. Backups contain personal data and password hashes: encrypt, restrict, copy off-machine and enforce retention externally.

Restore SQLite: stop the application, preserve the current database, copy a verified backup to the configured SQLite path, then restart and test login/reports.

Restore PostgreSQL: stop writes, create a new empty recovery database, use `pg_restore --no-owner --dbname=<recovery_database> <backup.dump>` under an authorized DBA account, validate data, then update DATABASE_URL and restart. Do not restore over production without a rollback plan. Perform quarterly restore drills. Restore is intentionally not exposed as a web upload endpoint.
