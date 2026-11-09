import csv
import hashlib
import io
import json
import os
import secrets
import shutil
import socket
import subprocess
import tempfile
import time
from collections import defaultdict, deque
from datetime import datetime, timedelta, timezone
from pathlib import Path
from urllib.parse import urlparse

from fastapi import FastAPI, Depends, HTTPException, Request, Response, UploadFile, File
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from pwdlib import PasswordHash
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

ROOT = Path(__file__).parent
engine = create_engine(
    os.getenv("DATABASE_URL", "sqlite:///./vms.db"),
    **(
        {"connect_args": {"check_same_thread": False}}
        if os.getenv("DATABASE_URL", "sqlite:///./vms.db").startswith("sqlite")
        else {}
    ),
)
from app.models import (
    Base,
    User,
    LoginSession,
    Duty,
    Attendance,
    Audit,
    Setting,
    Migration,
)

password_hash = PasswordHash.recommended()
app = FastAPI(title="NAFi iT VMS API", version="1.0.0")
app.mount("/static", StaticFiles(directory=ROOT / "static"), name="static")


def db():
    with Session(engine) as s:
        yield s


def now():
    return datetime.now(timezone.utc)


def today():
    return (now() + timedelta(hours=6)).date().isoformat()


def log(s, uid, message):
    s.add(Audit(user_id=uid, message=message, created=now().isoformat()))


def serial(row):
    return {
        c.name: getattr(row, c.name)
        for c in row.__table__.columns
        if c.name != "password"
    }


def initialize():
    Base.metadata.create_all(engine)
    with Session(engine) as s:
        if not s.get(Migration, 1):
            s.add(Migration(version=1))
        if not s.scalar(select(User.id).limit(1)):
            admin_pw = os.getenv("ADMIN_PASSWORD") or secrets.token_urlsafe(18)
            employee_pw = os.getenv("EMPLOYEE_PASSWORD") or secrets.token_urlsafe(18)
            print(
                f"INITIAL ADMIN: admin@nafi.it / {admin_pw}\nINITIAL EMPLOYEE: employee@nafi.it / {employee_pw}",
                flush=True,
            )
            s.add_all(
                [
                    User(
                        name="Sharif Ahmed",
                        email="admin@nafi.it",
                        password=password_hash.hash(admin_pw),
                        role="admin",
                        department="IT & Operations",
                        hourly_rate=200,
                    ),
                    User(
                        name="Nafisa Rahman",
                        email="employee@nafi.it",
                        password=password_hash.hash(employee_pw),
                        role="employee",
                        department="Operations",
                        hourly_rate=150,
                    ),
                ]
            )
            s.flush()
            for u in s.scalars(select(User)):
                for offset in range(14):
                    date = (now() + timedelta(hours=6, days=offset)).date().isoformat()
                    s.add(
                        Duty(
                            user_id=u.id,
                            date=date,
                            shift="Weekly off"
                            if offset % 7 == 6
                            else ("Day shift" if u.id == 1 else "Night shift"),
                            start="09:00" if u.id == 1 else "21:00",
                            end="18:00" if u.id == 1 else "06:00",
                            break_minutes=60,
                        )
                    )
            s.add(Setting(key="file_server", value="http://103.180.245.108:39942"))
            log(s, 1, "Workspace initialized · sample roster created")
        s.commit()


initialize()

attempts = defaultdict(deque)


@app.middleware("http")
async def security(request: Request, call_next):
    if request.url.path.startswith("/api"):
        origin = request.headers.get("origin")
        if (
            request.method not in ("GET", "HEAD", "OPTIONS")
            and origin
            and origin.rstrip("/") != str(request.base_url).rstrip("/")
        ):
            return Response("Cross-origin writes are not allowed", 403)
        key = request.client.host if request.client else "unknown"
        key += ":login" if request.url.path == "/api/login" else ":api"
        bucket = attempts[key]
        stamp = time.monotonic()
        while bucket and bucket[0] < stamp - 60:
            bucket.popleft()
        if len(bucket) >= (8 if request.url.path == "/api/login" else 120):
            return Response("Too many requests. Try again shortly.", 429)
        bucket.append(stamp)
    response = await call_next(request)
    response.headers.update(
        {
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY",
            "Referrer-Policy": "same-origin",
            "Content-Security-Policy": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; media-src 'self' blob:; connect-src 'self'; frame-src blob: 'self'; object-src 'none'; base-uri 'self'; form-action 'self'",
        }
    )
    if request.url.path.startswith("/api"):
        response.headers["Cache-Control"] = "no-store"
    return response


