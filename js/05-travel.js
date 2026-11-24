/* 장소 좌표와 이동시간 계산 (도보·택시·버스)
   담당: ③ AI·동선 */

// approximate map positions (lat, lng) used to estimate travel time by walking, taxi and bus
const COORD={T:[35.0756,129.0789],museum:[35.0785,129.0804],taejongdae:[35.0596,129.0832],gamji:[35.0553,129.0852],haenyeo:[35.0612,129.0640],
 huinnyeoul:[35.0781,129.0446],trail:[35.0748,129.0466],cafe:[35.0880,129.0690],kkangkkangi:[35.0918,129.0360],bongnae:[35.0912,129.0430],
 daiso:[35.0905,129.0405],bridge:[35.0950,129.0355],oliveyoung:[35.0935,129.0375],lotte:[35.0975,129.0347]};
function km(a,b){const R=6371,r=Math.PI/180,[la1,lo1]=COORD[a],[la2,lo2]=COORD[b];const dl=(la2-la1)*r,dn=(lo2-lo1)*r;
  const h=Math.sin(dl/2)**2+Math.cos(la1*r)*Math.cos(la2*r)*Math.sin(dn/2)**2;return 2*R*Math.asin(Math.sqrt(h))*1.35}
function leg(a,b){
  const {age,comp,weather}=state.a;
  const d=km(a,b),slow=age==="a70";
  const walk=Math.max(2,Math.round(d/(slow?3.2:4.2)*60));
  const taxi=Math.max(3,Math.round(d/22*60)+4);
  const bus=d<1.2?null:Math.round(d/15*60)+10;
  const lim=(slow||weather==="rain"||weather==="hot")?10:15;
  let mode,why;
  if(walk<=lim){mode="walk";why="near"}
  else if(weather==="rain"){mode="taxi";why="rain"}
  else if(slow||comp==="family"){mode="taxi";why="comfort"}
  else if(bus!==null&&bus-taxi<=10){mode="bus";why="cheap"}
  else{mode="taxi";why="fast"}
  return {d,walk,taxi,bus,mode,why,min:{walk,taxi,bus}[mode]};
}
