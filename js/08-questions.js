/* 질문 화면 — 한 화면에서 질문이 차례로 펼쳐지는 방식
   (동행·크루즈·관심사, 날짜 선택 줄)
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
@media (prefers-reduced-motion:reduce){.qblock.enter{animation:none}}
.qneed{align-self:flex-start;font-size:12px;font-weight:700;padding:3px 10px;border-radius:999px;background:var(--buoy);color:#fff}
.qblock.need .qhead h2{color:var(--buoy)}
.qneed[hidden]{display:none}`;
  document.head.appendChild(st);
})();

// 질문 순서: "AI에게 말로 물어보기"에서 빠진 필수 내용(state.aiFollow)이 있으면
// 글에서 알아낸 질문(이미 골라져 있음)을 위에, 빠진 질문을 맨 아래에 둠. 아니면 원래 순서
function qList(){
  const miss=state.aiFollow;
  if(!(miss&&miss.length))return QUESTIONS;
  return [...QUESTIONS.filter(k=>!miss.includes(k)),...QUESTIONS.filter(k=>miss.includes(k))];
}
const qNeed=key=>!!(state.aiFollow&&state.aiFollow.includes(key));
const QFOLLOW={
  ko:{h:"거의 다 됐어요!",p:list=>`적어주신 내용으로 동선을 짜려면 <b>${list}</b>만 더 알려 주세요. 맨 아래에서 골라 주세요.`,
    name:{comp:"누구랑",ship:"크루즈",interests:"관심사"},sep:"·",need:"아직 안 정했어요"},
  en:{h:"Almost there!",p:list=>`To plan your route, just tell us <b>${list}</b>. Pick below.`,
    name:{comp:"who you're with",ship:"your cruise",interests:"your interests"},sep:", ",need:"Not set yet"},
  ja:{h:"あと少しです！",p:list=>`ルートを作るために、<b>${list}</b>だけ教えてください。下で選んでください。`,
    name:{comp:"同行者",ship:"クルーズ",interests:"興味"},sep:"・",need:"まだ選んでいません"},
  zh:{h:"马上就好！",p:list=>`为了安排路线，请再告诉我们<b>${list}</b>。请在下方选择。`,
    name:{comp:"同行人",ship:"邮轮",interests:"兴趣"},sep:"、",need:"还没选"}};
function qFollowHTML(){
  if(!(state.aiFollow&&state.aiFollow.length))return "";
  const F=QFOLLOW[state.lang]||QFOLLOW.en;
  const list=state.aiFollow.map(k=>F.name[k]).join(F.sep);
  return `<div class="ainote qfollow" role="note"><b>${F.h}</b><br>${state.aiNote?esc(state.aiNote)+" ":""}${F.p(list)}</div>`;
}

function qFilled(key){
  return key==="interests"?state.a.interests.length>0:key==="ship"?!!state.ship:!!state.a[key];
}

/* ---- 참고 사진 디자인용 그림·아이콘 (2026-11-25) ---- */
const QI={ // 질문 제목 앞 아이콘 (선 그림)
  comp:'<path d="M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6M16 4.3a3.5 3.5 0 0 1 0 6.4M18 14.3c2 .8 3.5 2.8 3.5 5.7"/>',
  ship:'<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/><path d="M7.5 14h2M11 14h2M14.5 14h2M7.5 17.5h2M11 17.5h2"/>',
  interests:'<path d="M10 3l1.8 5.2L17 10l-5.2 1.8L10 17l-1.8-5.2L3 10l5.2-1.8zM18 14l.8 2.2L21 17l-2.2.8L18 20l-.8-2.2L15 17l2.2-.8z"/>'
};
const QHL={ // 질문 제목에서 파랗게 칠할 단어
  ko:{comp:"누구",interests:"관심",ship:"크루즈"},
  en:{comp:"Who",interests:"What",ship:"cruise"},
  ja:{comp:"どなた",interests:"興味",ship:"クルーズ"},
  zh:{comp:"谁",interests:"感兴趣",ship:"邮轮"}};
