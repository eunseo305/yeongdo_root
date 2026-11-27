/* 영도 루트 관리자 페이지: Worker(/admin/stats)에서 실제 이용 기록을 받아 보여줌
   담당: ④ 데이터·운영
   비밀번호 = Worker의 ADMIN_TOKEN Secret (npx wrangler secret put ADMIN_TOKEN). 이 브라우저 탭을 닫으면 잊음 */

// js/07-ai.js의 AI_PROXY와 같은 Worker 주소
const API="https://yeongdo-ai.yeongdoroot.workers.dev";

const KO=T.ko;
const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const placeName=(id,name)=>id==="food"?`🍴 ${name||"맛집"}`:id==="custom"?"직접 추가한 장소":(PLACES.find(p=>p.id===id)?.name.ko||id).replace(/ \(.*\)/,"");
const LANG_KO={ko:"한국어",en:"영어",ja:"일본어",zh:"중국어"};
const pct=(a,b)=>b?Math.round(a/b*100):0;
const hm=m=>m==null?"":String(Math.floor(m/60)%24).padStart(2,"0")+":"+String(m%60).padStart(2,"0");
const kst=ts=>new Date(ts+9*3600e3);
const ymd=ts=>kst(ts).toISOString().slice(0,10);
const when=ts=>{const d=kst(ts).toISOString();return d.slice(5,10).replace("-","/")+" "+d.slice(11,16)};
const main=document.getElementById("main");

let token=sessionStorage.getItem("yd-admin")||"";
let data=null;

/* ---------- 로그인 ---------- */
function showLogin(msg){
  document.getElementById("hdrCtl").hidden=true;
  main.innerHTML=`<form class="card login" id="loginForm">
    <h2>관리자 로그인</h2>
    <p class="sub" style="margin:0">관리자 비밀번호를 넣어 주세요.</p>
    <input type="password" id="pw" autocomplete="current-password" placeholder="비밀번호" required>
    <p class="err" id="loginErr">${esc(msg||"")}</p>
    <button class="btn" type="submit">들어가기</button>
  </form>`;
  const pw=document.getElementById("pw");pw.focus();
  document.getElementById("loginForm").onsubmit=e=>{e.preventDefault();token=pw.value.trim();load()};
}

async function load(){
  const days=document.getElementById("days").value;
  if(data)main.style.opacity=.5;
  let r,j;
  try{
    r=await fetch(`${API}/admin/stats?days=${days}`,{headers:{Authorization:"Bearer "+token},cache:"no-store"});
    j=await r.json().catch(()=>({}));
  }catch(e){main.style.opacity=1;return showLogin("서버에 연결하지 못했어요. 인터넷 연결이나 Worker 배포 상태를 확인해 주세요.")}
  main.style.opacity=1;
  if(r.status===401){sessionStorage.removeItem("yd-admin");return showLogin(token?"비밀번호가 맞지 않아요.":"")}
  if(!r.ok){
    const why={no_admin_token:"Worker에 ADMIN_TOKEN이 아직 없어요. worker 폴더에서 npx wrangler secret put ADMIN_TOKEN 을 실행해 주세요.",
      no_db:"Worker에 D1 데이터베이스(DB)가 연결되지 않았어요. wrangler.jsonc의 database_id를 확인하고 다시 배포해 주세요.",
      origin:"이 주소는 Worker의 ALLOWED_ORIGINS에 없어요."}[j.error]||`서버 오류 (${r.status}) ${j.detail||""}`;
    return showLogin(why);
  }
  sessionStorage.setItem("yd-admin",token);
  data=j;
  document.getElementById("hdrCtl").hidden=false;
  renderAll();
}
document.getElementById("days").onchange=load;
document.getElementById("reload").onclick=load;
document.getElementById("logout").onclick=()=>{sessionStorage.removeItem("yd-admin");token="";data=null;showLogin()};

