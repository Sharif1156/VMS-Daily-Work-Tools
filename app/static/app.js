const paths = {
  dashboard: "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",
  clock: "M12 8v4l3 2 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0",
  calendar: "M4 5h16v16H4z M4 10h16 M8 3v4 M16 3v4 M8 14h2 M14 14h2 M8 18h2",
  users:
    "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M16 4a4 4 0 0 1 0 8 M22 21v-2a4 4 0 0 0-3-4 M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
  money: "M3 5h18v14H3z M12 8v8 M15 9h-4a2 2 0 0 0 0 3h2a2 2 0 0 1 0 3H9",
  image: "M3 3h18v18H3z M3 17l6-6 4 4 3-3 5 5 M8 7h.01",
  qr: "M3 3h6v6H3z M15 3h6v6h-6z M3 15h6v6H3z M15 15h3v3h3v3h-6z",
  file: "M5 2h9l5 5v15H5z M14 2v6h5 M8 13h8 M8 17h6",
  video: "M3 5h13v14H3z M16 10l5-4v12l-5-4",
  globe:
    "M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0 M2 12h20 M12 2c6 6 6 14 0 20-6-6-6-14 0-20",
  server: "M3 3h18v7H3z M3 14h18v7H3z M7 6h.01 M7 17h.01 M15 6h3 M15 17h3",
  tools:
    "M14 6l4 4 M4 20l7-7 M13 3a6 6 0 0 0-7 8l-4 6a3 3 0 0 0 4 4l6-5a6 6 0 0 0 8-7l-4 4-5-5z",
  shield: "M12 2l9 4v6c0 6-9 10-9 10S3 18 3 12V6z M8 12l3 3 5-6",
  settings:
    "M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8 M9 2h6l1 4 4 1 2 5-3 3 1 4-5 3-3-3-4 1-3-5 3-3-1-4z",
  search: "M21 21l-6-6 M17 9a8 8 0 1 1-16 0 8 8 0 0 1 16 0",
  bell: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9 M10 21h4",
  arrow: "M5 12h14 M15 8l4 4-4 4",
  download: "M12 3v12 M7 10l5 5 5-5 M4 17v4h16v-4",
  sun: "M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8 M12 2v2 M12 20v2 M2 12h2 M20 12h2 M5 5l2 2 M17 17l2 2 M5 19l2-2 M17 7l2-2",
  check: "M5 12l4 4L19 6",
  menu: "M3 6h18 M3 12h18 M3 18h18",
  logout: "M9 3H3v18h6 M12 12h9 M17 8l4 4-4 4",
  copy: "M8 8h13v13H8z M16 8V3H3v13h5",
};
const icon = (n) =>
  `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[n] || paths.tools}"/></svg>`;
const esc = (x) =>
  String(x ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const navItems = [
  ["dashboard", "Dashboard", "dashboard"],
  ["duty", "Daily Duty", "clock"],
  ["schedule", "Shift Schedule", "calendar"],
  ["salary", "Salary Calculator", "money"],
  ["ocr", "Image & OCR", "image"],
  ["scanner", "QR Scanner", "qr"],
  ["pdf", "PDF Tools", "file"],
  ["video", "Video & CCTV", "video"],
  ["network", "Internet & Networking", "globe"],
  ["server", "File Server", "server"],
  ["other", "Other Tools", "tools"],
  ["portal", "Employee Portal", "users"],
  ["admin", "Admin Panel", "shield"],
  ["settings", "Settings", "settings"],
];
let state = {
  user: null,
  csrf: "",
  data: null,
  page: "dashboard",
  lang: localStorage.getItem("vms-lang") || "en",
};
const bn = {
  Dashboard: "ড্যাশবোর্ড",
  "Daily Duty": "দৈনিক ডিউটি",
  "Shift Schedule": "শিফট সূচি",
  "Salary Calculator": "বেতন ক্যালকুলেটর",
  "Image & OCR": "ছবি ও ওসিআর",
  "QR Scanner": "কিউআর স্ক্যানার",
  "PDF Tools": "পিডিএফ টুলস",
  "Video & CCTV": "ভিডিও ও সিসিটিভি",
  "Internet & Networking": "ইন্টারনেট ও নেটওয়ার্ক",
  "File Server": "ফাইল সার্ভার",
  "Other Tools": "অন্যান্য টুলস",
  "Employee Portal": "কর্মী পোর্টাল",
  "Admin Panel": "অ্যাডমিন প্যানেল",
  Settings: "সেটিংস",
};
const t = (s) => (state.lang === "bn" ? bn[s] || s : s);
function toast(message) {
  const el = document.querySelector("#toast");
  el.textContent = message;
  el.style.display = "block";
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => (el.style.display = "none"), 4500);
}
window.NTools.toast = toast;
document.body.classList.toggle("dark", localStorage.getItem("vms-theme") === "dark");
async function api(url, options = {}) {
  const headers = { "X-CSRF-Token": state.csrf, ...options.headers };
  if (options.body && !(options.body instanceof FormData))
    headers["Content-Type"] = "application/json";
  const response = await fetch("/api" + url, { ...options, headers });
  if (!response.ok) {
    let msg;
    try {
      const j = await response.json();
      msg =
        typeof j.detail === "string"
          ? j.detail
          : "Please check the input values";
    } catch {
      msg = await response.text();
    }
    if (response.status === 401 && state.user) {
      state.user = null;
      renderLogin();
    }
    throw Error(msg || "Request failed");
  }
  return response.headers.get("content-type")?.includes("application/json")
    ? response.json()
    : response;
}
const button = (label, action, ico = "arrow", primary = false) =>
  `<button class="btn ${primary ? "primary" : ""}" data-action="${action}">${icon(ico)}${label}</button>`;