const svgI=(p,sz=22)=>`<svg width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
// 크루즈 질문 오른쪽 위 그림: 다리 + 산 + 전망대 + 크루즈선 + 바다
const SHIP_ART=`<svg class="ship-art" viewBox="0 0 240 120" aria-hidden="true">
  <defs><linearGradient id="saSea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7cc0f5"/><stop offset="1" stop-color="#2f86e0"/></linearGradient>
  <linearGradient id="saFade" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="1"/><stop offset=".35" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>
  <path d="M150 74c10-30 30-46 50-52 18-4 30 4 40 10v42z" fill="#3f8f5a"/><path d="M175 74c8-18 22-28 40-30 12 0 20 6 25 10v20z" fill="#5aa86e"/>
  <rect x="204" y="10" width="5" height="22" fill="#e8eef6"/><ellipse cx="206.5" cy="10" rx="6" ry="3" fill="#2f7be8"/>
  <path d="M196 58h10v16h-10zM210 54h12v20h-12zM226 60h10v14h-10z" fill="#fff" stroke="#c7d3e2"/>
  <path d="M40 66h120" stroke="#9db6cf" stroke-width="2"/><path d="M98 30v36M102 30v36" stroke="#8aa3bd" stroke-width="2"/><path d="M100 32L60 66M100 32l40 34M100 40L74 66M100 40l26 26" stroke="#b5c8db" stroke-width="1"/>
  <path d="M0 74h240v46H0z" fill="url(#saSea)"/>
  <path d="M120 72h96l-8 12h-80z" fill="#fff" stroke="#9fb3c9"/><path d="M128 72l6-10h64l8 10z" fill="#fff" stroke="#9fb3c9"/><path d="M140 62l4-6h44l4 6z" fill="#fff" stroke="#9fb3c9"/>
  <path d="M132 67h70M136 77h72" stroke="#3a5a80" stroke-width="1.6" stroke-dasharray="2 2"/><path d="M128 84h80" stroke="#d64b3b" stroke-width="2"/>
  <path d="M0 96c40-8 80-8 120 0s80 8 120-2" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="2"/>
  <rect width="240" height="120" fill="url(#saFade)"/></svg>`;
// 크루즈 카드 왼쪽 썸네일: 바다 위 크루즈선
const SHIP_THUMB=`<svg class="ship-thumb" viewBox="0 0 90 64" aria-hidden="true">
  <defs><linearGradient id="stSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bfe0ff"/><stop offset=".6" stop-color="#e9f4ff"/><stop offset=".6" stop-color="#3d8fe0"/><stop offset="1" stop-color="#1a5fbf"/></linearGradient></defs>
  <rect width="90" height="64" fill="url(#stSky)"/>
  <path d="M8 40h74l-7 9H16z" fill="#fff" stroke="#8ea3bb"/><path d="M14 40l5-8h50l6 8z" fill="#fff" stroke="#8ea3bb"/><path d="M24 32l4-6h32l4 6z" fill="#fff" stroke="#8ea3bb"/>
  <rect x="52" y="20" width="6" height="6" fill="#d64b3b"/>
  <path d="M18 36h54M14 44h64" stroke="#2c4a70" stroke-width="1.4" stroke-dasharray="1.6 1.6"/>
  <path d="M0 54c15-3 30-3 45 0s30 3 45 0" stroke="#fff" stroke-opacity=".5" fill="none"/></svg>`;

function shipOptsHTML(){
  const x=t();
  return `${dateBarHTML()}${!CRUISES.length&&ALLC.length?`<p class="nodate">${DT[state.lang].none}</p>`:""}<div class="options one">${CRUISES.map(c=>{const cr=crowdOf(c.pax);return `
    <button type="button" class="ship" id="ship-${c.id}" data-v="${c.id}" aria-pressed="${state.ship===c.id}">
      ${SHIP_THUMB}
      <span class="ship-main">
        <span class="row"><strong>${esc(c.name)}</strong><span class="pill ${cr}">${x.crowd[cr]}</span></span>
        ${c.date?`<span class="ship-date">${c.date}</span>`:""}
        <span class="row times">
          <span class="ship-t"><span>${svgI('<circle cx="12" cy="5" r="2"/><path d="M12 7v14M5 12H3a9 9 0 0 0 18 0h-2M8 10h8"/>',17)}${x.arr} ${hmD(c.arr)}</span><i></i><span>${svgI('<path d="M12 3v14M12 4l7 11h-7M11 6L5 15h6M3 18h18l-2 3H5z"/>',17)}${x.dep} ${hmD(c.dep)}</span></span>
          <span class="ship-pax">${svgI('<path d="M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6M16 4.3a3.5 3.5 0 0 1 0 6.4M18 14.3c2 .8 3.5 2.8 3.5 5.7"/>',16)}${c.pax.toLocaleString()}${x.pax==="pax"?" pax":x.pax}</span>
        </span>
      </span>
    </button>`}).join("")}</div>
    <p class="srcbox">${svgI('<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',20)}<span>${CSRC[state.lang][cruiseSrc]}</span></p>`;
}

function qBody(key){
  const x=t();
  if(key==="nat")return{title:x.q_nat,opts:grid(Object.keys(x.nat).map(k=>[k,x.nat[k]]),"nat")};
  if(key==="comp")return{title:x.q_comp,opts:grid(Object.keys(x.comp).map(k=>[k,x.comp[k]]),"comp")};
  if(key==="interests")return{title:x.q_int,sub:x.q_intS,opts:grid(Object.keys(x.int).map(k=>[k,x.int[k],x.intS[k]]),"interests",true)};
  if(key==="ship")return{title:x.q_ship,sub:x.q_shipS,opts:shipOptsHTML()};
  return{title:"",opts:""};
}

function qBlockHTML(i,enter){
  const key=qList()[i],b=qBody(key);
  const w=(QHL[state.lang]||{})[key];
  const title=w&&b.title.includes(w)?b.title.replace(w,`<em>${w}</em>`):b.title;
  // AI 글에서 빠진 질문이면 "아직 안 정했어요" 표시 (고르면 qSync에서 숨김)
  const need=qNeed(key)&&!qFilled(key);
  return `<section class="qblock q-${key}${enter?" enter":""}${need?" need":""}" id="qb-${key}" data-key="${key}" data-i="${i}" aria-labelledby="qt-${key}">
    ${key==="ship"?SHIP_ART:""}
    ${qNeed(key)?`<span class="qneed" ${need?"":"hidden"}>${(QFOLLOW[state.lang]||QFOLLOW.en).need}</span>`:""}
    <div class="qhead"><span class="qnum">${i+1} / ${qList().length}</span><h2 id="qt-${key}"><span class="q-ic">${svgI(QI[key]||"",26)}</span><span>${title}</span></h2>${b.sub?`<p class="muted">${b.sub}</p>`:""}</div>${b.opts}</section>`;
}

function qProgHTML(){
  return qList().map(k=>`<span class="${qFilled(k)?"on":""}"></span>`).join("");
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
  const fu=qList().findIndex(k=>!qFilled(k));
  let lf=-1;qList().forEach((k,i)=>{if(qFilled(k))lf=i});
  state.q=fu<0?qList().length-1:Math.min(qList().length-1,Math.max(fu,lf+1));

  s.innerHTML=`${qFollowHTML()}<div class="progress" id="qProg" aria-hidden="true">${qProgHTML()}</div>
    <div class="qstack" id="qStack">${qList().slice(0,state.q+1).map((_,i)=>qBlockHTML(i,false)).join("")}</div>`;

  const stack=document.getElementById("qStack");

  stack.onclick=e=>{
    const cd=e.target.closest("[data-cd]");
    if(cd){setCruiseDate(cd.dataset.cd);qRefreshBlock("ship");qSync(a);return}

    const b=e.target.closest("[data-v]");if(!b)return;
    const blk=b.closest(".qblock"),key=blk.dataset.key,i=+blk.dataset.i,v=b.dataset.v;

    // 선택 표시만 갱신 (전체 다시 그리기 X)
    const was=state.a[key];
    qApply(blk,key,v);

    // 맨 아래(가장 최근에 열린) 질문에 답했으면 다음 질문을 펼침
    const next=()=>{if(i===state.q&&qFilled(key)&&i<qList().length-1)qRevealNext(key!=="interests")};
    qSync(a);
    // 노약자 동반을 새로 고르면 어떤 점을 배려하는지 팝업으로 알려 주고, 닫은 뒤 다음 질문으로
    if(key==="comp"&&v==="care"&&was!=="care")showCareInfo(b,next);else next();
  };

  stack.onchange=e=>{
    if(e.target.id==="cdate"&&e.target.value){setCruiseDate(e.target.value);qRefreshBlock("ship");qSync(a)}
  };

  qSync(a);

  // AI 글에서 빠진 질문이 있으면 맨 아래 그 질문으로 내려가서 바로 고를 수 있게
  if(state.aiFollow&&state.aiFollow.length){
    const first=stack.querySelector(".qblock.need");
    const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
    if(first)setTimeout(()=>first.scrollIntoView({behavior:reduce?"auto":"smooth",block:"start"}),250);
  }
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
  document.querySelectorAll(".qblock").forEach(b=>{
    const f=qFilled(b.dataset.key);b.classList.toggle("need",qNeed(b.dataset.key)&&!f);
    const n=b.querySelector(".qneed");if(n)n.hidden=f;
  });
  const x=t(),done=qList().every(qFilled);
  a.innerHTML=`<button class="btn ghost" id="backBtn" type="button">${x.back}</button><button class="btn" id="nextBtn" type="button" ${done?"":"disabled"}>${x.see}</button>`;
  document.getElementById("backBtn").onclick=()=>{state.screen="home";render()};
  document.getElementById("nextBtn").onclick=()=>{
    if(!qList().every(qFilled))return;
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
  const cal='<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>';
  const chk='<svg class="dck" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="#fff"/><path d="M7 12.5l3.2 3.2L17 9" fill="none" stroke="#1d6fe8" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  return `<div class="datebar"><p class="dl">${svgI('<path d="M3 17h18l-3 4H6zM5 17l2-5h10l2 5M9 12V8h6v4M12 8V5"/>',24)}${D.lbl}</p>
    <div class="dchips" role="group" aria-label="${esc(D.lbl)}">${ds.map(d=>{const on=state.cdate===d;return `<button type="button" id="cd-${d}" data-cd="${d}" aria-pressed="${on}">${on?svgI(cal,18):""}${lab(d)}${on?chk:""}</button>`}).join("")}</div>
    <label class="dpick" for="cdate">${svgI(cal+'<path d="M7.5 14h2M11 14h2M14.5 14h2"/>',20)}${D.other}<input type="date" id="cdate" value="${state.cdate||""}" min="${first}" max="${last}"></label></div>`;
}
function grid(items,key,multi){
  return `<div class="options">${items.map(([k,l,sub])=>{
    const on=multi?state.a.interests.includes(k):state.a[key]===k;
    return `<button type="button" class="opt" id="${key}-${k}" data-v="${k}" aria-pressed="${on}"><span>${l}</span>${sub?`<small>${sub}</small>`:""}</button>`}).join("")}</div>`;
}
/* ---- 노약자 동반 안내 팝업 ----
   동행에서 "노약자 동반"(comp=care)을 고르면 추천 동선에서 무엇을 배려하는지 보여 줍니다.
   목록은 실제 계산과 맞춰 두세요: js/09-engine.js(계단·짚라인), js/05-travel.js(걷는 속도·택시) */
const CARE_T={
ko:{h:"노약자 동반으로 이렇게 배려해요",ok:"확인",items:["계단이 많은 곳(흰여울문화마을, 조내기 고구마 역사공원 등)은 코스에서 빼요","짚라인처럼 몸에 무리가 가는 체험은 추천하지 않아요","걷는 속도를 느리게 잡아 이동 시간을 넉넉히 계산해요","걸어서 10분이 넘는 거리는 택시를 추천해요"]},
en:{h:"How we adjust your route",ok:"OK",items:["Places with lots of stairs (Huinnyeoul Village, Jonaegi park and others) are left out","Physically demanding activities such as the zipline are not suggested","Walking times are worked out at a slower pace, so you have time to spare","Anything over a 10-minute walk is suggested by taxi"]},
ja:{h:"このように配慮します",ok:"OK",items:["階段の多い場所（白瀬文化村、チョネギ公園など）はコースから外します","ジップラインなど体に負担のかかる体験はおすすめしません","歩く速さをゆっくりめにして、移動時間に余裕を持たせます","徒歩10分を超える区間はタクシーをおすすめします"]},
zh:{h:"我们会这样照顾您的行程",ok:"知道了",items:["排除台阶较多的地方（白滩文化村、Jonaegi公园等）","不推荐滑索等体力消耗大的体验","按较慢的步行速度计算，留出充足的移动时间","步行超过10分钟的路段推荐乘出租车"]}};
function showCareInfo(opener,onDone){
  const C=CARE_T[state.lang]||CARE_T.en;
  const chk='<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" style="flex:none;margin-top:1px"><circle cx="12" cy="12" r="10" fill="#1d6fe8"/><path d="M7 12.5l3.2 3.2L17 9" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const m=document.createElement("div");m.className="pmodal";
  m.innerHTML=`<div class="pm-box" role="dialog" aria-modal="true" aria-labelledby="care-t">
    <h2 id="care-t" style="font-size:19px">${C.h}</h2>
    <ul style="list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:12px">${C.items.map(s=>`<li style="display:flex;gap:10px;line-height:1.5">${chk}<span>${s}</span></li>`).join("")}</ul>
    <div class="pm-act"><button class="btn" type="button" data-care="ok">${C.ok}</button></div></div>`;
  document.body.appendChild(m);
  const prevOv=document.body.style.overflow;document.body.style.overflow="hidden";
  const close=()=>{
    document.removeEventListener("keydown",onKey);document.body.style.overflow=prevOv;m.remove();
    if(opener&&opener.isConnected)opener.focus();
    if(onDone)onDone();
  };
  const onKey=e=>{if(e.key==="Escape"||e.key==="Tab"){e.preventDefault();if(e.key==="Escape")close()}};
  document.addEventListener("keydown",onKey);
  m.onclick=e=>{if(e.target===m||e.target.closest("[data-care]"))close()};
  m.querySelector("[data-care]").focus();
}
