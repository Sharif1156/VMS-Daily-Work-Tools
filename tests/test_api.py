import os
import tempfile
import itertools

client_ids = itertools.count(1)
from pathlib import Path

os.environ["DATABASE_URL"] = "sqlite:///" + str(Path(tempfile.mkdtemp()) / "test.db")
os.environ["ADMIN_PASSWORD"] = "TestAdmin-password-123"
os.environ["EMPLOYEE_PASSWORD"] = "TestEmployee-password-123"
from fastapi.testclient import TestClient
from app.main import app


def client(email="admin@nafi.it", password="TestAdmin-password-123"):
    c = TestClient(app, client=(f"192.0.2.{next(client_ids)}", 50000))
    r = c.post("/api/login", json={"email": email, "password": password})
    assert r.status_code == 200
    c.headers["X-CSRF-Token"] = r.json()["csrf"]
    return c


def test_login_and_security_headers():
    c = TestClient(app, client=(f"192.0.2.{next(client_ids)}", 50000))
    assert c.get("/api/dashboard").status_code == 401
    assert (
        c.post(
            "/api/login", json={"email": "admin@nafi.it", "password": "bad"}
        ).status_code
        == 401
    )
    assert c.get("/").headers["x-content-type-options"] == "nosniff"


def test_employee_isolation_and_rbac():
    c = client("employee@nafi.it", "TestEmployee-password-123")
    data = c.get("/api/dashboard").json()
    assert len(data["people"]) == 1
    assert all(d["user_id"] == data["people"][0]["id"] for d in data["schedule"])
    assert c.get("/api/health").status_code == 403
    assert c.delete("/api/employees/1").status_code == 403
    assert (
        c.post(
            "/api/schedule",
            json={
                "user_id": 1,
                "date": "2026-11-09",
                "shift": "Day shift",
                "start": "09:00",
                "end": "18:00",
                "break_minutes": 60,
            },
        ).status_code
        == 403
    )
    report = c.get("/api/reports/schedule").text
    assert all(line.split(",")[1] == "2" for line in report.splitlines()[1:])


def test_csrf_and_logout():
    c = client()
    csrf = c.headers.pop("X-CSRF-Token")
    assert c.post("/api/logout").status_code == 403
    c.headers["X-CSRF-Token"] = csrf
    assert c.post("/api/logout").status_code == 200
    assert c.get("/api/me").status_code == 401


def test_attendance_validation():
    c = client("employee@nafi.it", "TestEmployee-password-123")
    assert c.post("/api/attendance/out", json={"break_minutes": 0}).status_code == 409
    assert c.post("/api/attendance/in", json={"break_minutes": 0}).status_code == 200
    assert c.post("/api/attendance/in", json={"break_minutes": 0}).status_code == 409
    assert c.post("/api/attendance/out", json={"break_minutes": -1}).status_code == 422
    assert c.post("/api/attendance/out", json={"break_minutes": 480}).status_code == 422
    assert c.post("/api/attendance/out", json={"break_minutes": 0}).status_code == 200


def test_employee_create_and_disable():
    c = client()
    user = {
        "name": "Test Person",
        "email": "test@example.com",
        "password": "secure-test-pass123",
        "role": "employee",
        "department": "QA",
        "hourly_rate": 125,
    }
    assert c.post("/api/employees", json=user).status_code == 200
    assert c.post("/api/employees", json=user).status_code == 409
    e = client(user["email"], user["password"])
    uid = e.get("/api/me").json()["user"]["id"]
    assert c.delete(f"/api/employees/{uid}").status_code == 200
    assert e.get("/api/me").status_code == 401
    assert c.delete("/api/employees/1").status_code == 400


def test_schedule_validation_and_upsert():
    c = client()
    row = {
        "user_id": 1,
        "date": "2026-11-09",
        "shift": "Day shift",
        "start": "09:00",
        "end": "18:00",
        "break_minutes": 60,
    }
    assert (
        c.post("/api/schedule", json={**row, "date": "2026-99-99"}).status_code == 422
    )
    assert c.post("/api/schedule", json={**row, "start": "99:00"}).status_code == 422
    assert c.post("/api/schedule", json=row).status_code == 200
    assert c.post("/api/schedule", json={**row, "start": "10:00"}).status_code == 200
    matching = [
        d
        for d in c.get("/api/dashboard").json()["schedule"]
        if d["user_id"] == 1 and d["date"] == row["date"]
    ]
    assert len(matching) == 1 and matching[0]["start"] == "10:00"


