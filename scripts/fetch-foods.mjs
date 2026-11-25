// 영도 맛집 목록(foods.json)을 한국관광공사 TourAPI(공공데이터포털)에서 받아 만든다.
// GitHub Actions(.github/workflows/foods.yml)가 매일 새벽 실행한다.
// 실행: TOURAPI_KEY=발급받은키 node scripts/fetch-foods.mjs
// 키는 공개 저장소에 적지 않는다. GitHub 저장소 Settings → Secrets → TOURAPI_KEY 에 넣는다.
// 받은 가게가 10곳보다 적거나 오류가 나면 기존 foods.json을 바꾸지 않는다.
// 전화번호는 페이지에서 쓰지 않으므로 저장하지 않는다.

import { writeFile } from "node:fs/promises";

const KEY = process.env.TOURAPI_KEY;
if (!KEY) {
  console.error("TOURAPI_KEY 가 없습니다.");
  process.exit(1);
}

const BASE = "https://apis.data.go.kr/B551011/KorService2/areaBasedList2";
const COMMON = { MobileOS: "ETC", MobileApp: "yeongdo_root", _type: "json", contentTypeId: "39", arrange: "C", numOfRows: "100" };
// 부산 영도구: 법정동 코드 26(부산) · 200(영도구). 안 되면 예전 지역 코드 6 · 14로 한 번 더 시도.
const AREAS = [{ lDongRegnCd: "26", lDongSignguCd: "200" }, { areaCode: "6", sigunguCode: "14" }];

async function getPage(area, pageNo) {
  const qs = new URLSearchParams({ ...COMMON, ...area, pageNo: String(pageNo) });
  // serviceKey는 이미 인코딩된 키를 그대로 붙인다 (두 번 인코딩 방지)
  const url = `${BASE}?serviceKey=${KEY}&${qs}`;
  const res = await fetch(url);
  const text = await res.text();
  let j;
  try { j = JSON.parse(text); } catch { throw new Error(`JSON 아님 (HTTP ${res.status}): ${text.slice(0, 200)}`); }
  const body = j?.response?.body;
  if (!body) throw new Error(`응답 형식 오류: ${text.slice(0, 200)}`);
  let items = body.items?.item ?? [];
  if (!Array.isArray(items)) items = [items];
  return { items, total: Number(body.totalCount) || 0 };
}

async function getAll(area) {
  const all = [];
  for (let p = 1; p <= 20; p++) {
    const { items, total } = await getPage(area, p);
    all.push(...items);
    if (!items.length || all.length >= total) break;
  }
  return all;
}

// 페이지의 분류(FCAT_ORDER)에 맞춘다. 이름 단서가 먼저, 그다음 관광공사 분류 코드.
const BY_NAME = [
  [/카페|커피|coffee|cafe|티룸|찻집|디저트/i, "cafe"],
  [/베이커리|빵|제과|bakery/i, "bakery"],
  [/돼지국밥/, "pork"],
  [/밀면/, "mil"],
  [/회|횟집|수산|해녀|해물|조개|복국|장어|생선|활어|대게|아구|아귀/, "sea"],
  [/떡볶이|분식|김밥/, "snack"],
  [/치킨|피자/i, "chick"],
  [/이자카야|주점|포차|bar|펍|pub|와인/i, "bar"],
  [/스시|초밥|일식|라멘|돈카츠|돈까스|우동|izakaya/i, "jp"],
  [/반점|짬뽕|중식|중화|마라/, "cn"],
  [/파스타|스테이크|이탈리안|레스토랑|브런치|버거/i, "west"],
];
const BY_CAT3 = { A05020100: "kr", A05020200: "west", A05020300: "jp", A05020400: "cn", A05020900: "cafe" };

function category(it) {
  const name = String(it.title || "");
  for (const [re, c] of BY_NAME) if (re.test(name)) return c;
  return BY_CAT3[it.cat3] || "kr";
}

let raw = [];
for (const area of AREAS) {
  try {
    raw = await getAll(area);
    console.log(`${JSON.stringify(area)} → ${raw.length}곳`);
  } catch (e) {
    console.error(`${JSON.stringify(area)} 실패: ${e.message}`);
    raw = [];
  }
  if (raw.length) break;
}

const seen = new Set();
const items = raw
  .filter((it) => /영도/.test(`${it.addr1 || ""} ${it.addr2 || ""}`))
  .map((it) => ({
    id: String(it.contentid),
    name: String(it.title || "").trim(),
    cat: category(it),
    addr: `${it.addr1 || ""} ${it.addr2 || ""}`.trim(),
    lat: Number(it.mapy) || null,
    lng: Number(it.mapx) || null,
  }))
  .filter((x) => x.name && !seen.has(x.id) && seen.add(x.id));

if (items.length < 10) {
  console.error(`영도 음식점이 ${items.length}곳뿐이라 foods.json을 바꾸지 않습니다.`);
  process.exit(1);
}

const out = { updated: new Date().toISOString(), source: "한국관광공사 TourAPI (공공데이터포털)", items };
await writeFile(new URL("../foods.json", import.meta.url), JSON.stringify(out, null, 1) + "\n", "utf8");
console.log(`foods.json 저장: ${items.length}곳`);
