/* 장소 별점 시연 데이터 (실제 후기가 쌓이면 바꿀 것). 이용 통계는 관리자 페이지(admin/)에서 봄
   담당: ④ 데이터·운영 */

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
