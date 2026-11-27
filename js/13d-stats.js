/* 이용 기록 보내기 → 관리자 페이지(admin/)에서 봄
   담당: ④ 데이터·운영
   보내는 것: 접속(언어), 만든 코스(크루즈·동행·관심사·장소·머무는 시간), 후기
   보내지 않는 것: 이름·연락처·위치 등 개인정보. sid는 이 기기에서 만든 무작위 번호
   서버: worker/src/index.js 의 /log (07-ai.js의 AI_PROXY와 같은 Worker) */

const STATS_URL=(typeof AI_PROXY==="string"&&AI_PROXY)?AI_PROXY.replace(/\/+$/,"")+"/log":"";
// Live Server(로컬)에서 테스트한 기록이 통계에 섞이지 않게 꺼 둠. 로컬에서 켜려면 주소 끝에 ?stats=1
const STATS_ON=!!STATS_URL&&(!/^(localhost|127\.0\.0\.1)$/.test(location.hostname)||/[?&]stats=1/.test(location.search));
const statsRid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,10);
const statsSid=(()=>{try{let v=localStorage.getItem("yd-sid");if(!v){v=statsRid();localStorage.setItem("yd-sid",v)}return v}catch(e){return statsRid()}})();

function statsSend(o){
  if(!STATS_ON)return;
  // text/plain으로 보내면 브라우저가 사전 확인(OPTIONS) 없이 바로 보냄. keepalive: 창을 닫아도 끝까지 보냄
  try{fetch(STATS_URL,{method:"POST",headers:{"Content-Type":"text/plain"},body:JSON.stringify({...o,sid:statsSid,lang:state.lang}),keepalive:true}).catch(()=>{})}catch(e){}
}

// 1) 접속: 페이지를 열 때 한 번. QR마다 주소에 ?src=이름 을 붙이면 어디서 들어왔는지 알 수 있음
statsSend({type:"visit",src:(new URLSearchParams(location.search).get("src")||(document.referrer?"link":"direct")).slice(0,40)});

// 2) 코스: 결과 화면을 그릴 때마다(경로 수정 포함) 2.5초 뒤 최신 상태로 보냄. 같은 코스는 같은 id로 덮어씀
let statsTimer=null,statsLast="",statsPending=null;
function statsPlan(){
  const r=typeof lastR!=="undefined"?lastR:null;
  if(!r||!r.c)return;
  if(!state.planId)state.planId=statsRid();
  const o={type:"plan",id:state.planId,ship:r.c.id,shipName:r.c.name,cdate:state.cdate||null,
    comp:state.a.comp,interests:state.a.interests,weather:state.a.weather,ai:!!state.aiNote,custom:!!r.custom,over:!!r.over,
    // 맛집 탭에서 넣은 가게는 가게 이름까지, 손님이 직접 찍은 장소는 이름 없이 "custom"으로
    stops:r.sim.stops.map(st=>st.p.food?{id:"food",name:st.p.name.ko,dw:st.dw}:{id:st.p.custom?"custom":st.p.id,dw:st.dw}),start:r.start,end:r.sim.end};
  const key=JSON.stringify(o);
  if(key===statsLast)return;
  statsPending=o;clearTimeout(statsTimer);
  statsTimer=setTimeout(statsFlush,2500);
}
function statsFlush(){
  clearTimeout(statsTimer);
  if(!statsPending)return;
  statsLast=JSON.stringify(statsPending);statsSend(statsPending);statsPending=null;
}
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="hidden")statsFlush()});

{
  const rr=renderResult;
  renderResult=function(s,a){rr(s,a);try{statsPlan()}catch(e){}};
  // 첫 화면으로 돌아가면 다음 코스는 새 기록으로
  const rh=renderHome;
  renderHome=function(s,a){statsFlush();state.planId=null;rh(s,a)};
  // 3) 후기: 기기에 저장하면서 서버에도 보냄
  const sr=saveReview;
  saveReview=function(r){sr(r);statsSend({type:"review",place:r.place,stars:r.stars,text:r.text||""})};
}
