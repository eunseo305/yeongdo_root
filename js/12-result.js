/* 결과 화면: 추천 동선, 통계, 후기 남기기
   담당: ② 화면 */

/* ---------- 경로 수정 (일정 탭)
   '✏️ 경로 수정'을 누르면: 장소마다 ▲ 위로 · ▼ 아래로 · ✕ 빼기, 장소 사이마다 ＋ 장소 추가 버튼이 나타남
   (폰에서는 장소를 왼쪽으로 밀어서 빼기도 됨) ---------- */
const EDT={
ko:{edit:"✏️ 경로 수정",done:"✓ 수정 완료",hint:"▲ 위로 · ▼ 아래로 버튼으로 순서를 바꾸고, ✕ 빼기 버튼으로 뺄 수 있어요. 장소를 더 넣고 싶은 자리에서 ＋ 여기에 장소 추가를 누르세요.",up:"위로",down:"아래로",upAria:n=>`${n} 한 칸 위로`,downAria:n=>`${n} 한 칸 아래로`,swipeDel:"빼기",delAria:n=>`${n} 빼기`,
  addHere:"＋ 여기에 장소 추가",addAria:n=>`${n}번째 자리에 장소 추가`,addAt:n=>`${n}번째 자리에 넣기`,close:"닫기",addH:"목록에서 고르기",add:"넣기",none:"넣을 수 있는 장소가 없어요",
  myH:"또는 내가 원하는 장소",name:"장소 이름",dwell:"머무는 시간(분)",pick:"📍 지도에서 위치 찍기",picking:"지도에서 새 장소 위치를 눌러 주세요",cancel:"취소",reset:"추천 코스로 되돌리기",
  ovT:"귀선 시간을 넘겨요",ovP:(n,e,b)=>`${n}에 머무는 시간을 늘리면 ${e}에 터미널에 돌아와요. 귀선 시간 ${b}보다 늦어요. 일정을 변경할까요?`,ovFit:m=>`네, ${m}분으로 맞출게요`,ovBack:"네, 이전 시간으로 되돌릴게요",ovKeep:"아니요, 그대로 둘게요",
  doneP:(e,b)=>`지금 경로로는 ${e}에 터미널에 돌아와서 귀선 시간 ${b}을 넘겨요. 장소를 빼거나 머무는 시간을 줄여 주세요.`,doneFix:"경로 계속 고치기",doneKeep:"그래도 완료",
  stay:"머무는 시간",less:n=>`${n} 머무는 시간 10분 줄이기`,more:n=>`${n} 머무는 시간 10분 늘리기`,stayAria:n=>`${n} 머무는 시간(분)`,
  course:"나만의 영도 코스",mine:"내가 추가한 곳",reason:"직접 고친 경로예요. 이동시간은 직선거리로 어림한 값이에요.",over:(e,b)=>`이 경로는 ${e}에 터미널에 돌아와요. 귀선 기한 ${b}보다 늦어요. 장소를 빼거나 머무는 시간을 줄여 주세요.`},
en:{edit:"✏️ Edit route",done:"✓ Done",hint:"Use ▲ Up and ▼ Down to reorder and ✕ Remove to take a stop out. Tap ＋ Add a place here wherever you want another stop.",up:"Up",down:"Down",upAria:n=>`Move ${n} up`,downAria:n=>`Move ${n} down`,swipeDel:"Remove",delAria:n=>`Remove ${n}`,
  addHere:"＋ Add a place here",addAria:n=>`Add a place at position ${n}`,addAt:n=>`Add at position ${n}`,close:"Close",addH:"Pick from the list",add:"Add",none:"No more places to add",
  myH:"Or add your own place",name:"Place name",dwell:"Time there (min)",pick:"📍 Pick on map",picking:"Tap the map where the new place is",cancel:"Cancel",reset:"Back to recommended route",
  ovT:"You'd miss all-aboard",ovP:(n,e,b)=>`With more time at ${n}, you'd get back to the terminal at ${e}, later than the ${b} all-aboard time. Change the schedule?`,ovFit:m=>`Yes, set it to ${m} min`,ovBack:"Yes, undo my change",ovKeep:"No, keep it",
  doneP:(e,b)=>`With this route you'd get back to the terminal at ${e}, past the ${b} all-aboard time. Remove a stop or shorten a visit.`,doneFix:"Keep editing",doneKeep:"Finish anyway",
  stay:"Time there",less:n=>`10 min less at ${n}`,more:n=>`10 min more at ${n}`,stayAria:n=>`Minutes at ${n}`,
  course:"My Yeongdo route",mine:"Added by you",reason:"You edited this route. Travel times are estimated from straight-line distance.",over:(e,b)=>`This route gets you back at ${e}, later than the ${b} all-aboard deadline. Remove a stop or shorten a visit.`},
ja:{edit:"✏️ ルート編集",done:"✓ 編集完了",hint:"▲ 上へ・▼ 下へで順番を変え、✕ 削除で外せます。追加したい位置の＋ ここに場所を追加を押してください。",up:"上へ",down:"下へ",upAria:n=>`${n}を1つ上へ`,downAria:n=>`${n}を1つ下へ`,swipeDel:"削除",delAria:n=>`${n}を削除`,
  addHere:"＋ ここに場所を追加",addAria:n=>`${n}番目に場所を追加`,addAt:n=>`${n}番目に追加`,close:"閉じる",addH:"リストから選ぶ",add:"追加",none:"追加できる場所がありません",
  myH:"または行きたい場所",name:"場所の名前",dwell:"滞在時間（分）",pick:"📍 地図で位置を選ぶ",picking:"地図で新しい場所の位置をタップしてください",cancel:"キャンセル",reset:"おすすめルートに戻す",
  ovT:"帰船時刻を過ぎます",ovP:(n,e,b)=>`${n}の滞在を延ばすと、ターミナルに戻るのは${e}で、帰船時刻${b}より遅くなります。日程を変更しますか？`,ovFit:m=>`はい、${m}分にします`,ovBack:"はい、元の時間に戻します",ovKeep:"いいえ、このままにします",
  doneP:(e,b)=>`このルートではターミナルに戻るのが${e}で、帰船時刻${b}を過ぎます。場所を減らすか滞在を短くしてください。`,doneFix:"編集を続ける",doneKeep:"このまま完了",
  stay:"滞在時間",less:n=>`${n}の滞在を10分減らす`,more:n=>`${n}の滞在を10分増やす`,stayAria:n=>`${n}の滞在時間（分）`,
  course:"わたしの影島ルート",mine:"自分で追加",reason:"手動で編集したルートです。移動時間は直線距離からの目安です。",over:(e,b)=>`このルートでは${e}にターミナルに戻ります。帰船期限${b}より遅いので、場所を減らすか滞在を短くしてください。`},
zh:{edit:"✏️ 修改路线",done:"✓ 完成",hint:"用▲ 上移、▼ 下移调整顺序，用✕ 删除移除地点。想加地点的位置点击＋ 在此添加地点。",up:"上移",down:"下移",upAria:n=>`将${n}上移一位`,downAria:n=>`将${n}下移一位`,swipeDel:"删除",delAria:n=>`删除${n}`,
  addHere:"＋ 在此添加地点",addAria:n=>`在第${n}个位置添加地点`,addAt:n=>`添加到第${n}个位置`,close:"关闭",addH:"从列表选择",add:"添加",none:"没有可添加的地点",
  myH:"或添加想去的地点",name:"地点名称",dwell:"停留时间（分钟）",pick:"📍 在地图上选择位置",picking:"请在地图上点击新地点的位置",cancel:"取消",reset:"恢复推荐路线",
  ovT:"会错过登船时间",ovP:(n,e,b)=>`延长在${n}的停留后，将于${e}回到码头，晚于登船时间${b}。要调整行程吗？`,ovFit:m=>`是，改为${m}分钟`,ovBack:"是，恢复原来的时间",ovKeep:"不，保持不变",
  doneP:(e,b)=>`按当前路线将于${e}回到码头，超过登船时间${b}。请删减地点或缩短停留。`,doneFix:"继续修改",doneKeep:"仍然完成",
  stay:"停留时间",less:n=>`${n}停留减少10分钟`,more:n=>`${n}停留增加10分钟`,stayAria:n=>`${n}停留时间（分钟）`,
  course:"我的影岛路线",mine:"自己添加",reason:"这是手动修改的路线，交通时间按直线距离估算。",over:(e,b)=>`按此路线将于${e}回到码头，晚于${b}的登船期限。请删减地点或缩短停留。`}};
