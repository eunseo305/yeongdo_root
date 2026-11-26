/* 오늘 영도 날씨 → 동선 반영 (기상청 단기예보·초단기실황)
   담당: ③ AI·동선

   하는 일
   - 크루즈 날짜(state.cdate, 고르지 않았으면 "오늘" 한국 시간)의 영도 날씨를 결과 화면 선호도 칩 위에 보여줌:
     최고·최저 기온, 강수량(강수확률), 바람, (오늘이면) 지금 실황.
     단기예보는 약 3일 뒤까지만 있어서, 4~10일 뒤는 중기예보(weather.json 의 mid: 최고·최저, 강수확률, 하늘상태)로 보여줌.
     10일보다 먼 날짜는 "예보 없음"으로 안내함.
   - 그날 날씨로 state.a.weather 를 sun / rain / hot / cold 중 하나로 자동으로 넣음. 사용자가 고르는 버튼은 없음.
     → 09-engine.js 의 score()·plan() 이 이 값으로 맑으면 야외, 비 오면 실내 위주로 동선을 짬.
   - 예보를 못 불러오면 날씨를 건드리지 않음 (기본값 맑음으로 계산).

   데이터
   - weather.json: GitHub Actions(.github/workflows/weather.yml)가 1시간마다
     기상청 API허브에서 받아 만들어 두는 파일 (scripts/fetch-weather.mjs). 인증키는 앱에 들어가지 않음.
     형태: {updated, base, grid:{nx,ny}, now:{at,t,mm,pty,w,reh},
            daily:{"YYYY-MM-DD":{tmn,tmx}}, hourly:{"YYYY-MM-DDTHH:00":{t,p,pty,mm,sno,sky,w,reh}}}

   붙이는 법
   - index.html 에서 14-start.js 다음 줄에 <script src="15-weather.js"></script>
     (12-result.js 의 renderResult 를 감싸서 쓰므로 그보다 뒤에 있어야 함) */

const WX_FILE="weather.json";
const WX_STALE=12*3600e3; // 12시간 넘게 갱신 안 된 파일은 믿지 않음 (Actions가 멈춘 경우)
// 동선용 날씨 분류 기준 (오늘 하루 예보 기준. 추움은 관광하는 낮 시간 09~18시만 봄)
const WX_RULE={
  rainProb:60,  // 강수확률 최대 60% 이상 → rain
  rainMm:1,     // 오늘 강수량 합 1mm 이상 → rain
  wetProb:40,   // 강수형태(비·눈·소나기) 예보가 있고 확률 40% 이상 → rain
  hotTemp:30,   // 최고기온 30° 이상 → hot
  coldFeel:5,   // 낮 시간 체감온도(바람 반영) 최저 5° 이하 → cold
  windMs:9,     // 바람 9m/s 이상 → cold (엔진의 cold = "추움·바람")
  midColdMax:7, // 중기예보(4~10일 뒤)는 바람·시간별 기온이 없어서 최고기온 7° 이하면 cold
  dayFrom:9,dayTo:18
};
let WXJ=null,WXNOW=null,wxState="idle"; // wxState: idle | loading | ok | fail