/* ---------- 차트 조각 ---------- */
// 세로 막대: items=[{label,v,tip,dim}], labelEvery=몇 칸마다 아래 글자를 쓸지
function colsHTML(items,labelEvery=1){
  const max=Math.max(1,...items.map(i=>i.v));
  const step=niceStep(max),lines=[];
  for(let y=step;y<=max;y+=step)lines.push(`<div class="gl" style="bottom:${y/max*100}%"><span>${y}</span></div>`);
  return `<div class="cols">${lines.join("")}${items.map(i=>`<div class="c${i.dim?" dim":""}" data-tip="${esc(i.tip)}"><b style="height:${i.v/max*100}%"></b></div>`).join("")}</div>
  <div class="xlab">${items.map((i,k)=>`<span>${k%labelEvery===0?esc(i.label):""}</span>`).join("")}</div>`;
}
function niceStep(max){const raw=max/3,p=10**Math.floor(Math.log10(raw||1)),m=raw/p;return Math.max(1,(m<1.5?1:m<3.5?2:5)*p)}
// 가로 막대: rows=[{name,v,text,tip}]
function hbarHTML(rows,max){
  if(!rows.length)return `<p class="empty">아직 기록이 없어요</p>`;
  max=max||Math.max(1,...rows.map(r=>r.v));
  return `<div class="hb">${rows.map(r=>`<span class="nm" title="${esc(r.name)}">${esc(r.name)}</span><span class="tr" data-tip="${esc(r.tip||"")}"><b style="width:${r.v/max*100}%"></b></span><span class="v">${r.text??r.v}</span>`).join("")}</div>`;
}
function countBy(list,keyFn){const m=new Map();list.forEach(x=>[].concat(keyFn(x)).forEach(k=>{if(k!=null)m.set(k,(m.get(k)||0)+1)}));return [...m].sort((a,b)=>b[1]-a[1])}
function shareRows(pairs,total,label){return pairs.map(([k,n])=>({name:label(k),v:n,text:`${pct(n,total)}%`,tip:`${label(k)}: ${n}건 (${pct(n,total)}%)`}))}