// 내가 추가한 장소는 이 기기에 저장해 두고 다음에도 고를 수 있게 함
function saveCustom(){try{localStorage.setItem("yd-custom",JSON.stringify(state.customPlaces))}catch(e){}}
try{state.customPlaces=JSON.parse(localStorage.getItem("yd-custom")||"[]").filter(p=>p&&p.id&&Array.isArray(p.ll))}catch(e){state.customPlaces=[]}
state.customPlaces.forEach(p=>{COORD[p.id]=p.ll});
const SWIPE_DEL=90; // 왼쪽으로 이만큼(px) 밀면 빠짐

// 장소 사이 '＋ 여기에 추가' 버튼 (at = 새 장소가 들어갈 순번, 0부터)
function addBtnHTML(at){
  if(!state.editing)return ""; // '경로 수정'을 눌렀을 때만 보임
  const E=EDT[state.lang]||EDT.en;
  return `<button type="button" class="addbtn" data-at="${at}" aria-expanded="${state.addAt===at}" aria-label="${esc(E.addAria(at+1))}">${E.addHere}</button>`;
}
// ＋를 누르면 그 자리에 펼쳐지는 넣기 상자
function addPanelHTML(r,at){
  const L=state.lang,E=EDT[L]||EDT.en,ids=r.chosen.map(p=>p.id);
  const rest=[...PLACES,...state.customPlaces].filter(p=>!ids.includes(p.id));
  return `<li class="addpanel" id="addPanel"><div class="card">
    <div class="aphead"><b>${E.addAt(at+1)}</b><button type="button" class="link" id="apClose">${E.close}</button></div>
    <label class="f" for="edSel">${E.addH}</label>
    <div class="edrow"><select id="edSel" ${rest.length?"":"disabled"}>${rest.length?rest.map(p=>`<option value="${p.id}">${esc(p.name[L])}${p.custom?" · "+E.mine:""}</option>`).join(""):`<option>${E.none}</option>`}</select>
      <button type="button" class="btn sea edadd" id="edAdd" ${rest.length?"":"disabled"}>${E.add}</button></div>
    <p style="font-weight:700;font-size:14.5px;margin-top:4px">${E.myH}</p>
    <div class="edrow"><label class="f" style="flex:1">${E.name}<input id="edName" class="edin" maxlength="40" autocomplete="off"></label>
      <label class="f" style="width:7.5em">${E.dwell}<input id="edDwell" class="edin" type="number" min="5" max="240" step="5" value="30"></label></div>
    <button type="button" class="btn ghost" id="edPick">${E.pick}</button>
  </div></li>`;
}
// 지도에서 누른 위치로 새 장소를 만들어, ＋를 눌렀던 자리에 넣음
function pickAt(lat,lng){
  const d=state.picking;if(!d||!lastR)return;
  const id="c"+Date.now().toString(36),nm={ko:d.name,en:d.name,ja:d.name,zh:d.name};
  const desc=Object.fromEntries(Object.keys(EDT).map(k=>[k,EDT[k].mine]));
  const p={id,zone:"C",seq:0,dwell:d.dwell,tags:[],stairs:false,meal:false,custom:true,ll:[+lat.toFixed(5),+lng.toFixed(5)],name:nm,d:desc};
  COORD[id]=p.ll;state.customPlaces.push(p);saveCustom();
  const v=lastR.chosen.map(q=>q.id);
  if(Number.isInteger(d.at))v.splice(Math.min(d.at,v.length),0,id);else v.push(id);
  state.route=v;state.picking=null;state.resTab="tl";
  renderResult(document.getElementById("screen"),document.getElementById("actions"));
  document.querySelector(`#tab-tl li.stop[data-id="${id}"]`)?.scrollIntoView({block:"center"});
}
function wireEdit(r,s,a){
  const ids=()=>r.chosen.map(p=>p.id);
  // 경로를 바꾸고 다시 그림. 키보드로 쓰는 사람을 위해 방금 누른 버튼 자리로 포커스를 돌려줌
  const commit=(v,focusId,sel=".delbtn")=>{
    state.route=v;state.addAt=null;renderResult(s,a);
    if(!focusId)return;
    const li=document.querySelector(`#tab-tl li.stop[data-id="${focusId}"]`);
    (li?.querySelector(`${sel}:not(:disabled)`)||li?.querySelector(".mvbtn:not(:disabled)")||li?.querySelector(".delbtn"))?.focus();
  };

  // ＋ 여기에 추가 / 넣기 상자
  s.querySelectorAll(".addbtn").forEach(b=>b.onclick=()=>{
    const at=+b.dataset.at;state.addAt=state.addAt===at?null:at;renderResult(s,a);
    document.getElementById("edSel")?.focus();
  });
  const close=document.getElementById("apClose");
  if(close)close.onclick=()=>{const at=state.addAt;state.addAt=null;renderResult(s,a);s.querySelector(`.addbtn[data-at="${at}"]`)?.focus()};
  const add=document.getElementById("edAdd");
  if(add)add.onclick=()=>{const id=document.getElementById("edSel").value;if(!findPlace(id))return;const v=ids();v.splice(state.addAt,0,id);commit(v,id)};
  const pick=document.getElementById("edPick");
  if(pick)pick.onclick=()=>{
    const ni=document.getElementById("edName"),name=ni.value.trim();
    if(!name){ni.setAttribute("aria-invalid","true");ni.focus();return}
    const dw=Math.min(240,Math.max(5,Math.round(+document.getElementById("edDwell").value||30)));
    state.picking={name,dwell:dw,at:state.addAt};state.addAt=null;state.resTab="map";renderResult(s,a);
    document.getElementById("pickBar")?.scrollIntoView({block:"center"});
  };
  const rs=document.getElementById("edReset");
  if(rs)rs.onclick=()=>{state.route=null;state.dwell={};state.addAt=null;renderResult(s,a)};

  // 머무는 시간 바꾸기: − / + 는 10분씩, 칸에 직접 써도 됨 (5~240분)
  const setDwell=(id,m,sel)=>{
    const old=r.sim.stops.find(st=>st.p.id===id)?.dw,wasOver=r.over;
    const nv=Math.min(240,Math.max(5,Math.round(m)));
    state.dwell={...(state.dwell||{}),[id]:nv};
    commit(ids(),id,sel);
    // 시간을 늘려서 귀선 시간을 새로 넘기게 되면 팝업으로 물어봄
    const r2=lastR;
    if(r2.over&&!wasOver&&nv>old)overPopup(id,old,nv,r2,s,a,sel);
  };
  s.querySelectorAll("#tab-tl .dwedit").forEach(box=>{
    const id=box.dataset.id,inp=box.querySelector(".dwin");
    box.querySelectorAll(".dwbtn").forEach(b=>b.onclick=()=>setDwell(id,(+inp.value||0)+ +b.dataset.d,`.dwbtn[data-d="${b.dataset.d}"]`));
    inp.onchange=()=>setDwell(id,+inp.value||30,".dwin");
  });
  const pc=document.getElementById("pickCancel");
  if(pc)pc.onclick=()=>{state.picking=null;state.resTab="tl";renderResult(s,a)};

  // ✏️ 경로 수정 / 완료
  const tg=document.getElementById("edToggle");
  const toggle=()=>{state.editing=!state.editing;state.addAt=null;renderResult(s,a);document.getElementById("edToggle")?.focus()};
  if(tg)tg.onclick=()=>{
    // 수정 완료를 누를 때 귀선 시간을 넘기는 경로면 팝업으로 알려 줌
    if(!state.editing||!r.over)return toggle();
    const L=state.lang,E=EDT[L]||EDT.en;
    askModal({title:E.ovT,body:E.doneP(hmD(r.sim.end),hmD(r.allAboard)),no:E.doneKeep,yes:E.doneFix},yes=>{
      if(yes)return document.querySelector("#tab-tl li.stop .dwin")?.focus(); // 계속 고치기
      toggle(); // 그래도 완료
    });
  };

  // 수정 중일 때만 ▲ 위로 · ▼ 아래로 · ✕ 빼기 연결 (수정 중이 아니면 버튼이 없음)
  s.querySelectorAll("#tab-tl .timeline.editing li.stop").forEach(li=>{
    const i=+li.dataset.i;
    li.querySelector(".delbtn").onclick=()=>{const v=ids(),next=v[i+1]||v[i-1];v.splice(i,1);commit(v,next,".delbtn")};
    li.querySelectorAll(".mvbtn").forEach(b=>b.onclick=()=>{
      const d=+b.dataset.mv,v=ids(),j=i+d;if(j<0||j>=v.length)return;
      [v[i],v[j]]=[v[j],v[i]];commit(v,v[j],`.mvbtn[data-mv="${d}"]`);
      document.querySelector(`#tab-tl li.stop[data-id="${v[j]}"]`)?.scrollIntoView({block:"center"});
    });
    // 왼쪽으로 밀어서 빼기 (세로로 움직이면 그냥 스크롤)
    li.onpointerdown=e=>{
      if(e.button>0||e.target.closest("button,a,select,input,label"))return;
      const x0=e.clientX,y0=e.clientY;let on=false,dx=0;
      const end=()=>{li.removeEventListener("pointermove",move);li.removeEventListener("pointerup",up);li.removeEventListener("pointercancel",cancel)};
      const move=ev=>{
        dx=ev.clientX-x0;const dy=ev.clientY-y0;
        if(!on){
          if(Math.abs(dx)>10&&Math.abs(dx)>Math.abs(dy)*1.5){on=true;li.setPointerCapture(ev.pointerId);li.classList.add("swiping")}
          else{if(Math.abs(dy)>10)end();return}
        }
        li.style.transform=`translateX(${Math.min(0,dx)}px)`;li.classList.toggle("willdel",dx<-SWIPE_DEL);
      };
      const cancel=()=>{end();li.classList.remove("swiping","willdel");li.style.transform=""};
      const up=()=>{
        if(on&&dx<-SWIPE_DEL){end();const v=ids();v.splice(i,1);commit(v)}
        else cancel();
      };
      li.addEventListener("pointermove",move);li.addEventListener("pointerup",up);li.addEventListener("pointercancel",cancel);
    };
  });

  // 약도(SVG)에서 위치 찍기: 화면 좌표 → 약도 좌표 → 위도·경도
  const sm=document.getElementById("smap");
  if(sm)sm.onclick=e=>{
    if(!state.picking)return;
    const svg=sm.querySelector("svg");if(!svg)return;
    const pt=svg.createSVGPoint();pt.x=e.clientX;pt.y=e.clientY;
    const q=pt.matrixTransform(svg.getScreenCTM().inverse());
    pickAt(MB.lat0-q.y/MB.H*(MB.lat0-MB.lat1),MB.lng0+q.x/MB.W*(MB.lng1-MB.lng0));
  };
}