const WXT={
ko:{h:"오늘 영도 날씨",hDay:"영도 날씨",hi:"최고",lo:"최저",rain:"강수량",prob:p=>`강수확률 ${p}%`,wind:"바람",
  now:(t,h)=>`지금 ${t}° (${h} 관측)`,
  cat:{sun:"맑아요 · 야외 명소 위주로 동선을 짰어요",rain:"비 소식이 있어요 · 실내 위주로 동선을 짰어요",
       hot:"더워요 · 한낮엔 실내, 야외는 아침·저녁에 넣었어요",cold:"춥고 바람이 불어요 · 실내·카페 위주로 짰어요"},
  loading:"날씨 예보를 불러오는 중이에요…",fail:"날씨 예보를 불러오지 못해 맑은 날 기준으로 짰어요.",none:"오늘 예보가 아직 없어 맑은 날 기준으로 짰어요.",noneDay:"이 날짜는 아직 예보가 없어요 (기상청 예보는 10일 뒤까지 나와요). 맑은 날 기준으로 짰어요.",
  sky:"하늘",probL:"강수확률",am:"오전",pm:"오후",
  src:"출처: 기상청 단기예보·초단기실황 (기상청 API허브)",srcMid:"출처: 기상청 중기예보 (기상청 API허브) · 하루 단위 예보라 바람·강수량은 없어요"},
en:{h:"Yeongdo weather today",hDay:"Yeongdo weather",hi:"High",lo:"Low",rain:"Rain",prob:p=>`${p}% chance`,wind:"Wind",
  now:(t,h)=>`Now ${t}° (observed ${h})`,
  cat:{sun:"Fair skies · route focuses on outdoor sights",rain:"Rain expected · route focuses on indoor stops",
       hot:"Hot · indoor at midday, outdoor stops early or late",cold:"Cold and windy · route focuses on indoor spots and cafés"},
  loading:"Loading the forecast…",fail:"Couldn't load the forecast, so the route assumes fair weather.",none:"No forecast for today yet, so the route assumes fair weather.",noneDay:"No forecast for this date yet (forecasts cover up to 10 days ahead), so the route assumes fair weather.",
  sky:"Sky",probL:"Rain chance",am:"AM",pm:"PM",
  src:"Source: Korea Meteorological Administration short-range forecast",srcMid:"Source: Korea Meteorological Administration medium-range forecast · daily outlook, no wind or rainfall amounts"},
ja:{h:"今日の影島の天気",hDay:"影島の天気",hi:"最高",lo:"最低",rain:"降水量",prob:p=>`降水確率 ${p}%`,wind:"風",
  now:(t,h)=>`いま ${t}°（${h} 観測）`,
  cat:{sun:"晴れ・屋外の名所を中心にルートを組みました",rain:"雨の予報・屋内を中心にルートを組みました",
       hot:"暑い日・日中は屋内、屋外は朝夕に入れました",cold:"寒くて風が強い・屋内やカフェを中心に組みました"},
  loading:"天気予報を読み込み中…",fail:"天気予報を読み込めなかったため、晴れの日を前提にしました。",none:"今日の予報がまだないため、晴れの日を前提にしました。",noneDay:"この日の予報はまだありません（予報は10日先まで）。晴れの日を前提にしました。",
  sky:"空",probL:"降水確率",am:"午前",pm:"午後",
  src:"出典：韓国気象庁 短期予報・実況",srcMid:"出典：韓国気象庁 中期予報・日単位の予報のため風・降水量はありません"},
zh:{h:"今日影岛天气",hDay:"影岛天气",hi:"最高",lo:"最低",rain:"降水量",prob:p=>`降水概率 ${p}%`,wind:"风速",
  now:(t,h)=>`现在 ${t}°（${h} 观测）`,
  cat:{sun:"晴天·路线以户外景点为主",rain:"有雨·路线以室内为主",
       hot:"炎热·中午安排室内，户外放在早晚",cold:"寒冷有风·路线以室内和咖啡馆为主"},
  loading:"正在加载天气预报…",fail:"无法加载天气预报，路线按晴天安排。",none:"今天暂无预报，路线按晴天安排。",noneDay:"该日期暂无预报（预报最多覆盖未来10天），路线按晴天安排。",
  sky:"天空",probL:"降水概率",am:"上午",pm:"下午",
  src:"来源：韩国气象厅 短期预报·实况",srcMid:"来源：韩国气象厅 中期预报·按日预报，无风速和降水量"}};
