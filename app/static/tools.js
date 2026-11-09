/* NAFi iT — Extra tools library (all tools run in the browser, nothing is uploaded) */
(function () {
  const enc = new TextEncoder();
  const hex = (buf) => Array.from(new Uint8Array(buf)).map((x) => x.toString(16).padStart(2, "0")).join("");
  const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
  const lines = (s) => String(s).split(/\r?\n/);
  const num = (x) => (Number.isFinite(+x) ? +x : NaN);
  const fmt = (n, d = 2) => Number(n).toLocaleString("en-US", { maximumFractionDigits: d });
  const T = (name, label, v = "", extra = {}) => ({ n: name, l: label, t: "textarea", v, ...extra });
  const I = (name, label, v = "", extra = {}) => ({ n: name, l: label, t: "text", v, ...extra });
  const N = (name, label, v = "", extra = {}) => ({ n: name, l: label, t: "number", v, step: "any", ...extra });
  const S = (name, label, o, v) => ({ n: name, l: label, t: "select", o, v });
  const C = (name, label, v = false) => ({ n: name, l: label, t: "checkbox", v });
  const F = (name, label, accept = "", extra = {}) => ({ n: name, l: label, t: "file", accept, ...extra });

  /* ---------- helpers ---------- */
  function hexToRgb(h) {
    h = h.trim().replace(/^#/, "");
    if (h.length === 3) h = h.split("").map((c) => c + c).join("");
    if (!/^[0-9a-f]{6}$/i.test(h)) throw Error("Enter a valid HEX colour, e.g. #2B6CB0");
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  }
  function rgbToHsl([r, g, b]) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
    let h = 0, s = 0, l = (max + min) / 2;
    if (d) {
      s = d / (1 - Math.abs(2 * l - 1));
      h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
      h = (h * 60 + 360) % 360;
    }
    return [Math.round(h), Math.round(s * 100), Math.round(l * 100)];
  }
  const lum = ([r, g, b]) => {
    const f = (c) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  function lcsDiff(a, b) {
    const m = a.length, n = b.length;
    if (m * n > 4e6) throw Error("Inputs are too large to compare in the browser");
    const dp = Array.from({ length: m + 1 }, () => new Uint32Array(n + 1));
    for (let i = m - 1; i >= 0; i--)
      for (let j = n - 1; j >= 0; j--)
        dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    const out = []; let i = 0, j = 0;
    while (i < m && j < n) {
      if (a[i] === b[j]) { out.push("  " + a[i]); i++; j++; }
      else if (dp[i + 1][j] >= dp[i][j + 1]) out.push("- " + a[i++]);
      else out.push("+ " + b[j++]);
    }
    while (i < m) out.push("- " + a[i++]);
    while (j < n) out.push("+ " + b[j++]);
    return out;
  }
  const MORSE = { a: ".-", b: "-...", c: "-.-.", d: "-..", e: ".", f: "..-.", g: "--.", h: "....", i: "..", j: ".---", k: "-.-", l: ".-..", m: "--", n: "-.", o: "---", p: ".--.", q: "--.-", r: ".-.", s: "...", t: "-", u: "..-", v: "...-", w: ".--", x: "-..-", y: "-.--", z: "--..", 0: "-----", 1: ".----", 2: "..---", 3: "...--", 4: "....-", 5: ".....", 6: "-....", 7: "--...", 8: "---..", 9: "----." };
  const UNITS = {
    Length: { m: 1, km: 1000, cm: 0.01, mm: 0.001, mile: 1609.344, yard: 0.9144, foot: 0.3048, inch: 0.0254 },
    Weight: { kg: 1, g: 0.001, mg: 1e-6, lb: 0.45359237, oz: 0.028349523125, tonne: 1000 },
    Data: { B: 1, KB: 1024, MB: 1024 ** 2, GB: 1024 ** 3, TB: 1024 ** 4 },
    "Data rate (bits/s)": { bps: 1, Kbps: 1e3, Mbps: 1e6, Gbps: 1e9, "MB/s": 8e6 },
    Area: { "m²": 1, "km²": 1e6, "ft²": 0.09290304, acre: 4046.8564224, hectare: 1e4, katha: 66.89, bigha: 1337.8 },
    Time: { s: 1, min: 60, hour: 3600, day: 86400, week: 604800 },
  };

  /* ---------- tool registry ---------- */
  const tools = [
    /* TEXT */
    { id: "wordcount", cat: "Text", name: "Word & Character Counter", desc: "Words, characters, sentences, lines", fields: [T("text", "Text")], live: true,
      run: ({ text }) => { const w = (text.match(/\S+/g) || []).length; return `Words: ${w}\nCharacters: ${text.length}\nCharacters (no spaces): ${text.replace(/\s/g, "").length}\nSentences: ${(text.match(/[^.!?।]+[.!?।]+/g) || []).length}\nParagraphs: ${text.split(/\n\s*\n/).filter((x) => x.trim()).length}\nLines: ${text ? lines(text).length : 0}`; } },
    { id: "case", cat: "Text", name: "Case Converter", desc: "UPPER, lower, Title, camelCase, snake_case", fields: [T("text", "Text"), S("mode", "Convert to", [["upper", "UPPERCASE"], ["lower", "lowercase"], ["title", "Title Case"], ["sentence", "Sentence case"], ["camel", "camelCase"], ["snake", "snake_case"], ["kebab", "kebab-case"]])],
      run: ({ text, mode }) => {
        const words = text.trim().split(/[\s_\-]+/).filter(Boolean);
        return ({ upper: () => text.toUpperCase(), lower: () => text.toLowerCase(),
          title: () => text.toLowerCase().replace(/(^|\s)\S/g, (m) => m.toUpperCase()),
          sentence: () => text.toLowerCase().replace(/(^\s*|[.!?]\s+)([a-z])/g, (m, a, b) => a + b.toUpperCase()),
          camel: () => words.map((w, i) => (i ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w.toLowerCase())).join(""),
          snake: () => words.map((w) => w.toLowerCase()).join("_"),
          kebab: () => words.map((w) => w.toLowerCase()).join("-") })[mode](); } },
    { id: "dedupe", cat: "Text", name: "Remove Duplicate Lines", desc: "Keep unique lines only", fields: [T("text", "Lines"), C("trim", "Trim each line", true), C("ci", "Ignore case")],
      run: ({ text, trim, ci }) => { const seen = new Set(); return lines(text).map((l) => (trim ? l.trim() : l)).filter((l) => { const k = ci ? l.toLowerCase() : l; if (seen.has(k)) return false; seen.add(k); return true; }).join("\n"); } },
    { id: "sortlines", cat: "Text", name: "Sort Lines", desc: "A→Z, Z→A, numeric, reverse", fields: [T("text", "Lines"), S("mode", "Order", [["az", "A → Z"], ["za", "Z → A"], ["num", "Numeric"], ["rev", "Reverse order"], ["len", "By length"]])],
      run: ({ text, mode }) => { const l = lines(text); return (mode === "az" ? l.sort((a, b) => a.localeCompare(b)) : mode === "za" ? l.sort((a, b) => b.localeCompare(a)) : mode === "num" ? l.sort((a, b) => parseFloat(a) - parseFloat(b)) : mode === "len" ? l.sort((a, b) => a.length - b.length) : l.reverse()).join("\n"); } },
    { id: "diff", cat: "Text", name: "Text Diff Checker", desc: "Compare two texts line by line", fields: [T("a", "Original"), T("b", "Changed")],
      run: ({ a, b }) => { const d = lcsDiff(lines(a), lines(b)); const ch = d.filter((x) => x[0] !== " ").length; return (ch ? `${ch} changed line(s)\n\n` : "Texts are identical.\n\n") + d.join("\n"); } },
    { id: "emails", cat: "Text", name: "Extract Emails", desc: "Pull email addresses from text", fields: [T("text", "Text or HTML"), C("uniq", "Remove duplicates", true), C("sort", "Sort A→Z")],
      run: ({ text, uniq, sort }) => { let m = text.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g) || []; if (uniq) m = [...new Set(m.map((x) => x.toLowerCase()))]; if (sort) m.sort(); return m.length ? `${m.length} found\n\n${m.join("\n")}` : "No email addresses found."; } },
    { id: "urls", cat: "Text", name: "Extract URLs", desc: "Find links in text or HTML", fields: [T("text", "Text or HTML"), C("uniq", "Remove duplicates", true)],
      run: ({ text, uniq }) => { let m = (text.match(/https?:\/\/[^\s"'<>)]+/g) || []).map((x) => x.replace(/[.,;:!?]+$/, "")); if (uniq) m = [...new Set(m)]; return m.length ? `${m.length} found\n\n${m.join("\n")}` : "No URLs found."; } },
    { id: "numbers", cat: "Text", name: "Extract Numbers", desc: "Sum, average, min, max", fields: [T("text", "Text")],
      run: ({ text }) => { const m = (text.match(/-?\d+(?:\.\d+)?/g) || []).map(Number); if (!m.length) return "No numbers found."; const sum = m.reduce((a, b) => a + b, 0); return `Count: ${m.length}\nSum: ${fmt(sum, 6)}\nAverage: ${fmt(sum / m.length, 6)}\nMin: ${Math.min(...m)}\nMax: ${Math.max(...m)}\n\n${m.join(", ")}`; } },
    { id: "prefix", cat: "Text", name: "Add Prefix / Suffix to Lines", desc: "Quote lists, build SQL or code", fields: [T("text", "Lines"), I("pre", "Prefix", "'"), I("suf", "Suffix", "',")],
      run: ({ text, pre, suf }) => lines(text).map((l) => pre + l + suf).join("\n") },
    { id: "palindrome", cat: "Text", name: "Palindrome Checker", desc: "Check words, phrases or lines", fields: [T("text", "One or more lines")],
      run: ({ text }) => lines(text).filter((l) => l.trim()).map((l) => { const c = l.toLowerCase().replace(/[^\p{L}\p{N}]/gu, ""); return `${c && c === [...c].reverse().join("") ? "✔ Palindrome" : "✘ Not a palindrome"}  —  ${l}`; }).join("\n") },
    { id: "readtime", cat: "Text", name: "Reading Time", desc: "Silent and spoken reading time", fields: [T("text", "Text"), N("wpm", "Reading speed (words/min)", 220), N("spm", "Speaking speed (words/min)", 140)],
      run: ({ text, wpm, spm }) => { const w = (text.match(/\S+/g) || []).length, f = (m) => `${Math.floor(m)} min ${Math.round((m % 1) * 60)} sec`; return `Words: ${w}\nSilent reading: ${f(w / wpm)}\nSpoken aloud: ${f(w / spm)}`; } },
    { id: "wordwrap", cat: "Text", name: "Word Wrap", desc: "Wrap long lines at a column width", fields: [T("text", "Text"), N("w", "Max line width", 60, { min: 10 })],
      run: ({ text, w }) => lines(text).map((l) => { const out = []; let cur = ""; for (const word of l.split(" ")) { if ((cur + " " + word).trim().length > w && cur) { out.push(cur); cur = word; } else cur = (cur ? cur + " " : "") + word; } out.push(cur); return out.join("\n"); }).join("\n") },
    { id: "lorem", cat: "Text", name: "Lorem Ipsum Generator", desc: "Placeholder text", fields: [N("n", "Paragraphs", 3, { min: 1, max: 20 })],
      run: ({ n }) => { const w = "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat".split(" "); const p = []; for (let i = 0; i < n; i++) { const s = []; for (let k = 0; k < 4; k++) { const len = 8 + Math.floor(Math.random() * 8); const x = Array.from({ length: len }, () => w[Math.floor(Math.random() * w.length)]); x[0] = x[0][0].toUpperCase() + x[0].slice(1); s.push(x.join(" ") + "."); } p.push(s.join(" ")); } return p.join("\n\n"); } },

    /* ENCODING */
    { id: "base64", cat: "Encoding", name: "Base64 Encode / Decode", desc: "UTF-8 safe", fields: [T("text", "Text"), S("mode", "Action", [["enc", "Encode"], ["dec", "Decode"]])],
      run: ({ text, mode }) => mode === "enc" ? b64(enc.encode(text)) : new TextDecoder().decode(Uint8Array.from(atob(text.trim()), (c) => c.charCodeAt(0))) },
    { id: "url", cat: "Encoding", name: "URL Encode / Decode", desc: "Percent-encoding", fields: [T("text", "Text"), S("mode", "Action", [["enc", "Encode component"], ["encfull", "Encode full URI"], ["dec", "Decode"]])],
      run: ({ text, mode }) => mode === "enc" ? encodeURIComponent(text) : mode === "encfull" ? encodeURI(text) : decodeURIComponent(text) },
    { id: "html", cat: "Encoding", name: "HTML Entity Encode / Decode", desc: "Escape & unescape", fields: [T("text", "Text"), S("mode", "Action", [["enc", "Encode"], ["dec", "Decode"]])],
      run: ({ text, mode }) => { if (mode === "enc") return text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]); const d = new DOMParser().parseFromString(text, "text/html"); return d.documentElement.textContent; } },
    { id: "hexenc", cat: "Encoding", name: "Text ⇄ Hex", desc: "UTF-8 bytes as hexadecimal", fields: [T("text", "Text or hex"), S("mode", "Action", [["enc", "Text → Hex"], ["dec", "Hex → Text"]])],
      run: ({ text, mode }) => { if (mode === "enc") return Array.from(enc.encode(text)).map((b) => b.toString(16).padStart(2, "0")).join(" "); const h = text.replace(/[^0-9a-f]/gi, ""); if (h.length % 2) throw Error("Hex string has an odd number of digits"); return new TextDecoder().decode(Uint8Array.from(h.match(/../g) || [], (x) => parseInt(x, 16))); } },
    { id: "jwt", cat: "Encoding", name: "JWT Decoder", desc: "Header & payload (not verified)", fields: [T("text", "JWT token")],
      run: ({ text }) => { const p = text.trim().split("."); if (p.length < 2) throw Error("Not a valid JWT"); const dec = (s) => JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(s.length / 4) * 4, "=")), (c) => c.charCodeAt(0)))); const h = dec(p[0]), pl = dec(p[1]); const dates = ["exp", "iat", "nbf"].filter((k) => pl[k]).map((k) => `${k}: ${new Date(pl[k] * 1000).toISOString()}`); return `HEADER\n${JSON.stringify(h, null, 2)}\n\nPAYLOAD\n${JSON.stringify(pl, null, 2)}${dates.length ? "\n\n" + dates.join("\n") : ""}\n\nSignature is NOT verified.`; } },
    { id: "morse", cat: "Encoding", name: "Morse Code", desc: "Text ⇄ Morse", fields: [T("text", "Text or Morse"), S("mode", "Action", [["enc", "Text → Morse"], ["dec", "Morse → Text"]])],
      run: ({ text, mode }) => { if (mode === "enc") return text.toLowerCase().split("").map((c) => (c === " " ? "/" : MORSE[c] || "")).filter(Boolean).join(" "); const rev = Object.fromEntries(Object.entries(MORSE).map(([k, v]) => [v, k])); return text.trim().split(/\s+/).map((c) => (c === "/" ? " " : rev[c] || "?")).join(""); } },

    /* DEVELOPER */
    { id: "json", cat: "Developer", name: "JSON Formatter & Validator", desc: "Pretty-print, minify, validate", fields: [T("text", "JSON"), S("mode", "Action", [["2", "Format (2 spaces)"], ["4", "Format (4 spaces)"], ["min", "Minify"]])],
      run: ({ text, mode }) => { const o = JSON.parse(text); return mode === "min" ? JSON.stringify(o) : JSON.stringify(o, null, +mode); } },
    { id: "timestamp", cat: "Developer", name: "Unix Timestamp Converter", desc: "Epoch ⇄ date", fields: [I("v", "Timestamp or date (leave empty for now)"), ],
      run: ({ v }) => { v = v.trim(); let d; if (!v) d = new Date(); else if (/^-?\d+$/.test(v)) d = new Date(v.length > 11 ? +v : v * 1000); else d = new Date(v); if (isNaN(d)) throw Error("Could not understand that value"); return `ISO (UTC): ${d.toISOString()}\nDhaka: ${d.toLocaleString("en-GB", { timeZone: "Asia/Dhaka", dateStyle: "full", timeStyle: "long" })}\nSeconds: ${Math.floor(d / 1000)}\nMilliseconds: ${d.getTime()}`; } },
    { id: "minify", cat: "Developer", name: "Code Minifier (basic)", desc: "Strip comments & whitespace", fields: [T("text", "Code"), S("lang", "Language", [["css", "CSS"], ["js", "JavaScript (simple)"], ["html", "HTML"]])],
      run: ({ text, lang }) => { let o = text; if (lang === "css") o = o.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\s+/g, " ").replace(/\s*([{}:;,>])\s*/g, "$1").replace(/;}/g, "}"); else if (lang === "html") o = o.replace(/<!--[\s\S]*?-->/g, "").replace(/>\s+</g, "><").replace(/\s+/g, " "); else o = o.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "").replace(/\s*\n\s*/g, "\n").replace(/[ \t]+/g, " "); return `${o.trim()}\n\n— ${text.length} → ${o.trim().length} chars. Basic minifier: test before production use.`; } },
    { id: "regex", cat: "Developer", name: "Regex Tester", desc: "Find all matches", fields: [I("p", "Pattern", "\\d+"), I("f", "Flags", "g"), T("text", "Test text")],
      run: ({ p, f, text }) => { const re = new RegExp(p, f.includes("g") ? f : f + "g"); const m = [...text.matchAll(re)]; return m.length ? `${m.length} match(es)\n\n` + m.map((x, i) => `#${i + 1} @${x.index}: ${x[0]}${x.length > 1 ? "  groups: " + x.slice(1).join(" | ") : ""}`).join("\n") : "No matches."; } },
    { id: "uuid", cat: "Developer", name: "UUID Generator", desc: "Random v4 UUIDs", fields: [N("n", "How many", 5, { min: 1, max: 100 })],
      run: ({ n }) => Array.from({ length: n }, () => crypto.randomUUID()).join("\n") },

    /* SECURITY */
    ...[["SHA-1", "SHA-1"], ["SHA-256", "SHA-256"], ["SHA-512", "SHA-512"]].map(([algo, name]) => ({ id: algo.toLowerCase().replace("-", ""), cat: "Security", name: name + " Hash Generator", desc: "Computed locally with Web Crypto", fields: [T("text", "Text")],
      run: async ({ text }) => { const h = await crypto.subtle.digest(algo, enc.encode(text)); return `Hex: ${hex(h)}\nHEX (upper): ${hex(h).toUpperCase()}\nBase64: ${b64(h)}`; } })),
    { id: "hmac", cat: "Security", name: "HMAC Generator", desc: "HMAC-SHA256/384/512", fields: [T("text", "Message"), I("key", "Secret key"), S("algo", "Algorithm", [["SHA-256", "SHA-256"], ["SHA-384", "SHA-384"], ["SHA-512", "SHA-512"], ["SHA-1", "SHA-1"]])],
      run: async ({ text, key, algo }) => { const k = await crypto.subtle.importKey("raw", enc.encode(key), { name: "HMAC", hash: algo }, false, ["sign"]); const s = await crypto.subtle.sign("HMAC", k, enc.encode(text)); return `Hex: ${hex(s)}\nBase64: ${b64(s)}`; } },
    { id: "password", cat: "Security", name: "Password Generator", desc: "Cryptographically random", fields: [N("len", "Length", 16, { min: 6, max: 128 }), C("up", "Uppercase", true), C("lo", "Lowercase", true), C("dg", "Digits", true), C("sy", "Symbols", true), N("n", "How many", 5, { min: 1, max: 50 })],
      run: ({ len, up, lo, dg, sy, n }) => { const sets = [[up, "ABCDEFGHJKLMNPQRSTUVWXYZ"], [lo, "abcdefghijkmnopqrstuvwxyz"], [dg, "23456789"], [sy, "!@#$%^&*()-_=+[]{};:,.?"]].filter((s) => s[0]).map((s) => s[1]); if (!sets.length) throw Error("Select at least one character type"); const all = sets.join(""); const rnd = (m) => { const a = new Uint32Array(1); const lim = Math.floor(2 ** 32 / m) * m; do crypto.getRandomValues(a); while (a[0] >= lim); return a[0] % m; }; return Array.from({ length: n }, () => { const p = sets.map((s) => s[rnd(s.length)]); while (p.length < len) p.push(all[rnd(all.length)]); for (let i = p.length - 1; i > 0; i--) { const j = rnd(i + 1); [p[i], p[j]] = [p[j], p[i]]; } return p.slice(0, len).join(""); }).join("\n"); } },
    { id: "pwstrength", cat: "Security", name: "Password Strength Checker", desc: "Checked in your browser only", fields: [{ n: "pw", l: "Password", t: "password", v: "" }],
      run: ({ pw }) => { let pool = 0; if (/[a-z]/.test(pw)) pool += 26; if (/[A-Z]/.test(pw)) pool += 26; if (/\d/.test(pw)) pool += 10; if (/[^A-Za-z0-9]/.test(pw)) pool += 32; const bits = pw.length * Math.log2(pool || 1); const common = /^(password|123456|qwerty|admin|letmein|welcome|iloveyou)/i.test(pw); const rating = common || bits < 28 ? "Very weak" : bits < 40 ? "Weak" : bits < 60 ? "Fair" : bits < 80 ? "Strong" : "Very strong"; return `Rating: ${rating}\nLength: ${pw.length}\nEstimated entropy: ${bits.toFixed(0)} bits${common ? "\nWarning: starts with a very common password." : ""}\n\nUse 14+ characters or a long passphrase.`; } },

    /* COLOR */
    { id: "color", cat: "Color", name: "Color Converter", desc: "HEX ⇄ RGB ⇄ HSL", fields: [I("hex", "HEX colour", "#2B6CB0")], preview: true,
      run: ({ hex: h }) => { const rgb = hexToRgb(h), [hh, s, l] = rgbToHsl(rgb); return { text: `HEX: #${rgb.map((x) => x.toString(16).padStart(2, "0")).join("").toUpperCase()}\nRGB: rgb(${rgb.join(", ")})\nHSL: hsl(${hh}, ${s}%, ${l}%)`, swatch: `rgb(${rgb.join(",")})` }; } },
    { id: "contrast", cat: "Color", name: "Color Contrast Checker", desc: "WCAG AA / AAA", fields: [I("fg", "Text colour", "#1B2941"), I("bg", "Background colour", "#FFFFFF")],
      run: ({ fg, bg }) => { const a = lum(hexToRgb(fg)), b = lum(hexToRgb(bg)), r = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05); const ok = (x) => (r >= x ? "Pass" : "Fail"); return `Contrast ratio: ${r.toFixed(2)} : 1\nAA normal text (4.5): ${ok(4.5)}\nAA large text (3): ${ok(3)}\nAAA normal text (7): ${ok(7)}`; } },
    { id: "gradient", cat: "Color", name: "CSS Gradient Generator", desc: "Linear gradients", fields: [I("c1", "Colour 1", "#2B6CB0"), I("c2", "Colour 2", "#63B3ED"), N("deg", "Angle (deg)", 135)], preview: true,
      run: ({ c1, c2, deg }) => { const g = `linear-gradient(${deg}deg, ${c1}, ${c2})`; return { text: `background: ${g};`, swatch: g }; } },
    { id: "palette", cat: "Color", name: "Color Shades Generator", desc: "Tints and shades of a colour", fields: [I("hex", "Base colour", "#2B6CB0")],
      run: ({ hex: h }) => { const rgb = hexToRgb(h); const mix = (t, p) => "#" + rgb.map((c) => Math.round(c + (t - c) * p).toString(16).padStart(2, "0")).join("").toUpperCase(); const tints = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => mix(255, i / 10)), shades = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => mix(0, i / 10)); return `TINTS (lighter)\n${tints.join("\n")}\n\nSHADES (darker)\n${shades.join("\n")}`; } },

    /* CALCULATORS */
    { id: "age", cat: "Calculators", name: "Age Calculator", desc: "Exact age in years, months, days", fields: [{ n: "dob", l: "Date of birth", t: "date", v: "" }, { n: "on", l: "Age on date (optional)", t: "date", v: "" }], req: ["dob"],
      run: ({ dob, on }) => { const b = new Date(dob), t = on ? new Date(on) : new Date(); if (b > t) throw Error("Birth date is after the target date"); let tm = (t.getFullYear() - b.getFullYear()) * 12 + t.getMonth() - b.getMonth(); if (t.getDate() < b.getDate()) tm--; const ay = b.getFullYear() + Math.floor((b.getMonth() + tm) / 12), am = (b.getMonth() + tm) % 12; const anchor = new Date(ay, am, Math.min(b.getDate(), new Date(ay, am + 1, 0).getDate())); const y = Math.floor(tm / 12), m = tm % 12, d = Math.round((new Date(t.getFullYear(), t.getMonth(), t.getDate()) - anchor) / 864e5); const days = Math.floor((t - b) / 864e5); return `Age: ${y} years, ${m} months, ${d} days\nTotal days: ${fmt(days, 0)}\nTotal weeks: ${fmt(days / 7, 1)}`; } },
    { id: "bmi", cat: "Calculators", name: "BMI Calculator", desc: "Body Mass Index", fields: [N("kg", "Weight (kg)", 70, { min: 1 }), N("cm", "Height (cm)", 170, { min: 50 })],
      run: ({ kg, cm }) => { const b = kg / (cm / 100) ** 2; return `BMI: ${b.toFixed(1)}\nCategory: ${b < 18.5 ? "Underweight" : b < 25 ? "Normal" : b < 30 ? "Overweight" : "Obese"}\nGeneral screening guide only, not medical advice.`; } },
    { id: "emi", cat: "Calculators", name: "Loan / EMI Calculator", desc: "Monthly instalment & interest", fields: [N("p", "Loan amount (৳)", 500000, { min: 1 }), N("r", "Annual interest rate (%)", 9, { min: 0 }), N("n", "Months", 36, { min: 1 })],
      run: ({ p, r, n }) => { const i = r / 1200, emi = i ? (p * i * (1 + i) ** n) / ((1 + i) ** n - 1) : p / n, tot = emi * n; return `Monthly EMI: ৳${fmt(emi)}\nTotal payment: ৳${fmt(tot)}\nTotal interest: ৳${fmt(tot - p)}`; } },
    { id: "percent", cat: "Calculators", name: "Percentage Calculator", desc: "Three common percentage questions", fields: [N("a", "A", 20), N("b", "B", 150)],
      run: ({ a, b }) => `${a}% of ${b} = ${fmt((a / 100) * b, 6)}\n${a} is ${fmt((a / b) * 100, 6)}% of ${b}\nChange from ${a} to ${b}: ${fmt(((b - a) / a) * 100, 6)}%` },
    { id: "gpa", cat: "Calculators", name: "GPA / CGPA Calculator", desc: "One 'grade,credit' pair per line", fields: [T("text", "Grade points and credits", "4.0,3\n3.5,3\n3.75,4")],
      run: ({ text }) => { let pts = 0, cr = 0; for (const l of lines(text).filter((x) => x.trim())) { const [g, c] = l.split(/[,\s]+/).map(Number); if (!Number.isFinite(g) || !Number.isFinite(c)) throw Error(`Bad line: "${l}"`); pts += g * c; cr += c; } return `GPA: ${(pts / cr).toFixed(2)}\nTotal credits: ${cr}`; } },
    { id: "unit", cat: "Calculators", name: "Unit Converter", desc: "Length, weight, data, area, time", fields: [S("cat", "Category", Object.keys(UNITS).map((k) => [k, k])), N("v", "Value", 1), I("from", "From unit", "km"), I("to", "To unit", "mile")],
      run: ({ cat, v, from, to }) => { const u = UNITS[cat]; if (!(from in u) || !(to in u)) throw Error("Units for " + cat + ": " + Object.keys(u).join(", ")); return `${v} ${from} = ${fmt((v * u[from]) / u[to], 8)} ${to}\n\nAvailable: ${Object.keys(u).join(", ")}`; } },
    { id: "random", cat: "Calculators", name: "Random Number Generator", desc: "Integers in a range", fields: [N("min", "Min", 1), N("max", "Max", 100), N("n", "Count", 5, { min: 1, max: 1000 }), C("uniq", "Unique only")],
      run: ({ min, max, n, uniq }) => { min = Math.ceil(min); max = Math.floor(max); if (max < min) throw Error("Max must be ≥ Min"); if (uniq && n > max - min + 1) throw Error("Range too small for that many unique numbers"); const out = [], s = new Set(), a = new Uint32Array(1); while (out.length < n) { crypto.getRandomValues(a); const x = min + (a[0] % (max - min + 1)); if (uniq && s.has(x)) continue; s.add(x); out.push(x); } return out.join(", "); } },

    /* DATE */
    { id: "week", cat: "Date & Time", name: "Week Number Calculator", desc: "ISO 8601 week", fields: [{ n: "d", l: "Date", t: "date", v: "" }], req: ["d"],
      run: ({ d }) => { const t = new Date(d + "T00:00:00Z"); const day = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - day); const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1)); const w = Math.ceil(((t - y0) / 864e5 + 1) / 7); return `ISO week: ${w}\nWeek-year: ${t.getUTCFullYear()}`; } },
    { id: "countdown", cat: "Date & Time", name: "Days Until / Since", desc: "Count days to any date", fields: [{ n: "d", l: "Date", t: "date", v: "" }], req: ["d"],
      run: ({ d }) => { const a = new Date(new Date().toDateString()), b = new Date(d + "T00:00:00"); const n = Math.round((b - a) / 864e5); return n === 0 ? "That is today." : n > 0 ? `${n} day(s) until ${d}  (${Math.floor(n / 7)} weeks ${n % 7} days)` : `${-n} day(s) since ${d}`; } },

    /* IMAGE */
    { id: "imgcompress", cat: "Image", name: "Image Compressor / Converter", desc: "Resize, compress, JPG/PNG/WebP", fields: [F("file", "Image", "image/*", { required: true }), S("fmt", "Output format", [["image/jpeg", "JPG"], ["image/webp", "WebP"], ["image/png", "PNG"]]), N("q", "Quality (10–100)", 75, { min: 10, max: 100 }), N("w", "Max width in px (0 = original)", 0, { min: 0 })],
      run: async ({ file, fmt: f, q, w }) => { if (!file || !file.size) throw Error("Choose an image first"); const bmp = await createImageBitmap(file); const scale = w > 0 && bmp.width > w ? w / bmp.width : 1; const c = document.createElement("canvas"); c.width = Math.round(bmp.width * scale); c.height = Math.round(bmp.height * scale); const ctx = c.getContext("2d"); if (f === "image/jpeg") { ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height); } ctx.drawImage(bmp, 0, 0, c.width, c.height); bmp.close?.(); const blob = await new Promise((r) => c.toBlob(r, f, q / 100)); if (!blob) throw Error("This browser cannot encode that format"); const ext = { "image/jpeg": "jpg", "image/webp": "webp", "image/png": "png" }[f]; return { text: `Before: ${fmt(file.size / 1024, 1)} KB\nAfter: ${fmt(blob.size / 1024, 1)} KB  (${c.width}×${c.height})`, blob, name: `image-${Date.now()}.${ext}` }; } },
  ];

  const cats = [...new Set(tools.map((t) => t.cat))];

  /* ---------- UI ---------- */
  const esc = (x) => String(x ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  function fieldHtml(f) {
    const a = `name="${f.n}"`;
    if (f.t === "textarea") return `<label>${esc(f.l)}<textarea ${a} rows="5">${esc(f.v)}</textarea></label>`;
    if (f.t === "select") return `<label>${esc(f.l)}<select ${a}>${f.o.map(([v, l]) => `<option value="${esc(v)}"${v === f.v ? " selected" : ""}>${esc(l)}</option>`).join("")}</select></label>`;
    if (f.t === "checkbox") return `<label class="check"><input type="checkbox" ${a}${f.v ? " checked" : ""}> ${esc(f.l)}</label>`;
    if (f.t === "file") return `<label>${esc(f.l)}<input type="file" ${a} accept="${esc(f.accept)}"></label>`;
    const extra = ["min", "max", "step"].filter((k) => f[k] !== undefined).map((k) => `${k}="${f[k]}"`).join(" ");
    return `<label>${esc(f.l)}<input type="${f.t}" ${a} value="${esc(f.v)}" ${extra}></label>`;
  }
  function values(form, tool) {
    const v = {};
    for (const f of tool.fields) {
      const el = form.elements[f.n];
      v[f.n] = f.t === "checkbox" ? el.checked : f.t === "file" ? el.files[0] : f.t === "number" ? (el.value === "" ? NaN : +el.value) : el.value;
    }
    return v;
  }
  async function execute(form, tool, out) {
    out.hidden = false;
    try {
      const v = values(form, tool);
      for (const f of tool.fields) if (f.t === "number" && Number.isNaN(v[f.n])) throw Error(`Enter a valid number for "${f.l}"`);
      for (const k of tool.req || []) if (!v[k]) throw Error("Please fill in all required fields");
      let r = await tool.run(v);
      if (typeof r === "string") r = { text: r };
      out.innerHTML = "";
      if (r.swatch) { const s = document.createElement("div"); s.className = "swatch"; s.style.background = r.swatch; out.append(s); }
      const pre = document.createElement("pre"); pre.className = "tool-out"; pre.textContent = r.text; out.append(pre);
      const bar = document.createElement("div"); bar.className = "result-actions";
      const copy = document.createElement("button"); copy.type = "button"; copy.className = "btn"; copy.textContent = "Copy result";
      copy.onclick = () => navigator.clipboard.writeText(r.text).then(() => window.NTools.toast?.("Copied"), () => window.NTools.toast?.("Clipboard unavailable"));
      bar.append(copy);
      if (r.blob) {
        const url = URL.createObjectURL(r.blob);
        const img = document.createElement("img"); img.src = url; img.alt = "Result preview"; img.className = "tool-preview"; out.prepend(img);
        const dl = document.createElement("a"); dl.className = "btn primary"; dl.href = url; dl.download = r.name; dl.textContent = "Download image"; bar.append(dl);
      }
      out.append(bar);
    } catch (e) {
      out.textContent = e.message || String(e);
    }
  }
  function open(id, host) {
    const tool = tools.find((t) => t.id === id);
    if (!tool) return;
    host.innerHTML = `<form class="card form-card" novalidate><h2>${esc(tool.name)}</h2><p>${esc(tool.desc)}. Runs in your browser — nothing is uploaded.</p>${tool.fields.map(fieldHtml).join("")}<div class="result-actions"><button class="btn primary" type="submit">Run</button><button class="btn" type="button" data-clear>Clear</button></div><div class="result" hidden></div></form>`;
    const form = host.querySelector("form"), out = form.querySelector(".result");
    form.onsubmit = (e) => { e.preventDefault(); execute(form, tool, out); };
    form.querySelector("[data-clear]").onclick = () => { form.reset(); out.hidden = true; out.innerHTML = ""; };
    if (tool.live) form.addEventListener("input", () => execute(form, tool, out));
    host.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function directory(query = "", cat = "") {
    const q = query.trim().toLowerCase();
    const list = tools.filter((t) => (!cat || t.cat === cat) && (!q || (t.name + " " + t.desc + " " + t.cat).toLowerCase().includes(q)));
    if (!list.length) return `<p class="empty">No tools match “${esc(query)}”.</p>`;
    return cats.filter((c) => list.some((t) => t.cat === c)).map((c) => `<h3 class="cat-title">${esc(c)}</h3><div class="directory">${list.filter((t) => t.cat === c).map((t) => `<button type="button" class="tool-card" data-ntool="${t.id}"><h2>${esc(t.name)}</h2><p>${esc(t.desc)}</p><span class="link">Open tool →</span></button>`).join("")}</div>`).join("");
  }
  window.NTools = { tools, cats, open, directory, toast: null };
})();
