// Logic tests for app/static/tools.js (no DOM needed). Run: node tests/tools.cjs
const fs = require("node:fs");
const assert = require("node:assert/strict");
const vm = require("node:vm");
const win = {};
vm.runInNewContext(fs.readFileSync("app/static/tools.js", "utf8"), {
  window: win, crypto: require("node:crypto").webcrypto, TextEncoder, TextDecoder, atob, btoa,
  DOMParser: class { parseFromString(t) { return { documentElement: { textContent: t.replace(/&amp;/g, "&").replace(/&lt;/g, "<") } }; } },
  document: {}, createImageBitmap: null, URL,
});
const T = Object.fromEntries(win.NTools.tools.map((t) => [t.id, t]));
const run = async (id, v) => { const r = await T[id].run(v); return typeof r === "string" ? r : r.text; };
(async () => {
  assert.equal(new Set(win.NTools.tools.map((t) => t.id)).size, win.NTools.tools.length, "unique ids");
  assert.match(await run("wordcount", { text: "Hello world. Bye!" }), /Words: 3/);
  assert.equal(await run("case", { text: "hello big world", mode: "camel" }), "helloBigWorld");
  assert.equal(await run("dedupe", { text: "a\nb\na", trim: true, ci: false }), "a\nb");
  assert.match(await run("diff", { a: "a\nb", b: "a\nc" }), /- b\n\+ c/);
  assert.match(await run("emails", { text: "x@y.com, X@Y.com", uniq: true, sort: false }), /1 found/);
  assert.match(await run("numbers", { text: "1 2 3.5" }), /Sum: 6.5/);
  assert.match(await run("palindrome", { text: "A man, a plan, a canal: Panama" }), /✔/);
  assert.equal(await run("base64", { text: "হ্যালো", mode: "enc" }), Buffer.from("হ্যালো").toString("base64"));
  assert.equal(await run("base64", { text: Buffer.from("হ্যালো").toString("base64"), mode: "dec" }), "হ্যালো");
  assert.equal(await run("hexenc", { text: "Hi", mode: "enc" }), "48 69");
  assert.equal(await run("morse", { text: "sos", mode: "enc" }), "... --- ...");
  assert.equal(await run("json", { text: '{"a":1}', mode: "min" }), '{"a":1}');
  await assert.rejects(run("json", { text: "{bad", mode: "2" }));
  assert.match(await run("sha256", { text: "abc" }), /ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad/);
  assert.match(await run("hmac", { text: "msg", key: "k", algo: "SHA-256" }), /Hex: [0-9a-f]{64}/);
  const pw = await run("password", { len: 20, up: true, lo: true, dg: true, sy: true, n: 3 });
  assert.equal(pw.split("\n").length, 3); assert.ok(pw.split("\n").every((p) => p.length === 20));
  assert.match(await run("color", { hex: "#2B6CB0" }), /rgb\(43, 108, 176\)/);
  assert.match(await run("contrast", { fg: "#000", bg: "#fff" }), /21\.00/);
  assert.match(await run("age", { dob: "2000-01-31", on: "2026-03-01" }), /26 years, 1 months, 1 days/);
  assert.match(await run("emi", { p: 120000, r: 0, n: 12 }), /EMI: ৳10,000/);
  assert.match(await run("percent", { a: 20, b: 150 }), /= 30/);
  assert.match(await run("gpa", { text: "4,3\n3,3" }), /GPA: 3.50/);
  assert.match(await run("unit", { cat: "Length", v: 1, from: "km", to: "m" }), /1,000 m/);
  assert.match(await run("week", { d: "2026-01-01" }), /ISO week: 1/);
  assert.match(await run("regex", { p: "\\d+", f: "g", text: "a1b22" }), /2 match/);
  assert.match(await run("timestamp", { v: "0" }), /1970-01-01/);
  assert.match(await run("jwt", { text: "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIiwiZXhwIjo0MTAyNDQ0ODAwfQ.x" }), /"sub": "1"/);
  console.log(`tools.js OK — ${win.NTools.tools.length} tools in ${win.NTools.cats.length} categories`);
})().catch((e) => { console.error(e); process.exit(1); });
