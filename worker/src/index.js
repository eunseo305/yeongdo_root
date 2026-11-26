/* 영도 동선 "AI에게 말로 물어보기" 중계 서버
   페이지(js/07-ai.js)가 적은 글을 보내면 Workers AI로 질문 답(JSON)을 뽑아 돌려줌.
   프롬프트는 여기서만 만듦 → 이 주소를 아무 AI 질문에나 쓰는 걸 막음.
   Workers Free는 하루 무료 한도(10,000 Neurons)를 넘으면 요금 없이 실패만 함 → 페이지는 단어 찾기로 넘어감 */

const MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast"; // JSON 모드 지원 모델 중 가장 크고 다국어에 강함
const MAX_TEXT = 500;   // 글 길이 제한
const MAX_SHIPS = 40;   // 크루즈 목록 길이 제한

const NAT = ["ja", "zh", "tw", "us", "kr", "other"];
const COMP = ["solo", "couple", "friends", "family", "care", "both"];
const INTERESTS = ["food", "cafe", "photo", "view", "culture", "beauty", "activity"];
const WEATHER = ["sun", "rain", "hot", "cold"];
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
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Vary": "Origin",
    },
  });
}

function buildMessages(text, lang, ships) {
  const system = `You read what a cruise passenger who just got off the ship at Busan's Yeongdo cruise terminal wrote about their day, and fill a JSON object.
Only fill what they actually said or clearly implied; do not guess (use null or [] instead).
- nat: one of ${NAT.join(", ")}, or null if not said
- comp: one of ${COMP.join(", ")}, or null (family = travelling with children; care = travelling with older adults or someone with limited mobility, e.g. elderly parents, wheelchair, trouble walking; both = children and older adults or someone with limited mobility together)
- interests: array from ${INTERESTS.join(", ")} (beauty = shopping, cosmetics, Daiso, Olive Young, department store; activity = zipline, Danubi train, fishing village experience)
- weather: one of ${WEATHER.join(", ")}, or null
- ship: one of ${ships.length ? ships.map(s => `${s.id} (${s.name})`).join(", ") : "(none)"}, or null if not named
- note: one warm sentence in ${LANG_NAME[lang] || "English"}, under 30 words, saying what you understood they want for today. No place names.${lang === "ko" ? " Write it in natural Korean using Hangul only (no Chinese characters)." : ""}
Rules:
- interests: include only interests the text actually mentions. Do not add any that are not mentioned.
- A market (시장, 市場, 市场) means food, not culture or beauty.
- Mentioning parents, grandparents, elderly people, or not being able to walk much means comp = care (or both if children also come).
- Mentioning rain means weather = rain.
The text may be in Korean, Japanese, Chinese or English.`;
  // 예시 한 쌍: 작은 모델이 규칙을 더 잘 따르게 함
  const exUser = "부모님이랑 왔어요. 해산물 좋아하고 많이 못 걸어요. 비가 와요.";
  const exAnswer = JSON.stringify({ nat: null, comp: "care", interests: ["food"], weather: "rain", ship: null, note: lang === "ko" ? "부모님과 무리 없이 다니며 맛있는 해산물을 즐기는 하루를 원하시는군요." : "You'd like an easy day with your parents enjoying seafood." });
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
    weather: { type: ["string", "null"] },
    ship: { type: ["string", "null"] },
    note: { type: "string" },
  },
  required: ["nat", "comp", "interests", "weather", "ship", "note"],
};

// 모델 답을 허용된 값만 남겨서 정리 (페이지에서도 한 번 더 검사함)
function clean(j, ships) {
  const ok = (v, list) => (list.includes(v) ? v : null);
  return {
    nat: ok(j.nat, NAT),
    comp: ok(j.comp, COMP),
    interests: Array.isArray(j.interests) ? [...new Set(j.interests.filter(v => INTERESTS.includes(v)))] : [],
    weather: ok(j.weather, WEATHER),
    ship: ok(j.ship, ships.map(s => s.id)),
    note: typeof j.note === "string" ? j.note.slice(0, 200) : "",
  };
}

export default {
  async fetch(req, env) {
    const origin = allowedOrigin(req, env);
    if (req.method === "OPTIONS") return reply({}, origin ? 204 : 403, origin);
    if (!origin) return reply({ error: "origin" }, 403, null);
    if (req.method !== "POST") return reply({ error: "method" }, 405, origin);

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
