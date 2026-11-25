/* 영도 관광지 목록 (이름, 설명, 머무는 시간, 관심사 태그, 계단·실내 여부)
   담당: ① 기획·콘텐츠 */

// zone: E = 동쪽 (크루즈터미널·태종대 쪽), W = 서쪽 (흰여울·봉래동 쪽), O = 영도 밖
// seq  = 같은 zone 안에서 지나가는 순서 (E는 터미널→태종대→서쪽, W는 남쪽 흰여울→북쪽 영도대교)
// open/close = 여는·닫는 시각(자정부터 분, 예: 10:00 = 600). close 전에 다 보고 나와야 동선에 넣어요
//   시간을 못 찾은 곳은 open/close를 비워 둠 (시간 제한 없이 계산). 찾으면 채워 주세요
// closed = 쉬는 요일 (0=일, 1=월 … 6=토). 고른 크루즈 날짜가 이 요일이면 빼요
//
// 영업시간 출처 (2026-11-25 인터넷 검색, 바뀔 수 있으니 가끔 다시 확인)
//   삼진어묵 본점   09:00~19:00 연중무휴        삼진어묵 공식몰·비짓부산
//   해녀촌          직판장 시간 못 찾음 (전시관은 09:00~18:00, 월 휴관)  영도해녀문화전시관 안내
//   남항시장        점포마다 다름               한국관광공사 정보
//   모모스커피      08:00~18:00 (라스트오더 17:30)  foods.json·여행 블로그 (09:00 개점이라는 글도 있음)
//   피아크          10:00~22:00 연중무휴        장소 안내 사이트
//   헤일르          10:00~19:00으로 잡음 (블로그마다 09:00~19:00, 10:00~19:30)  블로그 후기
//   국립해양박물관  09:00~18:00 (주말·공휴일 19:00), 월요일 휴관, 입장 마감 30분 전  박물관 공식·문체부
//   아르떼뮤지엄    10:00~20:00 (입장 마감 19:00) 연중무휴  아르떼뮤지엄 공식 FAQ
//   조내기 고구마   역사기념관 10:00~18:00, 월요일 휴관  영도구 안내
//   다이소 동삼점   지점 시간 못 찾음
//   올리브영 영도점 10:30~22:00                한국관광공사 정보 (2026-09 기준)
//   롯데 광복점     10:30~20:00 (식당가 21:00), 휴점일은 공식 사이트 확인  롯데백화점 공식
//   짚라인          2026-10-06 재개장 후 시간 못 찾음 (요금 2만 원)  부산일보 등
//   다누비열차      09:20~17:30, 월요일 휴무    부산시 보도자료(2017)·관광 안내
//   동삼어촌체험마을 시간·예약 방법 못 찾음
// alt:true = 예비 장소. 추천 목록(alt 없는 곳)만으로 코스를 못 짤 때만 써요
const PLACES=[
/* ---------- 음식 ---------- */
{id:"samjin",zone:"W",seq:4.5,dwell:30,tags:["food"],stairs:false,indoor:true,meal:false,open:540,close:1140,
 name:{ko:"삼진어묵 본점",en:"Samjin Eomuk (fish cake) flagship",ja:"サムジン練り物 本店",zh:"三进鱼糕 总店"},
 d:{ko:"부산 어묵의 원조, 갓 튀긴 어묵 간식 · 실내",en:"Busan's original fish cakes, fresh and hot · indoor",ja:"釜山練り物の元祖、揚げたてをおやつに・屋内",zh:"釜山鱼糕老字号，现炸小吃 · 室内"}},
{id:"haenyeo",zone:"E",seq:7,dwell:60,tags:["food","culture","view"],stairs:false,meal:true,
 name:{ko:"중리 해녀촌 (영도해녀문화전시관)",en:"Jungni Haenyeo Village (Haenyeo Culture Hall)",ja:"中里 海女村（影島海女文化展示館）",zh:"中里海女村（影岛海女文化展馆）"},
 d:{ko:"해녀가 잡은 해산물 · 전시관 1층 지붕 아래 자리",en:"Seafood caught by haenyeo divers · covered seats at the hall",ja:"海女が獲った海鮮・展示館1階の屋根の下",zh:"海女捕捞的海鲜 · 展馆一楼有遮蔽座位"}},
{id:"namhang",zone:"W",seq:3,dwell:40,tags:["food"],stairs:false,meal:true,
 name:{ko:"남항시장",en:"Namhang Market",ja:"南港市場",zh:"南港市场"},
 d:{ko:"영도 토박이 전통시장 먹거리 · 지붕 있는 시장",en:"Local market eats under a covered arcade",ja:"地元の伝統市場グルメ・アーケードあり",zh:"本地传统市场小吃 · 有顶棚"}},

/* ---------- 카페 ---------- */
{id:"momos",zone:"W",seq:5,dwell:45,tags:["cafe"],stairs:false,indoor:true,meal:false,open:480,close:1080,
 name:{ko:"모모스커피 영도 로스터리",en:"Momos Coffee Yeongdo Roastery",ja:"モモスコーヒー 影島ロースタリー",zh:"Momos咖啡 影岛烘焙店"},
 d:{ko:"부산 대표 로스터리, 옛 창고를 고친 매장 · 18:00까지",en:"Busan's star roastery in an old warehouse · until 18:00",ja:"釜山を代表するロースタリー、倉庫を改装・18:00まで",zh:"釜山代表性烘焙咖啡，旧仓库改造 · 营业至18:00"}},
{id:"peak",zone:"E",seq:3,dwell:50,tags:["cafe","view"],stairs:false,indoor:true,meal:false,open:600,close:1320,
 name:{ko:"피아크 카페",en:"P.ARK Café",ja:"ピアク カフェ",zh:"P.ARK 咖啡"},
 d:{ko:"부산항이 보이는 초대형 베이커리 카페 · 10:00 개점",en:"Huge bakery café with harbour views · opens 10:00",ja:"釜山港を望む大型ベーカリーカフェ・10:00開店",zh:"可看釜山港的超大烘焙咖啡馆 · 10:00开门"}},
{id:"heilleu",zone:"W",seq:1.6,dwell:45,tags:["cafe","view","photo"],stairs:true,indoor:true,meal:false,open:600,close:1140,
 name:{ko:"헤일르 (흰여울)",en:"Heilleu Café (Huinnyeoul)",ja:"ヘイルル（白瀬）",zh:"Heilleu咖啡（白滩）"},
 d:{ko:"흰여울 골목 안 바다 전망 카페 · 가는 길에 계단",en:"Sea-view café in the Huinnyeoul lanes · stairs on the way",ja:"白瀬の路地にある海の見えるカフェ・道中に階段",zh:"白滩小巷里的海景咖啡 · 途中有台阶"}},

/* ---------- 풍경·사진 ---------- */
{id:"huinnyeoul",zone:"W",seq:1.5,dwell:50,tags:["photo","view"],stairs:true,meal:false,
 name:{ko:"흰여울문화마을",en:"Huinnyeoul Culture Village",ja:"白瀬文化村",zh:"白滩文化村"},
 d:{ko:"절벽 위 골목과 바다 사진 명소 · 야외, 계단 많음",en:"Cliffside lanes, top photo spot · outdoor, many stairs",ja:"崖の上の路地、写真映え・屋外、階段多め",zh:"悬崖小巷，热门拍照点 · 户外，台阶多"}},
{id:"isongdo",zone:"W",seq:1,dwell:20,tags:["view","photo"],stairs:false,meal:false,
 name:{ko:"이송도 전망대",en:"Isongdo Observatory",ja:"二松島展望台",zh:"二松岛观景台"},
 d:{ko:"남항 앞바다와 묘박지 배들이 한눈에 · 야외",en:"Wide view over the anchored ships · outdoor",ja:"沖に停泊する船を一望・屋外",zh:"远眺锚地船只 · 户外"}},

/* ---------- 문화·예술 ---------- */
{id:"museum",zone:"E",seq:1,dwell:60,tags:["culture","view"],stairs:false,indoor:true,meal:false,open:540,close:1080,closed:[1],
 name:{ko:"국립해양박물관",en:"National Maritime Museum",ja:"国立海洋博物館",zh:"国立海洋博物馆"},
 d:{ko:"터미널 바로 옆, 실내·엘리베이터 · 무료 · 월요일 휴관",en:"Right by the terminal, indoor with lifts · free · closed Mondays",ja:"ターミナルのすぐ隣、屋内・EVあり・無料・月曜休館",zh:"紧邻码头，室内有电梯 · 免费 · 周一闭馆"}},
{id:"arte",zone:"E",seq:2,dwell:60,tags:["culture","photo"],stairs:false,indoor:true,meal:false,open:600,close:1200,
 name:{ko:"아르떼뮤지엄 부산",en:"ARTE MUSEUM Busan",ja:"アルテミュージアム 釜山",zh:"ARTE MUSEUM 釜山"},
 d:{ko:"빛과 소리의 몰입형 미디어아트 · 실내 · 10:00 개점",en:"Immersive light-and-sound media art · indoor · opens 10:00",ja:"光と音の没入型メディアアート・屋内・10:00開館",zh:"沉浸式光影媒体艺术 · 室内 · 10:00开门"}},
{id:"jonaegi",zone:"W",seq:0.5,dwell:30,tags:["culture"],stairs:true,meal:false,open:600,close:1080,closed:[1],
 name:{ko:"조내기 고구마 역사공원",en:"Jonaegi Sweet Potato History Park",ja:"チョネギ さつまいも歴史公園",zh:"Jonaegi红薯历史公园"},
 d:{ko:"조선에 고구마가 처음 온 곳 · 언덕 위 공원과 역사기념관 · 월요일 휴관",en:"Where sweet potatoes first reached Korea · hillside park and memorial hall · closed Mondays",ja:"朝鮮にさつまいもが初めて伝わった地・丘の上の公園と記念館・月曜休館",zh:"红薯最早传入朝鲜之地 · 山坡公园和纪念馆 · 周一闭馆"}},

/* ---------- 쇼핑·뷰티 ---------- */
{id:"daiso",zone:"E",seq:8,dwell:30,tags:["beauty"],stairs:false,indoor:true,meal:false,shop:true,
 name:{ko:"다이소 (영도 동삼)",en:"Daiso (Yeongdo Dongsam)",ja:"ダイソー（影島・東三）",zh:"大创（影岛东三）"},
 d:{ko:"저렴한 K-뷰티 화장품, 간식, 기념품",en:"Budget K-beauty, snacks and souvenirs",ja:"プチプラK-ビューティー・お菓子・お土産",zh:"平价韩妆、零食和纪念品"}},
{id:"oliveyoung",zone:"W",seq:6,dwell:30,tags:["beauty"],stairs:false,indoor:true,meal:false,shop:true,open:630,close:1320,
 name:{ko:"올리브영 부산영도점",en:"Olive Young Busan Yeongdo",ja:"オリーブヤング 釜山影島店",zh:"Olive Young 釜山影岛店"},
 d:{ko:"K-뷰티 화장품, 영도대교 바로 앞 · 10:30 개점",en:"K-beauty by Yeongdo Bridge · opens 10:30",ja:"K-ビューティー、影島大橋のすぐ前・10:30開店",zh:"韩国美妆，影岛大桥旁 · 10:30开门"}},
{id:"lotte",zone:"O",seq:1,dwell:80,tags:["beauty"],stairs:false,indoor:true,meal:false,out:true,shop:true,open:630,close:1200,
 name:{ko:"롯데백화점 광복점",en:"Lotte Department Store Gwangbok",ja:"ロッテ百貨店 光復店",zh:"乐天百货 光复店"},
 d:{ko:"영도대교 건너 바로 · 명품·K-뷰티·식당가 · 10:30 개점",en:"Just across Yeongdo Bridge · luxury, K-beauty, food hall · opens 10:30",ja:"影島大橋を渡ってすぐ・ブランド・K-ビューティー・レストラン街・10:30開店",zh:"过影岛大桥即到 · 名品·韩妆·美食街 · 10:30开门"}},

/* ---------- 액티비티 ---------- */
{id:"zipline",zone:"E",seq:5,dwell:40,tags:["activity","view"],stairs:false,meal:false,
 name:{ko:"태종대 오션 플라잉 (짚라인)",en:"Taejongdae Ocean Flying (zipline)",ja:"太宗台オーシャンフライング（ジップライン）",zh:"太宗台海洋飞翔（滑索）"},
 d:{ko:"바다 위를 나는 짚라인 · 야외, 비·강풍엔 운영 중단 · 운영시간은 현장 확인",en:"Zipline over the sea · outdoor, closed in rain or strong wind · check hours on site",ja:"海の上を飛ぶジップライン・屋外、雨・強風時は休止・営業時間は現地で確認",zh:"海上滑索 · 户外，雨天大风停运 · 营业时间请现场确认"}},
{id:"taejongdae",zone:"E",seq:6,dwell:90,tags:["view","photo","activity"],stairs:false,meal:false,open:560,close:1050,closed:[1],
 name:{ko:"태종대 다누비열차 (영도등대)",en:"Taejongdae Danubi train (lighthouse)",ja:"太宗台 ダヌビ列車（影島灯台）",zh:"太宗台 Danubi小火车（影岛灯塔）"},
 d:{ko:"열차로 절벽 해안과 전망대를 편하게 · 내리면 야외 · 월요일 운휴",en:"Ride the train past sea cliffs to the lookout · outdoor stops · no trains Mondays",ja:"列車で断崖と展望台へ・降りると屋外・月曜運休",zh:"乘小火车游览海崖和观景台 · 下车后为户外 · 周一停运"}},
{id:"dongsam",zone:"E",seq:4,dwell:90,tags:["activity","food"],stairs:false,meal:false,
 name:{ko:"동삼어촌체험마을",en:"Dongsam Fishing Village Experience",ja:"東三漁村体験村",zh:"东三渔村体验村"},
 d:{ko:"낚시·해산물 체험 · 야외 · 사전 예약 필요",en:"Fishing and seafood activities · outdoor · booking required",ja:"釣り・海産物体験・屋外・要予約",zh:"钓鱼·海鲜体验 · 户外 · 需预约"}},

/* ---------- 예비 장소 (위 목록만으로 코스가 안 나올 때만) ---------- */
{id:"gamji",zone:"E",seq:6.5,dwell:60,tags:["food","view"],stairs:false,meal:true,alt:true,
 name:{ko:"감지해변 조개구이촌",en:"Gamji Beach clam grill",ja:"甘池海辺の貝焼き村",zh:"甘池海边烤贝村"},
 d:{ko:"바다를 보며 조개구이 · 천막 아래 자리",en:"Grilled shellfish by the water · tented seats",ja:"海を眺めて貝焼き・テント席",zh:"看海吃烤贝 · 帐篷座位"}},
{id:"bongnae",zone:"W",seq:4,dwell:40,tags:["food","beauty"],stairs:false,indoor:true,meal:true,alt:true,
 name:{ko:"봉래시장",en:"Bongnae Market",ja:"蓬莱市場",zh:"蓬莱市场"},
 d:{ko:"영도 토박이 전통시장 먹거리",en:"Local market eats",ja:"地元の市場グルメ",zh:"本地传统市场小吃"}},
{id:"kkangkkangi",zone:"W",seq:5.5,dwell:40,tags:["culture","photo"],stairs:false,meal:false,alt:true,
 name:{ko:"깡깡이예술마을",en:"Kkangkkangi Art Village",ja:"カンカンイ芸術村",zh:"Kkangkkangi艺术村"},
 d:{ko:"선박 수리 골목의 벽화와 작품",en:"Murals in the old shipyard lanes",ja:"造船所路地の壁画",zh:"修船巷里的壁画"}},
{id:"trail",zone:"W",seq:2,dwell:40,tags:["view","photo"],stairs:true,meal:false,alt:true,
 name:{ko:"절영해안산책로",en:"Jeoryeong Coastal Trail",ja:"絶影海岸散策路",zh:"绝影海岸步道"},
 d:{ko:"파도 소리 들으며 해안 걷기",en:"Seaside walk below the village",ja:"波音を聞きながら散歩",zh:"听着海浪散步"}},
{id:"bridge",zone:"W",seq:6.5,dwell:30,tags:["view","photo"],stairs:false,meal:false,alt:true,
 name:{ko:"영도대교",en:"Yeongdo Bridge",ja:"影島大橋",zh:"影岛大桥"},
 d:{ko:"도개 시간이 맞으면 관람 (운영일 확인)",en:"Catch the bridge lift if it runs today",ja:"跳開時間が合えば見学",zh:"若时间合适可看开桥"}}
];
