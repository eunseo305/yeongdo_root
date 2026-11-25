/* 질문 화면 — 한 화면에서 질문이 차례로 펼쳐지는 방식
   (연령·동행·관심사·크루즈, 날짜 선택 줄)
   담당: ② 화면

   동작
   - 답한 질문 바로 아래에 다음 질문이 슬라이드되며 나타나고, 그 위치로 부드럽게 스크롤됩니다.
   - 관심사(복수 선택)는 하나만 골라도 다음 질문이 열리지만, 더 고를 수 있게 자동 스크롤은 하지 않습니다.
   - 위의 답을 바꿔도 아래 질문은 그대로 남아 있습니다.
   - 모든 질문에 답하면 하단 "결과 보기" 버튼이 켜집니다.
   - 클릭할 때마다 화면 전체를 다시 그리지 않고 바뀐 부분만 고쳐서, 스크롤 위치와 애니메이션이 유지됩니다. */

(function injectQStackCSS(){
  if(document.getElementById("q-stack-css"))return;
  const st=document.createElement("style");st.id="q-stack-css";
  st.textContent=`
.qstack{display:flex;flex-direction:column;gap:24px}
.qblock{display:flex;flex-direction:column;gap:12px;scroll-margin-top:16px}
.qblock+.qblock{padding-top:24px;border-top:1px solid rgba(127,127,127,.18)}
.qhead{display:flex;flex-direction:column;gap:4px}
.qnum{font-size:12px;font-weight:600;letter-spacing:.04em;opacity:.55}
.qblock.enter{animation:qIn .45s cubic-bezier(.2,.8,.2,1) both}
@keyframes qIn{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){.qblock.enter{animation:none}}`;
  document.head.appendChild(st);
})();

function qFilled(key){
  return key==="interests"?state.a.interests.length>0:key==="ship"?!!state.ship:!!state.a[key];
}

function shipOptsHTML(){
  const x=t();
  return `${dateBarHTML()}${!CRUISES.length&&ALLC.length?`<p class="nodate">${DT[state.lang].none}</p>`:""}<div class="options one">${CRUISES.map(c=>{const cr=crowdOf(c.pax);return `
    <button type="button" class="ship" id="ship-${c.id}" data-v="${c.id}" aria-pressed="${state.ship===c.id}">
      <span class="row"><strong>${c.date?`<span class="muted" style="font-weight:500">${c.date}</span> `:""}${esc(c.name)}</strong><span class="pill ${cr}">${x.crowd[cr]}</span></span>
      <span class="row times"><span>${x.arr} ${hmD(c.arr)} · ${x.dep} ${hmD(c.dep)}</span><span>${c.pax.toLocaleString()}${x.pax==="pax"?" pax":x.pax}</span></span>
    </button>`}).join("")}</div><p class="muted" style="font-size:12.5px">${CSRC[state.lang][cruiseSrc]}</p>`;
}

function qBody(key){
  const x=t();
  if(key==="nat")return{title:x.q_nat,opts:grid(Object.keys(x.nat).map(k=>[k,x.nat[k]]),"nat")};
  if(key==="age")return{title:x.q_age,opts:grid(Object.keys(x.age).map(k=>[k,x.age[k]]),"age")};
  if(key==="comp")return{title:x.q_comp,opts:grid(Object.keys(x.comp).map(k=>[k,x.comp[k]]),"comp")};
  if(key==="interests")return{title:x.q_int,sub:x.q_intS,opts:grid(Object.keys(x.int).map(k=>[k,x.int[k],x.intS[k]]),"interests",true)};
  if(key==="ship")return{title:x.q_ship,sub:x.q_shipS,opts:shipOptsHTML()};
  return{title:"",opts:""};
}

function qBlockHTML(i,enter){
  const key=QUESTIONS[i],b=qBody(key);
  return `<section class="qblock${enter?" enter":""}" id="qb-${key}" data-key="${key}" data-i="${i}" aria-labelledby="qt-${key}">
    <div class="qhead"><span class="qnum">${i+1} / ${QUESTIONS.length}</span><h2 id="qt-${key}">${b.title}</h2>${b.sub?`<p class="muted">${b.sub}</p>`:""}</div>${b.opts}</section>`;
}

function qProgHTML(){
  return QUESTIONS.map(k=>`<span class="${qFilled(k)?"on":""}"></span>`).join("");
}

// 선택값 반영 + 해당 블록의 눌림 표시만 갱신
function qApply(blk,key,v){
  if(key==="interests"){const arr=state.a.interests;const j=arr.indexOf(v);j>=0?arr.splice(j,1):arr.push(v)}
  else if(key==="ship"){state.ship=v}
  else{state.a[key]=v}
  blk.querySelectorAll("[data-v]").forEach(o=>{
    const ov=o.dataset.v;
    o.setAttribute("aria-pressed",key==="interests"?state.a.interests.includes(ov):key==="ship"?state.ship===ov:state.a[key]===ov);
  });
}

