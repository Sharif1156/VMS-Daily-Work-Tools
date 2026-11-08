const { JSDOM } = require("jsdom");
const fs = require("node:fs");
const assert = require("node:assert/strict");
const dom = new JSDOM(fs.readFileSync("app/static/index.html", "utf8"), {
  url: "https://vms.example.com",
  runScripts: "outside-only",
  pretendToBeVisual: true,
});
const w = dom.window;
w.scrollTo = () => {};
w.HTMLElement.prototype.scrollIntoView = () => {};
const user = {
  id: 1,
  name: "Sharif Ahmed",
  email: "admin@nafi.it",
  role: "admin",
  department: "Operations",
  hourly_rate: 200,
};
const data = {
  people: [user],
  schedule: [
    {
      id: 1,
      user_id: 1,
      date: "2026-11-08",
      shift: "Day shift",
      start: "09:00",
      end: "18:00",
      break_minutes: 60,
      employee: user.name,
    },
  ],
  attendance: [],
  activities: [],
  stats: {
    employees: 1,
    on_duty: 1,
    present: 0,
    hours: 0,
    overtime: 0,
    salary: 0,
  },
  today: "2026-11-08",
  file_server: "https://files.example.com",
};
w.fetch = async (url) => ({
  ok: true,
  headers: { get: () => "application/json" },
  json: async () => (url.endsWith("/me") ? { user, csrf: "test" } : data),
});
w.eval(fs.readFileSync("app/static/app.js", "utf8"));
setTimeout(() => {
  try {
    assert.equal(w.document.querySelector("h1").textContent, "Dashboard");
    for (const page of [
      "duty",
      "schedule",
      "salary",
      "ocr",
      "scanner",
      "pdf",
      "video",
      "network",
      "server",
      "other",
      "portal",
      "admin",
      "settings",
      "dashboard",
    ]) {
      w.eval(`go('${page}')`);
      assert(w.document.querySelector("main"), page + " renders");
      assert(
        w.document.querySelector("h1").textContent.length > 0,
        page + " title",
      );
      for (const f of w.document.querySelectorAll("form"))
        assert.equal(
          f.querySelectorAll("form").length,
          0,
          page + " nested form",
        );
    }
    w.eval("go('other');openUtility('dates')");
    assert(w.document.querySelector("#dates"));
    w.eval("openUtility('timezone')");
    assert(w.document.querySelector("#timezone"));
    w.eval("openUtility('qr')");
    assert(w.document.querySelector("#qr"));
    w.eval("openUtility('duplicates')");
    assert(w.document.querySelector("#duplicates"));
    user.role = "employee";
    w.eval("go('portal')");
    assert(!w.document.querySelector('nav [data-go="admin"]'));
    console.log(
      "Frontend smoke: all 14 pages, 4 utility forms, role-based navigation passed",
    );
  } catch (e) {
    console.error(e);
    process.exitCode = 1;
  }
  dom.window.close();
}, 80);
