/* 공통 상태(state)와 도구 함수, 언어 버튼, 화면 전환(render), 첫 화면
   담당: ② 화면 */

const blankA=()=>({nat:null,comp:null,interests:[],weather:null});
let state={resTab:"map",foodCat:"all",foodMore:false,mapFull:false,photosOn:false,photoBig:null,adsOn:false,adSel:null,lang:detectLang(),screen:"home",q:0,a:blankA(),ship:null,rating:0,aiText:"",aiNote:"",aiBusy:false,aiMsg:"",fbSent:false,route:null,customPlaces:[],picking:null,addAt:null,editing:false};
// route: 사용자가 고친 경로(장소 id 순서). null이면 자동 추천 경로
// customPlaces: 사용자가 지도에서 직접 찍어 추가한 장소. picking: 위치 찍는 중인 장소 {name,dwell,at}
// addAt: 일정에서 '＋ 여기에 추가'를 펼친 자리 (null이면 닫힘)
let sampleFn=null;
try{window.claude?.use?.("sample")?.then(s=>{sampleFn=s||null}).catch(()=>{})}catch(e){}

function detectLang(){const l=(navigator.language||"ko").toLowerCase();if(l.startsWith("ja"))return"ja";if(l.startsWith("zh"))return"zh";if(l.startsWith("ko"))return"ko";return"en"}
const t=()=>T[state.lang];
const hm=m=>String(Math.floor(m/60)).padStart(2,"0")+":"+String(m%60).padStart(2,"0");
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const crowdOf=p=>p>=3000?"high":p>=2000?"mid":"low";
const won=n=>"₩"+n.toLocaleString("ko-KR");

function loadReviews(){try{return JSON.parse(localStorage.getItem("yd-reviews")||"[]")}catch(e){return[]}}
function saveReview(r){try{const a=loadReviews();a.unshift(r);localStorage.setItem("yd-reviews",JSON.stringify(a.slice(0,30)))}catch(e){}}

function renderLang(){
  const bar=document.getElementById("langBar");
  bar.innerHTML=LANGS.map(([k,l])=>`<button type="button" id="lang-${k}" aria-pressed="${state.lang===k}" data-l="${k}">${l}</button>`).join("");
  bar.querySelectorAll("button").forEach(b=>b.onclick=()=>{state.lang=b.dataset.l;render()});
  // 로고 글자: 뒷단어(루트·Route·ルート·路线)만 <b>로 감싸 파란색으로 칠함 (css/skin-a.css)
  const bt=t().brand,bm=bt.match(/^(.*[\s島岛])(.+)$/);
  document.getElementById("brandText").innerHTML=bm?`${esc(bm[1])}<b>${esc(bm[2])}</b>`:esc(bt);
  document.documentElement.lang=state.lang==="zh"?"zh-CN":state.lang;
}

const QUESTIONS=["comp","ship","interests"];  // 나라(nat)·연령(age)·날씨(weather) 질문은 뺌. weather가 비어 있으면 맑음으로 계산

function render(){
  parkNaverMap(); // 화면을 바꾸기 전에 지도 상자를 보관함으로 옮김
  renderLang();
  const s=document.getElementById("screen"),a=document.getElementById("actions");
  if(state.screen==="home"){renderHome(s,a)}
  else if(state.screen==="q"){renderQ(s,a)}
  else if(state.screen==="ops"){renderOps(s,a)}
  else{renderResult(s,a)}
  window.scrollTo({top:0});
}