/* 머무는 시간을 늘려 귀선 시간을 넘길 때 뜨는 팝업
   - 네: 귀선 시간에 딱 맞는 시간으로 줄임 (5분 아래로 내려가야 하면 이전 시간으로 되돌림)
   - 아니요 / 바깥 클릭 / Esc: 바꾼 시간 그대로 둠 (빨간 경고는 계속 보임) */
function overPopup(id,old,nv,r,s,a,sel){
  const L=state.lang,E=EDT[L]||EDT.en,p=findPlace(id);
  const fit=Math.floor((nv-(r.sim.end-r.allAboard))/5)*5;
  const useFit=fit>=5&&fit>=old,to=useFit?fit:old;
  askModal({title:E.ovT,body:E.ovP(p.name[L],hmD(r.sim.end),hmD(r.allAboard)),no:E.ovKeep,yes:useFit?E.ovFit(to):E.ovBack},yes=>{
    if(yes){state.dwell={...state.dwell,[id]:to};renderResult(s,a)}
    const li=document.querySelector(`#tab-tl li.stop[data-id="${id}"]`);
    (li?.querySelector(`${sel}:not(:disabled)`)||li?.querySelector(".dwin"))?.focus();
  });
}
// 귀선 경고 팝업 공통 틀: 아니요 / 바깥 클릭 / Esc → done(false), 네 → done(true)
function askModal({title,body,no,yes},done){
  const m=document.createElement("div");m.className="pmodal";
  m.innerHTML=`<div class="pm-box" role="alertdialog" aria-modal="true" aria-labelledby="ov-t" aria-describedby="ov-p">
    <div class="qhead"><h2 id="ov-t">⚠️ ${esc(title)}</h2><p class="muted" id="ov-p">${esc(body)}</p></div>
    <div class="pm-act"><button class="btn ghost" type="button" data-ov="no">${esc(no)}</button><button class="btn" type="button" data-ov="yes">${esc(yes)}</button></div></div>`;
  document.body.appendChild(m);
  const prevOv=document.body.style.overflow;document.body.style.overflow="hidden";
  const close=v=>{document.removeEventListener("keydown",onKey);document.body.style.overflow=prevOv;m.remove();done(v)};
  const onKey=e=>{if(e.key==="Escape")close(false)};
  document.addEventListener("keydown",onKey);
  m.onclick=e=>{
    if(e.target===m)return close(false);
    const b=e.target.closest("[data-ov]");if(b)close(b.dataset.ov==="yes");
  };
  m.querySelector('[data-ov="yes"]').focus();
}

