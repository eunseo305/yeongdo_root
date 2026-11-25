/* 공중화장실: 결과 화면 지도에 "내 주변 가까운 공중화장실 5곳" 켜기/끄기
   담당: ③ AI·동선
   - 데이터: toilets.csv (부산 영도구 공중 화장실 CSV를 이름만 바꿔 복사한 것)
     열: 번호,이름,주소,개방시간_설명,데이터기준일,위도,경도
   - 버튼을 처음 누를 때 한 번만 CSV를 불러옴. 처음 화면은 항상 꺼짐(wcOn=false)
   - 켜면 브라우저 위치(GPS)를 계속 받아서(watchPosition) 가장 가까운 5곳만 표시
     · 위치를 못 받거나(권한 거절·오류·10초 초과) 영도에서 멀면(가장 가까운 화장실이 2km 넘음)
       크루즈터미널(T) 기준 5곳
     · 거리는 직선거리 (걷는 길 거리 아님)
   - 화장실 마커는 nWc 목록에 따로 담아 두고 그것만 지움 → 동선·관광지·광고·맛집 표시는 그대로 */
const WCT={
ko:{show:"🚻 화장실 표시",hide:"🚻 화장실 숨기기",loading:"🚻 불러오는 중…",fail:"🚻 불러오지 못했어요",wc:"공중화장실",open:"개방",
  near:"가까운 공중화장실 5곳",me:"내 위치",byMe:"내 위치 기준 · 직선거리",byT:"크루즈터미널 기준 · 직선거리",
  noLoc:"위치를 확인할 수 없어 크루즈터미널 기준으로 보여 드려요.",far:"지금 영도에서 멀리 계셔서 크루즈터미널 기준으로 보여 드려요."},
en:{show:"🚻 Show restrooms",hide:"🚻 Hide restrooms",loading:"🚻 Loading…",fail:"🚻 Couldn't load",wc:"Public restroom",open:"Open",
  near:"5 nearest public restrooms",me:"You are here",byMe:"From your location · straight-line",byT:"From the cruise terminal · straight-line",
  noLoc:"Couldn't get your location, so showing restrooms near the cruise terminal.",far:"You're far from Yeongdo, so showing restrooms near the cruise terminal."},
ja:{show:"🚻 トイレ表示",hide:"🚻 トイレ非表示",loading:"🚻 読み込み中…",fail:"🚻 読み込めません",wc:"公衆トイレ",open:"開放",
  near:"近くの公衆トイレ5か所",me:"現在地",byMe:"現在地から・直線距離",byT:"クルーズターミナルから・直線距離",
  noLoc:"現在地を取得できないため、クルーズターミナル基準で表示しています。",far:"影島から離れているため、クルーズターミナル基準で表示しています。"},
zh:{show:"🚻 显示厕所",hide:"🚻 隐藏厕所",loading:"🚻 加载中…",fail:"🚻 无法加载",wc:"公共厕所",open:"开放",
  near:"附近的5个公共厕所",me:"我的位置",byMe:"距我的位置·直线距离",byT:"距邮轮码头·直线距离",
  noLoc:"无法获取您的位置，按邮轮码头显示。",far:"您离影岛较远，按邮轮码头显示。"}};
const WC_API="source/toilets.csv";
/* 좌표가 잘못된 것으로 보여 지도에 표시하지 않는 번호 (원본 CSV는 그대로 둠)
   10251 흰여울마을안내센터: 위도 35.173171 → 영도 밖
   48315 7-1 주차장: 경도 129.008211 → 영도 밖
   48510·48524~48528 태종대유원지 화장실 6곳: 모두 같은 임시 좌표(35.05, 129.08) */
