/* 내 위치 버튼 (네이버 지도 앱의 ⌖ 버튼처럼): 누르면 지도를 내 위치로 옮기고 파란 점 표시
   담당: ③ AI·동선
   - MYLOC_TEST: 테스트용 가상 위치. 지금은 영도에 있을 수 없어서 영도 부산항(크루즈터미널, COORD.T)으로 고정.
     실제 GPS를 쓰려면 null 로 바꾸세요.  예) const MYLOC_TEST=null;
   - 화장실 기능(13b-toilets.js)도 myGeo()로 위치를 받으므로 같은 가상 위치를 기준으로 씀 */
const MYLOC_TEST=COORD.T;
const MYT={
ko:{go:"내 위치로 이동",me:"내 위치",fail:"위치를 확인할 수 없어요",test:"테스트 위치: 크루즈터미널"},
en:{go:"Go to my location",me:"You are here",fail:"Couldn't get your location",test:"Test location: cruise terminal"},
ja:{go:"現在地へ移動",me:"現在地",fail:"現在地を取得できません",test:"テスト位置：クルーズターミナル"},
zh:{go:"移到我的位置",me:"我的位置",fail:"无法获取您的位置",test:"测试位置：邮轮码头"}};
let myLocOn=false,myLocLL=null,nMe=[];

/* 위치 받기: 테스트 위치가 있으면 그 값을, 없으면 브라우저 GPS를 씀 (navigator.geolocation과 같은 모양) */
function myGeo(){
  if(!MYLOC_TEST)return navigator.geolocation||null;
  const fake=ok=>setTimeout(()=>ok({coords:{latitude:MYLOC_TEST[0],longitude:MYLOC_TEST[1],accuracy:0}}),150);
  return {getCurrentPosition:ok=>fake(ok),watchPosition:ok=>{fake(ok);return -1},clearWatch:()=>{}};
}
const myLabel=()=>MYT[state.lang].me+(MYLOC_TEST?` (${MYT[state.lang].test})`:"");

/* 약도(SVG)용 파란 점 */
function myLocSvg(){
  if(!myLocOn||!myLocLL)return "";
  const [x,y]=proj(...myLocLL),k=(1/ZK).toFixed(3);
  return `<g class="me-dot" transform="translate(${x} ${y}) scale(${k})"><title>${esc(myLabel())}</title><circle r="13" fill="#1a73e8" opacity=".18"/><circle r="6.5" fill="#1a73e8" stroke="#fff" stroke-width="2.5"/></g>`;
}
/* 네이버 지도용 파란 점 (화장실의 .nme 모양을 같이 씀) */
function drawNaverMe(){
  clearOverlays(nMe);
  if(!myLocOn||!myLocLL||!nmapObj)return;
  const N=naver.maps;
  nMe.push(new N.Marker({map:nmapObj,position:new N.LatLng(...myLocLL),zIndex:5,
    icon:{content:`<div class="nme" title="${esc(myLabel())}" aria-label="${esc(myLabel())}"></div>`,anchor:new N.Point(13,13)}}));
}
function myLocBtnHTML(){
  const L=state.lang;
  return `<button type="button" class="locbtn" id="locBtn" aria-pressed="${myLocOn}" aria-label="${esc(MYT[L].go)}" title="${esc(MYT[L].go+(MYLOC_TEST?" · "+MYT[L].test:""))}">
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="6.5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="2.6" fill="currentColor"/><path d="M12 1.5v4M12 18.5v4M1.5 12h4M18.5 12h4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>`;
}
/* 지도를 내 위치로 옮김 (네이버 지도: 가운데+확대 / 약도: 전체 보기로 바꿔 섬 전체에서 점이 보이게) */
function centerMyLoc(r){
  if(nmapObj&&document.getElementById("nmap")?.style.display!=="none"){
    nmapObj.setCenter(new naver.maps.LatLng(...myLocLL));if(nmapObj.getZoom()<16)nmapObj.setZoom(16);
  }else if(!state.mapFull){
    state.mapFull=true;const zt=document.getElementById("zoomToggle");if(zt)zt.textContent=MAPT[state.lang].zoom;
  }
  refreshMap(r);drawNaverMe();if(typeof drawNaverWc==="function")drawNaverWc();
}
function wireMyLoc(r){
  const b=document.getElementById("locBtn");if(!b)return;
  b.onclick=()=>{
    const g=myGeo(),fail=()=>{b.classList.remove("busy");const c=document.getElementById("mapCap");if(c){const o=c.textContent;c.textContent=MYT[state.lang].fail;setTimeout(()=>{if(c.textContent===MYT[state.lang].fail)c.textContent=o},2500)}};
    if(!g)return fail();
    b.classList.add("busy");
    g.getCurrentPosition(pos=>{
      b.classList.remove("busy");
      myLocLL=[pos.coords.latitude,pos.coords.longitude];myLocOn=true;
      const x=document.getElementById("locBtn");if(x)x.setAttribute("aria-pressed","true");
      centerMyLoc(lastR||r);
    },fail,{enableHighAccuracy:true,maximumAge:10000,timeout:10000});
  };
}
function myLocReset(){myLocOn=false;myLocLL=null;clearOverlays(nMe)}
