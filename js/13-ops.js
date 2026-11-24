/* 운영자용 분석 화면 (한국어만)
   담당: ④ 데이터·운영 */

/* ---------- operator view (Korean only): stay time, reviews, spending patterns ---------- */
function renderOps(s,a){
  const nm=id=>PLACES.find(p=>p.id===id).name.ko.replace(/ \(.*\)/,"");
  const rows=PLACES.map(p=>({id:p.id,plan:p.dwell,act:DWELL[p.id],diff:DWELL[p.id]-p.dwell})).sort((x,y)=>y.diff-x.diff);
  const top=rows[0],low=rows[rows.length-1];
  const maxM=Math.max(...rows.map(r=>Math.max(r.plan,r.act)));
  const avgDiff=Math.round(rows.reduce((n,r)=>n+r.diff,0)/rows.length);
  const mine=loadReviews();
  const allRev=mine.concat(SAMPLE_REVIEWS);
  const avgStars=(allRev.reduce((n,r)=>n+r.stars,0)/allRev.length).toFixed(1);
  const peak=HOURS.reduce((p,h)=>h[1]>p[1]?h:p);
  const maxH=peak[1];
  const natName={ja:"일본",zh:"중국",us:"미국",kr:"한국",tw:"대만",other:"기타"};
  const col={food:"#0d4a5c",cafe:"#7fb3bf",shop:"#e5533b"};
  const topSpend=SPEND.reduce((p,c)=>c.avg>p.avg?c:p);
  s.innerHTML=`
  <div style="display:flex;flex-direction:column;gap:8px">
    <p class="muted">운영자용 · 체류·후기·소비 분석</p>
    <div class="find">${nm(top.id)}에서 계획보다 ${top.diff}분 더 머물러요</div>
    <p class="muted">추천 동선의 예상 시간과 실제 머문 시간을 비교하면, 사람들이 오래 머무는 곳에 상권을 키울 수 있어요.</p>
  </div>
  <div class="kpis">
    <div class="stat"><div class="n">${avgDiff>0?"+":""}${avgDiff}분</div><div class="l">평균 체류 차이</div></div>
    <div class="stat"><div class="n">${avgStars}</div><div class="l">평균 후기 별점</div></div>
    <div class="stat"><div class="n">${peak[0]}시</div><div class="l">방문 가장 많은 시간</div></div>
  </div>
  <section class="card">
    <h2 style="font-size:19px">장소별 체류시간: 계획 vs 실제</h2>
    <div class="legend"><span><i style="background:var(--buoy)"></i>계획보다 김</span><span><i style="background:var(--sea)"></i>계획보다 짧음</span><span><i style="border:2px solid var(--sea-deep);background:none"></i>계획 시간</span></div>
    <div class="rows">${rows.map(r=>`<div class="drow"><span class="nm">${esc(nm(r.id))}</span><span class="track"><span class="pl" style="width:${r.plan/maxM*100}%"></span><span class="ac ${r.diff>0?"up":""}" style="width:${r.act/maxM*100}%"></span></span><span class="v">${r.diff>0?"+":""}${r.diff}분</span></div>`).join("")}</div>
    <p class="muted">${nm(low.id)}은(는) 계획보다 ${-low.diff}분 짧아요. 볼거리 안내를 보강하거나 동선 시간을 줄여도 돼요.</p>
  </section>
  <section class="card">
    <h2 style="font-size:19px">국적별 1인 평균 지출과 쓰는 곳</h2>
    <div class="legend"><span><i style="background:${col.food}"></i>음식</span><span><i style="background:${col.cafe}"></i>카페</span><span><i style="background:${col.shop}"></i>쇼핑</span></div>
    <div class="rows">${SPEND.map(d=>`<div class="srow"><span>${natName[d.k]}</span><span class="stack" aria-label="음식 ${d.food}%, 카페 ${d.cafe}%, 쇼핑 ${d.shop}%"><span style="width:${d.food}%;background:${col.food}"></span><span style="width:${d.cafe}%;background:${col.cafe}"></span><span style="width:${d.shop}%;background:${col.shop}"></span></span><span class="v" style="text-align:right;font-weight:700;white-space:nowrap">${won(d.avg)}</span></div>`).join("")}</div>
    <p class="muted">${natName[topSpend.k]} 승객이 가장 많이 쓰고, 그중 쇼핑 비중이 ${topSpend.shop}%예요.</p>
  </section>
  <section class="card">
    <h2 style="font-size:19px">시간대별 영도 방문 인원</h2>
    <div class="hours">${HOURS.map(h=>`<div><b class="${h===peak?"pk":""}" style="height:${h[1]/maxH*85}%"></b>${h[0]}</div>`).join("")}</div>
    <p class="muted">${peak[0]}시 전후로 몰려요. 식당은 이 시간 전에 준비를 끝내면 좋아요.</p>
  </section>
  <section class="card">
    <h2 style="font-size:19px">최근 후기</h2>
    ${allRev.slice(0,6).map(r=>`<div class="rv"><div class="meta">${"★".repeat(r.stars)}${"☆".repeat(5-r.stars)} · ${esc(nm(r.place))} · ${natName[r.nat]||"기타"}${r.mine?" · 이 기기에서 작성":""}</div>${r.text?esc(r.text):'<span class="muted">별점만 남김</span>'}</div>`).join("")}
  </section>
  <section class="card">
    <h2 style="font-size:19px">그래서 이렇게 해볼 수 있어요</h2>
    <ul class="todo">
      <li>${nm(top.id)}처럼 오래 머무는 곳 주변 가게에 입항일 정보를 먼저 알려요.</li>
      <li>${peak[0]}시 점심 피크 전에 해산물 식당 대기 안내를 앱에 띄워요.</li>
      <li>${natName[topSpend.k]} 승객이 많은 날은 쇼핑 동선(다이소·올리브영·롯데백화점 광복점)을 더 앞에 둬요.</li>
    </ul>
  </section>
  <p class="demo">위 숫자와 예시 후기는 시연용 가상 데이터예요. 실제로는 QR 접속 기록, 후기·체류시간 입력, 카드 결제 통계로 채워요. 이 기기에서 남긴 후기는 맨 위에 함께 보여요.</p>`;
  a.innerHTML=`<button class="btn ghost" id="backBtn" type="button">이전</button><button class="btn" id="homeBtn" type="button">관광객 화면으로</button>`;
  document.getElementById("backBtn").onclick=()=>{state.screen="home";render()};
  document.getElementById("homeBtn").onclick=()=>{state.screen="home";render()};
}