function legHTML(lg,x){
  const m=k=>{const v=lg[k];const on=lg.mode===k;return `<span class="mode${on?" on":""}">${x.modes[k]} ${v===null?"—":v+x.min}</span>`};
  return `<div class="leg"><div class="modes">${m("walk")}${m("taxi")}${m("bus")}</div><span class="move"><b>${x.recLbl} ${x.modes[lg.mode]}</b> · ${x.why[lg.why]}</span></div>`;
}
function fmtDur(m,L){const h=Math.floor(m/60),n=m%60;
  if(L==="en")return (h?h+" h ":"")+(n?n+" min":"").trim();
  if(L==="ja")return (h?h+"時間":"")+(n?n+"分":"");
  if(L==="zh")return (h?h+"小时":"")+(n?n+"分钟":"");
  return (h?h+"시간 ":"")+(n?n+"분":"");}
/* 선호도 다시 고르기 모달 (결과 화면 위에 뜸)
   - 연령·동행: 하나 누르면 바로 반영하고 닫힘
   - 관심사: 여러 개 고른 뒤 "결과 보기"로 반영
   - 바깥 클릭 / Esc: 바꾼 것 취소 (이전 버튼은 없음) */
function openPrefModal(key,s,a,opener){
  const x=t(),b=qBody(key),snap={...state.a,interests:state.a.interests.slice()};
  const m=document.createElement("div");m.className="pmodal";
  m.innerHTML=`<div class="pm-box" role="dialog" aria-modal="true" aria-labelledby="pm-t">
    <div class="qhead"><h2 id="pm-t">${b.title}</h2>${b.sub?`<p class="muted">${b.sub}</p>`:""}</div>
    <div class="qblock pm-body" data-key="${key}">${b.opts}</div>
    ${key==="interests"?`<div class="pm-act"><button class="btn" type="button" data-pm="ok">${x.see}</button></div>`:""}</div>`;
  document.body.appendChild(m);
  const prevOv=document.body.style.overflow;document.body.style.overflow="hidden";
  const close=apply=>{
    if(!apply)state.a=snap;
    document.removeEventListener("keydown",onKey);document.body.style.overflow=prevOv;m.remove();
    if(apply){renderResult(s,a);const c=s.querySelector(`[data-edit="${key}"]`);if(c)c.focus()}else opener.focus();
  };
  const onKey=e=>{if(e.key==="Escape")close(false)};
  document.addEventListener("keydown",onKey);
  const ok=()=>{const o=m.querySelector('[data-pm="ok"]');if(o)o.disabled=!qFilled(key)};
  m.onclick=e=>{
    if(e.target===m)return close(false);
    const pm=e.target.closest("[data-pm]");
    if(pm)return pm.dataset.pm==="ok"?(qFilled(key)&&close(true)):close(false);
    const v=e.target.closest("[data-v]");if(!v)return;
    qApply(m.querySelector(".pm-body"),key,v.dataset.v);
    if(key==="interests")ok();else close(true);
  };
  ok();
  (m.querySelector('[aria-pressed="true"]')||m.querySelector("[data-v]")).focus();
}

