/* 영도 맛집 목록, foods.json 불러오기, 맛집 화면
   담당: ④ 데이터·운영 */

/* ---------- 영도 맛집 목록 ----------
   출처: 부산어디?(busan-where.com) 영도구 맛집 목록 1~3페이지, 인기순, 2026-11-23 기준.
   58곳 중 주소와 위치가 확인된 36곳만 남김 (2026-11-24 검색). 좌표는 뽈레·한국관광공사 자료의 가게 위치.
   영업시간·휴무·브레이크타임은 검색으로 확인한 것만 넣고, 모르면 빈칸("").
   [이름, 분류, 소개, 네이버 평점, 리뷰 수, 인증 배지, 주소, [위도,경도], 영업시간, 휴무, 브레이크타임] */
let FOOD=[
["카페 385","cafe","해변을 한눈에 보며 여유롭게 쉬는 카페",null,null,null,"태종로 539",[35.08427,129.07629],"10:00~22:00","",""],
["피아크 카페&베이커리","cafe","하버뷰 베이커리카페",null,null,null,"해양로195번길 180 2층",[35.08639,129.07673],"10:00~22:00","연중무휴",""],
["그라치에","west","이탈리안, 감자뇨끼·오징어먹물리조또 인기",4.8,11447,["safe"],"청학동로 12 1층",[35.08902,129.06154],"11:30~21:30","연중무휴","15:00~17:00"],
["스페이스 원지","west","높은 층고와 뷰가 특징",4.5,1702,null,"봉래나루로 214",[35.09638,129.04470],"10:30~21:00","월요일","평일 15:00~17:00 (카페는 이용 가능)"],
["몽작","west","신선한 고기와 야경, 가족 식사 (네이버 예약제)",4.9,6960,["safe"],"남항서로 36",[35.08480,129.03611],"평일 17:00~23:30, 토 13:00~22:30, 일 12:30~22:00","연중무휴",""],
["미피카페 부산","cafe","미피 캐릭터 카페",null,null,null,"와치로51번길 2",[35.08806,129.06094],"11:00~22:00","",""],
["재기돼지국밥","pork","남항시장에서 55년 된 전통 돼지국밥",null,null,null,"절영로49번길 25 1층",[35.08963,129.03987],"08:00~21:00","월요일",""],
["모모스 로스터리 & 커피바","cafe","부산 대표 로스터리, 옛 창고를 고친 매장",4.4,2091,null,"봉래나루로 160",[35.09603,129.04258],"08:00~18:00 (라스트오더 17:30)","",""],
["에테르","cafe","흰여울문화마을 바다뷰 카페",4.3,4499,null,"절영로 234",[35.07726,129.04649],"10:00~21:00","연중무휴",""],
["오구카페","cafe","남항대교와 바다가 보이는 베이커리 카페",4.6,4306,null,"남항서로 52",[35.08558,129.03483],"09:00~22:00","연중무휴",""],
["아르프","west","비건 메뉴 레스토랑",null,null,["bib"],"태종로99번길 35 1층",[35.09293,129.04256],"월~수 11:30~16:00, 금~일 11:30~20:00","목요일",""],
["도날드즉석떡볶이","snack","해물 육수 즉석떡볶이 (현금 결제)",4.6,3725,null,"꿈나무길 267",[35.08581,129.04294],"월~토 11:00~19:30","일요일",""],
["리스보아","cafe","절영로, 바다 보며 커피와 에그타르트",4.9,1891,null,"절영로 198",[35.07965,129.04396],"09:00~21:30 (금·토 23:00까지)","연중무휴",""],
["선생조고매","cafe","고구마 음료와 디저트, 조내기고구마역사기념관 2층",null,null,null,"벚꽃길 75",[35.08529,129.05833],"10:00~19:00 (라스트오더 18:30)","월요일 (공휴일이면 영업)",""],
["아델라베일리 부산","west","호텔아델라 24층, 영도대교 전망",4.6,802,null,"태종로 45 호텔아델라 24층",[35.09394,129.03737],"11:00~23:00","",""],
["영도해녀촌","sea","해녀가 잡은 해산물과 김밥",null,null,null,"중리남로 2-35 (중리 해녀문화전시관 옆)",[35.06723,129.06609],"09:00~19:00 (여름은 마지막 주문 20:00)","",""],
["아트센트","cafe","청학동 옛 목욕탕 건물을 고친 카페",4.8,1689,["safe"],"하나길 807",[35.09395,129.05617],"월~목 10:00~21:00, 금~일 09:00~21:00","연중무휴",""],
["제주복국","sea","복요리 전문점",null,null,["model","safe"],"절영로 481",[35.07104,129.06889],"평일 10:00~20:30, 주말 09:00~21:00","연중무휴","평일 15:00~17:00"],
["청해수산","sea","두껍게 썬 회로 유명, 웨이팅 있음",null,null,null,"태종로113번길 35",[35.09250,129.04380],"12:30~22:00 (라스트오더 21:00)","화요일",""],
["태종대짬뽕","cn","태종대 입구 해산물 짬뽕",4.7,8233,null,"태종로 805",[35.06459,129.08118],"10:00~21:30","수요일",""],
["목장원","kr","바다 풍경 복합외식공간",null,null,["safe"],"절영로 355",[35.07162,129.05735],"11:30~21:30","연중무휴 (부정기 휴무라는 안내도 있음)",""],
["화목정따로국밥","kr","국물 깔끔한 따로국밥, 좌식",4.5,456,null,"태종로73번길 22 1층",[35.09337,129.03946],"10:10~20:20 (라스트오더 14:50, 19:50)","둘째·넷째 일요일","15:20~17:00"],
["선인장식당 영도본점","west","한우·한돈 함박스테이크, 치킨카레",null,null,null,"와치로 13",[35.09009,129.05806],"11:00~21:00","월요일","15:00~17:00"],
["사카나","jp","숙성 사시미 이자카야, 런치세트",4.6,509,null,"동삼로28번길 20 1층",[35.07692,129.07260],"17:00~다음 날 01:00 (라스트오더 00:00)","일요일",""],
["빨간등대 영도본점","kr","남항 바다 앞 해산물 코스 (2층)",4.9,4582,null,"남항서로 40 2층",[35.08495,129.03573],"11:30~21:30","","15:00~17:00"],
["무명일기","cafe","봉래동 옛 공장을 고친 카페",4.5,1461,null,"봉래나루로 178",[35.09644,129.04349],"금~일 11:00~18:00","월~목요일",""],
["토로","west","골목 이탈리안, 숙성 스테이크",null,null,["safe"],"태종로750번길 46",[35.06917,129.07817],"11:30~22:00","연중무휴",""],
["영도면옥","kr","칼국수·국밥·냉면",4.8,4358,null,"해양로 211",[35.08771,129.07305],"11:00~20:30","연중무휴","15:00~17:00"],
["신기커피영도","cafe","옛 산새소리유치원을 고친 카페(신기숲), 노키즈존",null,null,null,"와치로 65",[35.08685,129.06027],"11:00~21:00","연중무휴",""],
["금영돼지국밥","pork","전통 돼지국밥",null,null,null,"와치로 213 절영아파트 상가",[35.07644,129.06577],"10:00~19:00","일요일",""],
["비엘르","cafe","흰여울 근처 해안 풍경 디저트 카페",null,null,null,"절영로 202-2",[35.07945,129.04437],"평일 10:00~20:00, 주말 09:00~20:00","연중무휴",""],
["라운지비","cafe","부산항 조망 카페",5.0,1044,null,"해양로111번길 33",[35.09575,129.06755],"10:00~22:00","연중무휴",""],
["작은시장횟집","sea","흰여울 근처 로컬 횟집",4.6,370,null,"작은시장1길 16",[35.08415,129.04162],"11:00~21:00","",""],
["도요","cafe","아늑한 디저트 카페",null,null,null,"청학동로 16 1층",[35.08899,129.06198],"11:00~21:00","",""],
["영도횟집","sea","남항동 해산물 전문점",null,null,null,"남항로19번길 33",[35.09091,129.03949],"11:30~22:00 (토 23:00까지)","월요일","화~금 14:00~16:00"],
["화복반점","cn","청학동 중식당, 짬뽕·짜장면",null,null,null,"일산봉로39번길 14",[35.08600,129.06473],"11:30~21:30","수요일","평일 15:00~16:30"]
].map(([n,c,d,r,rv,b,a,ll,h,off,bk],i)=>({i,n,c,d,r,rv,b:b||[],a:a||"",ll:ll||null,h:h||"",off:off||"",bk:bk||""}));
const FCAT_ORDER=["cafe","sea","kr","pork","west","jp","cn","bakery","mil","snack","chick","bar"];
const FT={
ko:{h:n=>`영도 맛집 ${n}곳`,sub:"부산어디? 인기순 · ★ 네이버 평점",subApi:"한국관광공사 관광정보 · 동선에서 가까운 순",srcApi:d=>`출처: 한국관광공사 TourAPI(공공데이터포털), ${d} 업데이트. 매일 새벽 자동으로 새로 받아와요. 평점은 제공되지 않아요.`,all:"전체",near:"동선 근처",more:n=>`${n}곳 더 보기`,less:"접기",rev:"리뷰",
 src:"출처: 부산어디?(busan-where.com) 영도 맛집 목록(2026-11-23) 중 주소가 확인된 36곳. 주소·영업시간·휴무는 2026-11-24에 검색한 정보라 바뀌었을 수 있어요. 가기 전에 네이버 지도에서 한 번 더 확인하세요. 번호는 가까운 동선 장소예요.",
 hr:{open:"영업",off:"휴무",bk:"브레이크",none:"영업시간 정보 없음"},
 cat:{cafe:"카페·디저트",sea:"해산물·회",kr:"한식",pork:"돼지국밥",west:"양식",jp:"일식·초밥",cn:"중식",bakery:"베이커리",mil:"밀면",snack:"분식",chick:"치킨·피자",bar:"주점"},
 badge:{safe:"안심식당",model:"모범음식점",bib:"빕 구르망"}},
en:{h:n=>`${n} places to eat in Yeongdo`,sub:"Popularity order from Busan-where · ★ NAVER rating",subApi:"Korea Tourism Organization data · closest to your route first",srcApi:d=>`Source: Korea Tourism Organization TourAPI, updated ${d}. Refreshed automatically every morning. No ratings in this data.`,all:"All",near:"Near your route",more:n=>`Show ${n} more`,less:"Show less",rev:"reviews",
 src:"Source: Busan-where (busan-where.com) Yeongdo restaurant list (23 Nov 2026), keeping the 36 places whose address we could confirm. Addresses, hours and closing days were looked up on 24 Nov 2026 and may change, so check NAVER Map before you go. Descriptions and hours are in Korean.",
 hr:{open:"Hours",off:"Closed",bk:"Break",none:"No opening-hours info"},
 cat:{cafe:"Café & dessert",sea:"Seafood & sashimi",kr:"Korean",pork:"Pork rice soup",west:"Western",jp:"Japanese",cn:"Chinese",bakery:"Bakery",mil:"Milmyeon noodles",snack:"Street food",chick:"Chicken & pizza",bar:"Bar"},
 badge:{safe:"Safe restaurant",model:"Model restaurant",bib:"Bib Gourmand"}},
ja:{h:n=>`影島グルメ${n}店`,sub:"釜山オディ？人気順・★NAVER評価",subApi:"韓国観光公社データ・ルートに近い順",srcApi:d=>`出典：韓国観光公社 TourAPI、${d}更新。毎朝自動で更新されます。評価はありません。`,all:"すべて",near:"ルート近く",more:n=>`あと${n}店を見る`,less:"閉じる",rev:"件",
 src:"出典：釜山オディ？(busan-where.com) 影島グルメ一覧(2026年11月23日)のうち住所を確認できた36店。住所・営業時間・定休日は2026年11月24日に調べた情報で、変わることがあります。行く前にNAVER地図で確認してください。紹介文と営業時間は韓国語です。",
 hr:{open:"営業",off:"定休日",bk:"休憩",none:"営業時間の情報なし"},
 cat:{cafe:"カフェ・デザート",sea:"海鮮・刺身",kr:"韓国料理",pork:"テジクッパ",west:"洋食",jp:"和食・寿司",cn:"中華",bakery:"ベーカリー",mil:"ミルミョン",snack:"粉食",chick:"チキン・ピザ",bar:"居酒屋"},
 badge:{safe:"安心食堂",model:"模範飲食店",bib:"ビブグルマン"}},
zh:{h:n=>`影岛美食${n}家`,sub:"釜山哪里？人气排序 · ★ NAVER评分",subApi:"韩国观光公社数据 · 按离路线远近排序",srcApi:d=>`来源：韩国观光公社 TourAPI，${d}更新。每天早上自动更新。无评分数据。`,all:"全部",near:"路线附近",more:n=>`再看${n}家`,less:"收起",rev:"条评价",
 src:"来源：釜山哪里？(busan-where.com) 影岛美食列表（2026年11月23日）中能确认地址的36家。地址、营业时间和休息日为2026年11月24日查询的信息，可能有变，出发前请在NAVER地图再确认。介绍和营业时间为韩语。",
 hr:{open:"营业",off:"休息",bk:"休息时段",none:"无营业时间信息"},
 cat:{cafe:"咖啡·甜点",sea:"海鲜·生鱼片",kr:"韩餐",pork:"猪肉汤饭",west:"西餐",jp:"日料·寿司",cn:"中餐",bakery:"面包店",mil:"小麦冷面",snack:"小吃",chick:"炸鸡·披萨",bar:"酒馆"},
 badge:{safe:"安心餐厅",model:"模范餐厅",bib:"必比登推介"}}};
