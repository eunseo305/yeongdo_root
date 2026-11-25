/* 운영자 분석용 시연 데이터 (체류시간, 별점, 소비, 시간대별 방문, 후기 예시)
   담당: ④ 데이터·운영 */

/* ---------- operator analysis: sample data (replace with real QR logs, reviews, card spending) ---------- */
const DWELL={museum:52,taejongdae:104,gamji:71,haenyeo:66,huinnyeoul:58,trail:35,kkangkkangi:31,bongnae:47,bridge:22,lotte:88,daiso:33,oliveyoung:37,samjin:28,namhang:46,momos:52,peak:63,heilleu:51,isongdo:24,arte:72,jonaegi:22,zipline:38,dongsam:95};
const RATING={museum:4.4,taejongdae:4.7,gamji:4.5,haenyeo:4.6,huinnyeoul:4.8,trail:4.3,kkangkkangi:4.1,bongnae:4.2,bridge:3.9,lotte:4.6,daiso:4.3,oliveyoung:4.5,samjin:4.5,namhang:4.2,momos:4.6,peak:4.5,heilleu:4.5,isongdo:4.4,arte:4.6,jonaegi:4.1,zipline:4.5,dongsam:4.3};
const RCOUNT={museum:86,taejongdae:212,gamji:97,haenyeo:64,huinnyeoul:175,trail:41,kkangkkangi:28,bongnae:52,bridge:39,lotte:143,daiso:58,oliveyoung:74,samjin:118,namhang:37,momos:96,peak:121,heilleu:44,isongdo:33,arte:109,jonaegi:19,zipline:57,dongsam:26};
// star rating from this app's own reviews: sample base + reviews left on this device
function placeRating(id){
  const mine=loadReviews().filter(r=>r.place===id);
  const n=RCOUNT[id]+mine.length;
  const avg=(RATING[id]*RCOUNT[id]+mine.reduce((s,r)=>s+r.stars,0))/n;
  return {avg:avg.toFixed(1),n};
}
const mapLinks=(p,L)=>{const nv=L==="ko"?"네이버 지도":"NAVER Map";const q=encodeURIComponent((p.out?"부산 ":"부산 영도 ")+p.name.ko.replace(/ \(.*\)/,""));return `<span class="maps"><a href="https://map.naver.com/p/search/${q}" target="_blank" rel="noopener">${nv}</a></span>`};
const SPEND=[
 {k:"ja",avg:38000,food:55,cafe:20,shop:25},
 {k:"zh",avg:52000,food:35,cafe:10,shop:55},
 {k:"us",avg:41000,food:45,cafe:30,shop:25},
 {k:"kr",avg:29000,food:50,cafe:35,shop:15}
];
const HOURS=[[9,180],[10,420],[11,610],[12,720],[13,540],[14,430],[15,300],[16,120],[17,40]];
const SAMPLE_REVIEWS=[
 {stars:5,place:"huinnyeoul",nat:"ja",text:"写真がとてもきれいに撮れました。時間がもっと欲しかった。"},
 {stars:4,place:"taejongdae",nat:"us",text:"Train was easy for my parents. Lighthouse view was the highlight."},
 {stars:5,place:"gamji",nat:"zh",text:"海鲜很新鲜，看着海吃饭很开心。"},
 {stars:3,place:"bridge",nat:"kr",text:"도개 시간이 안 맞아서 아쉬웠어요. 시간 안내가 더 있었으면."}
];
