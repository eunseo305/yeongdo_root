/* 추천 엔진: 장소 점수, 코스 고르기, 시간표 계산
   담당: ③ AI·동선 */

/* ---------- recommendation engine (rule-based stand-in for the AI model) ---------- */
// 장소별 실내(in)/지붕 있음(semi)/야외(out) 구분
const ENV={
 samjin:"in",momos:"in",peak:"in",heilleu:"in",museum:"in",arte:"in",daiso:"in",oliveyoung:"in",lotte:"in",bongnae:"in",
 haenyeo:"semi",namhang:"semi",taejongdae:"semi",gamji:"semi",
 huinnyeoul:"out",isongdo:"out",jonaegi:"out",zipline:"out",dongsam:"out",kkangkkangi:"out",trail:"out",bridge:"out"};
// 날씨별로 아예 빼는 곳: 비 = 미끄럽거나 운영을 멈추는 곳, 추움·바람 = 바닷바람을 바로 맞는 곳
const WX_BLOCK={
 rain:["huinnyeoul","isongdo","jonaegi","zipline","dongsam","trail","bridge"],
 cold:["zipline","dongsam","isongdo","trail","bridge"]};
// 더운 날 한낮(12~15시)에 오래 있으면 힘든 야외 장소
const HOT_NOON=["zipline","dongsam","jonaegi","isongdo","huinnyeoul"];
function cruiseDow(){const d=state.cdate?new Date(state.cdate+"T00:00"):new Date();return isNaN(d)?new Date().getDay():d.getDay()}
function score(p){
  const {age,comp,nat,interests,weather}=state.a;
  if((p.out||p.shop)&&!interests.includes("beauty"))return -1;
  if(p.shop)return 12;
  // 날씨: 위험하거나 운영을 멈추는 곳은 아예 뺌
  if(WX_BLOCK[weather]?.includes(p.id))return -1;
  // 고른 크루즈 날짜에 쉬는 곳은 뺌 (날짜를 안 골랐으면 오늘 기준)
  if(p.closed&&p.closed.includes(cruiseDow()))return -1;
  // 짚라인은 70대 이상에게 추천하지 않음
  if(p.id==="zipline"&&age==="a70")return -1;
  const m=p.tags.filter(g=>interests.includes(g)).length;
  let s=m?1+3*m:0.6;
  if(p.stairs&&age==="a70")s-=5;
  if(p.stairs&&age==="a50")s-=1.5;
  if(p.stairs&&comp==="family")s-=1;
  if(p.stairs&&comp==="group")s-=1;
  if(comp==="family"&&p.indoor)s+=2;
  if(comp==="family"&&(p.id==="dongsam"||p.id==="arte"))s+=1.5;
  if(comp==="couple"&&(p.tags.includes("cafe")||p.tags.includes("photo")))s+=1;
  if(comp==="friends"&&(p.tags.includes("food")||p.tags.includes("photo")||p.tags.includes("activity")))s+=1;
  if(comp==="group"&&p.id==="dongsam")s-=1; // 단체는 체험 예약 인원이 맞지 않을 수 있음
  if(age==="a50"&&p.id==="zipline")s-=1.5;
  if(nat==="ja"&&(p.id==="haenyeo"||p.id==="samjin"))s+=0.8;
  if((nat==="zh"||nat==="tw")&&(p.id==="namhang"||p.id==="lotte"))s+=0.8;
  if(nat==="us"&&p.tags.includes("culture"))s+=0.5;
  // 날씨: 맑으면 야외를 올리고, 비·더위·추위엔 실내·지붕 있는 곳을 올리고 야외는 내림
  const env=ENV[p.id]||"out";
  if(weather==="sun")s+={in:0,semi:0.5,out:1.5}[env];
  if(weather==="rain"){s+={in:3,semi:0.5,out:-3.5}[env];if(p.stairs)s-=2} // 비 오면 계단길이 미끄러움
  if(weather==="hot"){s+={in:1.5,semi:0.3,out:-1}[env];if(p.tags.includes("cafe"))s+=0.8}
  if(weather==="cold"){s+={in:1,semi:0.3,out:-1.5}[env];if(p.tags.includes("cafe"))s+=0.5}
  // places people actually stay longer than planned and rate highly get a small boost (learning from reviews)
  s+=((RATING[p.id]??4.3)-4.3)*0.8;
  return s;
}
function simulate(route,start){
  let tm=start,prev="T",late=false;const out=[];
  const hot=state.a.weather==="hot";
  for(const p of route){const lg=leg(prev,p.id);tm+=lg.min;if(p.open&&tm<p.open)tm=p.open;
    // 경로를 직접 고친 경우엔 사용자가 바꾼 머무는 시간을 씀
    const dw=(state.route&&state.dwell?.[p.id])||p.dwell;
    // 닫기 전에 다 보고 나올 수 없거나, 더운 날 한낮에 야외 체험이면 이 순서는 못 씀
    if(p.close&&tm+dw>p.close)late=true;
    if(hot&&HOT_NOON.includes(p.id)&&tm<900&&tm+dw>720)late=true;
    out.push({p,at:tm,lg,dw});tm+=dw;prev=p.id}
  const backLeg=leg(prev,"T");
  return {stops:out,end:tm+backLeg.min,leave:tm,back:backLeg.min,backLeg,late};
}
// 출항 몇 분 전까지 크루즈터미널에 돌아와 있어야 하는지
const RETURN_BEFORE=120;
// 입항 후 몇 분 뒤에 관광을 시작하는지 (하선·입국 수속 시간)
const DEPART_AFTER=60;
function plan(){
  // 추천 장소만으로 먼저 짜 보고, 한 곳도 못 넣으면 예비 장소까지 넣어 다른 코스를 짬
  const main=planWith(PLACES.filter(p=>!p.alt));
  if(!main.none)return main;
  const alt=planWith(PLACES);
  return alt.none?main:{...alt,alt:true};
}
function planWith(places){
  const c=CRUISES.find(x=>x.id===state.ship);
  const start=c.arr+DEPART_AFTER, limit=c.dep-RETURN_BEFORE, allAboard=limit;
  // 사용자가 경로를 직접 고쳤으면 그 순서 그대로 시간표만 계산
  if(state.route){
    const chosen=state.route.map(findPlace).filter(Boolean);
    const sim=simulate(chosen,start);
    return {c,start,allAboard,sim,ord:[...new Set(chosen.map(p=>p.zone))],chosen,dur:c.dep-c.arr,free:limit-start,none:false,custom:true,over:sim.end>limit};
  }
  const W=state.a.weather,OUTMAX={rain:1,cold:2,hot:3}[W]??99;
  const isOut=p=>(ENV[p.id]||"out")==="out";
  // 비 오는 날 야외는 관심사와 아주 잘 맞는 곳(점수 3 이상) 한 곳까지만
  const scored=places.map(p=>({p,s:score(p)})).filter(x=>x.s>0&&!(W==="rain"&&isOut(x.p)&&x.s<3));
  const beauty=state.a.interests.includes("beauty");
  let orders=[["E"],["W"],["E","W"],["W","E"]];
  if(beauty)orders=orders.concat([["E","O"],["W","O"],["E","W","O"]]);
  let best=null;
  for(const ord of orders){
    const pool=scored.filter(x=>ord.includes(x.p.zone)).sort((a,b)=>b.s-a.s);
    let chosen=[],meal=false;
    for(const x of pool){
      if(x.p.meal&&meal)continue;
      if(isOut(x.p)&&chosen.filter(isOut).length>=OUTMAX)continue;
      const trial=chosen.concat(x.p).sort((a,b)=>ord.indexOf(a.zone)-ord.indexOf(b.zone)||a.seq-b.seq);
      const sm=simulate(trial,start);
      if(sm.end<=limit&&!sm.late){chosen=trial;if(x.p.meal)meal=true}
    }
    if(!chosen.length)continue;
    const total=chosen.reduce((n,p)=>n+scored.find(y=>y.p===p).s,0)-(ord.length-1)*1.2;
    if(!best||total>best.total)best={ord,chosen,total};
  }
  if(!best){best={ord:["E"],chosen:[],total:0,none:true}}
  const sim=simulate(best.chosen,start);
  return {c,start,allAboard,sim,ord:best.ord,chosen:best.chosen,dur:c.dep-c.arr,free:limit-start,none:!!best.none};
}
// 기본 장소 + 사용자가 추가한 장소에서 id로 찾기
function findPlace(id){return PLACES.find(p=>p.id===id)||state.customPlaces.find(p=>p.id===id)}
// 새 장소를 넣었을 때 터미널 복귀가 가장 빠른 자리에 끼워 넣음
function insertBest(ids,newId,start){
  let best=null;
  for(let i=0;i<=ids.length;i++){
    const trial=[...ids.slice(0,i),newId,...ids.slice(i)];
    const end=simulate(trial.map(findPlace),start).end;
    if(!best||end<best.end)best={trial,end};
  }
  return best.trial;
}
function seeded(str){let h=2166136261;for(const ch of str){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return()=>{h^=h<<13;h^=h>>>17;h^=h<<5;return((h>>>0)%10000)/10000}}
