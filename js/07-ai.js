/* "AI에게 말로 물어보기": 자유 입력을 질문 답으로 바꾸기
   담당: ③ AI·동선 */

/* ---------- AI: read free text into the same answers the questions collect ---------- */
const KW={
 interests:{food:["해산물","음식","맛집","시장","먹","seafood","food","eat","market","海鮮","グルメ","食","海鲜","美食","吃"],
  cafe:["카페","커피","cafe","café","coffee","カフェ","咖啡"],
  photo:["사진","인스타","photo","picture","instagram","写真","映え","拍照","打卡"],
  view:["바다","풍경","경치","등대","sea","ocean","view","coast","海","景色","绝景","海景"],
  culture:["박물관","예술","문화","벽화","museum","art","culture","博物館","アート","文化","艺术","博物馆"],
  beauty:["쇼핑","화장품","뷰티","다이소","올리브영","올영","백화점","롯데","lotte","department store","百貨店","百货","daiso","olive young","shopping","cosmetic","beauty","ショッピング","コスメ","買い物","购物","美妆","化妆品"]},
 comp:{family:["아이","애기","아들","딸","kid","child","son","daughter","子ども","子供","孩子","小孩"],
  couple:["남편","아내","와이프","여자친구","남자친구","부부","커플","husband","wife","partner","couple","夫","妻","彼氏","彼女","夫妻","老公","老婆","情侣"],
  friends:["친구","friend","友","朋友"],group:["단체","group","団体","旅行团"],solo:["혼자","alone","solo","myself","ひとり","一人","独自","自己"]},
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
  if(has(txt,["부모님","어르신","할머니","할아버지","못 걸","무릎","parents","elderly","can't walk","両親","歩けな","父母","老人","走不"]))out.age="a70";
  else if(/[56]0\s*(대|代|s|多)/.test(txt))out.age="a50";
  else if(/[34]0\s*(대|代|s|多)/.test(txt))out.age="a30";
  else if(/20\s*(대|代|s|多)/.test(txt))out.age="a20";
  if(!out.comp&&has(txt,["부모님","parents","両親","父母"]))out.comp="family";
  return {a:out,ship:ship?ship.id:null,note:""};
}
function fillDefaults(a){
  const byLang={ko:"kr",ja:"ja",zh:"zh",en:"us"};
  return {nat:a.nat||byLang[state.lang],age:a.age||"a30",comp:a.comp||"couple",interests:a.interests&&a.interests.length?a.interests:["view","food"],weather:a.weather||"sun"};
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
- age: one of a20, a30, a50, a70, or null (use a70 if they mention elderly parents or trouble walking)
- comp: one of solo, couple, friends, family, group, or null (family = travelling with kids or parents)
- interests: array from food, cafe, photo, view, culture, beauty (beauty = shopping, cosmetics, Daiso, Olive Young, department store)
- weather: one of sun, rain, hot, cold, or null
- ship: one of ${CRUISES.map(c=>`${c.id} (${c.name})`).join(", ")}, or null if not named
- note: one warm sentence in ${langName}, under 30 words, saying what you understood they want for today. No place names.`;
    try{
      const j=await sampleFn.json(prompt,{modelTier:"quick"});
      if(j&&typeof j==="object"){
        const ok=(v,list)=>list.includes(v)?v:null;
        res={a:{nat:ok(j.nat,["ja","zh","tw","us","kr","other"]),age:ok(j.age,["a20","a30","a50","a70"]),comp:ok(j.comp,["solo","couple","friends","family","group"]),
          interests:Array.isArray(j.interests)?j.interests.filter(v=>["food","cafe","photo","view","culture","beauty"].includes(v)):[],weather:ok(j.weather,["sun","rain","hot","cold"])},
          ship:ok(j.ship,CRUISES.map(c=>c.id)),note:typeof j.note==="string"?j.note.slice(0,200):""};
      }
    }catch(e){res=null}
  }
  if(!res){res=parseLocal(raw);state.aiMsg=t().ai_fail}
  state.a=fillDefaults(res.a);
  state.ship=res.ship;
  state.aiNote=res.note||"";
  state.aiBusy=false;state.rating=0;state.fbSent=false;
  if(state.ship){state.screen="result"}else{state.screen="q";state.q=QUESTIONS.indexOf("ship")}
  render();
}
