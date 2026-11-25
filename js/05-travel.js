/* 장소 좌표와 이동시간 계산 (도보·택시·버스)
   담당: ③ AI·동선 */

// 장소 좌표 (위도, 경도). 도보·택시·버스 이동시간 계산과 지도에 써요
// T = 부산항 영도 크루즈터미널
const COORD={T:[35.0808,129.0792],
 // 음식
 samjin:[35.0932,129.0429],haenyeo:[35.0670,129.0660],namhang:[35.0879,129.0440],
 // 카페
 momos:[35.0960,129.0426],peak:[35.0864,129.0767],heilleu:[35.0780,129.0450],
 // 풍경·사진
 huinnyeoul:[35.0774,129.0457],isongdo:[35.0755,129.0480],
 // 문화·예술
 museum:[35.0787,129.0803],arte:[35.0865,129.0759],jonaegi:[35.0853,129.0583],
 // 쇼핑·뷰티
 daiso:[35.0760,129.0719],oliveyoung:[35.0935,129.0375],lotte:[35.0971,129.0364],
 // 액티비티
 zipline:[35.0620,129.0792],taejongdae:[35.0596,129.0800],dongsam:[35.0693,129.0807],
 // 예비 장소
 gamji:[35.0553,129.0852],bongnae:[35.0912,129.0430],kkangkkangi:[35.0918,129.0360],trail:[35.0748,129.0466],bridge:[35.0950,129.0355]};
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
