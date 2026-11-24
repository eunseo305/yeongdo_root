/* 지도: 약도(SVG), 네이버 지도, 광고(제휴) 식당 표시
   담당: ③ AI·동선 */

/* ---------- 지도 ----------
   NAVER_KEY_ID: 네이버 클라우드 플랫폼(ncloud.com) 콘솔 → Maps → Application의 Client ID.
   이 파일을 연 주소(예: https://yeongdo-root.netlify.app, http://127.0.0.1:5500)가
   그 Application의 Web 서비스 URL에 등록되어 있어야 실제 네이버 지도 위에 동선이 그려집니다.
   키가 없거나 지도 SDK를 불러올 수 없는 곳(예: Claude 아티팩트)에서는 영도 약도(SVG)로 대신 그립니다. */
const CONFIG={NAVER_KEY_ID:"yre6gldlbd"};
const TERM_NAME={ko:"크루즈터미널",en:"Cruise Terminal",ja:"クルーズターミナル",zh:"邮轮码头"};
const MAPT={
ko:{full:"전체 보기",zoom:"동선 확대",sketch:"영도 약도 · 위치는 대략적이에요",real:"지도 데이터 © NAVER Corp.",legend:"숫자 = 방문 순서"},
en:{full:"Whole island",zoom:"Zoom to route",sketch:"Sketch map of Yeongdo · positions approximate",real:"Map data © NAVER Corp.",legend:"Numbers = visit order"},
ja:{full:"全体表示",zoom:"ルート拡大",sketch:"影島の略図・位置はおおよそです",real:"地図データ © NAVER Corp.",legend:"数字＝訪問順"},
zh:{full:"查看全岛",zoom:"放大路线",sketch:"影岛示意图·位置为大致",real:"地图数据 © NAVER Corp.",legend:"数字＝游览顺序"}};
/* 결과 화면 카테고리 탭 이름 */
const TABT={
ko:{aria:"결과 바로가기",map:"🗺️ 지도",tl:"🕒 일정",food:"🍜 맛집",why:"💡 추천 이유",fb:"⭐ 후기"},
en:{aria:"Jump to section",map:"🗺️ Map",tl:"🕒 Schedule",food:"🍜 Food",why:"💡 Why",fb:"⭐ Review"},
ja:{aria:"セクションへ移動",map:"🗺️ 地図",tl:"🕒 日程",food:"🍜 グルメ",why:"💡 理由",fb:"⭐ 感想"},
zh:{aria:"跳转到",map:"🗺️ 地图",tl:"🕒 行程",food:"🍜 美食",why:"💡 理由",fb:"⭐ 评价"}};
const TAB_KEYS=["map","tl","food","why","fb"];
/* 탭 전환: 누른 탭의 내용만 보이고 나머지는 숨김. init=true는 화면을 처음 그릴 때(지도는 renderResult가 이미 그림) */
function showTab(k,init){
  if(!TAB_KEYS.includes(k))k="map";
  state.resTab=k;
  TAB_KEYS.forEach(n=>{
    const p=document.getElementById("tab-"+n);if(p)p.hidden=n!==k;
    const b=document.getElementById("tabbtn-"+n);if(b){b.setAttribute("aria-selected",String(n===k));b.tabIndex=n===k?0:-1}
  });
  const bar=document.getElementById("rtabs");if(!bar)return;
  const ab=document.getElementById("tabbtn-"+k);
  if(ab)bar.scrollTo({left:ab.offsetLeft-bar.clientWidth/2+ab.offsetWidth/2}); // 고른 탭을 탭 줄 가운데로
  if(init)return;
  // 아래로 내려와 있었다면 새 탭 내용의 맨 앞이 탭 줄 바로 밑에 보이게 올림
  const panel=document.getElementById("tab-"+k);
  if(panel){const y=panel.getBoundingClientRect().top+window.scrollY-bar.offsetHeight-12;if(window.scrollY>y)window.scrollTo({top:y})}
  // 숨겨져 있던 네이버 지도는 크기를 잃어 회색이 되므로 다시 그림
  if(k==="map"&&lastR&&nmapObj)naverMap(lastR);
}
function wireTabs(){
  const bar=document.getElementById("rtabs");if(!bar)return;
  const btns=[...bar.querySelectorAll("[data-tab]")];
  btns.forEach((b,i)=>{
    b.onclick=()=>showTab(b.dataset.tab);
    b.onkeydown=e=>{ // 키보드 좌우 화살표로 탭 이동
      const d=e.key==="ArrowRight"?1:e.key==="ArrowLeft"?-1:0;if(!d)return;
      e.preventDefault();const nb=btns[(i+d+btns.length)%btns.length];showTab(nb.dataset.tab);nb.focus();
    };
  });
  showTab(state.resTab,true);
}
/* ---------- 광고(제휴) 식당 ----------
   아래는 시연용 가상 가게입니다. 실제 광고주를 받으면 이 목록만 바꾸면 지도·목록에 반영됩니다.
   cat: food(식당) / seafood(해산물) / cafe(카페)   promo: drink / pct10 / dessert / menu */
