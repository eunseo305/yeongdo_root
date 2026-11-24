/* 질문 화면 (국적·연령·동행·관심사·날씨·크루즈, 날짜 선택 줄)
   담당: ② 화면 */

function renderQ(s,a){
  const x=t(),key=QUESTIONS[state.q];
  const prog=`<div class="progress" aria-label="${state.q+1}/${QUESTIONS.length}">${QUESTIONS.map((_,i)=>`<span class="${i<=state.q?"on":""}"></span>`).join("")}</div>`;
  let title,sub="",opts="";
  if(key==="nat"){title=x.q_nat;opts=grid(Object.keys(x.nat).map(k=>[k,x.nat[k]]),"nat")}
  if(key==="age"){title=x.q_age;opts=grid(Object.keys(x.age).map(k=>[k,x.age[k]]),"age")}
  if(key==="comp"){title=x.q_comp;opts=grid(Object.keys(x.comp).map(k=>[k,x.comp[k]]),"comp")}
  if(key==="interests"){title=x.q_int;sub=x.q_intS;opts=grid(Object.keys(x.int).map(k=>[k,x.int[k],x.intS[k]]),"interests",true)}
  if(key==="weather"){title=x.q_wx;sub=x.q_wxS;opts=grid(Object.keys(x.wx).map(k=>[k,x.wx[k]]),"weather")}
  if(key==="ship"){title=x.q_ship;sub=x.q_shipS;opts=`${dateBarHTML()}${!CRUISES.length&&ALLC.length?`<p class="nodate">${DT[state.lang].none}</p>`:""}<div class="options one">${CRUISES.map(c=>{const cr=crowdOf(c.pax);return `
    <button type="button" class="ship" id="ship-${c.id}" data-v="${c.id}" aria-pressed="${state.ship===c.id}">
      <span class="row"><strong>${c.date?`<span class="muted" style="font-weight:500">${c.date}</span> `:""}${esc(c.name)}</strong><span class="pill ${cr}">${x.crowd[cr]}</span></span>
      <span class="row times"><span>${x.arr} ${hmD(c.arr)} · ${x.dep} ${hmD(c.dep)}</span><span>${c.pax.toLocaleString()}${x.pax==="pax"?" pax":x.pax}</span></span>
    </button>`}).join("")}</div><p class="muted" style="font-size:12.5px">${CSRC[state.lang][cruiseSrc]}</p>`}
  s.innerHTML=`${prog}<div style="display:flex;flex-direction:column;gap:4px"><h2>${title}</h2>${sub?`<p class="muted">${sub}</p>`:""}</div>${opts}`;
  s.querySelectorAll("[data-cd]").forEach(b=>b.onclick=()=>{setCruiseDate(b.dataset.cd);renderQ(s,a)});
  const cdi=document.getElementById("cdate");if(cdi)cdi.onchange=()=>{if(cdi.value){setCruiseDate(cdi.value);renderQ(s,a)}};
  s.querySelectorAll("[data-v]").forEach(b=>b.onclick=()=>{
    const v=b.dataset.v;
    if(key==="interests"){const arr=state.a.interests;const i=arr.indexOf(v);i>=0?arr.splice(i,1):arr.push(v)}
    else if(key==="ship"){state.ship=v}
    else{state.a[key]=v}
    renderQ(s,a);
  });
  const filled=key==="interests"?state.a.interests.length>0:key==="ship"?!!state.ship:!!state.a[key];
  const last=state.q===QUESTIONS.length-1;
  a.innerHTML=`<button class="btn ghost" id="backBtn" type="button">${x.back}</button><button class="btn" id="nextBtn" type="button" ${filled?"":"disabled"}>${last?x.see:x.next}</button>`;
  document.getElementById("backBtn").onclick=()=>{if(state.q===0){state.screen="home"}else state.q--;render()};
  document.getElementById("nextBtn").onclick=()=>{if(!filled)return;if(last){state.screen="result";state.rating=0;state.fbSent=false}else state.q++;render()};
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