const WC_SKIP=new Set(["10251","48315","48510","48524","48525","48526","48527","48528"]);
/* 48333 흰여울마을 안내센터(2층): 주소는 절영로 194인데 좌표가 영선2동행정복지센터(10506)와 같음 → 확인 전까지 보류(그대로 표시) */
const WC_KEEP=new Set(["48333"]);
const WC_N=5,WC_FAR_M=2000;
let wcOn=false,wcList=null,wcP=null,wcSel=null,nWc=[];
/* wcBase: 기준점 {ll:[위도,경도], src:"me"(내 위치)|"term"(터미널), why:"noLoc"|"far"|""}
   wcNear: 기준점에서 가까운 5곳 [{w,d}]   wcWatch: 위치 추적 번호   wcTok: 켜기/끄기 순번(늦게 온 응답 무시) */
let wcBase=null,wcNear=[],wcWatch=null,wcTok=0,wcPrevFull=null;

/* 따옴표("…,…") 안의 쉼표를 처리하는 작은 CSV 읽기 함수 */
function parseCSV(txt){
  const rows=[];let row=[],f="",q=false;
  txt=txt.replace(/^﻿/,"");
  for(let i=0;i<txt.length;i++){
    const c=txt[i];
    if(q){if(c==='"'){if(txt[i+1]==='"'){f+='"';i++}else q=false}else f+=c}
    else if(c==='"')q=true;
    else if(c===","){row.push(f);f=""}
    else if(c==="\n"){row.push(f.replace(/\r$/,""));rows.push(row);row=[];f=""}
    else f+=c;
  }
  if(f||row.length){row.push(f.replace(/\r$/,""));rows.push(row)}
  return rows;
}
function loadWc(){
  if(wcList)return Promise.resolve(wcList);
  if(wcP)return wcP;
  wcP=fetch(WC_API).then(res=>{if(!res.ok)throw res.status;return res.text()}).then(txt=>{
    const [head,...rows]=parseCSV(txt),ix=n=>head.indexOf(n);
    const iId=ix("번호"),iN=ix("이름"),iA=ix("주소"),iO=ix("개방시간_설명"),iD=ix("데이터기준일"),iLa=ix("위도"),iLn=ix("경도");
    const all=rows.map(c=>({id:c[iId],n:c[iN],addr:c[iA],open:c[iO],date:c[iD]||"",ll:[+c[iLa],+c[iLn]]}))
      .filter(w=>w.id&&!WC_SKIP.has(w.id)&&isFinite(w.ll[0])&&isFinite(w.ll[1])&&w.ll[0]&&w.ll[1]);
    /* 같은 화장실이 데이터기준일만 다르게 두 번 들어 있는 경우가 있어(예: 절영해안산책로2호 2023·2024)
       30m 안에 있고 이름이나 주소가 같으면 한 곳으로 보고, 데이터기준일이 최신인 줄을 씀.
       (주소는 "태종로 290 (청학동)"과 "태종로 290(청학동)"처럼 띄어쓰기만 다른 경우도 같게 봄) */
    /* 좌표가 완전히 같으면 이름이 달라도 한 곳만 표시 (예: 태종대유원지 제4·5호 → 제4호, 실내사격장 1층·2층 → 하나)
       단, WC_KEEP은 좌표 확인 중이라 일단 그대로 둠 */
    const key=s=>(s||"").replace(/\s+/g,""),same=(a,b)=>a.ll[0]===b.ll[0]&&a.ll[1]===b.ll[1];
    wcList=[];
    all.sort((a,b)=>b.date.localeCompare(a.date)||(+a.id)-(+b.id)).forEach(w=>{
      if(!wcList.some(k=>(distM(k.ll,w.ll)<=30&&(key(k.n)===key(w.n)||key(k.addr)===key(w.addr)))||(same(k,w)&&!WC_KEEP.has(k.id)&&!WC_KEEP.has(w.id))))wcList.push(w);
    });
    return wcList;
  }).catch(e=>{wcP=null;throw e}); // 실패하면 다음에 누를 때 다시 시도
  return wcP;
}
const wcLabel=w=>w.n+(w.open?` · ${WCT[state.lang].open} ${w.open}`:"");
const fmtM=d=>d<1000?`${Math.round(d/10)*10}m`:`${(d/1000).toFixed(1)}km`;