def current(request: Request, s: Session = Depends(db)):
    token = request.cookies.get("vms_session", "")
    session = s.get(LoginSession, hashlib.sha256(token.encode()).hexdigest())
    if not session or session.expires < now().isoformat():
        raise HTTPException(401, "Please sign in to continue")
    user = s.get(User, session.user_id)
    if not user or not user.active:
        raise HTTPException(401, "Account disabled")
    if request.method not in ("GET", "HEAD") and not secrets.compare_digest(
        request.headers.get("x-csrf-token", ""), session.csrf
    ):
        raise HTTPException(403, "Invalid security token. Sign in again.")
    return user


def admin(u: User = Depends(current)):
    if u.role != "admin":
        raise HTTPException(403, "Administrator access required")
    return u


class LoginIn(BaseModel):
    email: str = Field(max_length=200)
    password: str = Field(max_length=200)


@app.post("/api/login")
def login(data: LoginIn, response: Response, s: Session = Depends(db)):
    u = s.scalar(select(User).where(User.email == data.email.strip().lower()))
    if not u or not u.active or not password_hash.verify(data.password, u.password):
        raise HTTPException(401, "Incorrect email or password")
    token = secrets.token_urlsafe(32)
    csrf = secrets.token_urlsafe(32)
    s.add(
        LoginSession(
            token=hashlib.sha256(token.encode()).hexdigest(),
            user_id=u.id,
            csrf=csrf,
            expires=(now() + timedelta(hours=12)).isoformat(),
        )
    )
    log(s, u.id, "Signed in securely")
    s.commit()
    response.set_cookie(
        "vms_session",
        token,
        httponly=True,
        secure=os.getenv("COOKIE_SECURE", "false").lower() == "true",
        samesite="strict",
        max_age=43200,
    )
    return {"user": serial(u), "csrf": csrf}


@app.get("/api/me")
def me(request: Request, u: User = Depends(current), s: Session = Depends(db)):
    session = s.get(
        LoginSession,
        hashlib.sha256(request.cookies["vms_session"].encode()).hexdigest(),
    )
    return {"user": serial(u), "csrf": session.csrf}


@app.post("/api/logout")
def logout(
    request: Request,
    response: Response,
    u: User = Depends(current),
    s: Session = Depends(db),
):
    session = s.get(
        LoginSession,
        hashlib.sha256(request.cookies["vms_session"].encode()).hexdigest(),
    )
    s.delete(session)
    s.commit()
    response.delete_cookie("vms_session")
    return {"ok": True}


def hours(a):
    if not a.check_out:
        return 0
    return max(
        0,
        (
            datetime.fromisoformat(a.check_out) - datetime.fromisoformat(a.check_in)
        ).total_seconds()
        / 3600
        - a.break_minutes / 60,
    )