// 중기예보 하늘상태(wf) 글자 번역: "구름많고 비" = 하늘(구름많음) + 강수(비)
const WF_SKY={"맑음":{en:"Clear",ja:"晴れ",zh:"晴"},"구름많":{en:"Mostly cloudy",ja:"くもり時々晴れ",zh:"多云"},"흐리":{en:"Overcast",ja:"くもり",zh:"阴"},"흐림":{en:"Overcast",ja:"くもり",zh:"阴"}};
const WF_PCP={"비/눈":{en:"rain/snow",ja:"雨か雪",zh:"雨夹雪"},"소나기":{en:"showers",ja:"にわか雨",zh:"阵雨"},"비":{en:"rain",ja:"雨",zh:"雨"},"눈":{en:"snow",ja:"雪",zh:"雪"}};
function wfText(wf,L){
  if(!wf||L==="ko")return wf||"";
  const sk=Object.keys(WF_SKY).find(k=>wf.startsWith(k)),pc=Object.keys(WF_PCP).find(k=>wf.includes(k));
  if(!sk)return wf;
  const a=WF_SKY[sk][L]||WF_SKY[sk].en,b=pc?(WF_PCP[pc][L]||WF_PCP[pc].en):"";
  return b?`${a}${L==="en"?", ":"・"}${b}`:a;
}
const wfWet=wf=>/비|눈|소나기/.test(wf||"");
const WX_ICON={sun:"☀️",rain:"🌧️",hot:"🔥",cold:"🌬️"};

(function injectWxCSS(){
  if(document.getElementById("wx-auto-css"))return;
  const st=document.createElement("style");st.id="wx-auto-css";
  st.textContent=`
.wxauto{display:flex;flex-direction:column;gap:8px;padding:12px 14px;border-radius:14px;background:rgba(13,74,92,.06);border:1px solid rgba(13,74,92,.15);font-size:14px}
.wxa-hd{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:baseline;gap:4px 10px}
.wxa-hd b{font-size:14.5px}
.wxa-now{font-size:13px;opacity:.8}
.wxa-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}
.wxa-grid div{display:flex;flex-direction:column;align-items:center;gap:1px;padding:7px 4px;border-radius:10px;background:var(--paper,#fff);text-align:center}
.wxa-grid span{font-size:11.5px;opacity:.7}
.wxa-grid strong{font-size:16px;font-variant-numeric:tabular-nums}
.wxa-grid small{font-size:11px;opacity:.65}
.wxa-grid strong.wxa-wf{font-size:13px;line-height:1.25;word-break:keep-all}
.wxa-st{font-weight:600;color:var(--sea,#0d4a5c)}
.wxauto>small{font-size:11.5px;opacity:.6}
@media (max-width:360px){.wxa-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}`;
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
    WXJ=j;
    // 실황은 3시간 넘게 지난 값이면 보여주지 않음
    WXNOW=j.now&&typeof j.now.t==="number"&&Date.now()-new Date(j.now.at+":00+09:00").getTime()<3*3600e3?j.now:null;
    wxState="ok";
  }catch(e){wxState="fail"}
  // 결과 화면을 보고 있는 중에 예보가 도착했으면 다시 계산 (render()는 맨 위로 스크롤하므로 쓰지 않음)
  if(state.screen==="result"){
    parkNaverMap();renderResult(document.getElementById("screen"),document.getElementById("actions"));
  }
}

