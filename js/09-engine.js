/* 추천 엔진: 장소 점수, 코스 고르기, 시간표 계산
   담당: ③ AI·동선 */

/* ---------- recommendation engine (rule-based stand-in for the AI model) ---------- */
// 장소별 실내/야외 구분과 날씨별로 아예 빼는 곳
const ENV={museum:"in",taejongdae:"out",gamji:"semi",haenyeo:"semi",huinnyeoul:"out",trail:"out",cafe:"in",kkangkkangi:"out",bongnae:"semi",bridge:"out",daiso:"in",oliveyoung:"in",lotte:"in"};
const WX_BLOCK={rain:["trail","huinnyeoul","bridge"],cold:["trail","bridge"]};
function score(p){
  const {age,comp,nat,interests,weather}=state.a;
  if((p.out||p.shop)&&!interests.includes("beauty"))return -1;
  if(p.shop)return 12;
  const m=p.tags.filter(g=>interests.includes(g)).length;
  let s=m?1+3*m:0.6;
  if(p.stairs&&age==="a70")s-=5;
  if(p.stairs&&age==="a50")s-=1.5;
  if(p.stairs&&comp==="family")s-=1;
  if(p.stairs&&comp==="group")s-=1;
  if(comp==="family"&&p.indoor)s+=2;
  if(comp==="couple"&&(p.tags.includes("cafe")||p.tags.includes("photo")))s+=1;
  if(comp==="friends"&&(p.tags.includes("food")||p.tags.includes("photo")))s+=1;
  if(nat==="ja"&&p.id==="haenyeo")s+=0.8;
  if((nat==="zh"||nat==="tw")&&(p.id==="bongnae"||p.id==="lotte"))s+=0.8;
  if(nat==="us"&&p.tags.includes("culture"))s+=0.5;
  // 날씨: 위험한 곳은 아예 빼고, 실내·지붕 있는 곳은 올리고 야외는 내림
  if(WX_BLOCK[weather]?.includes(p.id))return -1;
  const env=ENV[p.id]||"out";
  if(weather==="rain")s+={in:3,semi:0.5,out:-3.5}[env];
  if(weather==="hot"){s+={in:1.5,semi:0.3,out:-1}[env];if(p.id==="cafe")s+=1.5}
  if(weather==="cold")s+={in:1,semi:0.3,out:-1.5}[env];
  // places people actually stay longer than planned and rate highly get a small boost (learning from reviews)
  s+=(RATING[p.id]-4.3)*0.8;
  return s;
}
function simulate(route,start){
  let tm=start,prev="T";const out=[];
  for(const p of route){const lg=leg(prev,p.id);tm+=lg.min;if(p.open&&tm<p.open)tm=p.open;out.push({p,at:tm,lg});tm+=p.dwell;prev=p.id}
  const backLeg=leg(prev,"T");
  return {stops:out,end:tm+backLeg.min,leave:tm,back:backLeg.min,backLeg};
}
// 출항 몇 분 전까지 크루즈터미널에 돌아와 있어야 하는지
const RETURN_BEFORE=120;
// 입항 후 몇 분 뒤에 관광을 시작하는지 (하선·입국 수속 시간)
const DEPART_AFTER=60;
function plan(){
  const c=CRUISES.find(x=>x.id===state.ship);
  const start=c.arr+DEPART_AFTER, limit=c.dep-RETURN_BEFORE, allAboard=limit;
  const W=state.a.weather,OUTMAX={rain:1,cold:2,hot:3}[W]??99;
  const isOut=p=>(ENV[p.id]||"out")==="out";
  // 비 오는 날 야외는 관심사와 아주 잘 맞는 곳(점수 3 이상) 한 곳까지만
  const scored=PLACES.map(p=>({p,s:score(p)})).filter(x=>x.s>0&&!(W==="rain"&&isOut(x.p)&&x.s<3));
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
      if(simulate(trial,start).end<=limit){chosen=trial;if(x.p.meal)meal=true}
    }
    if(!chosen.length)continue;
    const total=chosen.reduce((n,p)=>n+scored.find(y=>y.p===p).s,0)-(ord.length-1)*1.2;
    if(!best||total>best.total)best={ord,chosen,total};
  }
  if(!best){best={ord:["E"],chosen:[],total:0,none:true}}
  const sim=simulate(best.chosen,start);
  return {c,start,allAboard,sim,ord:best.ord,chosen:best.chosen,dur:c.dep-c.arr,free:limit-start,none:!!best.none};
}
function seeded(str){let h=2166136261;for(const ch of str){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return()=>{h^=h<<13;h^=h>>>17;h^=h<<5;return((h>>>0)%10000)/10000}}
