/* 날씨 자동 반영 (기상청 단기예보·초단기실황)
   담당: ③ AI·동선

   하는 일
   - 고른 날짜(state.cdate)와 크루즈(state.ship)의 "관광 시간대"(입항 1시간 뒤 ~ 출항 2시간 전)
     시간별 예보를 보고 state.a.weather 를 sun / rain / hot / cold 중 하나로 자동으로 넣음.
     → 09-engine.js 의 score()·plan(), 12-result.js 의 날씨 안내가 그대로 이 값을 씀.
   - 결과 화면 선호도 칩 위에 "영도 날씨 예보" 상자를 띄움 (지금 실황 + 관광 시간대 예보 + 직접 고르기).
   - 사용자가 직접 고르거나 "AI에게 말로 물어보기"에서 날씨를 말했으면 그 값이 우선이고, 자동으로 덮어쓰지 않음.

   데이터
   - weather.json: GitHub Actions(.github/workflows/weather.yml)가 1시간마다
     기상청 API허브에서 받아 만들어 두는 파일 (scripts/fetch-weather.mjs). 인증키는 앱에 들어가지 않음.
     형태: {updated, base, grid:{nx,ny}, now:{at,t,mm,pty,w,reh}, hourly:{"YYYY-MM-DDTHH:00":{t,p,pty,mm,sno,sky,w,reh}}}
   - 단기예보는 약 3일 뒤까지. 그보다 먼 날짜나 불러오기 실패 시에는 weather 를 비워 두어
     맑음 기준으로 계산함(기존 동작과 같음).

   붙이는 법
   - index.html 에서 14-start.js 다음 줄에 <script src="15-weather.js"></script>
     (12-result.js 의 renderResult, 07-ai.js 의 fillDefaults 를 감싸서 쓰므로 그 둘보다 뒤에 있어야 함) */

const WX_FILE="weather.json";
const WX_STALE=12*3600e3; // 12시간 넘게 갱신 안 된 파일은 믿지 않음 (Actions가 멈춘 경우)
// 분류 기준 (관광 시간대 중 가장 나쁜 값 기준)
const WX_RULE={
  rainProb:60,  // 강수확률 최대 60% 이상 → rain
  rainMm:1,     // 시간대 강수량 합 1mm 이상 → rain
  wetProb:40,   // 강수형태(비·눈·소나기) 예보가 있고 확률 40% 이상 → rain
  hotTemp:30,   // 기온 최고 30° 이상 → hot
  coldFeel:5,   // 체감온도(바람 반영) 최저 5° 이하 → cold
  windMs:9      // 바람 9m/s 이상 → cold (엔진의 cold = "추움·바람")
};
let WXD=null,WXNOW=null,wxState="idle"; // wxState: idle | loading | ok | fail

const WXT={
ko:{h:"영도 날씨 예보",span:(a,b)=>`관광 시간 ${a}–${b}`,line:s=>`${s.tMin}~${s.tMax}° · 비 올 확률 ${s.p}% · 바람 ${Math.round(s.wind)}m/s`,
  now:(t,h)=>`지금 영도 ${t}° (${h} 관측)`,
  auto:w=>`'${w}' 날씨로 동선에 반영했어요`,user:w=>`직접 고른 '${w}' 날씨로 반영 중이에요`,
  loading:"날씨 예보를 불러오는 중이에요…",fail:"날씨 예보를 불러오지 못해 맑은 날 기준으로 짰어요.",range:"이 날짜는 아직 예보가 없어서(약 3일 앞까지만 제공) 맑은 날 기준으로 짰어요.",
  pick:"날씨 직접 고르기",autoBtn:"자동",src:"출처: 기상청 단기예보·초단기실황 (기상청 API허브)"},
en:{h:"Yeongdo forecast",span:(a,b)=>`Your time ashore ${a}–${b}`,line:s=>`${s.tMin}–${s.tMax}° · ${s.p}% chance of rain · wind ${Math.round(s.wind)} m/s`,
  now:(t,h)=>`Now in Yeongdo ${t}° (observed ${h})`,
  auto:w=>`Route adjusted for "${w}"`,user:w=>`Using the weather you picked: "${w}"`,
  loading:"Loading the forecast…",fail:"Couldn't load the forecast, so the route assumes fair weather.",range:"No forecast for this date yet (about 3 days ahead only), so the route assumes fair weather.",
  pick:"Set weather yourself",autoBtn:"Auto",src:"Source: Korea Meteorological Administration short-range forecast"},
ja:{h:"影島の天気予報",span:(a,b)=>`観光時間 ${a}–${b}`,line:s=>`${s.tMin}〜${s.tMax}° · 降水確率 ${s.p}% · 風 ${Math.round(s.wind)}m/s`,
  now:(t,h)=>`いまの影島 ${t}°（${h} 観測）`,
  auto:w=>`「${w}」としてルートに反映しました`,user:w=>`選んだ天気「${w}」で反映中です`,
  loading:"天気予報を読み込み中…",fail:"天気予報を読み込めなかったため、晴れの日を前提にしました。",range:"この日付はまだ予報がないため（約3日先まで）、晴れの日を前提にしました。",
  pick:"天気を自分で選ぶ",autoBtn:"自動",src:"出典：韓国気象庁 短期予報・実況"},
zh:{h:"影岛天气预报",span:(a,b)=>`游览时间 ${a}–${b}`,line:s=>`${s.tMin}~${s.tMax}° · 降雨概率 ${s.p}% · 风速 ${Math.round(s.wind)}m/s`,
  now:(t,h)=>`影岛现在 ${t}°（${h} 观测）`,
  auto:w=>`已按"${w}"调整路线`,user:w=>`正在使用您选择的天气："${w}"`,
  loading:"正在加载天气预报…",fail:"无法加载天气预报，路线按晴天安排。",range:"该日期暂无预报（仅提供约3天内），路线按晴天安排。",
  pick:"自己选择天气",autoBtn:"自动",src:"来源：韩国气象厅 短期预报·实况"}};
