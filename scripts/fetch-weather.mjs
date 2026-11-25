/* 영도 크루즈터미널 날씨 → weather.json
   GitHub Actions(.github/workflows/weather.yml)가 1시간마다 실행합니다.

   - 기상청 API허브 단기예보(getVilageFcst): 시간별 예보 약 3일치 → hourly
   - 기상청 API허브 초단기실황(getUltraSrtNcst): 지금 관측값 → now
   - 인증키는 환경변수 KMA_AUTH_KEY (GitHub Secrets)에서만 읽고, 파일·로그에는 절대 쓰지 않습니다.
   - 오늘 이미 지난 시간의 예보는 이전 weather.json에서 가져와 함께 남깁니다.

   로컬 실행: KMA_AUTH_KEY=... node scripts/fetch-weather.mjs */

import { readFile, writeFile } from "node:fs/promises";

const KEY = process.env.KMA_AUTH_KEY;
if (!KEY) { console.error("KMA_AUTH_KEY 환경변수가 없습니다."); process.exit(1); }

const OUT = "weather.json";
const BASE = "https://apihub.kma.go.kr/api/typ02/openApi/VilageFcstInfoService_2.0";
const TERMINAL = { lat: 35.0756, lon: 129.0789 }; // 05-travel.js 의 COORD.T

/* 위경도 → 기상청 격자(nx, ny). 기상청 공개 LCC 변환식 (터미널 = 98, 73) */
function toGrid(lat, lon) {
  const RE = 6371.00877, GRID = 5.0, SLAT1 = 30, SLAT2 = 60, OLON = 126, OLAT = 38, XO = 43, YO = 136, D = Math.PI / 180;
  const re = RE / GRID, s1 = SLAT1 * D, s2 = SLAT2 * D, olon = OLON * D, olat = OLAT * D;
  let sn = Math.tan(Math.PI * 0.25 + s2 * 0.5) / Math.tan(Math.PI * 0.25 + s1 * 0.5);
  sn = Math.log(Math.cos(s1) / Math.cos(s2)) / Math.log(sn);
  let sf = Math.tan(Math.PI * 0.25 + s1 * 0.5); sf = Math.pow(sf, sn) * Math.cos(s1) / sn;
  let ro = Math.tan(Math.PI * 0.25 + olat * 0.5); ro = re * sf / Math.pow(ro, sn);
  let ra = Math.tan(Math.PI * 0.25 + lat * D * 0.5); ra = re * sf / Math.pow(ra, sn);
  let th = lon * D - olon; if (th > Math.PI) th -= 2 * Math.PI; if (th < -Math.PI) th += 2 * Math.PI; th *= sn;
  return { nx: Math.floor(ra * Math.sin(th) + XO + 0.5), ny: Math.floor(ro - ra * Math.cos(th) + YO + 0.5) };
}
const { nx, ny } = toGrid(TERMINAL.lat, TERMINAL.lon);

/* 한국 시간(KST) 다루기: Actions 서버는 UTC 이므로 9시간을 더한 "가짜 UTC" 로 계산 */
const kstNow = () => new Date(Date.now() + 9 * 3600e3);
const pad = n => String(n).padStart(2, "0");
const ymd = d => `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}`;
const key = (date, time) => `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}T${time.slice(0, 2)}:00`;

/* 단기예보 발표 시각 후보: 02·05·08·11·14·17·20·23시, 발표 10분 뒤부터 조회 가능. 최신 것부터 3개 */
function vilageBases() {
  const now = kstNow(), out = [];
  const t = new Date(now.getTime() - 10 * 60e3); // 10분 여유
  for (let back = 0; out.length < 3 && back < 48; back++) {
    const d = new Date(t.getTime() - back * 3600e3);
    const h = d.getUTCHours();
    if ([2, 5, 8, 11, 14, 17, 20, 23].includes(h)) {
      const b = { date: ymd(d), time: pad(h) + "00" };
      if (!out.some(x => x.date === b.date && x.time === b.time)) out.push(b);
    }
  }
  return out;
}
/* 초단기실황: 매시 정각 자료, 40분 뒤부터 조회 가능. 최신 것부터 3개 */
function ncstBases() {
  const t = new Date(kstNow().getTime() - 40 * 60e3), out = [];
  for (let back = 0; back < 3; back++) {
    const d = new Date(t.getTime() - back * 3600e3);
    out.push({ date: ymd(d), time: pad(d.getUTCHours()) + "00" });
  }
  return out;
}

async function call(op, base, rows) {
  const q = new URLSearchParams({ pageNo: "1", numOfRows: String(rows), dataType: "JSON",
    base_date: base.date, base_time: base.time, nx: String(nx), ny: String(ny), authKey: KEY });
  const ctl = new AbortController(), tm = setTimeout(() => ctl.abort(), 20000);
  let res;
  try { res = await fetch(`${BASE}/${op}?${q}`, { signal: ctl.signal }); }
  finally { clearTimeout(tm); }
  const text = await res.text();
  if (res.status === 401) throw new Error(`${op}: 인증키가 올바르지 않습니다 (401)`);
  if (res.status === 403) throw new Error(`${op}: 이 API를 활용신청하지 않았습니다 (403)`);
  if (!res.ok) throw new Error(`${op}: HTTP ${res.status}`);
  let j;
  try { j = JSON.parse(text); } catch { throw new Error(`${op}: JSON이 아닌 응답 (${text.slice(0, 80).replace(/\s+/g, " ")})`); }
  const h = j?.response?.header;
  if (h?.resultCode !== "00") throw new Error(`${op}: ${h?.resultCode} ${h?.resultMsg}`);
  return j.response.body?.items?.item || [];
}
async function firstOk(op, bases, rows) {
  let last;
  for (const b of bases) {
    try { const items = await call(op, b, rows); if (items.length) return { base: b, items }; }
    catch (e) { last = e; console.warn(`  ${op} ${b.date} ${b.time} 실패: ${e.message}`); if (/401|403/.test(e.message)) throw e; }
  }
  throw last || new Error(`${op}: 자료 없음`);
}