/* ---------- 가까운 5곳 고르기 ---------- */
function nearestWc(ll){return wcList.map(w=>({w,d:distM(ll,w.ll)})).sort((a,b)=>a.d-b.d).slice(0,WC_N)}
/* 위치(pos)가 있으면 내 위치 기준, 없거나 영도에서 멀면 터미널 기준 */
function setWcBase(pos,why){
  if(pos){
    const ll=[pos.coords.latitude,pos.coords.longitude],nr=nearestWc(ll);
    if(nr.length&&nr[0].d<=WC_FAR_M){wcBase={ll,src:"me",why:""};wcNear=nr;return}
    why="far";
  }
  wcBase={ll:COORD.T,src:"term",why:why||"noLoc"};wcNear=nearestWc(COORD.T);
}
/* 위치 추적 시작. 첫 위치(또는 실패)가 정해지면 resolve */
function startWcWatch(tok,onUpdate){
  return new Promise(res=>{
    let first=true;const done=()=>{if(first){first=false;clearTimeout(tm);res()}};
    const tm=setTimeout(()=>{if(first){setWcBase(null,"noLoc");done()}},10000);
    const geo=myGeo(); // 13c-myloc.js: 테스트 위치(MYLOC_TEST)가 있으면 그 값, 없으면 실제 GPS
    if(!geo){setWcBase(null,"noLoc");done();return}
    wcWatch=geo.watchPosition(pos=>{
      if(tok!==wcTok)return;
      if(first){setWcBase(pos);done();return}
      onUpdate(pos);
    },err=>{
      if(tok!==wcTok)return;
      if(first){setWcBase(null,"noLoc");done();return}
      if(err.code===1)onUpdate(null); // 도중에 권한을 끄면 터미널 기준으로
    },{enableHighAccuracy:true,maximumAge:10000,timeout:15000});
  });
}
function wcStop(){
  wcTok++;
  const geo=myGeo();if(wcWatch!==null&&geo)geo.clearWatch(wcWatch);
  wcWatch=null;wcOn=false;wcSel=null;wcBase=null;wcNear=[];clearOverlays(nWc);
}

/* ---------- 지도 화면 맞추기 ---------- */
// 켤 때: 기준점 + 5곳이 다 보이게 (약도는 전체 보기로)
function fitWc(){
  if(!wcBase)return;
  if(nmapObj&&document.getElementById("nmap")?.style.display!=="none"){
    const N=naver.maps,pts=[wcBase.ll,...wcNear.map(v=>v.w.ll)];
    const la=pts.map(p=>p[0]),ln=pts.map(p=>p[1]);
    nmapObj.fitBounds(new N.LatLngBounds(new N.LatLng(Math.min(...la),Math.min(...ln)),new N.LatLng(Math.max(...la),Math.max(...ln))));
    if(nmapObj.getZoom()>17)nmapObj.setZoom(17);
  }else{
    if(wcPrevFull===null)wcPrevFull=state.mapFull;
    state.mapFull=true;const zt=document.getElementById("zoomToggle");if(zt)zt.textContent=MAPT[state.lang].zoom;
  }
}
// 끌 때: 원래 동선 화면으로
function unfitWc(){
  if(wcPrevFull!==null){state.mapFull=wcPrevFull;wcPrevFull=null;const zt=document.getElementById("zoomToggle");if(zt)zt.textContent=state.mapFull?MAPT[state.lang].zoom:MAPT[state.lang].full}
  if(nmapObj&&lastR){
    const N=naver.maps,path=["T",...lastR.sim.stops.map(st=>st.p.id)].map(id=>COORD[id]);
    const la=path.map(p=>p[0]),ln=path.map(p=>p[1]);
    nmapObj.fitBounds(new N.LatLngBounds(new N.LatLng(Math.min(...la),Math.min(...ln)),new N.LatLng(Math.max(...la),Math.max(...ln))));
  }
}

