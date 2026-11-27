/* 영도 동선 "AI에게 말로 물어보기" 중계 서버
   페이지(js/07-ai.js)가 적은 글을 보내면 Workers AI로 질문 답(JSON)을 뽑아 돌려줌.
   프롬프트는 여기서만 만듦 → 이 주소를 아무 AI 질문에나 쓰는 걸 막음.
   Workers Free는 하루 무료 한도(10,000 Neurons)를 넘으면 요금 없이 실패만 함 → 페이지는 단어 찾기로 넘어감 */

const MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast"; // JSON 모드 지원 모델 중 가장 크고 다국어에 강함
const MAX_TEXT = 500;   // 글 길이 제한
const MAX_SHIPS = 40;   // 크루즈 목록 길이 제한

const NAT = ["ja", "zh", "tw", "us", "kr", "other"];
const COMP = ["solo", "couple", "friends", "family", "care", "both", "fam"];
const INTERESTS = ["food", "cafe", "photo", "view", "culture", "beauty", "activity"];
const LANG_NAME = { ko: "Korean", en: "English", ja: "Japanese", zh: "Simplified Chinese" };

function allowedOrigin(req, env) {
  const o = req.headers.get("Origin") || "";
  const list = (env.ALLOWED_ORIGINS || "").split(",").map(s => s.trim()).filter(Boolean);
  if (list.includes(o)) return o;
  if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(o)) return o; // 로컬 테스트
  return null;
}

function reply(body, status, origin) {
  // 204(내용 없음)는 본문을 붙이면 오류가 나므로 null
  return new Response(status === 204 ? null : JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": origin || "null",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Cache-Control": "no-store",
      "Vary": "Origin",
    },
  });
}

function buildMessages(text, lang, ships) {
  const system = `You read what a cruise passenger who just got off the ship at Busan's Yeongdo cruise terminal wrote about their day, and fill a JSON object.
Only fill what they actually said or clearly implied; do not guess (use null or [] instead).
- nat: one of ${NAT.join(", ")}, or null if not said
- comp: one of ${COMP.join(", ")}, or null (family = travelling with children; care = travelling with older adults or someone with limited mobility, e.g. elderly parents, wheelchair, trouble walking; both = children and older adults or someone with limited mobility together; fam = travelling with family but no children and no older adults or limited mobility mentioned)
- interests: array from ${INTERESTS.join(", ")} (beauty = shopping, cosmetics, Daiso, Olive Young, department store; activity = zipline, Danubi train, fishing village experience)
- ship: one of ${ships.length ? ships.map(s => `${s.id} (${s.name})`).join(", ") : "(none)"}, or null if not named
- note: one warm sentence in ${LANG_NAME[lang] || "English"}, under 30 words, saying what you understood they want for today. No place names.${lang === "ko" ? " Write it in natural Korean using Hangul only (no Chinese characters)." : ""}
Rules:
- interests: include only interests the text actually mentions. Do not add any that are not mentioned.
- A market (시장, 市場, 市场) means food, not culture or beauty.
- Mentioning parents, grandparents, elderly people, or not being able to walk much means comp = care (or both if children also come).
- The value "family" means children only. The word family (가족, 家族, 家人) alone does not mean children: if no children, kids, son or daughter are mentioned, use fam (or care if older adults are mentioned).
The text may be in Korean, Japanese, Chinese or English.`;
  // 예시 한 쌍: 작은 모델이 규칙을 더 잘 따르게 함
  const exUser = "부모님이랑 왔어요. 해산물 좋아하고 많이 못 걸어요.";
  const exAnswer = JSON.stringify({ nat: null, comp: "care", interests: ["food"], ship: null, note: lang === "ko" ? "부모님과 무리 없이 다니며 맛있는 해산물을 즐기는 하루를 원하시는군요." : "You'd like an easy day with your parents enjoying seafood." });
  return [
    { role: "system", content: system },
    { role: "user", content: exUser },
    { role: "assistant", content: exAnswer },
    { role: "user", content: text },
  ];
}

const SCHEMA = {
  type: "object",
  properties: {
    nat: { type: ["string", "null"] },
    comp: { type: ["string", "null"] },
    interests: { type: "array", items: { type: "string" } },
    ship: { type: ["string", "null"] },
    note: { type: "string" },
  },
  required: ["nat", "comp", "interests", "ship", "note"],
};

// 모델 답을 허용된 값만 남겨서 정리 (페이지에서도 한 번 더 검사함)
function clean(j, ships) {
  const ok = (v, list) => (list.includes(v) ? v : null);
  return {
    nat: ok(j.nat, NAT),
    comp: ok(j.comp, COMP),
    interests: Array.isArray(j.interests) ? [...new Set(j.interests.filter(v => INTERESTS.includes(v)))] : [],
    ship: ok(j.ship, ships.map(s => s.id)),
    note: typeof j.note === "string" ? j.note.slice(0, 200) : "",
  };
}

