/* "AI에게 말로 물어보기": 자유 입력을 질문 답으로 바꾸기
   담당: ③ AI·동선 */

/* ---------- AI: read free text into the same answers the questions collect ---------- */
const KW={
 interests:{food:["해산물","음식","맛집","시장","먹","seafood","food","eat","market","海鮮","グルメ","食","海鲜","美食","吃"],
  cafe:["카페","커피","cafe","café","coffee","カフェ","咖啡"],
  photo:["사진","인스타","photo","picture","instagram","写真","映え","拍照","打卡"],
  view:["바다","풍경","경치","등대","sea","ocean","view","coast","海","景色","绝景","海景"],
  culture:["박물관","예술","문화","벽화","museum","art","culture","博物館","アート","文化","艺术","博物馆"],
  activity:["액티비티","체험","짚라인","다누비","열차","낚시","어촌","activity","activities","zipline","zip line","train","fishing","アクティビティ","体験","ジップライン","釣り","活动","体验","滑索","钓鱼"],
  beauty:["쇼핑","화장품","뷰티","다이소","올리브영","올영","백화점","롯데","lotte","department store","百貨店","百货","daiso","olive young","shopping","cosmetic","beauty","ショッピング","コスメ","買い物","购物","美妆","化妆品"]},
 comp:{care:["노약자","부모님","어르신","할머니","할아버지","노인","못 걸","무릎","휠체어","거동","장애","parents","elderly","senior","grandparent","can't walk","wheelchair","mobility","disab","両親","高齢","歩けな","車椅子","障害","父母","老人","长辈","走不","轮椅","残疾","行动不便"],
  family:["아이","애기","아들","딸","kid","child","son","daughter","子ども","子供","孩子","小孩"],
  couple:["남편","아내","와이프","여자친구","남자친구","부부","커플","husband","wife","partner","couple","夫","妻","彼氏","彼女","夫妻","老公","老婆","情侣"],
  friends:["친구","friend","友","朋友"],solo:["혼자","alone","solo","myself","ひとり","一人","独自","自己"]},
 weather:{rain:["비","rain","雨"],hot:["덥","더워","hot","暑","热"],cold:["춥","추워","바람","cold","wind","寒","风","冷"]},
 nat:{ja:["일본","japan","日本"],zh:["중국","china","中国"],tw:["대만","taiwan","台湾"],us:["미국","america","usa"],kr:["한국","korea","韓国","韩国"]}
};
function has(txt,arr){return arr.some(w=>txt.includes(w.toLowerCase()))}
function parseLocal(raw){
  let txt=raw.toLowerCase();const out=blankA();
  const ship=CRUISES.find(c=>txt.includes(c.name.toLowerCase())||txt.includes((c.name.split(" ")[1]||c.name).toLowerCase()));
  CRUISES.forEach(c=>{txt=txt.split(c.name.toLowerCase()).join(" ")});
  for(const [k,arr] of Object.entries(KW.interests))if(has(txt,arr))out.interests.push(k);
  for(const [k,arr] of Object.entries(KW.comp))if(!out.comp&&has(txt,arr))out.comp=k;
  for(const [k,arr] of Object.entries(KW.weather))if(!out.weather&&has(txt,arr))out.weather=k;
  for(const [k,arr] of Object.entries(KW.nat))if(!out.nat&&has(txt,arr))out.nat=k;
  return {a:out,ship:ship?ship.id:null,note:""};
}
function fillDefaults(a){
  const byLang={ko:"kr",ja:"ja",zh:"zh",en:"us"};
  return {nat:a.nat||byLang[state.lang],comp:a.comp||"couple",interests:a.interests&&a.interests.length?a.interests:["view","food"],weather:a.weather||"sun"};
}
async function askAI(){
  const raw=(state.aiText||"").trim();
  if(!raw||state.aiBusy)return;
  state.aiBusy=true;state.aiMsg="";render();
  let res=null;
  if(sampleFn){
    const langName={ko:"Korean",en:"English",ja:"Japanese",zh:"Simplified Chinese"}[state.lang];
    const prompt=`A cruise passenger who just got off the ship at Busan's Yeongdo cruise terminal wrote this about their day:
"""${raw}"""
Read it and return ONLY a JSON object with these keys:
- nat: one of ja, zh, tw, us, kr, other, or null if not said
- comp: one of solo, couple, friends, family, care, or null (family = travelling with children; care = travelling with older adults or someone with limited mobility, e.g. elderly parents, wheelchair, trouble walking; prefer care if both apply)
- interests: array from food, cafe, photo, view, culture, beauty, activity (beauty = shopping, cosmetics, Daiso, Olive Young, department store; activity = zipline, Danubi train, fishing village experience)
- weather: one of sun, rain, hot, cold, or null
- ship: one of ${CRUISES.map(c=>`${c.id} (${c.name})`).join(", ")}, or null if not named
- note: one warm sentence in ${langName}, under 30 words, saying what you understood they want for today. No place names.`;
    try{
      const j=await sampleFn.json(prompt,{modelTier:"quick"});
      if(j&&typeof j==="object"){
        const ok=(v,list)=>list.includes(v)?v:null;
        res={a:{nat:ok(j.nat,["ja","zh","tw","us","kr","other"]),comp:ok(j.comp,["solo","couple","friends","family","care"]),
          interests:Array.isArray(j.interests)?j.interests.filter(v=>["food","cafe","photo","view","culture","beauty","activity"].includes(v)):[],weather:ok(j.weather,["sun","rain","hot","cold"])},
          ship:ok(j.ship,CRUISES.map(c=>c.id)),note:typeof j.note==="string"?j.note.slice(0,200):""};
      }
    }catch(e){res=null}
  }
  if(!res){res=parseLocal(raw);state.aiMsg=t().ai_fail}
  state.a=fillDefaults(res.a);
  state.ship=res.ship;
  state.aiNote=res.note||"";
  state.aiBusy=false;state.rating=0;state.fbSent=false;state.resTab="map";
  if(state.ship){state.screen="result"}else{state.screen="q";state.q=QUESTIONS.indexOf("ship")}
  render();
}