/* ---------- 그리기 ---------- */
/* 약도(SVG)용: 보라색 둥근 네모 + 🚻 (관광지=숫자 원, 광고=빨강 AD, 맛집=초록 점과 구분) + 파란 내 위치 점 */
function wcSvg(){
  if(!wcOn||!wcList||!wcBase)return "";
  const k=(1/ZK).toFixed(3),L=state.lang;
  const pins=wcNear.map(({w})=>{const [x,y]=proj(...w.ll),sel=wcSel===w.id;
    return `<g class="wc-pin" data-wc="${esc(w.id)}" tabindex="0" role="button" aria-label="${esc(WCT[L].wc+": "+w.n)}" transform="translate(${x} ${y}) scale(${k})">
      <title>${esc(wcLabel(w))}</title>
      <rect x="-8" y="-8" width="16" height="16" rx="4" fill="#7b4fd6" stroke="${sel?"#191f28":"#fff"}" stroke-width="1.6"/>
      <text y="3.6" text-anchor="middle" font-size="10">🚻</text>
      ${sel?`<text x="0" y="20" text-anchor="middle" font-size="10.5" font-weight="600" fill="#4a2a9a" stroke="#fff" stroke-width="3" paint-order="stroke">${esc(wcLabel(w))}</text>`:""}</g>`}).join("");
  let me="";
  if(wcBase.src==="me"&&!myLocOn){const [x,y]=proj(...wcBase.ll); // 내 위치 버튼 점이 있으면 겹치지 않게 생략
    me=`<g transform="translate(${x} ${y}) scale(${k})" aria-label="${esc(WCT[L].me)}"><title>${esc(WCT[L].me)}</title><circle r="13" fill="#1a73e8" opacity=".18"/><circle r="6.5" fill="#1a73e8" stroke="#fff" stroke-width="2.5"/></g>`}
  return `<g class="wc-layer">${pins}${me}</g>`;
}
/* 네이버 지도용 */
function drawNaverWc(){
  clearOverlays(nWc);
  if(!wcOn||!wcList||!wcBase||!nmapObj)return;
  const N=naver.maps,L=state.lang;
  wcNear.forEach(({w})=>{
    const sel=wcSel===w.id;
    const html=`<div class="nwc${sel?" on":""}" role="button" title="${esc(wcLabel(w))}" aria-label="${esc(WCT[L].wc+": "+w.n)}"><span class="ic">🚻</span>${sel?`<span class="nm">${esc(wcLabel(w))}</span>`:""}</div>`;
    const mk=new N.Marker({map:nmapObj,position:new N.LatLng(...w.ll),icon:{content:html,anchor:new N.Point(10,10)},zIndex:sel?3:1});
    N.Event.addListener(mk,"click",()=>{wcSel=sel?null:w.id;drawNaverWc();renderWcPanel()});
    nWc.push(mk);
  });
  if(wcBase.src==="me"&&!myLocOn)nWc.push(new N.Marker({map:nmapObj,position:new N.LatLng(...wcBase.ll),zIndex:4,
    icon:{content:`<div class="nme" title="${esc(WCT[L].me)}" aria-label="${esc(WCT[L].me)}"></div>`,anchor:new N.Point(13,13)}}));
}
/* 지도 아래 5곳 목록 */
function wcPanelHTML(){
  if(!wcOn||!wcBase||!wcNear.length)return "";
  const A=WCT[state.lang];
  return `<div class="wcpanel">
    <p class="wch"><b>🚻 ${A.near}</b><span class="muted">${wcBase.src==="me"?A.byMe:A.byT}</span></p>
    ${wcBase.why?`<p class="wcnote">${A[wcBase.why]}</p>`:""}
    <ol class="wclist">${wcNear.map(({w,d},i)=>`<li><button type="button" data-wcl="${esc(w.id)}" aria-pressed="${wcSel===w.id}">
      <span class="n">${i+1}</span><span class="t"><b>${esc(w.n)}</b><small>${w.open?esc(A.open+" "+w.open):""}</small></span><span class="d">${fmtM(d)}</span></button></li>`).join("")}</ol></div>`;
}
function renderWcPanel(){
  const p=document.getElementById("wcPanel");if(!p)return;
  p.innerHTML=wcPanelHTML();
  p.querySelectorAll("[data-wcl]").forEach(b=>b.onclick=()=>{
    const id=b.dataset.wcl;wcSel=wcSel===id?null:id;
    const v=wcNear.find(x=>x.w.id===id);
    if(lastR)refreshMap(lastR);drawNaverWc();
    if(wcSel&&v&&nmapObj)nmapObj.panTo(new naver.maps.LatLng(...v.w.ll));
  });
}
function wcBtnHTML(){
  return `<button type="button" class="adtoggle wctoggle" id="wcToggle" aria-pressed="${wcOn}">${wcOn?WCT[state.lang].hide:WCT[state.lang].show}</button>`;
}
/* 걷는 중 위치가 바뀌었을 때: 다시 고르고 다시 그림 (화면은 처음 켤 때와 터미널→내 위치로 바뀔 때만 이동) */
function onWcMove(pos){
  if(!wcOn)return;
  if(state.screen!=="result"){wcStop();unfitWc();return} // 결과 화면을 떠나면 위치 추적 멈춤
  const before=wcBase,ids=wcNear.map(v=>v.w.id).join();
  setWcBase(pos,pos?"":"noLoc");
  const moved=!before||before.src!==wcBase.src||distM(before.ll,wcBase.ll)>15;
  if(!moved&&ids===wcNear.map(v=>v.w.id).join())return;
  if(wcSel&&!wcNear.some(v=>v.w.id===wcSel))wcSel=null;
  if(lastR)refreshMap(lastR);drawNaverWc();
  if(before&&before.src!=="me"&&wcBase.src==="me")return fitWc();
  // 걷다가 내 위치나 5곳 중 하나가 지도 화면 밖으로 나가면 다시 맞춤
  if(nmapObj&&document.getElementById("nmap")?.style.display!=="none"){
    const bd=nmapObj.getBounds();
    if([wcBase.ll,...wcNear.map(v=>v.w.ll)].some(p=>!bd.hasLatLng(new naver.maps.LatLng(...p))))fitWc();
  }
}
/* 버튼과 약도 마커에 동작 연결 (refreshMap·renderResult에서 부름) */
function wireWc(r){
  document.querySelectorAll("#smap [data-wc]").forEach(el=>{
    const pick=()=>{wcSel=wcSel===el.dataset.wc?null:el.dataset.wc;refreshMap(r)};
    el.onclick=pick;
    el.onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();pick()}};
  });
  renderWcPanel();
  const b=document.getElementById("wcToggle");if(!b)return;
  b.onclick=()=>{
    if(wcOn){wcStop();unfitWc();refreshMap(r);syncWcBtn();return}
    const tok=++wcTok;
    b.disabled=true;b.textContent=WCT[state.lang].loading;
    loadWc().then(()=>startWcWatch(tok,onWcMove)).then(()=>{
      if(tok!==wcTok)return;
      wcOn=true;fitWc();refreshMap(lastR||r);drawNaverWc();
    }).catch(()=>{wcStop();const x=document.getElementById("wcToggle");if(x){x.textContent=WCT[state.lang].fail;setTimeout(syncWcBtn,2000)}})
      .finally(()=>{const x=document.getElementById("wcToggle");if(x)x.disabled=false;if(wcOn)syncWcBtn()});
  };
}
function syncWcBtn(){
  const b=document.getElementById("wcToggle");if(!b)return;
  b.setAttribute("aria-pressed",String(wcOn));b.textContent=wcOn?WCT[state.lang].hide:WCT[state.lang].show;
}