/* 강수량 문자열 → mm 숫자 ("강수없음", "1mm 미만", "30.0~50.0mm", "50.0mm 이상") */
function pcpMm(v) {
  if (v == null) return null;
  const s = String(v);
  if (s.includes("없음")) return 0;
  if (s.includes("미만")) return 0.5;
  const n = parseFloat(s.replace(/[^0-9.]/g, " ").trim().split(/\s+/)[0]);
  return Number.isFinite(n) ? n : null;
}
const num = v => { const n = parseFloat(v); return Number.isFinite(n) ? n : null; };

async function main() {
  console.log(`격자 nx=${nx}, ny=${ny}`);
  let prev = null;
  try { prev = JSON.parse(await readFile(OUT, "utf8")); } catch {}

  // 1) 단기예보 (시간별)
  const vf = await firstOk("getVilageFcst", vilageBases(), 2000);
  const hourly = {}, daily = {};
  for (const it of vf.items) {
    // 일 최저(TMN)·최고(TMX) 기온은 날짜별로 따로 모음
    if (it.category === "TMN" || it.category === "TMX") {
      const dk = key(it.fcstDate, "0000").slice(0, 10), d = daily[dk] || (daily[dk] = {});
      d[it.category === "TMN" ? "tmn" : "tmx"] = num(it.fcstValue);
      continue;
    }
    const k = key(it.fcstDate, it.fcstTime);
    const h = hourly[k] || (hourly[k] = {});
    const v = it.fcstValue;
    switch (it.category) {
      case "TMP": h.t = num(v); break;          // 기온 ℃
      case "POP": h.p = num(v); break;          // 강수확률 %
      case "PTY": h.pty = num(v); break;        // 강수형태 0 없음 1 비 2 비/눈 3 눈 4 소나기
      case "PCP": h.mm = pcpMm(v); break;       // 1시간 강수량 mm
      case "SNO": h.sno = String(v).includes("없음") ? 0 : num(v); break; // 1시간 신적설 cm
      case "SKY": h.sky = num(v); break;        // 하늘 1 맑음 3 구름많음 4 흐림
      case "WSD": h.w = num(v); break;          // 풍속 m/s
      case "REH": h.reh = num(v); break;        // 습도 %
    }
  }
  // 오늘 이미 지난 시간(새 예보에 없는 시간)은 이전 파일에서 가져와 남김
  const today = key(ymd(kstNow()), "0000").slice(0, 10);
  if (prev?.hourly) for (const [k, v] of Object.entries(prev.hourly)) if (k.slice(0, 10) >= today && !hourly[k]) hourly[k] = v;
  const sorted = Object.fromEntries(Object.entries(hourly).sort(([a], [b]) => a.localeCompare(b)));
  // 오늘 최저·최고는 새벽 2시 발표에만 들어 있으므로, 새 예보에 없으면 이전 파일 값을 남김
  if (prev?.daily) for (const [k, v] of Object.entries(prev.daily)) if (k >= today) daily[k] = { ...v, ...daily[k] };
  const dailySorted = Object.fromEntries(Object.entries(daily).sort(([a], [b]) => a.localeCompare(b)));

  // 2) 초단기실황 (지금) — 실패해도 예보만으로 저장
  let now = null;
  try {
    const nc = await firstOk("getUltraSrtNcst", ncstBases(), 20);
    now = { at: key(nc.base.date, nc.base.time) };
    for (const it of nc.items) {
      const v = it.obsrValue;
      if (it.category === "T1H") now.t = num(v);      // 기온
      if (it.category === "RN1") now.mm = num(v);     // 1시간 강수량
      if (it.category === "PTY") now.pty = num(v);    // 강수형태
      if (it.category === "WSD") now.w = num(v);      // 풍속
      if (it.category === "REH") now.reh = num(v);    // 습도
    }
  } catch (e) { console.warn(`초단기실황 건너뜀: ${e.message}`); now = prev?.now || null; }

  const out = {
    updated: new Date().toISOString(),
    source: "기상청 API허브 단기예보·초단기실황",
    grid: { nx, ny },
    base: key(vf.base.date, vf.base.time),
    now,
    daily: dailySorted,
    hourly: sorted
  };
  await writeFile(OUT, JSON.stringify(out) + "\n");
  console.log(`저장: 예보 ${Object.keys(sorted).length}시간 (발표 ${out.base}), 실황 ${now?.at || "없음"}`);
}

main().catch(e => { console.error(e.message); process.exit(1); });