const WX_ICON={sun:"☀️",rain:"🌧️",hot:"🔥",cold:"🌬️"};

(function injectWxCSS(){
  if(document.getElementById("wx-auto-css"))return;
  const st=document.createElement("style");st.id="wx-auto-css";
  st.textContent=`
.wxauto{display:flex;flex-direction:column;gap:6px;padding:12px 14px;border-radius:14px;background:rgba(13,74,92,.06);border:1px solid rgba(13,74,92,.15);font-size:14px}
.wxauto b{font-size:14.5px}
.wxa-now{font-size:13.5px;opacity:.85}
.wxa-st{font-weight:600;color:var(--sea,#0d4a5c)}
.wxa-pick{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin-top:2px}
.wxa-pick>span{font-size:12.5px;opacity:.7;margin-right:2px}
.wxa-pick button{font:inherit;font-size:12.5px;padding:5px 11px;min-height:32px;border-radius:999px;border:1px solid rgba(13,74,92,.25);background:transparent;color:inherit;cursor:pointer}
.wxa-pick button[aria-pressed="true"]{background:var(--sea,#0d4a5c);border-color:transparent;color:#fff}
.wxauto small{font-size:11.5px;opacity:.6}`;
  document.head.appendChild(st);
})();

/* ---------- weather.json 불러오기 ---------- */
async function loadWeather(){
  if(wxState==="loading")return;
  wxState="loading";
  try{
    const ctl=new AbortController(),tm=setTimeout(()=>ctl.abort(),6000);
    const r=await fetch(WX_FILE+"?v="+Date.now(),{signal:ctl.signal});clearTimeout(tm);
    if(!r.ok)throw new Error("weather "+r.status);
    const j=await r.json();
    if(!j||!j.hourly||typeof j.hourly!=="object")throw new Error("weather format");
    if(Date.now()-new Date(j.updated).getTime()>WX_STALE)throw new Error("weather stale");
    WXD=j.hourly;
    // 실황은 3시간 넘게 지난 값이면 보여주지 않음
    WXNOW=j.now&&typeof j.now.t==="number"&&Date.now()-new Date(j.now.at+":00+09:00").getTime()<3*3600e3?j.now:null;
    wxState="ok";
  }catch(e){wxState="fail"}
  // 결과 화면을 보고 있는 중에 예보가 도착했으면 다시 계산 (render()는 맨 위로 스크롤하므로 쓰지 않음)
  if(state.screen==="result"&&state.a.wxSrc!=="user"){
    parkNaverMap();renderResult(document.getElementById("screen"),document.getElementById("actions"));
  }
}