@app.get("/api/dashboard")
def dashboard(u: User = Depends(current), s: Session = Depends(db)):
    people = (
        list(s.scalars(select(User).where(User.active == 1)))
        if u.role == "admin"
        else [u]
    )
    ids = [p.id for p in people]
    duties = list(
        s.scalars(
            select(Duty).where(Duty.user_id.in_(ids)).order_by(Duty.date, Duty.start)
        )
    )
    entries = list(
        s.scalars(
            select(Attendance)
            .where(Attendance.user_id.in_(ids))
            .order_by(Attendance.id.desc())
        )
    )
    month = [a for a in entries if a.date.startswith(today()[:7])]
    total = sum(hours(a) for a in month)
    schedule = [
        {**serial(d), "employee": next(p.name for p in people if p.id == d.user_id)}
        for d in duties
    ]
    activities = list(
        s.scalars(
            select(Audit)
            .where(Audit.user_id.in_(ids))
            .order_by(Audit.id.desc())
            .limit(8)
        )
    )
    return {
        "people": [serial(p) for p in people],
        "schedule": schedule,
        "attendance": [dict(serial(a), hours=round(hours(a), 2)) for a in entries],
        "activities": [serial(a) for a in activities],
        "stats": {
            "employees": len(people),
            "on_duty": sum(
                d.date == today() and d.shift != "Weekly off" for d in duties
            ),
            "present": sum(a.date == today() for a in entries),
            "hours": round(total, 1),
            "overtime": round(sum(max(0, hours(a) - 8) for a in month), 1),
            "salary": round(
                sum(
                    hours(a) * next(p.hourly_rate for p in people if p.id == a.user_id)
                    for a in month
                )
            ),
        },
        "today": today(),
        "file_server": s.get(Setting, "file_server").value,
    }


class BreakIn(BaseModel):
    break_minutes: int = Field(default=0, ge=0, le=480)


@app.post("/api/attendance/{action}")
def attendance(
    action: str, data: BreakIn, u: User = Depends(current), s: Session = Depends(db)
):
    a = s.scalar(
        select(Attendance).where(Attendance.user_id == u.id, Attendance.date == today())
    )
    if action == "in":
        if a:
            raise HTTPException(409, "You already checked in today")
        s.add(
            Attendance(
                user_id=u.id, date=today(), check_in=now().isoformat(), break_minutes=0
            )
        )
    elif action == "out":
        if not a or a.check_out:
            raise HTTPException(409, "No open attendance record")
        if (
            data.break_minutes
            > (now() - datetime.fromisoformat(a.check_in)).total_seconds() / 60
        ):
            raise HTTPException(422, "Break exceeds elapsed working time")
        a.check_out = now().isoformat()
        a.break_minutes = data.break_minutes
    else:
        raise HTTPException(404, "Unknown attendance action")
    log(s, u.id, "Checked " + action)
    s.commit()
    return {"ok": True}


class UserIn(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: str = Field(min_length=5, max_length=200)
    password: str = Field(min_length=12, max_length=200)
    role: str = Field(pattern="^(admin|employee)$")
    department: str = Field(max_length=100)
    hourly_rate: float = Field(ge=0, le=100000)


@app.post("/api/employees")
def employee(data: UserIn, u: User = Depends(admin), s: Session = Depends(db)):
    if "@" not in data.email:
        raise HTTPException(422, "Valid email required")
    if s.scalar(select(User).where(User.email == data.email.lower())):
        raise HTTPException(409, "Email already registered")
    values = data.model_dump()
    values["email"] = data.email.lower()
    values["password"] = password_hash.hash(data.password)
    s.add(User(**values))
    log(s, u.id, "Created employee " + data.name)
    s.commit()
    return {"ok": True}


@app.delete("/api/employees/{uid}")
def disable(uid: int, u: User = Depends(admin), s: Session = Depends(db)):
    if uid == u.id:
        raise HTTPException(400, "Cannot disable your own account")
    target = s.get(User, uid)
    if not target:
        raise HTTPException(404, "Employee not found")
    target.active = 0
    log(s, u.id, "Disabled employee " + target.name)
    s.commit()
    return {"ok": True}


class DutyIn(BaseModel):
    user_id: int
    date: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}$")
    shift: str = Field(min_length=2, max_length=40)
    start: str = Field(pattern=r"^([01]\d|2[0-3]):[0-5]\d$")
    end: str = Field(pattern=r"^([01]\d|2[0-3]):[0-5]\d$")
    break_minutes: int = Field(ge=0, le=480)