function renderHome(s,a){
  const x=t();
  // 제목의 마지막 덩어리(알차게·sail·たっぷり 등)에 형광펜 밑줄
  const hm1=x.heroT.match(/^(.*[\s、，,])(\S+)$/);
  const heroT=hm1?`${hm1[1]}<em class="hl">${hm1[2]}</em>`:x.heroT;
  // 예시 버튼 아이콘: 가족, 포크·나이프, 우산, 시계
  const CHIP_IC=['<path d="M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6M16 4.3a3.5 3.5 0 0 1 0 6.4M18 14.3c2 .8 3.5 2.8 3.5 5.7"/>',
    '<path d="M6 3v7a2 2 0 0 0 2 2v9M10 3v7a2 2 0 0 1-2 2M6 3v5M8 3v5M17 21V3c-2 0-3.5 2.5-3.5 6s1.5 4 3.5 4"/>',
    '<path d="M12 3a9 9 0 0 1 9 9H3a9 9 0 0 1 9-9zM12 12v7a2 2 0 0 0 4 0"/>',
    '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'];
  s.innerHTML=`
<section class="hero">
  <span class="qr-tag"><svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h3v3h-3zM18 18h3v3h-3z" fill="none" stroke="#fff" stroke-width="2"/></svg>${x.qr}</span>
  <h1>${heroT}</h1>
  <p>${x.heroP}</p>
  <svg class="hero-art" viewBox="0 0 400 110" preserveAspectRatio="xMaxYMax slice" aria-hidden="true">
    <path d="M284 34q4-4 8 0q4-4 8 0M300 22q3-3 6 0q3-3 6 0" fill="none" stroke="#33507a" stroke-width="2" stroke-linecap="round"/>
    <path d="M318 62h82v48h-82z" fill="#8fb7e4"/>
    <path d="M344 62V30l3-6h14l3 6v32z" fill="#fff" stroke="#c9d8ea"/><path d="M344 40h20M344 50h20" stroke="#2f7be8" stroke-width="3"/>
    <rect x="347" y="14" width="14" height="10" rx="2" fill="#bfe0ff" stroke="#2f7be8" stroke-width="2"/><path d="M344 14l10-8 10 8z" fill="#2f7be8"/>
    <path d="M300 100l10-12 10 6 8-10 12 10 10-8 12 12 18-6 20 8v10H300z" fill="#e9eef5" stroke="#d2dbe7"/>
    <path d="M0 78c50-22 110-22 170 0s120 18 230-8v40H0z" fill="#d7e9fc"/>
    <path d="M0 90c60-16 130-14 200 4s140 10 200-6v22H0z" fill="#a9cff8"/>
    <path d="M0 100c70-10 150-8 210 2s130 4 190-4v12H0z" fill="#7fb6f2"/>
  </svg>
</section>
<section class="aibox">
  <h2><span class="ai-ic"><svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M10 3l1.8 5.2L17 10l-5.2 1.8L10 17l-1.8-5.2L3 10l5.2-1.8zM18 2l.8 2.2L21 5l-2.2.8L18 8l-.8-2.2L15 5l2.2-.8z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg></span>${x.ai_h}</h2>
  <label for="aiText" class="muted" style="position:absolute;left:-9999px">${x.ai_h}</label>
  <div class="ai-field">
    <svg class="ai-bubble" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4c5 0 9 3.1 9 7s-4 7-9 7c-1 0-2-.1-3-.4L4.5 20l1-3.6C4 15 3 13.1 3 11c0-3.9 4-7 9-7z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="8.5" cy="11" r="1.1" fill="currentColor"/><circle cx="12" cy="11" r="1.1" fill="currentColor"/><circle cx="15.5" cy="11" r="1.1" fill="currentColor"/></svg>
    <textarea id="aiText" placeholder="${esc(x.ai_ph)}">${esc(state.aiText)}</textarea>
  </div>
  <div class="ai-chips">${(x.ai_chips||[]).map((c,i)=>`<button type="button" data-chip="${esc(c)}"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${CHIP_IC[i]||""}</svg>${esc(c)}</button>`).join("")}</div>
  <button class="btn sea ai-go" id="aiBtn" type="button" ${state.aiBusy?"disabled":""}><svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M10 3l1.8 5.2L17 10l-5.2 1.8L10 17l-1.8-5.2L3 10l5.2-1.8zM18 2l.8 2.2L21 5l-2.2.8L18 8l-.8-2.2L15 5l2.2-.8z" fill="#fff"/></svg>${state.aiBusy?x.ai_wait:x.ai_btn}</button>
  ${state.aiMsg?`<p class="muted">${esc(state.aiMsg)}</p>`:""}
</section>
<div class="or">${x.or}</div>
<section style="display:flex;flex-direction:column;gap:12px">
  <h2>${x.how}</h2>
  <ol class="steps-list">
    <li><b>1</b><span>${x.h1}</span></li>
    <li><b>2</b><span>${x.h2}</span></li>
    <li><b>3</b><span>${x.h3}</span></li>
    <li><b>4</b><span>${x.h4}</span></li>
  </ol>
</section>
<button type="button" class="link" id="opsLink">${x.ops}</button>`;
  a.innerHTML=`<button class="btn" id="startBtn" type="button">${x.start}</button>`;
  document.getElementById("startBtn").onclick=()=>{state.screen="q";state.q=0;state.aiNote="";render()};
  document.getElementById("opsLink").onclick=()=>{state.screen="ops";render()};
  const ta=document.getElementById("aiText");
  ta.oninput=()=>{state.aiText=ta.value};
  // 예시 버튼: 누르면 입력칸 끝에 그 말을 붙임
  s.querySelectorAll("[data-chip]").forEach(b=>b.onclick=()=>{
    const w=b.dataset.chip,v=ta.value.trim();
    if(!v.includes(w)){ta.value=v?`${v}, ${w}`:w;state.aiText=ta.value}
    ta.focus();
  });
  document.getElementById("aiBtn").onclick=askAI;
}