const ADS=[
 {id:"ad1",cat:"seafood",ll:[35.0588,129.0812],name:{ko:"등대 활어회센터",en:"Lighthouse Sashimi"},promo:"drink",menu:{ko:"모둠회",en:"Assorted sashimi"},price:"35,000~"},
 {id:"ad2",cat:"food",ll:[35.0628,129.0788],name:{ko:"태종대 돼지국밥",en:"Taejongdae Pork Soup"},promo:"pct10",menu:{ko:"돼지국밥",en:"Pork rice soup"},price:"10,000"},
 {id:"ad3",cat:"cafe",ll:[35.0793,129.0455],name:{ko:"파도소리 카페",en:"Wave Sound Café"},promo:"dessert",menu:{ko:"바다 라떼",en:"Sea latte"},price:"6,500"},
 {id:"ad4",cat:"seafood",ll:[35.0768,129.0482],name:{ko:"흰여울 해물칼국수",en:"Huinnyeoul Seafood Noodles"},promo:"pct10",menu:{ko:"해물칼국수",en:"Seafood noodles"},price:"11,000"},
 {id:"ad5",cat:"food",ll:[35.0896,129.0418],name:{ko:"봉래 손만두",en:"Bongnae Dumplings"},promo:"menu",menu:{ko:"찐만두",en:"Steamed dumplings"},price:"7,000"},
 {id:"ad6",cat:"cafe",ll:[35.0925,129.0368],name:{ko:"깡깡이 로스터리",en:"Kkangkkangi Roastery"},promo:"pct10",menu:{ko:"핸드드립",en:"Hand drip"},price:"6,000"},
 {id:"ad7",cat:"food",ll:[35.0806,129.0772],name:{ko:"동삼 밀면",en:"Dongsam Milmyeon"},promo:"drink",menu:{ko:"물밀면",en:"Cold wheat noodles"},price:"9,000"},
 {id:"ad8",cat:"cafe",ll:[35.0772,129.0826],name:{ko:"오션뷰 베이커리",en:"Ocean View Bakery"},promo:"dessert",menu:{ko:"소금빵",en:"Salt bread"},price:"3,500"},
 {id:"ad9",cat:"seafood",ll:[35.0618,129.0662],name:{ko:"중리 조개구이",en:"Jungni Clam Grill"},promo:"menu",menu:{ko:"조개구이 세트",en:"Grilled clam set"},price:"40,000~"}
];
const ADT={
ko:{toggle:"광고 식당",ad:"광고",nearOf:s=>`${s} 근처`,walkN:n=>`도보 ${n}분`,nearStop:"근처 광고 식당",near:"동선 근처 광고 식당 (장소별)",from:s=>`${s}에서 도보 약`,walk:"분",cat:{food:"식당",seafood:"해산물",cafe:"카페"},promo:{drink:"크루즈 승객 음료 1잔 무료",pct10:"크루즈 승객 10% 할인",dessert:"주문 시 디저트 서비스",menu:"외국어 메뉴판·해외카드 결제"},tap:"지도에서 아이콘을 눌러 보세요.",show:"크루즈 탑승권을 보여주세요",sample:"가게 정보는 시연용 예시입니다."},
en:{toggle:"Sponsored",ad:"Ad",nearOf:s=>`Near ${s}`,walkN:n=>`${n} min walk`,nearStop:"Sponsored nearby",near:"Sponsored places near your route",from:s=>`${s} →`,walk:" min walk",cat:{food:"Restaurant",seafood:"Seafood",cafe:"Café"},promo:{drink:"Free drink for cruise guests",pct10:"10% off for cruise guests",dessert:"Free dessert with order",menu:"English menu, foreign cards OK"},tap:"Tap an icon on the map.",show:"Show your cruise card",sample:"Shop details are sample data."},
ja:{toggle:"広告店舗",ad:"広告",nearOf:s=>`${s}周辺`,walkN:n=>`徒歩${n}分`,nearStop:"近くの広告店舗",near:"ルート近くの広告店舗",from:s=>`${s}から徒歩約`,walk:"分",cat:{food:"食堂",seafood:"海鮮",cafe:"カフェ"},promo:{drink:"クルーズ客はドリンク1杯無料",pct10:"クルーズ客10%割引",dessert:"注文でデザートサービス",menu:"外国語メニュー・海外カード可"},tap:"地図のアイコンをタップしてください。",show:"クルーズカードを提示してください",sample:"店舗情報はデモ用の例です。"},
zh:{toggle:"广告店铺",ad:"广告",nearOf:s=>`${s}附近`,walkN:n=>`步行${n}分钟`,nearStop:"附近广告店铺",near:"路线附近的广告店铺",from:s=>`距${s}步行约`,walk:"分钟",cat:{food:"餐厅",seafood:"海鲜",cafe:"咖啡馆"},promo:{drink:"邮轮游客免费饮料1杯",pct10:"邮轮游客9折",dessert:"点餐送甜点",menu:"外语菜单·可刷外卡"},tap:"点击地图上的图标查看。",show:"请出示邮轮卡",sample:"店铺信息为演示样例。"}};
const ICON={
 food:'<path d="M8 4v6.5M6 4v4.5a2 2 0 0 0 4 0V4M8 11v9M16.5 4c-1.8 0-2.8 2.6-2.8 5.4 0 2 .9 3.4 2.8 3.6V20" fill="none" stroke="#fff" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>',
 seafood:'<path d="M3.5 12c2.8-3.8 7.6-4.8 11.4-2.6L19.5 6.5v11l-4.6-2.9C11.1 16.8 6.3 15.8 3.5 12z" fill="#fff"/><circle cx="8" cy="11.2" r="1.1" fill="#e0442d"/>',
 cafe:'<path d="M5 8.5h10.5v4.2A4.8 4.8 0 0 1 10.7 17.5h-.9A4.8 4.8 0 0 1 5 12.7z" fill="#fff"/><path d="M15.5 10h1.6a2.1 2.1 0 0 1 0 4.2h-1.6" fill="none" stroke="#fff" stroke-width="1.8"/><path d="M4 20h13" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>'};