function foodNear(f,r){
  const ll=f.ll;if(!ll)return null;
  let best=null;r.sim.stops.forEach((st,i)=>{const d=distM(ll,COORD[st.p.id]);if(!best||d<best.d)best={d,i,p:st.p}});
  return best&&best.d<=800?{...best,walk:Math.max(2,Math.round(best.d*1.3/70))}:null;
}
function foodHTML(r){
  const L=state.lang,F=FT[L],zones=new Set(r.chosen.map(p=>p.zone).filter(z=>z==="E"||z==="W"));
  const cats=FCAT_ORDER.filter(c=>FOOD.some(f=>f.c===c)).map(c=>[c,FOOD.filter(f=>f.c===c).length]);
  const list=FOOD.filter(f=>state.foodCat==="all"||f.c===state.foodCat).map(f=>({...f,nr:foodNear(f,r)}))
    .sort((a,b)=>(!!b.nr-!!a.nr)||((a.nr?.i??0)-(b.nr?.i??0))||((a.nr?.d??0)-(b.nr?.d??0))||(a.i-b.i));
  const LIMIT=8,shown=state.foodMore?list:list.slice(0,LIMIT);
  const nv=L==="ko"?"네이버 지도":"NAVER Map";
  const item=f=>{const q=encodeURIComponent("부산 영도 "+f.n);return `<li class="fd">
    <span class="nm"><strong>${esc(f.n)}</strong>${f.nr?`<span class="nearb"><span class="num">${f.nr.i+1}</span>${esc(ADT[L].nearOf(f.nr.p.name[L].split(" (")[0].split("（")[0]))} · ${ADT[L].walkN(f.nr.walk)}</span>`:""}</span>
    <span class="meta"><span>${F.cat[f.c]}</span>${f.r?`<span><span class="st">★ ${f.r.toFixed(1)}</span> (${F.rev} ${f.rv.toLocaleString()})</span>`:""}${f.b.map(b=>`<span class="fbadge">${F.badge[b]}</span>`).join("")}</span>
    ${f.d?`<span class="ds">${esc(f.d)}</span>`:""}
    ${f.a?`<span class="fad">${esc(f.a)}</span>`:""}
    ${foodSrc==="api"?"":`<span class="fhr">${f.h||f.off||f.bk?[f.h&&`${F.hr.open} ${esc(f.h)}`,f.off&&`${F.hr.off} ${esc(f.off)}`,f.bk&&`${F.hr.bk} ${esc(f.bk)}`].filter(Boolean).join(" · "):F.hr.none}</span>`}
    <span class="maps"><a href="https://map.naver.com/p/search/${q}" target="_blank" rel="noopener">${nv}</a></span></li>`};
  return `<h2 style="font-size:19px">${F.h(FOOD.length)}</h2><p class="muted">${foodSrc==="api"?F.subApi:F.sub}</p>
    <div class="fcats" role="group" aria-label="${esc(F.h(FOOD.length))}">${[["all",FOOD.length]].concat(cats).map(([c,n])=>`<button type="button" id="fcat-${c}" data-fc="${c}" aria-pressed="${state.foodCat===c}">${c==="all"?F.all:F.cat[c]} ${n}</button>`).join("")}</div>
    <ol class="flist">${shown.map(item).join("")}</ol>
    ${list.length>LIMIT?`<button type="button" class="fmore" id="foodMore">${state.foodMore?F.less:F.more(list.length-LIMIT)}</button>`:""}
    <p class="demo" style="text-align:left">${foodSrc==="api"?F.srcApi(foodUpdated):F.src}</p>`;
}
/* ---------- 매일 바뀌는 맛집 목록 불러오기 ----------
   foods.json: GitHub Actions가 매일 새벽 한국관광공사 TourAPI에서 영도 음식점을 받아 만들어 두는 파일
   (scripts/fetch-foods.mjs). 형태: {updated, items:[{id,name,cat,addr,lat,lng,tel}]}
   불러오지 못하면 위의 기본 목록(FOOD, 부산어디? 중 36곳)을 그대로 씁니다. */