function renderQ(s,a){
  // 어디까지 펼칠지: 첫 미응답 질문까지 (이미 답한 뒷 질문이 있으면 거기까지)
  const fu=QUESTIONS.findIndex(k=>!qFilled(k));
  let lf=-1;QUESTIONS.forEach((k,i)=>{if(qFilled(k))lf=i});
  state.q=fu<0?QUESTIONS.length-1:Math.min(QUESTIONS.length-1,Math.max(fu,lf+1));

  s.innerHTML=`<div class="progress" id="qProg" aria-hidden="true">${qProgHTML()}</div>
    <div class="qstack" id="qStack">${QUESTIONS.slice(0,state.q+1).map((_,i)=>qBlockHTML(i,false)).join("")}</div>`;

  const stack=document.getElementById("qStack");

  stack.onclick=e=>{
    const cd=e.target.closest("[data-cd]");
    if(cd){setCruiseDate(cd.dataset.cd);qRefreshBlock("ship");qSync(a);return}

    const b=e.target.closest("[data-v]");if(!b)return;
    const blk=b.closest(".qblock"),key=blk.dataset.key,i=+blk.dataset.i,v=b.dataset.v;

    // 선택 표시만 갱신 (전체 다시 그리기 X)
    qApply(blk,key,v);

    // 맨 아래(가장 최근에 열린) 질문에 답했으면 다음 질문을 펼침
    if(i===state.q&&qFilled(key)&&i<QUESTIONS.length-1)qRevealNext(key!=="interests");
    qSync(a);
  };

  stack.onchange=e=>{
    if(e.target.id==="cdate"&&e.target.value){setCruiseDate(e.target.value);qRefreshBlock("ship");qSync(a)}
  };

  qSync(a);
}

function qRevealNext(scroll){
  const stack=document.getElementById("qStack");if(!stack)return;
  state.q++;
  stack.insertAdjacentHTML("beforeend",qBlockHTML(state.q,true));
  const nb=stack.lastElementChild;
  if(scroll){
    const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
    setTimeout(()=>nb.scrollIntoView({behavior:reduce?"auto":"smooth",block:"start"}),180);
  }
}

function qRefreshBlock(key){
  const old=document.getElementById("qb-"+key);if(!old)return;
  old.outerHTML=qBlockHTML(+old.dataset.i,false);
}

function qSync(a){
  const p=document.getElementById("qProg");if(p)p.innerHTML=qProgHTML();
  const x=t(),done=QUESTIONS.every(qFilled);
  a.innerHTML=`<button class="btn ghost" id="backBtn" type="button">${x.back}</button><button class="btn" id="nextBtn" type="button" ${done?"":"disabled"}>${x.see}</button>`;
  document.getElementById("backBtn").onclick=()=>{state.screen="home";render()};
  document.getElementById("nextBtn").onclick=()=>{
    if(!QUESTIONS.every(qFilled))return;
    state.screen="result";state.rating=0;state.fbSent=false;state.resTab="map";render();
  };
}

const DT={
ko:{lbl:"크루즈가 들어오는 날",other:"다른 날짜",today:"오늘",wd:["일","월","화","수","목","금","토"],none:"이 날은 영도 크루즈터미널에 머무는 배가 없어요. 위에서 다른 날짜를 골라 보세요.",fmt:(m,d,w)=>`${m}/${d} (${w})`},
en:{lbl:"Day your cruise is in port",other:"Other date",today:"Today",wd:["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],none:"No ships at the Yeongdo terminal that day. Pick another date above.",fmt:(m,d,w)=>`${w} ${m}/${d}`},
ja:{lbl:"クルーズの入港日",other:"他の日付",today:"今日",wd:["日","月","火","水","木","金","土"],none:"この日は影島ターミナルに停泊する船がありません。上で別の日付を選んでください。",fmt:(m,d,w)=>`${m}/${d}（${w}）`},
zh:{lbl:"邮轮靠港日期",other:"其他日期",today:"今天",wd:["日","一","二","三","四","五","六"],none:"这天影岛码头没有停靠的邮轮，请在上方选择其他日期。",fmt:(m,d,w)=>`${m}/${d}（周${w}）`}};
function dateBarHTML(){
  if(!ALLC.length)return "";
  const D=DT[state.lang],today=ymdOf(new Date());
  let ds=arrivalDates().slice(0,8);
  if(state.cdate&&!ds.includes(state.cdate))ds=[state.cdate,...ds].sort();
  const lab=d=>{const x=new Date(d+"T00:00");return d===today?D.today:D.fmt(x.getMonth()+1,x.getDate(),D.wd[x.getDay()])};
  const first=ymdOf(ALLC[0].a),last=ymdOf(ALLC[ALLC.length-1].d);
  return `<div class="datebar"><p class="dl">${D.lbl}</p>
    <div class="dchips" role="group" aria-label="${esc(D.lbl)}">${ds.map(d=>`<button type="button" id="cd-${d}" data-cd="${d}" aria-pressed="${state.cdate===d}">${lab(d)}</button>`).join("")}</div>
    <label class="dpick" for="cdate">${D.other}<input type="date" id="cdate" value="${state.cdate||""}" min="${first}" max="${last}"></label></div>`;
}
function grid(items,key,multi){
  return `<div class="options">${items.map(([k,l,sub])=>{
    const on=multi?state.a.interests.includes(k):state.a[key]===k;
    return `<button type="button" class="opt" id="${key}-${k}" data-v="${k}" aria-pressed="${on}"><span>${l}</span>${sub?`<small>${sub}</small>`:""}</button>`}).join("")}</div>`;
}