const adName=(a,L)=>L==="ko"?a.name.ko:a.name.en;
function distM([a1,b1],[a2,b2]){const r=Math.PI/180,x=(b2-b1)*r*Math.cos((a1+a2)/2*r),y=(a2-a1)*r;return Math.sqrt(x*x+y*y)*6371000}
function nearAds(r){
  const stops=r.sim.stops.map((st,i)=>({p:st.p,i,ll:COORD[st.p.id]}));
  return ADS.map(a=>{let best=null;stops.forEach(s=>{const d=distM(a.ll,s.ll);if(!best||d<best.d)best={d,p:s.p,i:s.i}});return {a,...best,walk:best?Math.max(1,Math.round(best.d*1.3/70)):0}})
    .filter(x=>x.d<=800).sort((x,y)=>x.i-y.i||x.d-y.d);
}
function adCardHTML(id,r){
  const L=state.lang,A=ADT[L],a=ADS.find(v=>v.id===id);if(!a)return "";
  const n=nearAds(r).find(v=>v.a.id===id);
  const where=n?`<span class="muted">${A.from(esc(n.p.name[L].split(" (")[0].split("（")[0]))} ${Math.max(1,Math.round(n.d*1.3/70))}${A.walk}</span>`:"";
  return `<div class="adcard" role="region" aria-label="${esc(adName(a,L))}">
    <div class="top"><strong>${esc(adName(a,L))}</strong><span class="lbl">${A.ad}</span></div>
    <span class="muted">${A.cat[a.cat]} · ${esc(L==="ko"?a.menu.ko:a.menu.en)} ₩${a.price}</span>
    <span class="promo">${A.promo[a.promo]}</span>
    <span class="muted">${A.show}</span>${where}</div>`;
}
function adsSvg(r){
  if(!state.adsOn)return "";
  const L=state.lang,near=new Set(nearAds(r).map(v=>v.a.id));
  return ADS.map(a=>{
    const [x,y]=proj(...a.ll),sel=state.adSel===a.id,s=(sel?1.1:.82)/ZK;
    const lbl=sel?`<text x="0" y="22" text-anchor="middle" font-size="10.5" font-weight="600" fill="#1b2a30" stroke="#fff" stroke-width="3" paint-order="stroke">${esc(adName(a,L))}</text>`:"";
    return `<g class="ad-pin" data-ad="${a.id}" tabindex="0" role="button" aria-label="${esc(ADT[L].ad+": "+adName(a,L))}" transform="translate(${x} ${y}) scale(${s})">
      <rect class="bg" x="-12" y="-12" width="24" height="24" rx="6" fill="#e0442d" stroke="${sel?"#0d4a5c":"#fff"}" stroke-width="2"/>
      <g transform="translate(-9 -9) scale(.75)">${ICON[a.cat]}</g>
      <rect x="6" y="-17" width="14" height="9" rx="2" fill="#fff" stroke="#e0442d" stroke-width=".8"/>
      <text x="13" y="-10.4" text-anchor="middle" font-size="6.5" font-weight="700" fill="#e0442d">AD</text>
      ${lbl}</g>`}).join("");
}
function wireAds(r){
  const sel=(id,el)=>{const fromTl=el&&el.closest(".adnear");state.adSel=fromTl?id:(state.adSel===id?null:id);refreshMap(r);if(fromTl){showTab("map");document.getElementById("adCard")?.scrollIntoView({block:"center",behavior:"smooth"})}};
  document.querySelectorAll("#smap [data-ad], #adlist [data-ad], .adnear [data-ad]").forEach(el=>{
    el.onclick=()=>sel(el.dataset.ad,el);
    el.onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();sel(el.dataset.ad,el)}};
  });
  const zt=document.getElementById("zoomToggle");
  if(zt)zt.onclick=()=>{state.mapFull=!state.mapFull;zt.textContent=state.mapFull?MAPT[state.lang].zoom:MAPT[state.lang].full;refreshMap(r)};
  const tg=document.getElementById("adToggle");
  if(tg)tg.onclick=()=>{state.adsOn=!state.adsOn;if(!state.adsOn)state.adSel=null;refreshMap(r)};
}
function adPanelHTML(r){
  const L=state.lang,A=ADT[L],near=nearAds(r);
  if(!state.adsOn)return "";
  return `<div style="display:flex;flex-direction:column;gap:8px">
    <p style="font-weight:700;font-size:14.5px">${A.near}</p>
    <div class="adgroups" id="adlist">${[...new Set(near.map(v=>v.i))].map(i=>{
      const g=near.filter(v=>v.i===i),stop=g[0].p.name[L].split(" (")[0].split("（")[0];
      return `<div class="adgroup"><p class="adg-h"><span class="num">${i+1}</span>${esc(A.nearOf(stop))}</p>
        <div class="adlist">${g.map(v=>`<button type="button" id="adbtn-${v.a.id}" data-ad="${v.a.id}" aria-pressed="${state.adSel===v.a.id}"><span class="dot"></span>${esc(adName(v.a,L))} <small>${A.cat[v.a.cat]} · ${A.walkN(v.walk)}</small></button>`).join("")}</div></div>`}).join("")}</div>
    <div id="adCard">${state.adSel?adCardHTML(state.adSel,r):`<p class="muted">${A.tap}</p>`}</div>
    <p class="demo" style="text-align:left">${A.sample}</p></div>`;
}
function refreshMap(r){
  const sm=document.getElementById("smap");if(sm)sm.innerHTML=sketchMap(r);
  const ap=document.getElementById("adPanel");if(ap)ap.innerHTML=adPanelHTML(r);
  const tg=document.getElementById("adToggle");if(tg)tg.setAttribute("aria-pressed",String(state.adsOn));
  if(nmapObj)drawNaverAds(r);
  wireAds(r);
}