/* ---------- 고른 날짜 날씨 요약과 분류 ---------- */
// 오늘 날짜는 한국 시간 기준 (예보 키가 한국 시간이므로)
const kstToday=()=>new Date(Date.now()+9*3600e3).toISOString().slice(0,10);
// 날씨를 볼 날짜: 크루즈 날짜를 골랐으면 그날, 아니면 오늘
const wxDay=()=>/^\d{4}-\d{2}-\d{2}$/.test(state.cdate||"")?state.cdate:kstToday();
// 체감온도: 기상청 겨울철 체감온도식 (기온 10° 이하, 풍속 1.3m/s 이상일 때만 바람 반영)
function feelTemp(t,w){
  if(typeof t!=="number")return null;
  if(t>10||typeof w!=="number"||w<1.3)return t;
  const v=Math.pow(w*3.6,0.16);
  return 13.12+0.6215*t-11.37*v+0.3965*t*v;
}
function wxCat(s){
  if(s.p>=WX_RULE.rainProb||s.mm>=WX_RULE.rainMm||(s.wet&&s.p>=WX_RULE.wetProb))return "rain";
  if(s.tMax>=WX_RULE.hotTemp)return "hot";
  if(s.feelMin<=WX_RULE.coldFeel||s.wind>=WX_RULE.windMs)return "cold";
  return "sun";
}
function wxSummary(){
  const day=wxDay();
  if(wxState!=="ok"||!WXJ)return {status:wxState==="fail"?"fail":"loading",day};
  const rows=Object.entries(WXJ.hourly).filter(([k])=>k.slice(0,10)===day).map(([k,v])=>({...v,h:+k.slice(11,13)}));
  const d0=(WXJ.daily||{})[day]||{};
  // 단기예보 끝자락은 다음 날 0시 한 시간치만 들어오는 경우가 있음 (예: 11/30 00시 7° 하나 → 최저·최고 모두 7°).
  // 오늘이 아닌 날은 일 최저·최고(TMN·TMX)가 있거나 낮 시간(09~18시) 예보가 있을 때만 단기예보로 요약하고,
  // 아니면 중기예보 하루 값을 씀
  const enough=day===kstToday()||typeof d0.tmn==="number"||typeof d0.tmx==="number"||
    rows.some(r=>r.h>=WX_RULE.dayFrom&&r.h<=WX_RULE.dayTo);
  if(!rows.length||!enough)return midSummary(day)||{status:day===kstToday()?"none":"noneDay",day};
  if(WXNOW&&WXNOW.at.slice(0,10)===day)rows.push({t:WXNOW.t,w:WXNOW.w,mm:WXNOW.mm,pty:WXNOW.pty,h:+WXNOW.at.slice(11,13)});
  const vals=(k,list=rows)=>list.map(r=>r[k]).filter(v=>typeof v==="number");
  const temps=vals("t"),d=(WXJ.daily||{})[day]||{};
  // 최고·최저는 기상청 일 최고·최저(TMX·TMN)를 먼저 쓰고, 없으면 시간별 기온에서 구함
  const tMax=typeof d.tmx==="number"?Math.max(d.tmx,...temps):Math.max(...temps);
  const tMin=typeof d.tmn==="number"?Math.min(d.tmn,...temps):Math.min(...temps);
  const daytime=rows.filter(r=>r.h>=WX_RULE.dayFrom&&r.h<=WX_RULE.dayTo);
  const feels=(daytime.length?daytime:rows).map(r=>feelTemp(r.t,r.w)).filter(v=>typeof v==="number");
  const s={status:"ok",day,tMax,tMin,
    mm:Math.round(vals("mm").reduce((n,v)=>n+v,0)*10)/10,
    p:Math.max(0,...vals("p")),wind:Math.max(0,...vals("w")),
    feelMin:feels.length?Math.min(...feels):99,wet:rows.some(r=>r.pty>0)};
  s.cat=wxCat(s);
  return s;
}
// 단기예보가 없는 날(4~10일 뒤)은 중기예보 하루 값으로 요약
function midSummary(day){
  const m=(WXJ.mid||{})[day];
  if(!m||typeof m.tmx!=="number"&&typeof m.tmn!=="number")return null;
  const ps=[m.p,m.pAm,m.pPm].filter(v=>typeof v==="number");
  const wfs=[m.wf,m.wfAm,m.wfPm].filter(Boolean);
  const tMax=typeof m.tmx==="number"?m.tmx:m.tmn,tMin=typeof m.tmn==="number"?m.tmn:m.tmx;
  // 강수확률·하늘상태(getMidLandFcst)는 없을 수 있음 → p:null, wf:"" 로 두고 기온만 보여줌
  const s={status:"ok",mid:true,day,tMax,tMin,p:ps.length?Math.max(...ps):null,pAm:m.pAm,pPm:m.pPm,
    wf:wfs.find(wfWet)||m.wfPm||m.wf||m.wfAm||"",wet:wfs.some(wfWet)};
  const p=s.p||0;
  s.cat=p>=WX_RULE.rainProb||(s.wet&&p>=WX_RULE.wetProb)?"rain":s.tMax>=WX_RULE.hotTemp?"hot":s.tMax<=WX_RULE.midColdMax?"cold":"sun";
  return s;
}
// 고른 날짜 예보로 state.a.weather 를 채움. 예보가 없으면 그대로 둠 (엔진은 맑음으로 계산)
function applyAutoWeather(){
  const s=wxSummary();
  if(s.status==="ok")state.a.weather=s.cat;
  return s;
}

