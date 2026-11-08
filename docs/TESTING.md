# Validation report and acceptance checklist

## Automated checks

Run `python -m pytest -q` in the installed virtual environment. Tests use a fresh temporary SQLite database with isolated test passwords; they do not use the live database.

Coverage includes:
- unauthenticated access and failed login;
- session CSRF, logout invalidation and response security headers;
- employee data isolation on dashboard and CSV reports;
- forbidden admin endpoints and cross-user roster modification;
- check-in/out conflict handling, invalid break duration and completed attendance;
- employee creation, duplicate emails, disabling sessions and self-disable protection;
- valid duty upsert, unique daily schedule and calendar/time validation;
- file server URL scheme/embedded-credential validation;
- real QR PNG generation, PDF merge/compress/first-page/image conversion;
- Excel export, transactional roster CSV import and invalid employee rejection;
- PDF split/JPG ZIP generation and video option validation;
- rejection of DNS command-injection payloads.

Frontend syntax: `node --check app/static/app.js`.

Frontend DOM smoke suite: `npm ci && npm test`. This renders all 14 pages, opens four utility forms, checks for invalid nested forms and verifies employee admin-navigation visibility using jsdom. It does not replace real-browser visual or end-to-end tests.

Latest local result: **13 API tests passed** and **frontend DOM smoke passed**. The dependency stack emits one upstream TestClient/httpx deprecation warning.

## Manual acceptance required before deployment

- Windows 10/11 and target Windows Server startup/reboot, backup and recovery tasks.
- PostgreSQL initialization and concurrent attendance submissions.
- Desktop/tablet/mobile (360px and 768px), dark/light modes, keyboard navigation and screen reader review.
- Every tool form in Chrome/Edge/Firefox, download and clipboard behavior over HTTPS.
- Bengali OCR with actual Tesseract language packs and Bangla screenshots.
- FFmpeg conversions for WMV, AVI, MOV, MKV; size/quality and 120-second cancellation limits.
- Browser-specific QR decoding (unsupported browsers return an explicit error).
- Native DST transitions for New York/Dublin; clock-change ambiguity must be verified.
- Network DNS with approved domains in the deployment network (sandbox egress is restricted).
- External file server access under its own authorized credentials. No remote probe is made by this application.
- Upload resource exhaustion, malformed media fuzzing, reverse proxy body limits, operational logging, low-privilege process isolation, retention and encrypted off-site backup.

The automated suite is a regression baseline, not proof that every requested enterprise feature exists or is production-certified. Missing scope is tracked explicitly in README.md.