/* ---------- 화면 ---------- */
function renderAll(){
  const d=data,P=d.plans,V=d.visits;
  const planUsers=new Set(P.map(p=>p.sid)).size;
  const avgStops=P.length?(P.reduce((n,p)=>n+p.stops.length,0)/P.length).toFixed(1):"-";

  // 일별: 빠진 날짜도 0으로 채움
  const dayMap=new Map(V.byDay.map(x=>[x.d,x]));
  const planDay=new Map(countBy(P,p=>ymd(p.created)));
  const days=[];
  for(let t=Math.max(d.since,Date.now()-(d.days-1)*864e5);ymd(t)<=ymd(Date.now());t+=864e5){
    const k=ymd(t),x=dayMap.get(k)||{n:0,u:0};days.push({k,...x,p:planDay.get(k)||0});
  }
  const hourMap=new Map(V.byHour.map(x=>[x.h,x.n]));
  const hours=[...Array(24)].map((_,h)=>({h,n:hourMap.get(h)||0}));
  const peak=hours.reduce((a,b)=>b.n>a.n?b:a);

  // 장소: 코스에 들어간 횟수, 손님이 바꾼 평균 머무는 시간 vs 기본값
  const pl=new Map();
  // 맛집은 가게마다 따로 셈 (food:가게이름)
  P.forEach(p=>p.stops.forEach(s=>{const k=s.id==="food"?"food:"+(s.name||""):s.id;const o=pl.get(k)||{n:0,dw:0};o.n++;o.dw+=s.dw||0;pl.set(k,o)}));
  const placeRows=[...pl].sort((a,b)=>b[1].n-a[1].n).map(([k,o])=>{
    const [id,fname]=k.startsWith("food:")?["food",k.slice(5)]:[k],label=placeName(id,fname);
    const base=PLACES.find(p=>p.id===id)?.dwell,avg=Math.round(o.dw/o.n),diff=base!=null?avg-base:null;
    return {id,label,n:o.n,avg,base,diff};
  });

  const ships=countBy(P,p=>p.ship_name||p.ship);
  const langs=V.byLang.map(x=>[x.lang||"?",x.n]);
  const comps=countBy(P,p=>p.comp);
  const ints=countBy(P,p=>p.interests);
  const revAvg=d.reviews.length?(d.reviews.reduce((n,r)=>n+r.stars,0)/d.reviews.length).toFixed(1):"-";

  main.innerHTML=`
  <div class="kpis">
    ${kpi(V.total.toLocaleString(),"접속 수",`기기 ${V.users.toLocaleString()}대`)}
    ${kpi(P.length.toLocaleString(),"만든 코스",`평균 ${avgStops}곳`)}
    ${kpi(pct(planUsers,V.users)+"%","코스까지 간 비율","코스 만든 기기 ÷ 접속 기기")}
    ${kpi(pct(P.filter(p=>p.ai).length,P.length)+"%","AI로 물어본 코스","")}
    ${kpi(pct(P.filter(p=>p.custom).length,P.length)+"%","경로 직접 수정","순서·장소를 바꾼 코스")}
    ${kpi(pct(P.filter(p=>p.over).length,P.length)+"%","귀선 시간 초과","수정 후 시간이 넘친 코스")}
    ${kpi(revAvg,"평균 후기 별점",`후기 ${d.reviews.length}개`)}
  </div>

  <div class="grid2">
    <section class="card"><h2>일별 접속</h2><p class="sub">한국 시간 기준 · 막대에 마우스를 올리면 자세히</p>
      ${colsHTML(days.map(x=>({label:x.k.slice(5).replace("-","/"),v:x.n,tip:`${x.k}\n접속 ${x.n} · 기기 ${x.u} · 코스 ${x.p}`})),Math.ceil(days.length/8))}</section>
    <section class="card"><h2>시간대별 접속</h2><p class="sub">${peak.n?`${peak.h}시에 가장 많이 들어와요`:"아직 기록이 없어요"}</p>
      ${colsHTML(hours.map(x=>({label:x.h,v:x.n,dim:x.h!==peak.h,tip:`${x.h}시 ~ ${x.h+1}시\n접속 ${x.n}`})),3)}</section>
  </div>

  <section class="card">
    <div class="row"><div><h2>장소별 인기와 머무는 시간</h2><p class="sub">코스에 들어간 횟수 · 손님이 정한 평균 머무는 시간과 앱 기본값의 차이 (오래 머무는 곳일수록 +)</p></div></div>
    ${placeRows.length?`<div class="tbl"><table><thead><tr><th>장소</th><th style="width:40%">코스에 들어간 횟수</th><th class="num">평균 머문 시간</th><th class="num">기본값</th><th class="num">차이</th></tr></thead><tbody>
      ${(()=>{const mx=placeRows[0].n;return placeRows.map(r=>`<tr><td>${esc(r.label)}</td>
        <td><div class="hb" style="grid-template-columns:1fr 44px"><span class="tr" data-tip="${esc(r.label)}: ${r.n}회 (코스의 ${pct(r.n,P.length)}%)"><b style="width:${r.n/mx*100}%"></b></span><span class="v">${r.n}</span></div></td>
        <td class="num">${r.avg}분</td><td class="num">${r.base!=null?r.base+"분":"-"}</td>
        <td class="num ${r.diff>0?"up":r.diff<0?"down":""}">${r.diff==null?"-":(r.diff>0?"+":"")+r.diff+"분"}</td></tr>`).join("")})()}
    </tbody></table></div>`:`<p class="empty">아직 기록이 없어요</p>`}
  </section>

  <div class="grid3">
    <section class="card"><h2>크루즈별 코스</h2><p class="sub">어느 배 손님이 많이 썼는지</p>${hbarHTML(ships.slice(0,10).map(([k,n])=>({name:k,v:n,tip:`${k}: 코스 ${n}개`})))}</section>
    <section class="card"><h2>화면 언어</h2><p class="sub">접속 기준</p>${hbarHTML(shareRows(langs,V.total,k=>LANG_KO[k]||k),V.total)}</section>
    <section class="card"><h2>누구와 왔나</h2><p class="sub">코스 기준</p>${hbarHTML(shareRows(comps,P.length,k=>KO.comp[k]||k),P.length)}</section>
    <section class="card"><h2>관심사</h2><p class="sub">코스 기준 · 여러 개 고를 수 있어 합이 100%를 넘어요</p>${hbarHTML(shareRows(ints,P.length,k=>KO.int[k]||k),P.length)}</section>
  </div>

  <section class="card">
    <div class="row"><div><h2>최근 코스</h2><p class="sub">최근 ${Math.min(P.length,200)}개 · 시간은 한국 시간</p></div>
      <button class="btn ghost" type="button" id="csvBtn" ${P.length?"":"disabled"}>CSV 내려받기 (${P.length}개)</button></div>
    ${P.length?`<div class="tbl"><table><thead><tr><th>만든 때</th><th>크루즈</th><th>동행</th><th>관심사</th><th>코스</th><th class="num">관광 시간</th><th>표시</th></tr></thead><tbody>
      ${P.slice(0,200).map(p=>`<tr><td style="white-space:nowrap">${when(p.created)}</td><td>${esc(p.ship_name||p.ship||"")}${p.cdate?`<br><small style="color:var(--muted)">${esc(p.cdate)}</small>`:""}</td>
        <td>${esc(KO.comp[p.comp]||"")}</td><td>${p.interests.map(k=>`<span class="tag">${esc(KO.int[k]||k)}</span>`).join("")}</td>
        <td>${p.stops.map(s=>esc(placeName(s.id,s.name))).join(" → ")||'<span style="color:var(--muted)">없음</span>'}</td>
        <td class="num" style="white-space:nowrap">${hm(p.start_min)}–${hm(p.end_min)}</td>
        <td>${p.ai?'<span class="tag">AI</span>':""}${p.custom?'<span class="tag">수정</span>':""}${p.over?'<span class="tag bad">초과</span>':""}${LANG_KO[p.lang]?`<span class="tag">${LANG_KO[p.lang]}</span>`:""}</td></tr>`).join("")}
    </tbody></table></div>`:`<p class="empty">아직 만든 코스가 없어요. 관광객 화면에서 코스를 만들면 여기에 쌓여요.</p>`}
  </section>

  <section class="card"><h2>후기</h2><p class="sub">관광객이 보낸 후기 (최근 300개)</p>
    ${d.reviews.length?d.reviews.map(r=>`<div class="rv"><div class="meta">${"★".repeat(r.stars)}${"☆".repeat(5-r.stars)} · ${esc(placeName(r.place))} · ${LANG_KO[r.lang]||""} · ${when(r.ts)}</div>${r.text?esc(r.text):'<span style="color:var(--muted)">별점만 남김</span>'}</div>`).join(""):`<p class="empty">아직 받은 후기가 없어요. 관광객 화면에 후기 입력이 다시 생기면 여기에 쌓여요.</p>`}
  </section>`;

  const cb=document.getElementById("csvBtn");if(cb)cb.onclick=downloadCSV;
}
const kpi=(n,l,h)=>`<div class="kpi"><div class="n">${n}</div><div class="l">${l}</div>${h?`<div class="h">${h}</div>`:""}</div>`;

