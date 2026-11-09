(function () {
  const $ = (s) => document.querySelector(s);
  const N = window.NTools;
  const esc = (x) => String(x).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const state = { q: "", cat: "" };
  N.toast = (m) => { const t = $("#toast"); t.textContent = m; t.style.display = "block"; clearTimeout(N._t); N._t = setTimeout(() => (t.style.display = "none"), 2500); };

  const setTheme = (dark) => { document.body.classList.toggle("dark", dark); try { localStorage.setItem("vms-theme", dark ? "dark" : "light"); } catch {} };
  let saved = null; try { saved = localStorage.getItem("vms-theme"); } catch {}
  document.body.classList.toggle("dark", saved ? saved === "dark" : matchMedia("(prefers-color-scheme: dark)").matches);
  $("#theme").onclick = () => setTheme(!document.body.classList.contains("dark"));

  $("#count").textContent = $("#count2").textContent = N.tools.length;
  $("#catcount").textContent = N.cats.length;
  $("#year").textContent = new Date().getFullYear();

  const popular = ["wordcount", "json", "password", "imgcompress", "base64", "age", "emi", "color"].map((id) => N.tools.find((t) => t.id === id)).filter(Boolean);
  $("#popular").innerHTML = popular.map((t) => `<button type="button" data-open="${t.id}">${esc(t.name)}</button>`).join("");

  function drawCats() {
    $("#cats").innerHTML = [["", "All"], ...N.cats.map((c) => [c, c])].map(([v, l]) => `<button type="button" data-cat="${esc(v)}" class="${state.cat === v ? "on" : ""}">${esc(l)}</button>`).join("");
  }
  function drawDir() {
    $("#dir").innerHTML = N.directory(state.q, state.cat);
  }
  function showTool() {
    const id = decodeURIComponent(location.hash.slice(1));
    const tool = N.tools.find((t) => t.id === id);
    const panel = $("#tool-panel");
    if (!tool) { panel.hidden = true; panel.innerHTML = ""; document.title = "NAFi iT Tools — Free Online Tools"; $("#hero").hidden = false; return; }
    $("#hero").hidden = true;
    panel.hidden = false;
    panel.innerHTML = `<a class="back" href="#" data-back>← All tools</a><div id="tool-host"></div>`;
    N.open(id, $("#tool-host"));
    document.title = tool.name + " — NAFi iT Tools";
  }
  document.addEventListener("click", (e) => {
    const o = e.target.closest("[data-open]"), n = e.target.closest("[data-ntool]"), c = e.target.closest("[data-cat]"), b = e.target.closest("[data-back]");
    if (o || n) { location.hash = (o || n).dataset.open || n.dataset.ntool; }
    if (c) { state.cat = c.dataset.cat; drawCats(); drawDir(); }
    if (b) { e.preventDefault(); history.pushState("", document.title, location.pathname); showTool(); }
  });
  $("#site-search").addEventListener("input", (e) => { state.q = e.target.value; if (location.hash) { history.pushState("", document.title, location.pathname); showTool(); } drawDir(); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)) { e.preventDefault(); $("#site-search").focus(); }
  });
  window.addEventListener("hashchange", showTool);
  drawCats(); drawDir(); showTool();
})();
