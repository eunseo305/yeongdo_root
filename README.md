# 영도 루트 (Yeongdo Route)

크루즈 관광객에게 남은 정박 시간에 맞춘 영도 동선을 추천하는 웹앱이에요.

## 폴더 구조와 담당

| 파일 | 하는 일 | 담당 |
|---|---|---|
| `index.html` | 뼈대. CSS와 JS 파일을 순서대로 불러옴 | ② 화면 |
| `css/style.css` | 기본 디자인 | ② 화면 |
| `css/skin-a.css` | 디자인 A "클린 블루" 덮어쓰기 | ② 화면 |
| `js/01-text.js` | 화면 문구 (한·영·일·중) | ① 기획·콘텐츠 |
| `js/02-places.js` | 영도 관광지 목록 | ① 기획·콘텐츠 |
| `js/03-cruises.js` | 크루즈 입출항 일정, `cruises.json` 불러오기 | ④ 데이터·운영 |
| `js/04-sample-data.js` | 장소 별점 시연 데이터 | ④ 데이터·운영 |
| `js/05-travel.js` | 장소 좌표, 이동시간 계산 | ③ AI·동선 |
| `js/06-app.js` | 공통 상태(state), 도구 함수, 화면 전환, 첫 화면 | ② 화면 |
| `js/07-ai.js` | "AI에게 말로 물어보기" | ③ AI·동선 |
| `js/08-questions.js` | 질문 화면 | ② 화면 |
| `js/09-engine.js` | 추천 엔진 (코스 고르기, 시간표) | ③ AI·동선 |
| `js/10-map.js` | 약도, 네이버 지도, 광고 식당 | ③ AI·동선 |
| `js/11-food.js` | 맛집 목록, `foods.json` 불러오기 | ④ 데이터·운영 |
| `js/12-result.js` | 결과 화면 | ② 화면 |
| `js/13d-stats.js` | 이용 기록(접속·코스·후기)을 Worker로 보내기 | ④ 데이터·운영 |
| `js/14-start.js` | 앱 시작 | ② 화면 |
| `admin/` | 관리자 페이지 (`/admin/`, 비밀번호 필요) | ④ 데이터·운영 |
| `worker/` | Cloudflare Worker: AI 중계 + 이용 기록 저장(D1) + 관리자 통계 | ③·④ |

## 함께 지킬 규칙

1. **JS 파일 순서를 바꾸지 마세요.** 뒤 파일이 앞 파일에서 만든 것을 씁니다. 새 파일은 `14-start.js` 바로 위에 넣어요.
2. **모든 파일이 이름을 함께 씁니다.** 다른 파일에 이미 있는 이름(`state`, `t`, `esc`, `PLACES` 등)으로 새 `const`/`let`/`function`을 만들면 앱이 멈춰요. 새 이름을 만들 땐 `Ctrl+Shift+F`로 먼저 검색하세요.
3. **공통 파일(`06-app.js`의 `state`, `01-text.js`의 문구 구조)을 바꿀 땐 팀에 먼저 알려주세요.** 여러 사람의 코드가 함께 쓰는 곳이에요.
4. 각자 **자기 브랜치**에서 작업하고, Pull Request로 `main`에 합쳐요. `main`에 올라가면 Netlify가 자동으로 사이트를 업데이트해요.
5. 확인은 VS Code **Live Server**(`http://127.0.0.1:5500`)로 해요. 파일을 더블클릭해서 열면 `cruises.json`, `foods.json`과 지도가 동작하지 않아요.

## 관리자 페이지 (`/admin/`) 처음 설정

관광객 화면에는 운영자 메뉴가 없어요. 관리자는 `https://yeongdoroot.vercel.app/admin/` 으로 들어가요.
기록은 `worker/`의 Cloudflare Worker가 D1 데이터베이스에 저장해요 (이름·연락처 같은 개인정보는 받지 않음).

`worker` 폴더에서 한 번만:

1. `npx wrangler d1 create yeongdo-stats` → 나온 `database_id`를 `wrangler.jsonc`에 붙여넣기
2. `npx wrangler secret put ADMIN_TOKEN` → 관리자 비밀번호 입력 (코드나 저장소에 쓰지 마세요)
3. `npx wrangler deploy`

표(visits·plans·reviews)는 Worker가 처음 요청 때 알아서 만들어요.
로컬(Live Server)에서 테스트한 기록은 통계에 섞이지 않게 보내지 않아요. 로컬에서도 보내려면 주소 끝에 `?stats=1`.
QR마다 주소 끝에 `?src=이름`(예: `?src=terminal-qr`)을 붙이면 어디서 들어왔는지도 쌓여요.