const field = (label, name, type = "text", value = "", extra = "") =>
  `<label>${label}<input name="${name}" type="${type}" value="${esc(value)}" ${extra}></label>`;
const select = (label, name, options) =>
  `<label>${label}<select name="${name}">${options.map(([v, l]) => `<option value="${esc(v)}">${esc(l)}</option>`).join("")}</select></label>`;
function form(id, title, content, submit = "Calculate") {
  return `<form id="${id}" class="card form-card"><h2>${title}</h2>${content}<button class="btn primary" type="submit">${submit}${icon("arrow")}</button><div class="result" hidden></div></form>`;
}
function renderLogin() {
  document.querySelector("#app").innerHTML =
    `<div class="login-page"><section class="login-brand"><div class="brand"><div class="brandmark">N</div><div><strong>NAFi iT</strong><small>VIRTUAL MANAGEMENT SYSTEM</small></div></div><h1>Your work.<br>Your tools.<br>One connected workspace.</h1><p>One Dashboard • All Essential Tools • Always Accessible.</p><div class="hero-badges"><span>${icon("shield")} Secure by design</span><span>${icon("users")} Built for your team</span></div></section><section class="login-form"><form id="login"><div class="eyebrow">NAFi iT · ENTERPRISE EDITION</div><h2>Welcome back</h2><p>Sign in to your management workspace.</p>${field("Email address", "email", "email", "", 'required autocomplete="username"')}${field("Password", "password", "password", "", 'required autocomplete="current-password"')}<button class="btn primary">Sign in securely ${icon("arrow")}</button><div class="error" role="alert"></div><p class="login-note">Authorized personnel only. All access is audited.</p></form></section></div>`;
  document.querySelector("#login").onsubmit = async (e) => {
    e.preventDefault();
    const b = e.target.querySelector("button");
    b.disabled = true;
    b.textContent = "Signing in…";
    try {
      const result = await api("/login", {
        method: "POST",
        body: JSON.stringify(Object.fromEntries(new FormData(e.target))),
      });
      state.user = result.user;
      state.csrf = result.csrf;
      await refresh();
      render();
    } catch (err) {
      e.target.querySelector(".error").textContent = err.message;
    } finally {
      b.disabled = false;
      b.textContent = "Sign in securely";
    }
  };
}
async function refresh() {
  state.data = await api("/dashboard");
}
function initials(name) {
  return name
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("");
}
function go(page) {
  if (page !== "other" && !state.keepQuery) state.toolQuery = "";
  state.page = page;
  render();
  window.scrollTo(0, 0);
}
function render() {
  if (!state.user) return renderLogin();
  const title = navItems.find((n) => n[0] === state.page)?.[1] || "Dashboard";
  document.querySelector("#app").innerHTML =
    `<aside><div class="brand"><div class="brandmark">N</div><div><strong>NAFi iT<span style="color:#6293ff">.</span></strong><small>VMS · ENTERPRISE EDITION</small></div></div><div class="workspace"><span>${icon("users")}</span><div><b>NAFi iT Workspace</b>Enterprise workspace</div><span style="margin-left:auto;background:none;padding:0">⌄</span></div><nav><div class="nav-label">WORKSPACE</div>${navItems
      .filter((n) => n[0] !== "admin" || state.user.role === "admin")
      .map(
        ([key, label, i], idx) =>
          `${idx === 4 ? '<div class="nav-label">TOOLS & UTILITIES</div>' : ""}${key === "portal" ? '<div class="nav-label">MANAGEMENT</div>' : ""}<button data-go="${key}" class="${state.page === key ? "active" : ""}">${icon(i)}${t(label)}${key === "server" ? '<span class="nav-badge">LAN</span>' : ""}</button>`,
      )
      .join(
        "",
      )}</nav><div class="sidebar-bottom"><span class="status-dot"></span> Workspace connected <button data-action="logout" aria-label="Sign out" style="margin-left:auto">${icon("logout")}</button></div></aside><div class="shell"><header><button class="mobile-menu" data-action="menu" aria-label="Menu">${icon("menu")}</button><div class="breadcrumb">Workspace <span>/</span><b>${t(title)}</b></div><div class="top-actions"><label class="search">${icon("search")}<input id="global-search" placeholder="Search tools…" aria-label="Search tools"><span class="key">/</span></label><button class="icon-button" data-action="language" aria-label="Change language" style="font-size:11px">${state.lang === "en" ? "বাং" : "EN"}</button><button class="icon-button" data-action="theme" aria-label="Toggle theme">${icon("sun")}</button><button class="icon-button" data-action="notifications" aria-label="Notifications">${icon("bell")}<span class="notification-dot"></span></button><div class="profile"><div class="avatar">${initials(state.user.name)}</div><div><b>${esc(state.user.name)}</b><small>${state.user.role === "admin" ? "Administrator" : "Employee"}</small></div></div></div></header><main>${state.page === "dashboard" ? dashboard() : pageContent()}<footer><span>© ${new Date().getFullYear()} NAFi iT. All rights reserved.</span><span>VMS Enterprise <span style="margin:0 8px">·</span> v1.0.0 <span style="margin:0 8px">·</span> <span class="status-dot"></span> Connected</span></footer></main></div>`;
  bind();
  document.body.classList.toggle(
    "dark",
    localStorage.getItem("vms-theme") === "dark",
  );
}
function heading(title, subtitle, actions = "") {
  return `<div class="page-head"><div><h1>${title}</h1><p>${subtitle}</p></div><div class="head-actions">${actions}</div></div>`;
}
function todayDuty() {
  return state.data.schedule.find(
    (d) => d.user_id === state.user.id && d.date === state.data.today,
  );
}
function dashboard() {
  const d = state.data,
    s = d.stats,
    duty = todayDuty(),
    first = state.user.name.split(" ")[0];
  const date = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const stats = [
    ["Total employees", s.employees, "users", "", "Active team members"],
    [
      "On duty today",
      s.on_duty,
      "calendar",
      "green",
      `${d.schedule.filter((x) => x.date === d.today && x.shift === "Day shift").length} day shift · ${d.schedule.filter((x) => x.date === d.today && x.shift === "Night shift").length} night shift`,
    ],
    [
      "Monthly working hours",
      `${s.hours}<small> hrs</small>`,
      "clock",
      "purple",
      "Recorded net working time",
    ],
    [
      "Monthly salary",
      `<small>৳</small> ${s.salary.toLocaleString()}`,
      "money",
      "orange",
      `${s.overtime} hrs overtime this month`,
    ],
  ];
  return `${heading(state.lang === "bn" ? "আপনার ড্যাশবোর্ড" : "Dashboard", state.lang === "bn" ? "আপনার কর্মক্ষেত্রের সকল তথ্য একসাথে।" : "Here's what's happening in your workspace today.", `<span class="btn date-button">${icon("calendar")}${date}</span>${button("Export report", "export", "download", true)}`)}<section class="hero"><div class="hero-content"><div class="eyebrow">YOUR WORKDAY, SIMPLIFIED</div><h2>${state.lang === "bn" ? "স্বাগতম" : "Welcome back"}, ${esc(first)} <span>👋</span></h2><p>One dashboard. All your essential tools. Let's make today productive.</p><div class="hero-badges"><span>${icon("shield")} Secure workspace</span><span>${icon("clock")} Always accessible</span><span>${icon("users")} Better together</span></div></div><div class="hero-art"><div class="clock-art">${icon("dashboard")}</div><div class="hero-date">${new Date().toLocaleDateString("en-GB", { weekday: "long" })}<strong>${new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Dhaka" })}</strong>Bangladesh Standard Time</div></div></section><section class="stats">${stats.map(([label, value, i, color, sub]) => `<div class="stat"><div class="stat-top">${label}<span class="tile-icon ${color}">${icon(i)}</span></div><div class="stat-value">${value}</div><div class="stat-bottom"><span class="status-dot"></span>${sub}</div></div>`).join("")}</section><div class="dashboard-grid"><section class="card"><div class="card-head"><div><h2>Attendance overview</h2><div class="card-sub">Your team's attendance over the last 7 days</div></div><div class="chart-legend"><span><i class="legend-dot"></i>Present</span><span><i class="legend-dot light"></i>Scheduled</span></div></div><div class="chart"><div class="axis"><span>${Math.max(s.employees, 4)}</span><span>${Math.max(2, Math.round(s.employees / 2))}</span><span>0</span></div><div class="bars">${Array.from(
    { length: 7 },
    (_, idx) => {
      let day = new Date(d.today + "T12:00:00");
      day.setDate(day.getDate() - 6 + idx);
      let key = day.toISOString().slice(0, 10);
      let count = d.attendance.filter((a) => a.date === key).length;
      let scheduled = d.schedule.filter(
        (a) => a.date === key && a.shift !== "Weekly off",
      ).length;
      return `<div class="bar-group" title="${key}: ${count} present, ${scheduled} scheduled"><div class="bar" style="height:${(count / Math.max(s.employees, 4)) * 100}%"></div><div class="bar soft" style="height:${(scheduled / Math.max(s.employees, 4)) * 100}%"></div><span class="bar-label">${day.toLocaleDateString("en", { weekday: "short" })}</span></div>`;
    },
  ).join(
    "",
  )}</div></div><div class="chart-foot">${icon("clock")} Live records · updated ${new Date().toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" })}<span style="margin-left:auto">${s.present} present today</span></div></section><section class="card"><div class="card-head"><div><h2>My duty today</h2><div class="card-sub">${new Date(d.today + "T12:00:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</div></div><span class="pill">${duty ? "Scheduled" : "Unassigned"}</span></div><div class="shift-summary"><div class="tile-icon">${icon("sun")}</div><div><b>${esc(duty?.shift || "No duty assigned")}</b><p>${esc(state.user.department)} · ${esc(duty?.start || "—")} – ${esc(duty?.end || "—")}</p></div></div><div class="shift-details"><div><small>Duty starts</small><strong>${duty?.start || "—"}</strong></div><div><small>Duty ends</small><strong>${duty?.end || "—"}</strong></div><div><small>Break time</small><strong>${duty?.break_minutes || 0} minutes</strong></div><div><small>My attendance</small><strong>${d.attendance.some((a) => a.user_id === state.user.id && a.date === d.today) ? "Checked in" : "Not checked in"}</strong></div></div><div class="shift-footer"><span class="positive">${icon("shield").replace("<svg", '<svg style="width:11px;height:11px;vertical-align:middle"')} Your personal schedule</span><button class="link" data-go="schedule">View schedule ${icon("arrow")}</button></div></section></div><section class="quick-section"><div class="section-title"><h2>Quick access tools</h2><button class="link" data-go="other">Explore all tools ${icon("arrow")}</button></div><div class="tools-grid">${[
    ["duty", "Duty Calculator", "clock", ""],
    ["salary", "Salary Calculator", "money", "green"],
    ["ocr", "Image to Text", "image", "purple"],
    ["pdf", "PDF Tools", "file", "orange"],
    ["video", "Video & CCTV", "video", ""],
    ["network", "Network Tools", "globe", "green"],
  ]
    .map(
      ([key, label, i, c]) =>
        `<button class="tool-card" data-go="${key}"><span class="tile-icon ${c}">${icon(i)}</span><b>${label}</b></button>`,
    )
    .join(
      "",
    )}</div></section><div class="bottom-grid"><section class="card"><div class="card-head"><div><h2>Today's duty schedule</h2><div class="card-sub">People keeping your workspace moving</div></div><button class="link" data-go="schedule">View all ${icon("arrow")}</button></div>${scheduleTable(d.schedule.filter((x) => x.date === d.today))}</section><section class="card"><div class="card-head"><h2>Recent activity</h2><button class="link" data-action="refresh">Refresh</button></div>${
    d.activities.length
      ? d.activities
          .slice(0, 4)
          .map(
            (a, i) =>
              `<div class="activity"><div class="tile-icon ${i % 2 ? "green" : ""}">${icon(i % 2 ? "check" : "shield")}</div><div><b>${esc(a.message)}</b><small>${new Date(a.created).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</small></div></div>`,
          )
          .join("")
      : '<p style="padding:22px">No recent activity.</p>'
  }</section></div><div class="server-banner"><div class="tile-icon">${icon("server")}</div><div><h3>NAFi iT File Server</h3><p>Your files. Organized, connected, and within reach.</p></div><span class="server-status">${icon("globe")} External server · connection not verified</span><button class="btn" data-go="server">Open file server ${icon("arrow")}</button></div>`;
}
function scheduleTable(rows) {
  return `<div class="table-wrap"><table><thead><tr><th>EMPLOYEE</th><th>SHIFT</th><th>DUTY TIME</th><th>STATUS</th></tr></thead><tbody>${rows.length ? rows.map((d) => `<tr><td><div class="employee"><div class="avatar">${initials(d.employee)}</div><div><b>${esc(d.employee)}</b><small>EMP-${String(d.user_id).padStart(3, "0")} · ${d.date}</small></div></div></td><td><span class="tag ${d.shift.includes("Night") ? "night" : ""}">${esc(d.shift)}</span></td><td>${d.start} – ${d.end}</td><td><span class="pill">${d.shift === "Weekly off" ? "Off duty" : "Scheduled"}</span></td></tr>`).join("") : '<tr><td colspan="4">No duty scheduled for this date.</td></tr>'}</tbody></table></div>`;
}
function pageContent() {
  const d = state.data;
  let content = "";
  const page = state.page,
    title = navItems.find((n) => n[0] === page)?.[1] || "Tools";
  if (page === "duty") {
    content = `<div class="stats"><div class="stat"><div class="stat-top">Monthly net hours</div><div class="stat-value">${d.stats.hours}</div></div><div class="stat"><div class="stat-top">Monthly overtime (>8h/day)</div><div class="stat-value">${d.stats.overtime} <small>hrs</small></div></div></div>${form(
      "attendance",
      "Today's attendance",
      select("Action", "action", [
        ["in", "Check in"],
        ["out", "Check out"],
      ]) +
        field(
          "Break taken (minutes, on check-out)",
          "break_minutes",
          "number",
          0,
          'min="0" max="480"',
        ),
      "Record attendance",
    )}<section class="card"><div class="card-head"><h2>Attendance history</h2><a class="btn" href="/api/reports/attendance/excel">Download Excel</a></div><div class="table-wrap"><table><thead><tr><th>Date</th><th>Employee</th><th>Check in</th><th>Check out</th><th>Net hours</th></tr></thead><tbody>${d.attendance.map((a) => `<tr><td>${a.date}</td><td>EMP-${a.user_id}</td><td>${new Date(a.check_in).toLocaleTimeString()}</td><td>${a.check_out ? new Date(a.check_out).toLocaleTimeString() : "On duty"}</td><td>${a.hours}</td></tr>`).join("") || '<tr><td colspan="5">No attendance yet. Check in to start tracking your work.</td></tr>'}</tbody></table></div></section>`;
  }
  if (page === "schedule") {
    content = `${
      state.user.role === "admin"
        ? form(
            "schedule",
            "Assign employee duty",
            `<div class="form-grid">${select(
              "Employee",
              "user_id",
              d.people.map((p) => [p.id, p.name]),
            )}${field("Date", "date", "date", d.today, "required")}${select(
              "Shift",
              "shift",
              [
                ["Day shift", "Day shift"],
                ["Night shift", "Night shift"],
                ["Weekly off", "Weekly off"],
                ["Custom shift", "Custom shift"],
              ],
            )}${field("Start", "start", "time", "09:00", "required")}${field("End", "end", "time", "18:00", "required")}${field("Break minutes", "break_minutes", "number", 60, 'min="0" max="480"')}</div>`,
            "Save duty",
          ) +
          form(
            "roster-import",
            "Import monthly roster",
            `<p>CSV / XLSX columns: user_id,date,shift,start,end,break_minutes. Dates YYYY-MM-DD, times HH:MM.</p><label>Roster file<input name="file" type="file" accept=".csv,.xlsx" required></label>`,
            "Import roster",
          )
        : ""
    }<section class="card"><div class="card-head"><div><h2>Duty roster</h2><div class="card-sub">${state.user.role === "admin" ? "All employees" : "Only your personal schedule"} · next 14 days</div></div><a class="btn" href="/api/reports/schedule/excel">Download Excel</a></div>${scheduleTable(d.schedule)}</section>`;
  }
  if (page === "salary") {
    content = form(
      "salary",
      "Salary & hourly rate calculator",
      `<div class="form-grid">${field("Regular hours", "hours", "number", d.stats.hours, 'min="0" step="0.01" required')}${field("Hourly rate (৳)", "rate", "number", state.user.hourly_rate, 'min="0" step="0.01" required')}${field("Overtime hours", "overtime", "number", 0, 'min="0" step="0.01"')}${field("Overtime multiplier", "multiplier", "number", 1.5, 'min="1" step="0.1"')}${field("Night allowance (৳)", "night", "number", 0, 'min="0"')}${field("Bonus (৳)", "bonus", "number", 0, 'min="0"')}${field("Deductions (৳)", "deduction", "number", 0, 'min="0"')}</div><p>Estimate only. Regular hours must exclude overtime hours to avoid double counting.</p>`,
    );
  }
  if (page === "ocr") {
    content = form(
      "ocr",
      "Image to text · বাংলা + English",
      `<p>Upload an image or screenshot (up to 20 MB). Processing happens on your server using Tesseract.</p><label>Image<input name="file" type="file" accept="image/png,image/jpeg" required></label>`,
      "Extract text",
    );
  }
  if (page === "pdf") {
    content = form(
      "pdf",
      "PDF workspace",
      select("Operation", "operation", [
        ["merge", "Merge PDFs"],
        ["compress", "Lossless PDF compression"],
        ["first-page", "Extract first page from each PDF"],
        ["images", "JPG / PNG to PDF"],
        ["split", "Split every page (ZIP)"],
        ["jpg", "PDF to JPG (ZIP)"],
      ]) +
        `<label>Files (max 20, 20 MB each)<input name="files" type="file" accept=".pdf,.jpg,.jpeg,.png" multiple required></label><p>Lossless compression preserves quality; some PDFs cannot be reduced further.</p>`,
      "Process & download",
    );
  }
  if (page === "scanner") {
    content = form(
      "scanner",
      "Scan a QR code",
      `<p>Uses your browser's BarcodeDetector API where supported. Your image stays on your device.</p><label>QR image<input name="file" type="file" accept="image/*" required></label>`,
      "Scan image",
    );
  }
  if (page === "video") {
    content = `${form("video", "Video playback & frame inspection", `<label>Video file<input name="file" type="file" accept="video/*" required></label><p>Browser-supported MP4 / WebM formats. Files remain on your device.</p>`, "Open video")}<section>${form("timestamp", "Footage timestamp calculator", `<div class="form-grid">${field("Footage start", "start", "datetime-local", "", "required")}${field("Footage end", "end", "datetime-local", "", "required")}</div>`)}${form(
      "convert",
      "Video converter & compressor",
      `<p>FFmpeg conversion to MP4. Maximum 20 MB and first 5 minutes; 120-second timeout. Install FFmpeg on the server.</p><label>Video<input name="file" type="file" accept=".wmv,.avi,.mov,.mkv,.mp4,.webm" required></label><div class="form-grid">${select(
        "Resolution",
        "resolution",
        [
          ["480", "480p"],
          ["720", "720p"],
          ["1080", "1080p"],
        ],
      )}${select("Frame rate", "fps", [
        [15, "15 fps"],
        [24, "24 fps"],
        [25, "25 fps"],
        [30, "30 fps"],
      ])}${field("Video bitrate (kbps)", "bitrate", "number", 1500, 'min="200" max="8000" required')}</div>`,
      "Convert & download",
    )}</section>`;
  }
  if (page === "network") {
    content =
      form(
        "dns",
        "DNS lookup",
        field(
          "Domain name",
          "domain",
          "text",
          "github.com",
          'required placeholder="example.com"',
        ) +
          "<p>Resolves IPv4 / IPv6 using the server DNS resolver. No user-supplied commands are executed.</p>",
        "Look up domain",
      ) +
      `<section class="card form-card"><h2>Connection information</h2><div class="result">Browser status: ${navigator.onLine ? "Online" : "Offline"}\nProtocol: ${location.protocol}\nConnection: ${esc(navigator.connection?.effectiveType || "Not reported by browser")}</div><p>Local IP, gateway, DNS settings and Wi-Fi credentials are not exposed by normal browsers. WAN speed/ISP services are not configured.</p></section>`;
  }
  if (page === "server") {
    content = `<section class="card form-card"><div class="tile-icon">${icon("server")}</div><h2 style="margin-top:18px">NAFi iT File Server</h2><p>External server connection has not been verified. Use a trusted network. The current address uses ${new URL(d.file_server).protocol === "https:" ? "HTTPS" : "unencrypted HTTP; ask your administrator to configure HTTPS before sending credentials"}.</p><div class="result">${esc(d.file_server)}</div><div style="display:flex;gap:10px;margin-top:18px"><a class="btn primary" href="${esc(d.file_server)}" target="_blank" rel="noopener noreferrer">Open file server ${icon("arrow")}</a>${button("Copy address", "copy-server", "copy")}</div></section>`;
  }
  if (page === "other") {
    const q = state.toolQuery || "";
    const core = [
      ["dates", "Date calculator", "Date differences and add/subtract days"],
      ["timezone", "Time zone converter", "Dhaka, New York, Dublin and more"],
      ["qr", "QR code generator", "Generate downloadable text, URL or Wi-Fi QR codes"],
      ["duplicates", "Duplicate file checker", "Private, local SHA-256 file comparison"],
    ].filter(([, l, d]) => !q || (l + " " + d).toLowerCase().includes(q.toLowerCase()));
    content = `<div class="tools-search"><input id="tool-search" type="search" placeholder="Search ${window.NTools.tools.length + 4}+ tools — text, PDF, color, calculators…" value="${esc(q)}" aria-label="Search tools"></div><p style="margin:-6px 0 16px"><a class="link" href="/tools" target="_blank" rel="noopener">Open the public Tools site (no login) ↗</a></p><div id="utility" style="margin-bottom:22px"></div>${core.length ? `<h3 class="cat-title">Workspace utilities</h3><div class="directory">${core.map(([id, label, desc]) => `<button class="tool-card" data-action="tool-${id}"><h2>${label}</h2><p>${desc}</p><span class="link">Open tool ${icon("arrow")}</span></button>`).join("")}</div>` : ""}<div id="tool-dir">${window.NTools.directory(q)}</div>`;
  }
  if (page === "portal") {
    const mine = d.attendance.filter((a) => a.user_id === state.user.id);
    content = `<section class="card form-card"><div class="avatar">${initials(state.user.name)}</div><h2 style="margin-top:15px">${esc(state.user.name)}</h2><p>${esc(state.user.email)} · ${esc(state.user.department)} · EMP-${state.user.id}</p><div class="result">Role: ${esc(state.user.role)}\nYour recorded monthly hours: ${mine
      .filter((a) => a.date.startsWith(d.today.slice(0, 7)))
      .reduce((sum, a) => sum + a.hours, 0)
      .toFixed(
        2,
      )}\nHourly rate: ৳${state.user.hourly_rate}</div><a href="/api/reports/attendance" class="btn">Download authorized attendance report</a></section><section class="card"><div class="card-head"><h2>My upcoming schedule</h2></div>${scheduleTable(d.schedule.filter((x) => x.user_id === state.user.id))}</section>`;
  }
  if (page === "admin") {
    content =
      state.user.role !== "admin"
        ? "<p>Administrator access required.</p>"
        : `${form(
            "employee",
            "Create employee account",
            `<div class="form-grid">${field("Full name", "name", "text", "", 'required minlength="2"')}${field("Email", "email", "email", "", "required")}${field("Temporary password (12+ characters)", "password", "password", "", 'required minlength="12"')}${field("Department", "department", "text", "Operations", "required")}${select(
              "Role",
              "role",
              [
                ["employee", "Employee"],
                ["admin", "Administrator"],
              ],
            )}${field("Hourly rate (৳)", "hourly_rate", "number", 150, 'min="0" required')}</div>`,
            "Create employee",
          )}<section class="card"><div class="card-head"><h2>Employee directory</h2>${button("System health", "health", "shield")}</div><div class="table-wrap"><table><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Action</th></tr></thead><tbody>${d.people.map((p) => `<tr><td>${esc(p.name)}</td><td>${esc(p.email)}</td><td>${p.role}</td><td>${p.id !== state.user.id ? `<button class="link" data-action="disable-${p.id}">Disable account</button>` : "Current account"}</td></tr>`).join("")}</tbody></table></div></section>`;
  }
  if (page === "settings") {
    content = `<section class="card form-card"><h2>Workspace preferences</h2><p>Appearance and language preferences are saved on this device.</p><div style="display:flex;gap:10px;margin-top:15px">${button("Toggle dark / light mode", "theme", "sun")}${button("English / বাংলা", "language", "globe")}</div></section>${state.user.role === "admin" ? form("server", "File server configuration", field("HTTP(S) server address", "address", "url", d.file_server, "required") + "<p>Do not include credentials in the address. Configure HTTPS at the file server.</p>", "Save address") : ""}`;
  }
  return (
    heading(t(title), "Your secure, connected office workspace.") + content
  );
}
function bind() {
  document
    .querySelectorAll("[data-go]")
    .forEach((b) => (b.onclick = () => go(b.dataset.go)));
  document
    .querySelectorAll("[data-action]")
    .forEach((b) => (b.onclick = () => action(b.dataset.action)));
  document.querySelector("#global-search")?.addEventListener("input", (e) => {
    let value = e.target.value.toLowerCase();
    document
      .querySelectorAll("nav button")
      .forEach(
        (b) => (b.hidden = !b.textContent.toLowerCase().includes(value)),
      );
  });
  document
    .querySelectorAll("form")
    .forEach((f) => (f.onsubmit = (e) => submit(e)));
  const bindTools = () =>
    document.querySelectorAll("[data-ntool]").forEach(
      (b) =>
        (b.onclick = () => {
          const host = document.querySelector("#utility");
          window.NTools.open(b.dataset.ntool, host);
        }),
    );
  bindTools();
  document.querySelector("#tool-search")?.addEventListener("input", (e) => {
    state.toolQuery = e.target.value;
    document.querySelector("#tool-dir").innerHTML = window.NTools.directory(state.toolQuery);
    bindTools();
  });
  document.querySelector("#global-search")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.target.value.trim()) {
      state.toolQuery = e.target.value.trim();
      go("other");
    }
  });
}
async function action(a) {
  try {
    if (a === "theme") {
      localStorage.setItem(
        "vms-theme",
        document.body.classList.contains("dark") ? "light" : "dark",
      );
      document.body.classList.toggle("dark");
      return;
    }
    if (a === "language") {
      state.lang = state.lang === "en" ? "bn" : "en";
      localStorage.setItem("vms-lang", state.lang);
      render();
      return;
    }
    if (a === "menu") {
      document.querySelector("aside").classList.toggle("open");
      return;
    }
    if (a === "logout") {
      await api("/logout", { method: "POST" });
      state.user = null;
      renderLogin();
      return;
    }
    if (a === "export") {
      location.href = "/api/reports/attendance";
      return;
    }
    if (a === "refresh") {
      await refresh();
      render();
      toast("Workspace updated");
      return;
    }
    if (a === "notifications") {
      toast(state.data.activities[0]?.message || "No new notifications");
      return;
    }
    if (a === "copy-server") {
      await navigator.clipboard.writeText(state.data.file_server);
      toast("Server address copied");
      return;
    }
    if (a === "health") {
      toast(JSON.stringify(await api("/health")));
      return;
    }
    if (a.startsWith("disable-")) {
      if (
        confirm("Disable this account? Existing sessions will stop working.")
      ) {
        await api("/employees/" + a.split("-")[1], { method: "DELETE" });
        await refresh();
        render();
        toast("Account disabled");
      }
      return;
    }
    if (a.startsWith("tool-")) openUtility(a.slice(5));
  } catch (e) {
    toast(e.message);
  }
}
function openUtility(tool) {
  let html = "";
  if (tool === "dates")
    html = form(
      "dates",
      "Date calculator",
      `<div class="form-grid">${field("Start date", "start", "date", state.data.today, "required")}${field("End date", "end", "date", state.data.today, "required")}${field("Days to add / subtract", "days", "number", 0, "required")}</div>`,
    );
  if (tool === "timezone")
    html = form(
      "timezone",
      "Time zone converter",
      field(
        "Date & time (in source zone)",
        "time",
        "datetime-local",
        "",
        "required",
      ) +
        select("Source zone", "source", [
          ["Asia/Dhaka", "Bangladesh · Dhaka"],
          ["America/New_York", "USA · New York"],
          ["Europe/Dublin", "Ireland · Dublin"],
          ["UTC", "UTC"],
        ]) +
        "<p>Results account for current daylight-saving rules. Ambiguous clock-change times should be verified.</p>",
    );
  if (tool === "qr")
    html = form(
      "qr",
      "QR code generator",
      `<label>Text, URL, or Wi-Fi payload<textarea name="text" required maxlength="2000" placeholder="https://example.com or WIFI:T:WPA;S:Network;P:Password;;"></textarea></label>`,
      "Generate PNG",
    );
  if (tool === "duplicates")
    html = form(
      "duplicates",
      "Duplicate file checker",
      `<p>Files are hashed locally. Nothing is uploaded or deleted.</p><label>Choose files<input type="file" name="files" multiple required></label>`,
      "Find duplicates",
    );
  document.querySelector("#utility").innerHTML = html;
  document.querySelector("#utility form").onsubmit = submit;
  document
    .querySelector("#utility")
    .scrollIntoView({ behavior: "smooth", block: "start" });
}
function download(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
async function submit(e) {
  e.preventDefault();
  const f = e.target,
    values = Object.fromEntries(new FormData(f)),
    result = f.querySelector(".result"),
    b = f.querySelector('button[type="submit"]') || f.querySelector("button");
  b.disabled = true;
  const label = b.innerHTML;
  b.textContent = "Processing…";
  try {
    let output = "";
    switch (f.id) {
      case "roster-import": {
        let data = new FormData();
        data.append("file", values.file);
        let response = await api("/schedule/import", {
          method: "POST",
          body: data,
        });
        await refresh();
        output = response.imported + " roster rows imported.";
        break;
      }
      case "convert": {
        let data = new FormData();
        data.append("file", values.file);
        let response = await api(
          "/tools/video?" +
            new URLSearchParams({
              resolution: values.resolution,
              fps: values.fps,
              bitrate: values.bitrate,
            }),
          { method: "POST", body: data },
        );
        let blob = await response.blob();
        download(blob, "converted.mp4");
        output = `Conversion complete. Before: ${(values.file.size / 1048576).toFixed(2)} MB. After: ${(blob.size / 1048576).toFixed(2)} MB.`;
        break;
      }
      case "attendance":
        await api("/attendance/" + values.action, {
          method: "POST",
          body: JSON.stringify({ break_minutes: +values.break_minutes }),
        });
        await refresh();
        render();
        toast("Attendance saved");
        return;
      case "schedule":
        await api("/schedule", {
          method: "POST",
          body: JSON.stringify({
            ...values,
            user_id: +values.user_id,
            break_minutes: +values.break_minutes,
          }),
        });
        await refresh();
        render();
        toast("Duty saved");
        return;
      case "employee":
        await api("/employees", {
          method: "POST",
          body: JSON.stringify({ ...values, hourly_rate: +values.hourly_rate }),
        });
        await refresh();
        render();
        toast("Employee created");
        return;
      case "server":
        await api("/settings/server", {
          method: "PUT",
          body: JSON.stringify(values),
        });
        await refresh();
        toast("Settings saved");
        output = "File server address updated.";
        break;
      case "salary": {
        const total =
          +values.hours * +values.rate +
          +values.overtime * +values.rate * +values.multiplier +
          +values.night +
          +values.bonus -
          +values.deduction;
        output = `Regular pay: ৳${(+values.hours * +values.rate).toFixed(2)}\nOvertime pay: ৳${(+values.overtime * +values.rate * +values.multiplier).toFixed(2)}\nNet estimated pay: ৳${total.toFixed(2)}`;
        break;
      }
      case "ocr": {
        let data = new FormData();
        data.append("file", values.file);
        output =
          (await api("/tools/ocr", { method: "POST", body: data })).text ||
          "No text detected.";
        break;
      }
      case "pdf": {
        let data = new FormData();
        for (const file of f.elements.files.files) data.append("files", file);
        let archived = ["split", "jpg"].includes(values.operation);
        if (archived) {
          data = new FormData();
          data.append("file", f.elements.files.files[0]);
        }
        let r = await api(
          (archived ? "/tools/pdf-archive/" : "/tools/pdf/") + values.operation,
          { method: "POST", body: data },
        );
        download(await r.blob(), archived ? "pages.zip" : "processed.pdf");
        output = "PDF processed. Your download is ready.";
        break;
      }
      case "dns":
        output = JSON.stringify(
          await api("/tools/dns", {
            method: "POST",
            body: JSON.stringify(values),
          }),
          null,
          2,
        );
        break;
      case "timestamp": {
        let seconds = (new Date(values.end) - new Date(values.start)) / 1000;
        if (seconds < 0) throw Error("End must be after start");
        output = `Footage duration: ${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m ${seconds % 60}s\nTotal seconds: ${seconds}`;
        break;
      }
      case "dates": {
        let start = new Date(values.start + "T00:00:00Z"),
          end = new Date(values.end + "T00:00:00Z");
        let days = Math.round((end - start) / 86400000);
        start.setUTCDate(start.getUTCDate() + +values.days);
        output = `Difference: ${days} days\nStart date ${+values.days >= 0 ? "+" : ""}${values.days} days: ${start.toISOString().slice(0, 10)}`;
        break;
      }
      case "timezone": {
        const zones = [
          "Asia/Dhaka",
          "America/New_York",
          "Europe/Dublin",
          "UTC",
        ];
        const target = new Date(values.time + "Z");
        let instant = new Date(target);
        for (let i = 0; i < 3; i++) {
          const parts = new Intl.DateTimeFormat("sv-SE", {
            timeZone: values.source,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hourCycle: "h23",
          }).format(instant);
          let shown = new Date(parts.replace(" ", "T") + "Z");
          instant = new Date(
            instant.getTime() + target.getTime() - shown.getTime(),
          );
        }
        output = zones
          .map(
            (z) =>
              z +
              ": " +
              instant.toLocaleString("en-GB", {
                timeZone: z,
                dateStyle: "medium",
                timeStyle: "short",
              }),
          )
          .join("\n");
        break;
      }
      case "qr": {
        let response = await api("/tools/qr", {
          method: "POST",
          body: JSON.stringify({ text: values.text }),
        });
        let blob = await response.blob();
        download(blob, "nafi-qr.png");
        result.hidden = false;
        result.innerHTML = `<div class="qr-output"><img alt="Generated QR code" src="${URL.createObjectURL(blob)}"></div>`;
        return;
      }
      case "scanner": {
        if (!("BarcodeDetector" in window))
          throw Error(
            "QR scanning is not supported in this browser. Use a current Chrome or Edge browser with BarcodeDetector enabled.",
          );
        let image = await createImageBitmap(values.file);
        let codes = await new BarcodeDetector({ formats: ["qr_code"] }).detect(
          image,
        );
        image.close();
        output =
          codes.map((c) => c.rawValue).join("\n") || "No QR code detected.";
        break;
      }
      case "duplicates": {
        let hashes = new Map(),
          files = Array.from(f.elements.files.files);
        if (files.some((file) => file.size > 100 * 1024 * 1024))
          throw Error("Each file must be under 100 MB");
        for (let i = 0; i < files.length; i++) {
          b.textContent = `Hashing ${i + 1} / ${files.length}…`;
          let file = files[i],
            hash = Array.from(
              new Uint8Array(
                await crypto.subtle.digest("SHA-256", await file.arrayBuffer()),
              ),
            )
              .map((x) => x.toString(16).padStart(2, "0"))
              .join("");
          let list = hashes.get(hash) || [];
          list.push(file.name + " (" + file.size + " bytes)");
          hashes.set(hash, list);
        }
        let dup = [...hashes.values()].filter((a) => a.length > 1);
        output = dup.length
          ? dup
              .map(
                (group, i) => `Duplicate group ${i + 1}:\n${group.join("\n")}`,
              )
              .join("\n\n")
          : "No content duplicates found. " +
            files.length +
            " files compared using SHA-256.";
        break;
      }
      case "video": {
        result.hidden = false;
        result.innerHTML = `<video controls></video><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">${[0.25, 0.5, 1, 2, 4].map((n) => `<button type="button" class="btn" data-speed="${n}">${n}×</button>`).join("")}<button type="button" class="btn" id="frame">Next frame (~30 fps)</button></div><p id="play-time" style="margin-top:12px"></p>`;
        const video = result.querySelector("video");
        video.src = URL.createObjectURL(values.file);
        result
          .querySelectorAll("[data-speed]")
          .forEach(
            (btn) =>
              (btn.onclick = () => (video.playbackRate = +btn.dataset.speed)),
          );
        result.querySelector("#frame").onclick = () => {
          video.pause();
          video.currentTime += 1 / 30;
        };
        video.ontimeupdate = () =>
          (result.querySelector("#play-time").textContent =
            `Timestamp: ${video.currentTime.toFixed(3)} seconds`);
        return;
      }
      default:
        throw Error("Unknown operation");
    }
    result.hidden = false;
    result.textContent = output;
    if (
      [
        "salary",
        "ocr",
        "scanner",
        "duplicates",
        "timezone",
        "dates",
        "timestamp",
      ].includes(f.id)
    ) {
      const div = document.createElement("div");
      div.style.marginTop = "12px";
      const copy = document.createElement("button");
      copy.className = "btn";
      copy.type = "button";
      copy.textContent = "Copy result";
      copy.onclick = () =>
        navigator.clipboard
          .writeText(output)
          .then(() => toast("Copied"))
          .catch(() => toast("Clipboard unavailable"));
      const save = document.createElement("button");
      save.className = "btn";
      save.type = "button";
      save.textContent = "Download TXT";
      save.onclick = () =>
        download(new Blob([output], { type: "text/plain" }), "vms-report.txt");
      div.append(copy, save);
      result.append(div);
    }
  } catch (err) {
    toast(err.message);
    result.hidden = false;
    result.textContent = err.message;
  } finally {
    b.disabled = false;
    b.innerHTML = label;
  }
}
(async () => {
  try {
    const session = await api("/me");
    state.user = session.user;
    state.csrf = session.csrf;
    await refresh();
    render();
  } catch {
    renderLogin();
  }
})();
setInterval(async () => {
  if (state.user && state.page === "dashboard" && !document.hidden) {
    try {
      await refresh();
      render();
    } catch {}
  }
}, 60000);
document.addEventListener("keydown", (e) => {
  if (
    e.key === "/" &&
    !["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)
  ) {
    e.preventDefault();
    document.querySelector("#global-search")?.focus();
  }
});
