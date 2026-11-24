/* 공통 상태(state)와 도구 함수, 언어 버튼, 화면 전환(render), 첫 화면
   담당: ② 화면 */

const blankA=()=>({nat:null,age:null,comp:null,interests:[],weather:null});
let state={foodCat:"all",foodMore:false,mapFull:false,adsOn:true,adSel:null,lang:detectLang(),screen:"home",q:0,a:blankA(),ship:null,rating:0,aiText:"",aiNote:"",aiBusy:false,aiMsg:"",fbSent:false};
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
  document.getElementById("brandText").textContent=t().brand;
  document.documentElement.lang=state.lang==="zh"?"zh-CN":state.lang;
}

const QUESTIONS=["nat","age","comp","interests","weather","ship"];

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
  s.innerHTML=`
<section class="hero">
  <span class="qr-tag"><svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h3v3h-3zM18 18h3v3h-3z" fill="none" stroke="#fff" stroke-width="2"/></svg>${x.qr}</span>
  <h1>${x.heroT}</h1>
  <p>${x.heroP}</p>
  <svg class="wave" width="180" height="60" viewBox="0 0 180 60" aria-hidden="true"><path d="M0 30c15 12 30 12 45 0s30-12 45 0 30 12 45 0 30-12 45 0" fill="none" stroke="#fff" stroke-width="6"/></svg>
</section>
<section class="aibox">
  <h2 style="font-size:20px">${x.ai_h}</h2>
  <label for="aiText" class="muted" style="position:absolute;left:-9999px">${x.ai_h}</label>
  <textarea id="aiText" placeholder="${esc(x.ai_ph)}">${esc(state.aiText)}</textarea>
  <button class="btn sea" id="aiBtn" type="button" ${state.aiBusy?"disabled":""}>${state.aiBusy?x.ai_wait:x.ai_btn}</button>
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
  document.getElementById("aiBtn").onclick=askAI;
}
