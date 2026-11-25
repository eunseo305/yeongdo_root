/* 결과 화면: 추천 동선, 통계, 후기 남기기
   담당: ② 화면 */

function legHTML(lg,x){
  const m=k=>{const v=lg[k];const on=lg.mode===k;return `<span class="mode${on?" on":""}">${x.modes[k]} ${v===null?"—":v+x.min}</span>`};
  return `<div class="leg"><div class="modes">${m("walk")}${m("taxi")}${m("bus")}</div><span class="move"><b>${x.recLbl} ${x.modes[lg.mode]}</b> · ${x.why[lg.why]}</span></div>`;
}
function fmtDur(m,L){const h=Math.floor(m/60),n=m%60;
  if(L==="en")return (h?h+" h ":"")+(n?n+" min":"").trim();
  if(L==="ja")return (h?h+"時間":"")+(n?n+"分":"");
  if(L==="zh")return (h?h+"小时":"")+(n?n+"分钟":"");
  return (h?h+"시간 ":"")+(n?n+"분":"");}
/* 선호도 다시 고르기 모달 (결과 화면 위에 뜸)
   - 연령·동행: 하나 누르면 바로 반영하고 닫힘
   - 관심사: 여러 개 고른 뒤 "결과 보기"로 반영
   - 바깥 클릭 / Esc: 바꾼 것 취소 (이전 버튼은 없음) */
function openPrefModal(key,s,a,opener){
  const x=t(),b=qBody(key),snap={...state.a,interests:state.a.interests.slice()};
  const m=document.createElement("div");m.className="pmodal";
  m.innerHTML=`<div class="pm-box" role="dialog" aria-modal="true" aria-labelledby="pm-t">
    <div class="qhead"><h2 id="pm-t">${b.title}</h2>${b.sub?`<p class="muted">${b.sub}</p>`:""}</div>
    <div class="qblock pm-body" data-key="${key}">${b.opts}</div>
    ${key==="interests"?`<div class="pm-act"><button class="btn" type="button" data-pm="ok">${x.see}</button></div>`:""}</div>`;
  document.body.appendChild(m);
  const prevOv=document.body.style.overflow;document.body.style.overflow="hidden";
  const close=apply=>{
    if(!apply)state.a=snap;
    document.removeEventListener("keydown",onKey);document.body.style.overflow=prevOv;m.remove();
    if(apply){renderResult(s,a);const c=s.querySelector(`[data-edit="${key}"]`);if(c)c.focus()}else opener.focus();
  };
  const onKey=e=>{if(e.key==="Escape")close(false)};
  document.addEventListener("keydown",onKey);
  const ok=()=>{const o=m.querySelector('[data-pm="ok"]');if(o)o.disabled=!qFilled(key)};
  m.onclick=e=>{
    if(e.target===m)return close(false);
    const pm=e.target.closest("[data-pm]");
    if(pm)return pm.dataset.pm==="ok"?(qFilled(key)&&close(true)):close(false);
    const v=e.target.closest("[data-v]");if(!v)return;
    qApply(m.querySelector(".pm-body"),key,v.dataset.v);
    if(key==="interests")ok();else close(true);
  };
  ok();
  (m.querySelector('[aria-pressed="true"]')||m.querySelector("[data-v]")).focus();
}