@app.post("/api/schedule")
def schedule(data: DutyIn, u: User = Depends(admin), s: Session = Depends(db)):
    try:
        datetime.strptime(data.date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(422, "Invalid calendar date")
    if not s.get(User, data.user_id):
        raise HTTPException(404, "Employee not found")
    old = s.scalar(
        select(Duty).where(Duty.user_id == data.user_id, Duty.date == data.date)
    )
    if old:
        for k, v in data.model_dump().items():
            setattr(old, k, v)
    else:
        s.add(Duty(**data.model_dump()))
    log(s, u.id, "Updated duty roster for " + data.date)
    s.commit()
    return {"ok": True}


@app.get("/api/reports/{kind}")
def report(kind: str, u: User = Depends(current), s: Session = Depends(db)):
    model = {"attendance": Attendance, "schedule": Duty}.get(kind)
    if not model:
        raise HTTPException(404, "Report not found")
    rows = s.scalars(
        select(model)
        if u.role == "admin"
        else select(model).where(model.user_id == u.id)
    )
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([c.name for c in model.__table__.columns])
    for row in rows:
        writer.writerow(
            [
                ("'" + str(v)) if str(v).startswith(("=", "+", "-", "@")) else v
                for v in serial(row).values()
            ]
        )
    return Response(
        output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{kind}.csv"'},
    )


class ServerIn(BaseModel):
    address: str = Field(max_length=500)


@app.put("/api/settings/server")
def server(data: ServerIn, u: User = Depends(admin), s: Session = Depends(db)):
    parsed = urlparse(data.address)
    if (
        parsed.scheme not in ("http", "https")
        or not parsed.hostname
        or parsed.username
        or parsed.password
    ):
        raise HTTPException(422, "Use an HTTP(S) address without credentials")
    s.get(Setting, "file_server").value = data.address
    log(s, u.id, "Updated file server address")
    s.commit()
    return {"ok": True}


@app.get("/api/health")
def health(u: User = Depends(admin)):
    return {
        "database": "connected",
        "ffmpeg": bool(shutil.which("ffmpeg")),
        "tesseract": bool(shutil.which("tesseract")),
        "time": now().isoformat(),
    }


MAX_FILE = 20 * 1024 * 1024


async def read_upload(file):
    data = await file.read(MAX_FILE + 1)
    if len(data) > MAX_FILE:
        raise HTTPException(413, "Maximum file size is 20 MB")
    if not data:
        raise HTTPException(422, "File is empty")
    return data


@app.post("/api/tools/pdf/{action}")
async def pdf(
    action: str, files: list[UploadFile] = File(...), u: User = Depends(current)
):
    from pypdf import PdfReader, PdfWriter
    from PIL import Image

    writer = PdfWriter()
    if len(files) > 20:
        raise HTTPException(422, "At most 20 files")
    try:
        if action == "images":
            images = []
            for f in files:
                image = Image.open(io.BytesIO(await read_upload(f)))
                image.thumbnail((4000, 4000))
                images.append(image.convert("RGB"))
            out = io.BytesIO()
            images[0].save(out, format="PDF", save_all=True, append_images=images[1:])
        else:
            for f in files:
                reader = PdfReader(io.BytesIO(await read_upload(f)))
                if len(reader.pages) > 300:
                    raise ValueError("Maximum 300 pages per file")
                if action == "first-page":
                    writer.add_page(reader.pages[0])
                elif action in ("merge", "compress"):
                    for p in reader.pages:
                        writer.add_page(p)
                else:
                    raise ValueError("Unknown PDF operation")
            if action == "compress":
                for p in writer.pages:
                    p.compress_content_streams()
            out = io.BytesIO()
            writer.write(out)
        return Response(
            out.getvalue(),
            media_type="application/pdf",
            headers={"Content-Disposition": 'attachment; filename="processed.pdf"'},
        )
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            422,
            "Unable to process file. Use valid, unencrypted PDFs or images. Compression is lossless and may not reduce every file.",
        )