function downloadCSV(){
  const q=v=>`"${String(v??"").replace(/"/g,'""')}"`;
  const head=["만든때(KST)","언어","크루즈","크루즈날짜","동행","관심사","날씨","AI","직접수정","시간초과","출발","터미널도착","장소(머문분)"];
  const rows=data.plans.map(p=>[kst(p.created).toISOString().slice(0,16).replace("T"," "),LANG_KO[p.lang]||p.lang,p.ship_name||p.ship,p.cdate,KO.comp[p.comp]||p.comp,
    p.interests.map(k=>KO.int[k]||k).join("/"),p.weather,p.ai?"Y":"",p.custom?"Y":"",p.over?"Y":"",hm(p.start_min),hm(p.end_min),
    p.stops.map(s=>`${placeName(s.id,s.name)}(${s.dw})`).join(" > ")]);
  const csv="﻿"+[head,...rows].map(r=>r.map(q).join(",")).join("\r\n"); // ﻿: 엑셀에서 한글 안 깨지게
  const a=document.createElement("a");
  a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));
  a.download=`영도루트-코스-${ymd(Date.now())}.csv`;a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}

/* ---------- 마우스 올리면 뜨는 설명 ---------- */
const tip=document.getElementById("tip");
document.addEventListener("pointermove",e=>{
  const el=e.target.closest?.("[data-tip]");
  if(!el||!el.dataset.tip){tip.style.display="none";return}
  tip.textContent=el.dataset.tip;tip.style.display="block";
  const w=tip.offsetWidth,x=Math.min(e.clientX+12,innerWidth-w-8);
  tip.style.left=x+"px";tip.style.top=(e.clientY-tip.offsetHeight-10)+"px";
});

if(token)load();else showLogin();
