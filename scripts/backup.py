"""Consistent SQLite backup or pg_dump custom archive; configuration from .env."""

import os
import sqlite3
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from dotenv import load_dotenv

root = Path(__file__).resolve().parents[1]
load_dotenv(root / ".env")
url = os.environ.get("DATABASE_URL", "sqlite:///./vms.db")
destination = root / "backups"
destination.mkdir(exist_ok=True)
stamp = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
if url.startswith("sqlite:///"):
    path = Path(url.removeprefix("sqlite:///"))
    if not path.is_absolute():
        path = root / path
    if not path.exists():
        raise SystemExit("Database does not exist")
    target = destination / f"vms-{stamp}.db"
    with sqlite3.connect(path) as src, sqlite3.connect(target) as dst:
        src.backup(dst)
else:
    from sqlalchemy.engine import make_url

    parsed = make_url(url)
    env = {**os.environ, "PGPASSWORD": parsed.password or ""}
    target = destination / f"vms-{stamp}.dump"
    subprocess.run(
        [
            "pg_dump",
            "--host",
            parsed.host or "localhost",
            "--port",
            str(parsed.port or 5432),
            "--username",
            parsed.username or "postgres",
            "--dbname",
            parsed.database,
            "--format=custom",
            "--file",
            str(target),
        ],
        env=env,
        check=True,
    )
print(f"Backup created: {target}")