const MB={lat0:35.101,lat1:35.047,lng0:129.026,lng1:129.094,W:400,H:390};
const proj=(la,ln)=>[+((ln-MB.lng0)/(MB.lng1-MB.lng0)*MB.W).toFixed(1),+((MB.lat0-la)/(MB.lat0-MB.lat1)*MB.H).toFixed(1)];
const COAST=[[35.0962,129.0368],[35.0972,129.0450],[35.0952,129.0560],[35.0930,129.0650],[35.0902,129.0748],[35.0868,129.0822],[35.0822,129.0868],
 [35.0790,129.0838],[35.0745,129.0842],[35.0700,129.0862],[35.0640,129.0885],[35.0570,129.0898],[35.0518,129.0878],[35.0512,129.0830],
 [35.0545,129.0790],[35.0592,129.0752],[35.0618,129.0700],[35.0605,129.0625],[35.0680,129.0560],[35.0740,129.0470],[35.0798,129.0418],
 [35.0848,129.0365],[35.0890,129.0322],[35.0932,129.0328]];
const MAINLAND=[[35.1012,129.0255],[35.1012,129.0560],[35.0995,129.0500],[35.0985,129.0400],[35.0968,129.0340],[35.0962,129.0255]];
const poly=arr=>arr.map(([a,b])=>proj(a,b).join(",")).join(" ");
let ZK=1; // 약도 확대 배율 (마커·글자는 배율과 상관없이 같은 크기로 보이게 1/ZK로 줄여 그림)
function routeView(xy){
  // 동선(터미널+방문지)이 화면을 꽉 채우도록 viewBox 계산. 너무 가까이 가지 않게 최소 폭 제한
  if(state.mapFull)return [0,0,MB.W,MB.H];
  const xs=xy.map(p=>p[0]),ys=xy.map(p=>p[1]),pad=34;
  let x0=Math.min(...xs)-pad,x1=Math.max(...xs)+pad,y0=Math.min(...ys)-pad,y1=Math.max(...ys)+pad;
  let w=Math.max(x1-x0,130),h=Math.max(y1-y0,130*MB.H/MB.W);
  if(w/h>MB.W/MB.H)h=w*MB.H/MB.W;else w=h*MB.W/MB.H;
  const cx=(Math.min(...xs)+Math.max(...xs))/2,cy=(Math.min(...ys)+Math.max(...ys))/2;
  return [cx-w/2,cy-h/2,w,h].map(v=>+v.toFixed(1));
}
function sketchMap(r){
  const L=state.lang,ids=["T",...r.sim.stops.map(st=>st.p.id)];
  const xy=ids.map(id=>proj(...COORD[id]));
  const vb=routeView(xy);ZK=MB.W/vb[2];
  const k=1/ZK,f=n=>+(n*k).toFixed(2);
  const out=xy.map(p=>p.join(",")).join(" ");
  const back=[xy[xy.length-1],xy[0]].map(p=>p.join(",")).join(" ");
  const short=p=>p.name[L].split(" (")[0].split("（")[0];
  const midX=vb[0]+vb[2]*0.62;
  let marks="";
  r.sim.stops.forEach((st,i)=>{
    const [x,y]=xy[i+1],left=x>midX;
    marks+=`<g transform="translate(${x} ${y}) scale(${k.toFixed(3)})">
      <circle r="11" fill="#e5533b" stroke="#fff" stroke-width="2.5"/>
      <text y="4.5" text-anchor="middle" font-size="12.5" font-weight="700" fill="#fff">${i+1}</text>
      <text x="${left?-16:16}" y="4" text-anchor="${left?"end":"start"}" font-size="12" font-weight="500" fill="#1b2a30" stroke="#fff" stroke-width="3.5" paint-order="stroke">${esc(short(st.p))}</text></g>`;
  });
  const [tx,ty]=xy[0];
  const np=proj(35.1001,129.029),yd=proj(35.0735,129.066);
  return `<svg viewBox="${vb.join(" ")}" role="img" aria-label="${esc(MAPT[L].sketch)}" font-family="Noto Sans KR, sans-serif">
    <defs><pattern id="mgrid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="#c9dfe3" stroke-width="${f(1)}"/></pattern>
    <marker id="marr" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="${f(5/3.5*3.5)}" markerHeight="${f(5)}" markerUnits="userSpaceOnUse" orient="auto"><path d="M0 0L10 5L0 10z" fill="#e5533b"/></marker></defs>
    <rect x="-200" y="-200" width="${MB.W+400}" height="${MB.H+400}" fill="#dcebee"/>
    <rect x="-200" y="-200" width="${MB.W+400}" height="${MB.H+400}" fill="url(#mgrid)"/>
    <polygon points="${poly(MAINLAND)}" fill="#efe9dc" stroke="#cfc6b3" stroke-width="${f(1)}"/>
    <text x="${np[0]}" y="${np[1]}" font-size="${f(11)}" fill="#8a8170">남포·광복 Nampo</text>
    <polygon points="${poly(COAST)}" fill="#f4f1ea" stroke="#9fb8bc" stroke-width="${f(1.5)}"/>
    ${state.mapFull?`<text x="${yd[0]}" y="${yd[1]}" font-size="20" fill="#b9c4c2" text-anchor="middle" font-family="Do Hyeon, sans-serif">YEONGDO 영도</text>`:""}
    <polyline points="${back}" fill="none" stroke="#0d4a5c" stroke-width="${f(2.5)}" stroke-dasharray="${f(5)} ${f(5)}" opacity=".7"/>
    <polyline points="${out}" fill="none" stroke="#e5533b" stroke-width="${f(3.5)}" stroke-linejoin="round" marker-mid="url(#marr)"/>
    ${adsSvg(r)}
    ${foodSvg(r)}
    ${marks}
    <g transform="translate(${tx} ${ty}) scale(${k.toFixed(3)})">
      <rect x="-13" y="-13" width="26" height="26" rx="7" fill="#0d4a5c" stroke="#fff" stroke-width="2.5"/>
      <text y="4.5" text-anchor="middle" font-size="12.5" font-weight="700" fill="#fff">T</text>
      <text x="18" y="22" font-size="11.5" font-weight="700" fill="#0d4a5c" stroke="#fff" stroke-width="3.5" paint-order="stroke">${esc(TERM_NAME[L])}</text></g>
  </svg>`;
}
/* 네이버 지도
   지도는 한 번만 만들고 계속 다시 씀. 결과 화면이 새로 그려질 때마다
   지도 상자(nmapEl)를 새 화면의 #nmap 자리로 옮기고, 크기를 다시 맞춘 뒤
   동선·핀·광고·맛집 표시만 지우고 새로 그림.
   (지도를 지웠다 다시 만들면 "처음부터" 뒤에 회색 화면이 되는 문제가 있었음) */