@app.post("/api/tools/ocr")
async def ocr(file: UploadFile = File(...), u: User = Depends(current)):
    if not shutil.which("tesseract"):
        raise HTTPException(
            503,
            "Install Tesseract with eng and ben language packs on the server to enable OCR",
        )
    from PIL import Image
    import pytesseract

    try:
        img = Image.open(io.BytesIO(await read_upload(file)))
        img.thumbnail((4000, 4000))
        return {"text": pytesseract.image_to_string(img, lang="eng+ben", timeout=45)}
    except Exception:
        raise HTTPException(
            422,
            "OCR failed. Check the image and installed Bengali/English language packs.",
        )


class QRIn(BaseModel):
    text: str = Field(min_length=1, max_length=2000)


@app.post("/api/tools/qr")
def qr(data: QRIn, u: User = Depends(current)):
    import qrcode

    try:
        image = qrcode.make(data.text)
        output = io.BytesIO()
        image.save(output, format="PNG")
        return Response(output.getvalue(), media_type="image/png")
    except Exception:
        raise HTTPException(422, "Text is too long for a QR code")


class DNSIn(BaseModel):
    domain: str = Field(
        max_length=253,
        pattern=r"^([a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}$",
    )


@app.post("/api/tools/dns")
def dns(data: DNSIn, u: User = Depends(current)):
    try:
        return {
            "domain": data.domain,
            "addresses": sorted(
                {i[4][0] for i in socket.getaddrinfo(data.domain, 443)}
            ),
        }
    except socket.gaierror:
        raise HTTPException(422, "Domain could not be resolved")


@app.get("/")
def index():
    return FileResponse(ROOT / "static/index.html")


@app.get("/tools")
def public_tools():
    """Public, login-free page for the browser-side tools (no data is sent to the server)."""
    return FileResponse(ROOT / "static/tools.html")


@app.post("/api/schedule/import")
async def roster_import(
    file: UploadFile = File(...), u: User = Depends(admin), s: Session = Depends(db)
):
    raw = await read_upload(file)
    try:
        if file.filename.lower().endswith(".xlsx"):
            from openpyxl import load_workbook

            book = load_workbook(io.BytesIO(raw), read_only=True, data_only=True)
            rows = iter(book.active.values)
            columns = next(rows)
            records = [dict(zip(columns, row)) for row in rows]
        else:
            records = list(csv.DictReader(io.StringIO(raw.decode("utf-8-sig"))))
        if len(records) > 5000:
            raise ValueError("Maximum 5000 entries")
        validated = [DutyIn.model_validate(r) for r in records]
        for row in validated:
            datetime.strptime(row.date, "%Y-%m-%d")
            if not s.get(User, row.user_id):
                raise ValueError("Unknown employee")
        for row in validated:
            old = s.scalar(
                select(Duty).where(Duty.user_id == row.user_id, Duty.date == row.date)
            )
            if old:
                for key, value in row.model_dump().items():
                    setattr(old, key, value)
            else:
                s.add(Duty(**row.model_dump()))
            s.flush()
        log(s, u.id, f"Imported {len(validated)} roster rows")
        s.commit()
        return {"imported": len(validated)}
    except Exception:
        s.rollback()
        raise HTTPException(
            422,
            "Invalid roster. Required columns: user_id,date,shift,start,end,break_minutes. Dates YYYY-MM-DD, times HH:MM. Maximum 5000 rows.",
        )


@app.get("/api/reports/{kind}/excel")
def excel_report(kind: str, u: User = Depends(current), s: Session = Depends(db)):
    from openpyxl import Workbook

    model = {"attendance": Attendance, "schedule": Duty}.get(kind)
    if not model:
        raise HTTPException(404, "Report not found")
    book = Workbook()
    sheet = book.active
    sheet.title = kind.title()
    sheet.append([c.name for c in model.__table__.columns])
    for row in s.scalars(
        select(model)
        if u.role == "admin"
        else select(model).where(model.user_id == u.id)
    ):
        sheet.append(
            [
                ("'" + str(v)) if str(v).startswith(("=", "+", "-", "@")) else v
                for v in serial(row).values()
            ]
        )
    out = io.BytesIO()
    book.save(out)
    return Response(
        out.getvalue(),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{kind}.xlsx"'},
    )