function renderResult(s,a){
  const x=t(),r=plan(),L=state.lang;
  const ordKey=r.ord.includes("O")?"O":r.ord.join("");
  const ids=r.chosen.map(p=>p.id);
  const rnd=seeded([state.a.nat,state.a.age,state.a.comp,state.a.weather,state.a.interests.slice().sort().join(),ids.join()].join("|"));
  const n=40+Math.floor(rnd()*150),pct=48+Math.floor(rnd()*27),rate=(4.3+rnd()*0.5).toFixed(1);
  const intNames=state.a.interests.map(k=>x.int[k]).join(", ");
  const reasons=[x.r.int(intNames)];
  const W=state.a.weather;
  if(W&&W!=="sun"){
    reasons.push(x.r[W]);
    const cut=(WX_BLOCK[W]||[]).map(id=>PLACES.find(p=>p.id===id)).filter(Boolean).map(p=>p.name[L].split(" (")[0].split("（")[0]);
    if(cut.length&&x.wxCut[W])reasons.push(x.wxCut[W](cut.join(", ")));
    if(x.wxTip[W])reasons.push(x.wxTip[W]);
  }
  const hasStairsSkip=(state.a.age==="a70"||state.a.age==="a50")&&!ids.includes("huinnyeoul");
  if(hasStairsSkip)reasons.push(x.r.stairs);
  if(state.a.comp==="family"&&ids.includes("museum"))reasons.push(x.r.family);
  if(crowdOf(r.c.pax)==="high"&&ids.includes("taejongdae")&&ids.includes("museum"))reasons.push(x.r.crowd);
  if(ids.includes("daiso")||ids.includes("oliveyoung"))reasons.push(x.r.shopYd);
  if(ids.includes("lotte"))reasons.push(x.r.beauty);
  if(r.none)reasons.unshift(x.r.tooShort);else if(r.free<=150)reasons.push(x.r.short);
  if(r.chosen.some(p=>p.meal))reasons.push(x.r.meal);
  if(r.ord.length>1&&!r.ord.includes("O"))reasons.push(x.r.oneWay);

  // 선호도 칩: 누르면 모달로 그 항목만 다시 고름 (openPrefModal). 나라는 칩에서 뺌
  const chip=(k,v)=>`<button type="button" class="chip" data-edit="${k}" aria-haspopup="dialog">${esc(v)}</button>`;
  const prof=[["age",x.age[state.a.age]],["comp",x.comp[state.a.comp]]].filter(([,v])=>v).map(([k,v])=>chip(k,v)).join("")+state.a.interests.map(k=>chip("interests",x.int[k])).join("");
  let tl=`<li class="tl"><span class="t">${hm(r.start)}</span><span class="rail"><span class="dot end"></span><span class="line"></span></span><div class="body"><strong>${x.disembark}</strong><span class="d">${r.c.name}</span></div></li>`;
  const nearAll=nearAds(r);
  r.sim.stops.forEach((st,i)=>{
    tl+=`<li class="tl"><span class="t">${hm(st.at)}</span><span class="rail"><span class="dot"></span><span class="line"></span></span><div class="body">
      ${legHTML(st.lg,x)}
      <strong>${i+1}. ${esc(st.p.name[L])}${st.p.out?`<span class="tag-out">${x.outside}</span>`:""}</strong>
      <span class="rt" aria-label="${x.rtAria} ${placeRating(st.p.id).avg}/5"><span class="st">★</span> ${placeRating(st.p.id).avg} <small>(${placeRating(st.p.id).n})</small></span>
      <span class="d"><span class="envb ${ENV[st.p.id]||"out"}">${x.env[ENV[st.p.id]||"out"]}</span> ${esc(st.p.d[L])} · ${st.p.dwell}${x.min}</span>
      ${mapLinks(st.p,L)}
      ${state.adsOn?(()=>{const g=nearAll.filter(v=>v.i===i);return g.length?`<span class="adnear"><b>${ADT[L].nearStop}</b>${g.map(v=>`<button type="button" data-ad="${v.a.id}"><span class="dot"></span>${esc(adName(v.a,L))} · ${ADT[L].walkN(v.walk)}</button>`).join("")}</span>`:""})():""}</div></li>`;
  });
  tl+=`<li class="tl"><span class="t">${hm(r.sim.end)}</span><span class="rail"><span class="dot end"></span></span><div class="body">${legHTML(r.sim.backLeg,x)}<strong>${x.terminal}</strong></div></li>`;

  const fb=state.fbSent?`<p style="color:var(--good);font-size:14px">${x.fbThanks}</p>`:`
    <div class="stars">${[1,2,3,4,5].map(i=>`<button type="button" id="star-${i}" data-s="${i}" aria-pressed="${state.rating>=i}" aria-label="${i}/5">★</button>`).join("")}</div>
    <label class="f" for="fbLong">${x.fbLong}<select id="fbLong">${r.chosen.map(p=>`<option value="${p.id}">${esc(p.name[L])}</option>`).join("")}</select></label>
    <label class="f" for="fbText">${x.fbText}<textarea id="fbText" style="min-height:64px"></textarea></label>
    <button class="btn sea" id="fbSave" type="button" ${state.rating?"":"disabled"}>${x.fbSave}</button>`;

  s.innerHTML=`
  <div style="display:flex;flex-direction:column;gap:8px">
    <p class="muted">${x.resultT} · ${state.cdate&&ALLC.length?(()=>{const x=new Date(state.cdate+"T00:00"),D=DT[L];return D.fmt(x.getMonth()+1,x.getDate(),D.wd[x.getDay()])+" · "})():""}${esc(r.c.name)} · ${hmD(r.c.arr)}–${hmD(r.c.dep)}</p>
    <div class="course-name">${x.course[ordKey]}</div>
    ${W&&W!=="sun"?(()=>{const c={in:0,semi:0,out:0};r.chosen.forEach(p=>c[ENV[p.id]||"out"]++);return `<div class="wxbar ${W}"><b>${x.wxDay} · ${esc(x.wx[W])}</b><span>${x.env.in} ${c.in}${x.cnt} · ${x.env.semi} ${c.semi}${x.cnt} · ${x.env.out} ${c.out}${x.cnt}</span></div>`})():""}
    <div class="chips">${prof}</div>
  </div>
  ${state.aiNote?`<div class="ainote"><b>${x.aiSays}</b><br>${esc(state.aiNote)}</div>`:""}
  ${state.aiMsg&&!state.aiNote?`<p class="muted">${esc(state.aiMsg)}</p>`:""}
  <div class="alert" role="note"><span>${x.leaveBy} <strong>${hmD(r.sim.leave)}</strong> · ${x.returnBy} <strong>${hmD(r.allAboard)}</strong></span><span class="muted">${x.alertP} (${x.dep} ${hmD(r.c.dep)})</span>${(()=>{const sp=r.allAboard-r.sim.end;return !r.none&&sp>=20?`<span class="spare"><b>${x.spare(fmtDur(sp,L))}</b> ${x.spareTip}</span>`:""})()}</div>
  <nav class="rtabs" id="rtabs" role="tablist" aria-label="${(TABT[L]||TABT.en).aria}">${TAB_KEYS.map(k=>`<button type="button" role="tab" id="tabbtn-${k}" data-tab="${k}" aria-controls="tab-${k}">${(TABT[L]||TABT.en)[k]}</button>`).join("")}</nav>
  <div class="rpanel" id="tab-map" role="tabpanel" aria-labelledby="tabbtn-map">
  <section class="mapbox" aria-label="map">
    <div id="nmap"></div>
    <div id="smap">${sketchMap(r)}</div>
    ${myLocBtnHTML()}
    <div class="map-cap"><span id="mapCap">${MAPT[L].sketch}</span><span class="map-btns">${wcBtnHTML()}<button type="button" class="adtoggle" id="zoomToggle" style="color:var(--sea)">${state.mapFull?MAPT[L].zoom:MAPT[L].full}</button><button type="button" class="adtoggle" id="adToggle" aria-pressed="${state.adsOn}"><svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true"><rect x="1" y="1" width="22" height="22" rx="5" fill="currentColor"/></svg>${ADT[L].toggle}</button></span></div>
  </section>
  <div id="wcPanel"></div>
  <div id="adPanel">${adPanelHTML(r)}</div>
  </div>
  <div class="rpanel" id="tab-tl" role="tabpanel" aria-labelledby="tabbtn-tl" hidden>
  <ol class="timeline">${tl}</ol>
  <p class="muted" style="margin-top:-8px">${x.rtSrc} ${x.modeNote}</p>
  </div>
  <div class="rpanel" id="tab-food" role="tabpanel" aria-labelledby="tabbtn-food" hidden>
  <section class="card" id="foodSec">${foodHTML(r)}</section>
  </div>
  <div class="rpanel" id="tab-why" role="tabpanel" aria-labelledby="tabbtn-why" hidden>
  <section class="card">
    <h2 style="font-size:19px">${x.statsT}</h2>
    <div class="stats">
      <div class="stat"><div class="n">${n}</div><div class="l">${x.sN}</div></div>
      <div class="stat"><div class="n">${pct}%</div><div class="l">${x.sPct}</div></div>
      <div class="stat"><div class="n">${rate}</div><div class="l">${x.sRate} / 5</div></div>
    </div>
    <div class="meter" aria-hidden="true"><i style="width:${pct}%"></i></div>
  </section>
  <section class="card">
    <h2 style="font-size:19px">${x.whyT}</h2>
    <ul class="reasons">${reasons.map(v=>`<li>${esc(v)}</li>`).join("")}</ul>
  </section>
  </div>
  <div class="rpanel" id="tab-fb" role="tabpanel" aria-labelledby="tabbtn-fb" hidden>
  <section class="card" id="fb">
    <h2 style="font-size:19px">${x.fbT}</h2>
    <p class="muted">${x.fbP}</p>
    ${fb}
  </section>
  </div>
  <p class="demo">${x.demo}</p>`;
  lastR=r;naverMap(r);wireAds(r);wireWc(r);wireMyLoc(r);wireFood(r);wireTabs();
  s.querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>openPrefModal(b.dataset.edit,s,a,b));
  s.querySelectorAll("[data-s]").forEach(b=>b.onclick=()=>{
    state.rating=+b.dataset.s;
    s.querySelectorAll("[data-s]").forEach(o=>o.setAttribute("aria-pressed",String(+o.dataset.s<=state.rating)));
    const sv=document.getElementById("fbSave");if(sv)sv.disabled=false;
  });
  const sv=document.getElementById("fbSave");
  if(sv)sv.onclick=()=>{
    saveReview({stars:state.rating,place:document.getElementById("fbLong").value,nat:state.a.nat||{ko:"kr",ja:"ja",zh:"zh",en:"us"}[state.lang]||"other",text:document.getElementById("fbText").value.trim().slice(0,200),mine:true});
    state.fbSent=true;renderResult(s,a);document.getElementById("fb").scrollIntoView({block:"center"});
  };
  a.innerHTML=`<button class="btn ghost" id="backBtn" type="button">${x.back}</button><button class="btn" id="againBtn" type="button">${x.again}</button>`;
  document.getElementById("backBtn").onclick=()=>{state.screen="q";state.q=QUESTIONS.length-1;render()};
  document.getElementById("againBtn").onclick=()=>{wcStop();myLocReset();if(wcPrevFull!==null){state.mapFull=wcPrevFull;wcPrevFull=null}state={...state,screen:"home",q:0,a:blankA(),ship:null,rating:0,aiText:"",aiNote:"",aiMsg:"",fbSent:false};render()};
}