let naverP=null,nmapObj=null,nmapEl=null,nmapPark=null,nAds=[],nRoute=[],mapToken=0;
/* 지도 상자는 문서에서 절대 빼지 않음. 화면이 바뀌기 직전(render)에 화면 밖
   보관함으로 옮겨 두었다가, 결과 화면이 다시 그려지면 새 #nmap 자리로 옮김.
   (화면을 innerHTML로 바꾸면서 지도 상자가 문서에서 떨어져 나가면, 두 번째
   실행 때 "네이버 지도 Open API 인증이 실패했습니다"가 뜨는 문제가 있었음) */
function parkNaverMap(){
  if(!nmapEl)return;
  if(!nmapPark){nmapPark=document.createElement("div");nmapPark.setAttribute("aria-hidden","true");
    nmapPark.style.cssText="position:fixed;left:-10000px;top:0;width:360px;height:320px;overflow:hidden;visibility:hidden;pointer-events:none";
    document.body.appendChild(nmapPark)}
  if(nmapEl.parentNode!==nmapPark)nmapPark.appendChild(nmapEl);
}
function showSketch(){
  const k=document.getElementById("nmap"),s=document.getElementById("smap"),c=document.getElementById("mapCap");
  if(k)k.style.display="none";if(s)s.style.display="block";if(c)c.textContent=MAPT[state.lang].sketch;
}
// 키 인증이 실패하면 약도로 되돌림
window.navermap_authFailure=()=>{showSketch();nmapObj=null};
function clearOverlays(list){list.forEach(o=>{try{o.setMap(null)}catch(e){}});list.length=0}
function drawNaverAds(r){
  clearOverlays(nAds);
  if(!state.adsOn||!nmapObj)return;
  const N=naver.maps,L=state.lang;
  ADS.forEach(a=>{
    const html=`<div class="nad" role="button"><span class="ic"><svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">${ICON[a.cat]}</svg><i>AD</i></span><span class="nm">${esc(adName(a,L))}</span></div>`;
    const mk=new N.Marker({map:nmapObj,position:new N.LatLng(...a.ll),icon:{content:html,anchor:new N.Point(15,15)},zIndex:1});
    N.Event.addListener(mk,"click",()=>{state.adSel=a.id;refreshMap(r)});
    nAds.push(mk);
  });
}
/* SDK 불러오기
   - 스크립트 태그는 딱 한 번만 넣음. (예전엔 6초 안에 안 끝나면 실패로 보고
     다음 실행 때 maps.js를 또 넣었는데, SDK가 두 번 로드되면서 두 번째 실행 때
     "네이버 지도 Open API 인증이 실패했습니다"가 떴음)
   - maps.js는 받은 뒤에도 안쪽 모듈을 따로 더 받아서, onload 시점엔 아직
     naver.maps.Map이 없을 수 있음 → Map이 실제로 생길 때까지 기다림 */