@app.post("/api/tools/pdf-archive/{action}")
async def pdf_archive(
    action: str, file: UploadFile = File(...), u: User = Depends(current)
):
    import pymupdf
    import zipfile

    data = await read_upload(file)
    if action not in ("split", "jpg"):
        raise HTTPException(404, "Unknown operation")
    try:
        source = pymupdf.open(stream=data, filetype="pdf")
        if source.needs_pass or len(source) > 100:
            raise ValueError("Use an unencrypted PDF under 100 pages")
        out = io.BytesIO()
        with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as archive:
            for idx, page in enumerate(source):
                if action == "jpg":
                    if page.rect.width * page.rect.height > 10_000_000:
                        raise ValueError("Page too large")
                    archive.writestr(
                        f"page-{idx + 1}.jpg", page.get_pixmap(dpi=100).tobytes("jpeg")
                    )
                else:
                    single = pymupdf.open()
                    single.insert_pdf(source, from_page=idx, to_page=idx)
                    archive.writestr(f"page-{idx + 1}.pdf", single.tobytes())
                    single.close()
        source.close()
        return Response(
            out.getvalue(),
            media_type="application/zip",
            headers={"Content-Disposition": 'attachment; filename="pages.zip"'},
        )
    except Exception:
        raise HTTPException(
            422,
            "Unable to process PDF. Maximum 100 unencrypted pages with standard page dimensions.",
        )


@app.post("/api/tools/video")
def video_convert(
    file: UploadFile = File(...),
    resolution: str = "720",
    fps: int = 25,
    bitrate: int = 1500,
    u: User = Depends(current),
):
    if (
        resolution not in ("480", "720", "1080")
        or fps not in (15, 24, 25, 30)
        or not 200 <= bitrate <= 8000
    ):
        raise HTTPException(422, "Invalid video settings")
    if not shutil.which("ffmpeg"):
        raise HTTPException(
            503, "Install FFmpeg and add it to the server PATH to enable conversion"
        )
    data = file.file.read(MAX_FILE + 1)
    if not data or len(data) > MAX_FILE:
        raise HTTPException(413, "Video must be between 1 byte and 20 MB")
    with tempfile.TemporaryDirectory() as temp:
        source = Path(temp) / "source"
        target = Path(temp) / "output.mp4"
        source.write_bytes(data)
        try:
            subprocess.run(
                [
                    "ffmpeg",
                    "-nostdin",
                    "-y",
                    "-protocol_whitelist",
                    "file,pipe",
                    "-i",
                    str(source),
                    "-t",
                    "300",
                    "-map",
                    "0:v:0",
                    "-map",
                    "0:a:0?",
                    "-vf",
                    f"scale=-2:{resolution}",
                    "-r",
                    str(fps),
                    "-c:v",
                    "libx264",
                    "-threads",
                    "2",
                    "-preset",
                    "fast",
                    "-b:v",
                    f"{bitrate}k",
                    "-c:a",
                    "aac",
                    "-b:a",
                    "96k",
                    "-movflags",
                    "+faststart",
                    str(target),
                ],
                stdin=subprocess.DEVNULL,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.PIPE,
                timeout=120,
                check=True,
            )
            return Response(
                target.read_bytes(),
                media_type="video/mp4",
                headers={
                    "Content-Disposition": 'attachment; filename="converted.mp4"',
                    "X-Original-Bytes": str(len(data)),
                    "X-Output-Bytes": str(target.stat().st_size),
                },
            )
        except subprocess.TimeoutExpired:
            raise HTTPException(
                408, "Conversion exceeded 120 seconds. Try a smaller file."
            )
        except subprocess.CalledProcessError:
            raise HTTPException(
                422,
                "Unable to decode video. Upload a valid WMV, AVI, MOV, MKV, or MP4 file.",
            )