/* ---------- 이용 기록 모으기 (관리자 페이지용) ----------
   D1 데이터베이스(env.DB)에 저장. 표는 처음 요청 때 자동으로 만듦.
   이름·연락처 같은 개인정보는 받지 않음. sid = 기기마다 만든 무작위 번호 */

const SCHEMA_SQL = [
  `CREATE TABLE IF NOT EXISTS visits (id INTEGER PRIMARY KEY AUTOINCREMENT, sid TEXT, lang TEXT, src TEXT, ts INTEGER)`,
  `CREATE TABLE IF NOT EXISTS plans (id TEXT PRIMARY KEY, sid TEXT, lang TEXT, ship TEXT, ship_name TEXT, cdate TEXT,
     comp TEXT, interests TEXT, weather TEXT, ai INTEGER, custom INTEGER, over INTEGER, stops TEXT,
     start_min INTEGER, end_min INTEGER, created INTEGER, updated INTEGER)`,
  `CREATE TABLE IF NOT EXISTS reviews (id INTEGER PRIMARY KEY AUTOINCREMENT, sid TEXT, lang TEXT, place TEXT, stars INTEGER, text TEXT, ts INTEGER)`,
  `CREATE INDEX IF NOT EXISTS visits_ts ON visits(ts)`,
  `CREATE INDEX IF NOT EXISTS plans_updated ON plans(updated)`,
];
let schemaReady = null;
function ensureSchema(env) {
  if (!schemaReady) schemaReady = env.DB.batch(SCHEMA_SQL.map(q => env.DB.prepare(q))).catch(e => { schemaReady = null; throw e; });
  return schemaReady;
}

const ID_RE = /^[a-z0-9_-]{1,40}$/i;
const str = (v, n) => (typeof v === "string" ? v.slice(0, n) : null);
const id = v => (typeof v === "string" && ID_RE.test(v) ? v : null);
const int = (v, lo, hi) => (Number.isFinite(v) ? Math.max(lo, Math.min(hi, Math.round(v))) : null);
const LANGS = Object.keys(LANG_NAME);

async function handleLog(req, env, origin) {
  if (!env.DB) return reply({ error: "no_db" }, 503, origin);
  let b;
  try { b = JSON.parse(await req.text()); } catch { return reply({ error: "bad_json" }, 400, origin); }
  const sid = id(b.sid);
  const lang = LANGS.includes(b.lang) ? b.lang : null;
  const now = Date.now();
  await ensureSchema(env);

  if (b.type === "visit") {
    await env.DB.prepare("INSERT INTO visits (sid, lang, src, ts) VALUES (?, ?, ?, ?)")
      .bind(sid, lang, str(b.src, 40), now).run();
  } else if (b.type === "plan") {
    const pid = id(b.id);
    if (!pid) return reply({ error: "bad_id" }, 400, origin);
    const stops = (Array.isArray(b.stops) ? b.stops : []).slice(0, 30)
      .map(s => ({ id: id(s && s.id), dw: int(s && s.dw, 0, 600), ...(s && s.id === "food" ? { name: str(s.name, 40) } : {}) }))
      .filter(s => s.id);
    const interests = (Array.isArray(b.interests) ? b.interests : []).filter(v => INTERESTS.includes(v));
    await env.DB.prepare(`INSERT INTO plans (id, sid, lang, ship, ship_name, cdate, comp, interests, weather, ai, custom, over, stops, start_min, end_min, created, updated)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET lang=excluded.lang, ship=excluded.ship, ship_name=excluded.ship_name, cdate=excluded.cdate,
        comp=excluded.comp, interests=excluded.interests, weather=excluded.weather, ai=excluded.ai, custom=excluded.custom,
        over=excluded.over, stops=excluded.stops, start_min=excluded.start_min, end_min=excluded.end_min, updated=excluded.updated`)
      .bind(pid, sid, lang, id(b.ship), str(b.shipName, 60), str(b.cdate, 10),
        COMP.includes(b.comp) ? b.comp : null, JSON.stringify(interests), str(b.weather, 10),
        b.ai ? 1 : 0, b.custom ? 1 : 0, b.over ? 1 : 0, JSON.stringify(stops),
        int(b.start, 0, 2880), int(b.end, 0, 2880), now, now).run();
  } else if (b.type === "review") {
    const stars = int(b.stars, 1, 5);
    if (!stars) return reply({ error: "bad_stars" }, 400, origin);
    await env.DB.prepare("INSERT INTO reviews (sid, lang, place, stars, text, ts) VALUES (?, ?, ?, ?, ?, ?)")
      .bind(sid, lang, id(b.place), stars, str(b.text, 300), now).run();
  } else {
    return reply({ error: "bad_type" }, 400, origin);
  }
  return reply({ ok: true }, 200, origin);
}