let naverScript=null;
const naverReady=()=>!!(window.naver&&naver.maps&&typeof naver.maps.Map==="function"&&naver.maps.LatLng);
function loadNaver(){
  if(!CONFIG.NAVER_KEY_ID)return Promise.reject("no key");
  if(naverP)return naverP;
  naverP=new Promise((res,rej)=>{
    if(naverReady()){res();return}
    if(!naverScript){
      naverScript=document.createElement("script");
      naverScript.src="https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId="+encodeURIComponent(CONFIG.NAVER_KEY_ID);
      naverScript.onerror=()=>{naverScript.remove();naverScript=null}; // 네트워크 실패만 다음에 새로 넣음
      document.head.appendChild(naverScript);
    }
    const t0=Date.now();
    (function wait(){
      if(naverReady())return res();
      if(!naverScript)return rej("load error");
      if(Date.now()-t0>15000)return rej("timeout"); // 기다림만 멈추고 스크립트는 그대로 둠
      setTimeout(wait,100);
    })();
  }).catch(e=>{naverP=null;throw e}); // 실패하면 다음 실행 때 다시 기다림(스크립트를 또 넣지는 않음)
  return naverP;
}
function naverMap(r){
  const my=++mapToken;
  loadNaver()
    .then(()=>new Promise(res=>requestAnimationFrame(()=>requestAnimationFrame(res)))) // 새 화면이 자리 잡을 때까지 기다림
    .then(()=>{
      if(my!==mapToken)return; // 그사이 화면이 또 바뀌었으면 그리지 않음
      const slot=document.getElementById("nmap");if(!slot)return;
      const N=naver.maps;
      slot.style.display="block";document.getElementById("smap").style.display="none";
      document.getElementById("mapCap").textContent=MAPT[state.lang].real;
      if(!nmapEl){nmapEl=document.createElement("div");nmapEl.style.cssText="width:100%;height:100%"}
      if(nmapEl.parentNode!==slot)slot.appendChild(nmapEl); // 지도 상자를 새 화면으로 옮김
      const path=["T",...r.sim.stops.map(st=>st.p.id)].map(id=>new N.LatLng(...COORD[id]));
      if(!nmapObj)nmapObj=new N.Map(nmapEl,{center:path[0],zoom:14});
      const map=nmapObj;
      map.setSize(new N.Size(slot.clientWidth||nmapEl.offsetWidth||360,slot.clientHeight||320));
      // 이전 결과의 동선·핀·광고·맛집 표시 지우기
      clearOverlays(nRoute);clearOverlays(nAds);clearOverlays(nFoods);
      nRoute.push(new N.Polyline({map,path,strokeWeight:5,strokeColor:"#e5533b",strokeOpacity:.9}));
      nRoute.push(new N.Polyline({map,path:[path[path.length-1],path[0]],strokeWeight:3,strokeColor:"#0d4a5c",strokeOpacity:.7,strokeStyle:"shortdash"}));
      path.forEach((p,i)=>nRoute.push(new N.Marker({map,position:p,icon:{content:`<div class="npin${i?"":" t"}">${i||"T"}</div>`,anchor:new N.Point(13,13)},zIndex:2})));
      const lats=path.map(p=>p.lat()),lngs=path.map(p=>p.lng());
      const bounds=new N.LatLngBounds(new N.LatLng(Math.min(...lats),Math.min(...lngs)),new N.LatLng(Math.max(...lats),Math.max(...lngs)));
      const fit=()=>{if(my!==mapToken||!nmapEl.isConnected)return;map.setSize(new N.Size(slot.clientWidth||360,slot.clientHeight||320));map.fitBounds(bounds)};
      fit();
      setTimeout(fit,300); // 한 번 더 크기를 맞춰서 회색 화면 방지
      drawNaverAds(r);drawNaverFoods(r);
    }).catch(()=>{if(my===mapToken)showSketch()}); // 실패하면 약도로 되돌림(지도는 버리지 않음)
}