function renderResult(s,a){
  const x=t(),r=plan(),L=state.lang;
  const ordKey=r.ord.includes("O")?"O":r.ord.join("");
  const W=state.a.weather;
  const E=EDT[L]||EDT.en;

  // 선호도 칩: 누르면 모달로 그 항목만 다시 고름 (openPrefModal). 나라는 칩에서 뺌
  const chip=(k,v)=>`<button type="button" class="chip" data-edit="${k}" aria-haspopup="dialog">${esc(v)}</button>`;
  const prof=[["age",x.age[state.a.age]],["comp",x.comp[state.a.comp]]].filter(([,v])=>v).map(([k,v])=>chip(k,v)).join("")+state.a.interests.map(k=>chip("interests",x.int[k])).join("");
  let tl=`<li class="tl"><span class="t">${hm(r.start)}</span><span class="rail"><span class="dot end"></span><span class="line"></span></span><div class="body"><strong>${x.disembark}</strong><span class="d">${r.c.name}</span>${addBtnHTML(0)}</div></li>`;
  if(state.addAt===0)tl+=addPanelHTML(r,0);
  r.sim.stops.forEach((st,i)=>{
    tl+=`<li class="tl stop" data-i="${i}" data-id="${st.p.id}"><span class="swipedel" aria-hidden="true">${E.swipeDel}</span><span class="t">${hm(st.at)}</span><span class="rail"><span class="dot"></span><span class="line"></span></span><div class="body">
      ${legHTML(st.lg,x)}
      <strong>${i+1}. ${esc(st.p.name[L])}${st.p.out?`<span class="tag-out">${x.outside}</span>`:""}</strong>
      ${st.p.custom?"":`<span class="rt" aria-label="${x.rtAria} ${placeRating(st.p.id).avg}/5"><span class="st">★</span> ${placeRating(st.p.id).avg} <small>(${placeRating(st.p.id).n})</small></span>`}
      <span class="d">${st.p.custom?"":`<span class="envb ${ENV[st.p.id]||"out"}">${x.env[ENV[st.p.id]||"out"]}</span> `}${esc(st.p.d[L])}${state.editing?"":` · ${st.dw}${x.min}`}</span>
      ${state.editing?`<span class="dwedit" data-id="${st.p.id}"><span class="dwlbl">${E.stay}</span>
        <button type="button" class="dwbtn" data-d="-10" aria-label="${esc(E.less(st.p.name[L]))}" ${st.dw<=5?"disabled":""}>−</button>
        <input class="dwin" type="number" inputmode="numeric" min="5" max="240" step="5" value="${st.dw}" aria-label="${esc(E.stayAria(st.p.name[L]))}">
        <span>${x.min}</span>
        <button type="button" class="dwbtn" data-d="10" aria-label="${esc(E.more(st.p.name[L]))}" ${st.dw>=240?"disabled":""}>＋</button></span>`:""}
      ${mapLinks(st.p,L)}
      ${addBtnHTML(i+1)}</div>
      ${state.editing?`<span class="edtools">
        <button type="button" class="mvbtn" data-mv="-1" aria-label="${esc(E.upAria(st.p.name[L]))}" ${i===0?"disabled":""}>▲ ${E.up}</button>
        <button type="button" class="mvbtn" data-mv="1" aria-label="${esc(E.downAria(st.p.name[L]))}" ${i===r.sim.stops.length-1?"disabled":""}>▼ ${E.down}</button>
        <button type="button" class="delbtn" aria-label="${esc(E.delAria(st.p.name[L]))}">✕ ${E.swipeDel}</button></span>`:""}</li>`;
    if(state.addAt===i+1)tl+=addPanelHTML(r,i+1);
  });
  tl+=`<li class="tl"><span class="t">${hm(r.sim.end)}</span><span class="rail"><span class="dot end"></span></span><div class="body">${legHTML(r.sim.backLeg,x)}<strong>${x.terminal}</strong></div></li>`;

  s.innerHTML=`
  <div style="display:flex;flex-direction:column;gap:8px">
    <p class="muted">${x.resultT} · ${state.cdate&&ALLC.length?(()=>{const x=new Date(state.cdate+"T00:00"),D=DT[L];return D.fmt(x.getMonth()+1,x.getDate(),D.wd[x.getDay()])+" · "})():""}${esc(r.c.name)} · ${hmD(r.c.arr)}–${hmD(r.c.dep)}</p>
    <div class="course-name">${r.custom?E.course:x.course[ordKey]}</div>
    ${W?(()=>{const c={in:0,semi:0,out:0};r.chosen.forEach(p=>c[ENV[p.id]||"out"]++);return `<div class="wxbar ${W}"><b>${x.wxDay} · ${esc(x.wx[W])}</b><span>${x.env.in} ${c.in}${x.cnt} · ${x.env.semi} ${c.semi}${x.cnt} · ${x.env.out} ${c.out}${x.cnt}</span></div>`})():""}
    <div class="chips">${prof}</div>
  </div>
  ${state.aiNote?`<div class="ainote"><b>${x.aiSays}</b><br>${esc(state.aiNote)}</div>`:""}
  ${state.aiMsg&&!state.aiNote?`<p class="muted">${esc(state.aiMsg)}</p>`:""}
  <div class="alert" role="note"><span>${x.leaveBy} <strong>${hmD(r.sim.leave)}</strong> · ${x.returnBy} <strong>${hmD(r.allAboard)}</strong></span><span class="muted">${x.alertP} (${x.dep} ${hmD(r.c.dep)})</span>${(()=>{const sp=r.allAboard-r.sim.end;return !r.none&&sp>=20?`<span class="spare"><b>${x.spare(fmtDur(sp,L))}</b> ${x.spareTip}</span>`:""})()}${r.over?`<span class="over" role="alert">${E.over(hmD(r.sim.end),hmD(r.allAboard))}</span>`:""}</div>
  <nav class="rtabs" id="rtabs" role="tablist" aria-label="${(TABT[L]||TABT.en).aria}">${TAB_KEYS.map(k=>`<button type="button" role="tab" id="tabbtn-${k}" data-tab="${k}" aria-controls="tab-${k}">${(TABT[L]||TABT.en)[k]}</button>`).join("")}</nav>
  <div class="rpanel" id="tab-map" role="tabpanel" aria-labelledby="tabbtn-map">
  ${state.picking?`<div class="pickbar" id="pickBar" role="status"><span><b>${esc(state.picking.name)}</b> · ${E.picking}</span><button type="button" class="adtoggle" id="pickCancel" style="color:var(--sea)">${E.cancel}</button></div>`:""}
  <section class="mapbox${state.picking?" picking":""}" aria-label="map">
    <div id="nmap"></div>
    <div id="smap">${sketchMap(r)}</div>
    ${myLocBtnHTML()}
    <div class="map-cap"><span id="mapCap">${MAPT[L].sketch}</span><span class="map-btns">${wcBtnHTML()}<button type="button" class="adtoggle" id="photoToggle" aria-pressed="${state.photosOn}" style="color:var(--sea)">${state.photosOn?MAPT[L].photoHide:MAPT[L].photoShow}</button><button type="button" class="adtoggle" id="adToggle" aria-pressed="${state.adsOn}"><svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true"><rect x="1" y="1" width="22" height="22" rx="5" fill="currentColor"/></svg>${ADT[L].toggle}</button></span></div>
  </section>
  <div id="wcPanel"></div>
  <div id="adPanel">${adPanelHTML(r)}</div>
  </div>
  <div class="rpanel" id="tab-tl" role="tabpanel" aria-labelledby="tabbtn-tl" hidden>
  <div class="edbar${state.editing?" on":""}">
    <button type="button" class="btn ${state.editing?"sea":"ghost"} edtoggle" id="edToggle" aria-pressed="${!!state.editing}">${state.editing?E.done:E.edit}</button>
    ${state.editing?`<p class="muted">${E.hint}</p>`:""}
    ${r.custom?`<button type="button" class="link" id="edReset">${E.reset}</button>`:""}
  </div>
  <ol class="timeline${state.editing?" editing":""}">${tl}</ol>
  <p class="muted" style="margin-top:-8px">${x.rtSrc} ${x.modeNote}</p>
  </div>
  <div class="rpanel" id="tab-food" role="tabpanel" aria-labelledby="tabbtn-food" hidden>
  <section class="card" id="foodSec">${foodHTML(r)}</section>
  </div>
  <p class="demo">${x.demo}</p>`;
  lastR=r;naverMap(r);wireAds(r);wireWc(r);wireMyLoc(r);wireFood(r);wireTabs();wireEdit(r,s,a);
  s.querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>openPrefModal(b.dataset.edit,s,a,b));
  a.innerHTML=`<button class="btn ghost" id="backBtn" type="button">${x.back}</button><button class="btn" id="againBtn" type="button">${x.again}</button>`;
  document.getElementById("backBtn").onclick=()=>{state.screen="q";state.q=QUESTIONS.length-1;render()};
  document.getElementById("againBtn").onclick=()=>{wcStop();myLocReset();if(wcPrevFull!==null){state.mapFull=wcPrevFull;wcPrevFull=null}state={...state,screen:"home",q:0,a:blankA(),ship:null,rating:0,aiText:"",aiNote:"",aiMsg:"",fbSent:false,route:null,dwell:{},picking:null,addAt:null,editing:false,photoBig:null};render()};
}