// 비밀번호 비교: 길이와 상관없이 끝까지 비교 (시간 차이로 맞히기 어렵게)
function sameText(a, b) {
  const x = new TextEncoder().encode(a), y = new TextEncoder().encode(b);
  let d = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) d |= (x[i] || 0) ^ (y[i] || 0);
  return d === 0;
}

async function handleStats(req, env, origin) {
  if (!env.ADMIN_TOKEN) return reply({ error: "no_admin_token" }, 503, origin);
  const auth = req.headers.get("Authorization") || "";
  if (!sameText(auth, "Bearer " + env.ADMIN_TOKEN)) return reply({ error: "unauthorized" }, 401, origin);
  if (!env.DB) return reply({ error: "no_db" }, 503, origin);
  await ensureSchema(env);

  const days = int(Number(new URL(req.url).searchParams.get("days")) || 30, 1, 365);
  const since = Date.now() - days * 864e5;
  const KST = 9 * 3600 * 1000;
  const [byDay, byHour, byLang, totals, plans, reviews] = await env.DB.batch([
    env.DB.prepare(`SELECT date((ts + ?) / 1000, 'unixepoch') AS d, COUNT(*) AS n, COUNT(DISTINCT sid) AS u FROM visits WHERE ts >= ? GROUP BY d ORDER BY d`).bind(KST, since),
    env.DB.prepare(`SELECT CAST(strftime('%H', (ts + ?) / 1000, 'unixepoch') AS INTEGER) AS h, COUNT(*) AS n FROM visits WHERE ts >= ? GROUP BY h ORDER BY h`).bind(KST, since),
    env.DB.prepare(`SELECT lang, COUNT(*) AS n FROM visits WHERE ts >= ? GROUP BY lang ORDER BY n DESC`).bind(since),
    env.DB.prepare(`SELECT COUNT(*) AS n, COUNT(DISTINCT sid) AS u FROM visits WHERE ts >= ?`).bind(since),
    env.DB.prepare(`SELECT id, sid, lang, ship, ship_name, cdate, comp, interests, weather, ai, custom, over, stops, start_min, end_min, created, updated
      FROM plans WHERE updated >= ? ORDER BY updated DESC LIMIT 5000`).bind(since),
    env.DB.prepare(`SELECT lang, place, stars, text, ts FROM reviews WHERE ts >= ? ORDER BY ts DESC LIMIT 300`).bind(since),
  ]);
  return reply({
    days, since,
    visits: { total: totals.results[0].n, users: totals.results[0].u, byDay: byDay.results, byHour: byHour.results, byLang: byLang.results },
    plans: plans.results.map(p => ({ ...p, interests: JSON.parse(p.interests || "[]"), stops: JSON.parse(p.stops || "[]") })),
    reviews: reviews.results,
  }, 200, origin);
}

export default {
  async fetch(req, env) {
    const origin = allowedOrigin(req, env);
    if (req.method === "OPTIONS") return reply({}, origin ? 204 : 403, origin);
    if (!origin) return reply({ error: "origin" }, 403, null);
    const path = new URL(req.url).pathname;
    try {
      if (path === "/log" && req.method === "POST") return await handleLog(req, env, origin);
      if (path === "/admin/stats" && req.method === "GET") return await handleStats(req, env, origin);
    } catch (e) {
      return reply({ error: "server", detail: String(e && e.message || e).slice(0, 200) }, 500, origin);
    }
    if (path !== "/" || req.method !== "POST") return reply({ error: "method" }, 405, origin);

    let body;
    try { body = await req.json(); } catch { return reply({ error: "bad_json" }, 400, origin); }
    const text = typeof body.text === "string" ? body.text.trim().slice(0, MAX_TEXT) : "";
    if (!text) return reply({ error: "empty" }, 400, origin);
    const lang = LANG_NAME[body.lang] ? body.lang : "en";
    const ships = (Array.isArray(body.ships) ? body.ships : [])
      .slice(0, MAX_SHIPS)
      .filter(s => s && typeof s.id === "string" && typeof s.name === "string")
      .map(s => ({ id: s.id.slice(0, 40), name: s.name.slice(0, 60) }));

    try {
      const out = await env.AI.run(MODEL, {
        messages: buildMessages(text, lang, ships),
        response_format: { type: "json_schema", json_schema: SCHEMA },
        max_tokens: 300,
      });
      // JSON 모드 답은 { response: {...} } (모델에 따라 문자열일 수도 있음)
      let j = out && out.response;
      if (typeof j === "string") j = JSON.parse(j);
      if (!j || typeof j !== "object") throw new Error("no json");
      return reply(clean(j, ships), 200, origin);
    } catch (e) {
      // 무료 한도 초과, "JSON Mode couldn't be met" 등 → 페이지가 단어 찾기로 넘어감
      return reply({ error: "ai_failed", detail: String(e && e.message || e).slice(0, 200) }, 502, origin);
    }
  },
};