const FOOD_API="foods.json";
let foodSrc="sample",foodUpdated="",lastR=null;
async function loadFoods(){
  try{
    const ctl=new AbortController();setTimeout(()=>ctl.abort(),5000);
    const res=await fetch(FOOD_API+"?v="+Date.now(),{signal:ctl.signal});if(!res.ok)return;
    const j=await res.json();const rows=Array.isArray(j)?j:(j&&j.items);if(!Array.isArray(rows))return;
    const items=rows.map((x,i)=>{const la=+x.lat,ln=+x.lng;return {i,n:String(x.name||"").trim(),c:FCAT_ORDER.includes(x.cat)?x.cat:"kr",d:"",a:String(x.addr||""),h:"",off:"",bk:"",r:null,rv:null,b:[],
      ll:(la>35&&la<35.2&&ln>128.9&&ln<129.2)?[la,ln]:null}}).filter(f=>f.n);
    if(items.length<10)return;
    FOOD=items;foodSrc="api";foodUpdated=String(j.updated||"").slice(0,10);
    if(state.foodCat!=="all"&&!FOOD.some(f=>f.c===state.foodCat))state.foodCat="all";
    if(state.screen==="result"&&lastR){const sec=document.getElementById("foodSec");if(sec){sec.innerHTML=foodHTML(lastR);wireFood(lastR)}}
  }catch(e){}
}
function wireFood(r){
  const sec=document.getElementById("foodSec");if(!sec)return;
  sec.querySelectorAll("[data-fc]").forEach(b=>b.onclick=()=>{state.foodCat=b.dataset.fc;state.foodMore=false;sec.innerHTML=foodHTML(r);wireFood(r)});
  const m=document.getElementById("foodMore");
  if(m)m.onclick=()=>{state.foodMore=!state.foodMore;sec.innerHTML=foodHTML(r);wireFood(r);if(!state.foodMore)sec.scrollIntoView({block:"start"})};
}