/* ---------- 관광 시간대 계산과 분류 ---------- */
function wxWindow(){
  const c=CRUISES.find(x=>x.id===state.ship);if(!c)return null;
  const day=state.cdate||ymdOf(new Date());
  const from=c.arr+DEPART_AFTER,to=Math.max(from+60,c.dep-RETURN_BEFORE); // 09-engine.js 와 같은 기준
  const base=new Date(day+"T00:00"),hours=[];
  for(let m=Math.floor(from/60)*60;m<to;m+=60){
    const d=new Date(+base+m*6e4);
    hours.push(`${ymdOf(d)}T${String(d.getHours()).padStart(2,"0")}:00`);
  }
  return {from,to,hours};
}
// 체감온도: 기상청 겨울철 체감온도식 (기온 10° 이하, 풍속 1.3m/s 이상일 때만 바람 반영)
function feelTemp(t,w){
  if(typeof t!=="number")return null;
  if(t>10||typeof w!=="number"||w<1.3)return t;
  const v=Math.pow(w*3.6,0.16);
  return 13.12+0.6215*t-11.37*v+0.3965*t*v;
}
function wxCat(s){
  if(s.p>=WX_RULE.rainProb||s.mm>=WX_RULE.rainMm||(s.wet&&s.p>=WX_RULE.wetProb))return "rain";
  if(s.tMaxRaw>=WX_RULE.hotTemp)return "hot";
  if(s.feelMin<=WX_RULE.coldFeel||s.wind>=WX_RULE.windMs)return "cold";
  return "sun";
}
function wxSummary(){
  const w=wxWindow();if(!w)return null;
  if(wxState!=="ok"||!WXD)return {w,status:wxState==="fail"?"fail":"loading"};
  const rows=w.hours.map(k=>WXD[k]).filter(Boolean);
  if(!rows.length)return {w,status:"range"};
  const vals=k=>rows.map(r=>r[k]).filter(v=>typeof v==="number");
  const mx=k=>{const v=vals(k);return v.length?Math.max(...v):0},mn=k=>{const v=vals(k);return v.length?Math.min(...v):0};
  const feels=rows.map(r=>feelTemp(r.t,r.w)).filter(v=>typeof v==="number");
  const s={w,status:"ok",tMin:Math.round(mn("t")),tMax:Math.round(mx("t")),tMaxRaw:mx("t"),
    feelMin:feels.length?Math.min(...feels):99,p:Math.round(mx("p")),
    mm:vals("mm").reduce((n,v)=>n+v,0),wind:mx("w"),wet:rows.some(r=>r.pty>0)};
  s.cat=wxCat(s);
  return s;
}
// 사용자가 직접 고른 날씨가 아니면 예보로 state.a.weather 를 채움
function applyAutoWeather(){
  const s=wxSummary();
  if(state.a.wxSrc==="user")return s;
  state.a.wxSrc="auto";
  state.a.weather=s&&s.status==="ok"?s.cat:null; // 예보가 없으면 비워 둠 → 엔진은 맑음으로 계산
  return s;
}

/* ---------- 결과 화면 날씨 상자 ---------- */
function wxBoxHTML(s){
  if(!s)return "";
  const W=WXT[state.lang]||WXT.en,x=t(),user=state.a.wxSrc==="user",cur=state.a.weather||"sun";
  const st=user?W.user(x.wx[cur]):s.status==="ok"?W.auto(x.wx[s.cat]):W[s.status];
  const icon=s.status==="ok"||user?WX_ICON[user?cur:s.cat]+" ":"";
  // 실황은 고른 날짜가 오늘일 때만 보여줌
  const isToday=(state.cdate||ymdOf(new Date()))===ymdOf(new Date());
  const now=WXNOW&&isToday?`<span class="wxa-now">${W.now(Math.round(WXNOW.t),WXNOW.at.slice(11,16))}</span>`:"";
  const opts=["auto","sun","rain","hot","cold"].map(k=>{
    const on=k==="auto"?!user:user&&cur===k;
    return `<button type="button" data-wxset="${k}" aria-pressed="${on}">${k==="auto"?W.autoBtn:WX_ICON[k]+" "+esc(x.wx[k])}</button>`;
  }).join("");
  return `<div class="wxauto" role="note">
    <b>${W.h} · ${W.span(hmD(s.w.from),hmD(s.w.to))}</b>
    ${now}
    ${s.status==="ok"?`<span>${W.line(s)}</span>`:""}
    <span class="wxa-st">${icon}${esc(st)}</span>
    <div class="wxa-pick" role="group" aria-label="${esc(W.pick)}"><span>${W.pick}</span>${opts}</div>
    <small>${W.src}</small></div>`;
}

/* ---------- 기존 함수 감싸기 (다른 파일 수정 없이 연결) ---------- */
(function hookWeather(){
  // 결과를 그리기 직전에 날씨를 채우고, 그린 뒤 날씨 상자를 끼워 넣음
  const origRender=renderResult;
  renderResult=function(s,a){
    const info=applyAutoWeather();
    origRender(s,a);
    const chips=s.querySelector(".chips");
    if(chips)chips.insertAdjacentHTML("beforebegin",wxBoxHTML(info));
    s.querySelectorAll("[data-wxset]").forEach(b=>b.onclick=()=>{
      const v=b.dataset.wxset;
      if(v==="auto")state.a.wxSrc="auto";else{state.a.weather=v;state.a.wxSrc="user"}
      parkNaverMap();renderResult(s,a);
      const nb=s.querySelector(`[data-wxset="${v}"]`);if(nb)nb.focus();
    });
  };
  // AI 입력에 날씨가 들어 있었을 때만 "사용자가 고른 날씨"로 표시 (없으면 fillDefaults 가 넣은 sun 은 자동으로 덮어씀)
  const origFill=fillDefaults;
  fillDefaults=function(a){const r=origFill(a);r.wxSrc=a&&a.weather?"user":"auto";return r};
})();

loadWeather();