def test_file_server_validation():
    c = client()
    assert (
        c.put(
            "/api/settings/server", json={"address": "javascript:alert(1)"}
        ).status_code
        == 422
    )
    assert (
        c.put(
            "/api/settings/server", json={"address": "https://user:pass@example.com"}
        ).status_code
        == 422
    )
    assert (
        c.put(
            "/api/settings/server", json={"address": "https://files.example.com"}
        ).status_code
        == 200
    )


def test_pdf_and_qr():
    import io
    from pypdf import PdfWriter, PdfReader

    c = client()
    writer = PdfWriter()
    writer.add_blank_page(width=200, height=200)
    out = io.BytesIO()
    writer.write(out)
    for action in ("merge", "compress", "first-page"):
        r = c.post(
            "/api/tools/pdf/" + action,
            files=[("files", ("a.pdf", out.getvalue(), "application/pdf"))],
        )
        assert r.status_code == 200
        assert len(PdfReader(io.BytesIO(r.content)).pages) == 1
    assert (
        c.post(
            "/api/tools/pdf/merge", files={"files": ("bad.pdf", b"not pdf")}
        ).status_code
        == 422
    )
    from PIL import Image

    img = io.BytesIO()
    Image.new("RGB", (20, 20), "blue").save(img, format="PNG")
    r = c.post(
        "/api/tools/pdf/images",
        files={"files": ("image.png", img.getvalue(), "image/png")},
    )
    assert r.status_code == 200
    r = c.post("/api/tools/qr", json={"text": "https://example.com"})
    assert r.status_code == 200 and r.content.startswith(b"\x89PNG")


def test_dns_rejects_shell_payloads():
    c = client()
    for payload in ["example.com;whoami", "127.0.0.1", "-x", "$(id)"]:
        assert c.post("/api/tools/dns", json={"domain": payload}).status_code == 422


def test_excel_reports_and_roster_import():
    import io
    from openpyxl import load_workbook

    c = client()
    r = c.get("/api/reports/schedule/excel")
    assert r.status_code == 200
    assert load_workbook(io.BytesIO(r.content)).active.max_row > 1
    raw = b"user_id,date,shift,start,end,break_minutes\n2,2026-12-01,Day shift,09:00,18:00,60\n"
    assert (
        c.post("/api/schedule/import", files={"file": ("roster.csv", raw)}).json()[
            "imported"
        ]
        == 1
    )
    bad = raw + b"99999,2026-12-02,Day shift,09:00,18:00,60\n"
    assert (
        c.post("/api/schedule/import", files={"file": ("roster.csv", bad)}).status_code
        == 422
    )


def test_pdf_archive_and_video_validation():
    import io, zipfile
    from pypdf import PdfWriter

    out = io.BytesIO()
    writer = PdfWriter()
    writer.add_blank_page(width=200, height=200)
    writer.write(out)
    c = client()
    for action in ("split", "jpg"):
        r = c.post(
            "/api/tools/pdf-archive/" + action,
            files={"file": ("a.pdf", out.getvalue())},
        )
        assert r.status_code == 200
        assert len(zipfile.ZipFile(io.BytesIO(r.content)).namelist()) == 1
    assert (
        c.post(
            "/api/tools/video?resolution=999", files={"file": ("a.mp4", b"x")}
        ).status_code
        == 422
    )


def test_cross_origin_mutations_rejected():
    c = client()
    assert (
        c.post(
            "/api/logout", headers={"Origin": "https://attacker.example"}
        ).status_code
        == 403
    )
    assert (
        c.post("/api/logout", headers={"Origin": "http://testserver"}).status_code
        == 200
    )


def test_login_rate_limit():
    c = TestClient(app, client=("198.51.100.45", 50000))
    for _ in range(8):
        assert (
            c.post(
                "/api/login", json={"email": "missing@example.com", "password": "bad"}
            ).status_code
            == 401
        )
    assert (
        c.post(
            "/api/login", json={"email": "missing@example.com", "password": "bad"}
        ).status_code
        == 429
    )


def test_public_tools_page_needs_no_login():
    c = TestClient(app, client=(f"192.0.2.{next(client_ids)}", 50000))
    r = c.get("/tools")
    assert r.status_code == 200
    assert "NAFi iT Tools" in r.text
    assert c.get("/static/tools.js").status_code == 200