/* ---------- 결과 화면 날씨 상자 ---------- */
function wxBoxHTML(s){
  const W=WXT[state.lang]||WXT.en,L=state.lang;
  const day=s.day||kstToday(),isToday=day===kstToday();
  const D=typeof DT!=="undefined"&&(DT[L]||DT.en),x=new Date(day+"T00:00");
  const date=D?D.fmt(x.getMonth()+1,x.getDate(),D.wd[x.getDay()]):day;
  const now=WXNOW&&WXNOW.at.slice(0,10)===day?`<span class="wxa-now">${W.now(Math.round(WXNOW.t),WXNOW.at.slice(11,16))}</span>`:"";
  const head=`<div class="wxa-hd"><b>${isToday?W.h:W.hDay} · ${esc(date)}</b>${now}</div>`;
  if(s.status!=="ok")return `<div class="wxauto" role="note">${head}<span class="wxa-st">${esc(W[s.status])}</span><small>${W.src}</small></div>`;
  const cell=(lbl,val,sub)=>`<div><span>${lbl}</span><strong>${val}</strong>${sub?`<small>${sub}</small>`:""}</div>`;
  if(s.mid){
    const ap=typeof s.pAm==="number"&&typeof s.pPm==="number"?`${W.am} ${Math.round(s.pAm)} · ${W.pm} ${Math.round(s.pPm)}`:"";
    return `<div class="wxauto" role="note">${head}
    <div class="wxa-grid">
      ${cell(W.hi,Math.round(s.tMax)+"°")}
      ${cell(W.lo,Math.round(s.tMin)+"°")}
      ${cell(W.probL,s.p==null?"–":Math.round(s.p)+"%",ap)}
      ${`<div><span>${W.sky}</span><strong class="wxa-wf">${s.wf?esc(wfText(s.wf,L)):"–"}</strong></div>`}
    </div>
    <span class="wxa-st">${WX_ICON[s.cat]} ${esc(W.cat[s.cat])}</span>
    <small>${W.srcMid}</small></div>`;
  }
  return `<div class="wxauto" role="note">${head}
    <div class="wxa-grid">
      ${cell(W.hi,Math.round(s.tMax)+"°")}
      ${cell(W.lo,Math.round(s.tMin)+"°")}
      ${cell(W.rain,s.mm+"mm",W.prob(Math.round(s.p)))}
      ${cell(W.wind,Math.round(s.wind)+"m/s")}
    </div>
    <span class="wxa-st">${WX_ICON[s.cat]} ${esc(W.cat[s.cat])}</span>
    <small>${W.src}</small></div>`;
}

/* ---------- 기존 함수 감싸기 (다른 파일 수정 없이 연결) ---------- */
(function hookWeather(){
  // 결과를 그리기 직전에 오늘 날씨를 채우고, 그린 뒤 날씨 상자를 끼워 넣음
  const origRender=renderResult;
  renderResult=function(s,a){
    const info=applyAutoWeather();
    origRender(s,a);
    // 위쪽 머리말의 "날씨 반영" 줄(없으면 코스 이름) 바로 밑에 끼워 넣음 (내 선택 칩은 터미널 도착 기한 카드 밑 상자로 옮겨 감)
    const at=s.querySelector(".wxbar")||s.querySelector(".course-name");
    if(at)at.insertAdjacentHTML("afterend",wxBoxHTML(info));
  };
})();

loadWeather();
