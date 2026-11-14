const survivalChecklist = {
  "meta": {
    "title": "생존밥 GitHub·1차 QA 대조 체크리스트",
    "date": "2026-11-15",
    "repository": "LumiA-SH/sangjonbap",
    "branch": "master",
    "commit": "9a0a82591bcee03d45423c28c00df11d32b75635",
    "commit_message": "26.11.15. 마물 수정 반영",
    "qa_file": "생존밥 1차 QA 결과 및 요청사항.txt",
    "scope": "사용자가 제공한 9개 작업 묶음 + 첨부 1차 QA 전체 + 고정 커밋 코드 + Supabase 읽기 조회",
    "limitations": "코드 정적 검토와 DB 읽기 조회 기준. 실제 플레이, 빌드·자동화 테스트, 브라우저 QA 및 배포된 API/워커의 최신 커밋 일치는 확인하지 않음. GitHub·DB 수정·마이그레이션·외부 게시 실행 없음."
  },
  "groups": [
    {
      "number": 1,
      "title": "혈액팩·음식 성장 연결 마무리",
      "specs": "12-4 · 3-4 · 10-6",
      "qa": "1.1 · 2.1",
      "sources": [
        "server/src/modules/shop/repository.js",
        "server/src/modules/cooking/repository.js",
        "frontend/src/admin/AdminPanel.js",
        "frontend/src/admin/MasterPanel.js",
        "frontend/src/admin/ItemPicker.js",
        "frontend/src/dev/TrainingBloodPanel.js"
      ],
      "items": [
        {
          "id": "1-01",
          "kind": "done",
          "title": "무료 혈액팩을 캐릭터별 KST 하루 수량 1개로 제한",
          "detail": "구매 수량이 정확히 1이어야 하고 날짜별 구매 기록으로 재구매를 차단한다. 요청 횟수만 제한하는 방식이 아니다.",
          "checked": true
        },
        {
          "id": "1-02",
          "kind": "done",
          "title": "무료·일반 혈액팩의 한도와 상품 설정 분리",
          "detail": "DB 확인: 무료 혈액팩 0코인·혈량 +10·일일 1개, 일반 혈액팩 2코인·혈량 +30·일일 한도 없음. 무료 구매 기록을 일반팩에 적용하지 않는다.",
          "checked": true
        },
        {
          "id": "1-03",
          "kind": "done",
          "title": "혈액팩 관리자 설정과 사용 경로 연결",
          "detail": "아이템 효과·팩 종류·상점 설정 및 혈액팩 사용 화면/API 연결이 있다. 인벤토리의 직접 사용 버튼은 7번에서 별도로 처리한다.",
          "checked": true
        },
        {
          "id": "1-04",
          "kind": "done",
          "title": "음식 등급별 성장 확률·지정 능력치·상한·혈량 회복 연결",
          "detail": "DB 등급 설정은 성장 확률 15/20/25%, 혈량 +10/+20/+30. 일반 음식은 지정 ATK/DEF/AGI +1, 상한 min(40, 설정값)을 적용한다. 실패요리는 수치 성장·혈량 회복에서 제외한다.",
          "checked": true
        },
        {
          "id": "1-05",
          "kind": "done",
          "title": "아이템 생성·수정과 이미지 업로드 및 기존 ID 유지 경로",
          "detail": "기존 항목은 ID 기반 PATCH로 수정하며 아이템 이미지 업로드 컴포넌트가 연결되어 있다. 실제 참조 유지·이미지 저장 성공 여부는 아래 재검증 대상이다.",
          "checked": true
        },
        {
          "id": "1-06",
          "kind": "done",
          "title": "기존 아이템에 음식 효과와 실패요리 RP 문구 연결",
          "detail": "음식 이름·이미지는 연결 아이템에서 관리하고 음식 설정에서 등급·성장·RP를 연결하는 2단계 구조다. 음식 설정 화면에서 이름·이미지를 독립 생성하는 구조는 아니다.",
          "checked": true
        },
        {
          "id": "1-07",
          "kind": "fix",
          "title": "음식 목록과 섭취 API에 실제 음식 판별 보강",
          "detail": "현재 food_config 연결 여부와 활성 여부 중심이다. MATERIAL 통조림처럼 잘못 연결된 항목이 다시 활성화되어도 음식 목록·섭취 경로에 들어오지 않도록 판별 기준을 일치시킨다.",
          "checked": false
        },
        {
          "id": "1-08",
          "kind": "setup",
          "title": "정상 음식·실패요리·재료·레시피 QA 데이터 준비",
          "detail": "조회 시 food_config는 비활성 MATERIAL 「개발용 통조림」 1건뿐이다. 활성 정상 음식과 실패요리가 없으므로 생성→요리→지급→섭취를 검증할 데이터가 필요하다. 기존 데이터를 임의 삭제하지 않는다.",
          "checked": false
        },
        {
          "id": "1-09",
          "kind": "test",
          "title": "아이템→음식 설정→레시피→인벤토리→섭취 전체 흐름 검수",
          "detail": "정상 음식과 실패요리를 각각 등록하고 이미지·이름·참조 유지, 필요 재료 수량, 완성 수량, 음식 지급·회수·섭취를 확인한다. 수정 시 기존 ID와 연결 관계가 유지되어야 한다.",
          "checked": false
        },
        {
          "id": "1-10",
          "kind": "test",
          "title": "혈액팩·음식 경계값과 중복 요청 재검증",
          "detail": "무료팩 2개 요청/같은 날 재구매/유료팩 구매 병행, 일자 전환, 능력치 상한, 혈량 상한, 식사 한도, 실패요리 RP를 확인한다. 코드 존재만으로 실행 통과 처리하지 않는다.",
          "checked": false
        }
      ]
    },
    {
      "number": 2,
      "title": "자정 활동 종료와 수동 테스트",
      "specs": "4-3 · 7-3~7-6",
      "qa": "8.2",
      "sources": [
        "server/src/modules/daily/recovery.js",
        "server/src/modules/battle/repository.js",
        "frontend/src/dev/BattlePanel.js",
        "server/src/modules/dev/routes.js",
        "server/src/modules/admin/extended-routes.js"
      ],
      "items": [
        {
          "id": "2-01",
          "kind": "done",
          "title": "기존 일일 초기화와 중복 방지 기반 확보",
          "detail": "AP를 최대치로 복구하고 식사 횟수·훈련 여부를 초기화하며 혈량 감소를 처리하는 함수가 있다. 일일 상태 잠금과 실행 기록으로 중복 처리를 방지하는 기반도 있다. 최종 자정 전투 정책은 아직 다르다.",
          "checked": true
        },
        {
          "id": "2-02",
          "kind": "fix",
          "title": "24시간 방치 자동 패배 제거",
          "detail": "battle/repository.js의 expire()가 24시간 미행동 시 DEFEAT/TIMEOUT으로 종료한다. 호출 경로·관련 테스트와 화면의 24시간 패배 안내를 함께 정리한다.",
          "checked": false
        },
        {
          "id": "2-03",
          "kind": "fix",
          "title": "00시 일반 PVE 전체를 패배가 아닌 중단으로 종료",
          "detail": "현재 자정에 빈사가 된 캐릭터의 전투만 DEFEAT/MIDNIGHT_NEAR_DEATH로 끝낸다. 요청한 일반 PVE 전체 중단에 맞춰 저장 상태·종료 사유·처리 대상을 수정한다.",
          "checked": false
        },
        {
          "id": "2-04",
          "kind": "fix",
          "title": "확정 턴·조사 보상·자원 변동을 유지하는 중단 처리",
          "detail": "이미 확정된 HP·AP·아이템·보상은 되돌리지 않고 미확정 턴을 추가 실행하지 않는다. 패배 보정이나 승리 보상을 새로 발생시키지 않는 중단 경로로 연결한다.",
          "checked": false
        },
        {
          "id": "2-05",
          "kind": "fix",
          "title": "자정 안내·종료 사유·재접속 화면 연결",
          "detail": "전투 결과의 중단 표시, 자정 안내, 접속 복귀 시 종료 상태 동기화를 처리한다. 최신 전투 재조회는 있으나 현재 UI의 결과 구분은 승리·패배·도주 중심이다.",
          "checked": false
        },
        {
          "id": "2-06",
          "kind": "setup",
          "title": "일일 처리 시작 설정의 HOLD 해소",
          "detail": "DB의 daily_reset_state.start_date와 last_completed_date가 모두 NULL이다. 현재 함수는 시작일 미설정 시 DAILY_RESET_START_HOLD를 반환한다. 운영 시작·소급 정책에 맞는 설정과 실행 상태 확인이 필요하며 이번 검토에서는 변경하지 않았다.",
          "checked": false
        },
        {
          "id": "2-07",
          "kind": "fix",
          "title": "테스트 환경용 자정 수동 실행 버튼·제한된 API 추가",
          "detail": "검토한 관리자·개발 라우트에는 요청된 수동 실행 경로가 없다. 운영 시간을 바꾸지 않고 기존 처리 함수를 재사용하며 테스트 환경·관리자 권한·중복 실행을 통제한다.",
          "checked": false
        },
        {
          "id": "2-08",
          "kind": "test",
          "title": "수동 자정 실행의 6개 효과 검증",
          "detail": "AP 최대치, 훈련, 식사 횟수, 생존 캐릭터 혈량, 무료팩 일일 구매 가능 상태, 진행 중 전투 중단을 함께 확인한다. 무료팩은 날짜별 기록 구조이므로 과거 구매 이력을 지우는 방식으로 구현하지 않는다.",
          "checked": false
        },
        {
          "id": "2-09",
          "kind": "test",
          "title": "자정 직전·직후 동시 요청과 반복 실행 검증",
          "detail": "전투 명령·조사·구매와 자정 처리가 겹쳐도 확정 결과가 유실되거나 이중 지급되지 않는지, 새로고침·재접속·수동 재실행 결과가 일관적인지 확인한다.",
          "checked": false
        }
      ]
    },
    {
      "number": 3,
      "title": "조사·구역·레시피의 남은 변경",
      "specs": "5-1 · 5-2 · 8-5 · 15-5 · 15-8",
      "qa": "1.1 레시피 · 5.1~5.5",
      "sources": [
        "server/src/modules/investigation/repository.js",
        "server/src/shared/recipes.js",
        "server/src/modules/gacha/repository.js",
        "frontend/src/admin/InvestigationAdminPanel.js",
        "frontend/src/admin/MasterPanel.js",
        "frontend/src/admin/BattleAdminPanel.js",
        "frontend/src/admin/navigation.js"
      ],
      "items": [
        {
          "id": "3-01",
          "kind": "done",
          "title": "조사 성공·대성공 구분 제거",
          "detail": "현재 조사 결과는 등급 분기 없이 활성 결과의 가중치로 선택한다. 관리자 저장은 NORMAL로 정규화하며 DB의 기존 조사 결과 4건도 NORMAL이다.",
          "checked": true
        },
        {
          "id": "3-02",
          "kind": "done",
          "title": "구역별·전체 조사율 계산 연결",
          "detail": "고유 조사 결과·마물·레시피 발견 기록을 기준으로 계산한다. 전체 조사율은 같은 마물·레시피를 ID 기준으로 중복 계산하지 않도록 구성되어 있다.",
          "checked": true
        },
        {
          "id": "3-03",
          "kind": "done",
          "title": "조사 결과·보상·단서 관리자 연결",
          "detail": "결과 텍스트, 선택 가중치, 고유 여부, 보상 아이템·수량·확률, 단서 선택이 있다. 단서 없음/ID 선택으로 연결 유무를 표현한다.",
          "checked": true
        },
        {
          "id": "3-04",
          "kind": "done",
          "title": "구역 공통 레시피 후보와 최초 발견·무료 습득·상점 등록 연결",
          "detail": "구역별 후보·가중치·발견 확률을 관리하고 조사/전투에서 재사용한다. DB의 레시피 1건은 구역 연결·최초 발견·상점 등록이 모두 존재하며 발견 후 상점 누락은 0건이다.",
          "checked": true
        },
        {
          "id": "3-05",
          "kind": "done",
          "title": "가챠 레시피 지급 제외",
          "detail": "현재 가챠 지급 경로는 RP 아이템 중심이며 레시피 습득을 수행하지 않는다. 음식 효과 연결 아이템도 가챠 RP 보상에서 거부한다.",
          "checked": true
        },
        {
          "id": "3-06",
          "kind": "done",
          "title": "마물 한 구역 배치와 구역별 등장 가중치",
          "detail": "관리자 화면에서 구역을 1개까지만 지정하며 area_monster.weight로 조우 추첨을 한다. 중복 배치 방지 마이그레이션이 적용되어 있고 DB 중복 배치는 0건이다.",
          "checked": true
        },
        {
          "id": "3-07",
          "kind": "done",
          "title": "레시피의 기존 재료·완성 음식 선택과 수량 설정",
          "detail": "식재료는 기존 아이템, 완성 음식/실패요리는 음식 유형별 검색으로 선택한다. 필요 수량과 완성 음식 수량을 저장하는 입력 경로가 있다.",
          "checked": true
        },
        {
          "id": "3-08",
          "kind": "fix",
          "title": "구역 상세에서 조사 결과·마물·레시피를 통합 관리",
          "detail": "현재 조사 결과+레시피 후보 화면은 있으나 마물 편집은 별도 메뉴다. 구역 관리의 하위 메뉴에서 같은 구역의 세 목록과 가중치·추가·제거를 관리하도록 연결한다.",
          "checked": false
        },
        {
          "id": "3-09",
          "kind": "fix",
          "title": "구역 공개 예정 시각을 날짜·시간 선택 UI로 변경",
          "detail": "MasterPanel의 unlock_at은 ISO 문자열 직접 입력 방식이다. KST 기준 날짜·시간 입력과 저장값 변환을 연결한다.",
          "checked": false
        },
        {
          "id": "3-10",
          "kind": "test",
          "title": "공개 예정 시각에 접근 가능해지는지 재검증하고 실패 원인 수정",
          "detail": "현재 접근 조건은 is_open=true와 unlock_at 도달을 모두 요구한다. 예정 시각만 설정하고 is_open=false면 열리지 않는다. QA에서 실패한 설정을 재현하여 공개 허용/예약 공개 의미와 저장·표시·갱신 흐름을 맞춘다.",
          "checked": false
        },
        {
          "id": "3-11",
          "kind": "fix",
          "title": "레시피 이미지 등록·업로드·조회 연결",
          "detail": "현재 recipe 테이블과 관리자 레시피 기본 입력에 이미지 필드가 없다. 음식의 아이템 이미지와 레시피 자체 이미지를 혼동하지 않고 QA의 레시피 이미지 요구를 연결한다.",
          "checked": false
        },
        {
          "id": "3-12",
          "kind": "test",
          "title": "조사율·발견 중복·마물 구역 이동·레시피 구매 회귀 검증",
          "detail": "최초/재발견, 같은 레시피의 여러 구역 후보, 비활성 전환, 마물 구역 이동, 레시피 상점 구매·이미 학습한 레시피 재구매 차단을 확인한다.",
          "checked": false
        }
      ]
    },
    {
      "number": 4,
      "title": "마물 행동과 관리자 보상 설정",
      "specs": "6-2 · 15-3 · 15-4",
      "qa": "6.1 · 6.2",
      "sources": [
        "frontend/src/admin/BattleAdminPanel.js",
        "server/src/modules/battle/rewards.js",
        "server/src/modules/battle/repository.js"
      ],
      "items": [
        {
          "id": "4-01",
          "kind": "done",
          "title": "행동명·종류·복수 특수공격·공격 배율 입력",
          "detail": "여러 행동 행과 SPECIAL_ATTACK 유형, 공격 배율을 설정할 수 있다. 현재 선택 비중은 활성 행동 확률의 합계를 100%로 맞추는 방식이다.",
          "checked": true
        },
        {
          "id": "4-02",
          "kind": "done",
          "title": "기본 식재료·추가 식재료·일반 아이템 보상 구분",
          "detail": "관리자에서 BASE/BONUS/일반을 분리한다. 기본 식재료는 100%·1개, 추가 식재료는 꽝 가능·최대 1개, 일반 아이템은 별도 확률·수량 설정을 사용한다.",
          "checked": true
        },
        {
          "id": "4-03",
          "kind": "done",
          "title": "식재료 실제 추첨 로직에서 1개 제한",
          "detail": "rewards.js는 기본 식재료 1종을 보장하고 추가 후보의 확률 합계가 100% 이하인지 검증한다. 추가 추첨은 당첨 1개 또는 없음만 반환한다.",
          "checked": true
        },
        {
          "id": "4-04",
          "kind": "fix",
          "title": "마물 행동별 설명 필드 추가와 저장·조회 연결",
          "detail": "monster_action에는 설명 컬럼이 없고 관리자 행동 입력·정리 payload에도 설명이 없다. 마물 전체 설명과 별도로 행동 설명을 등록하도록 연결한다.",
          "checked": false
        },
        {
          "id": "4-05",
          "kind": "test",
          "title": "기본 식재료 없는 마물의 저장 차단 범위 대조",
          "detail": "QA는 기본 식재료가 없으면 저장 불가를 요구한다. 현재 화면의 필수 검사는 활성 마물에만 적용된다. 비활성 저장까지 QA 기준에 맞는지 서버 검증과 함께 확인하고 불일치하면 수정한다.",
          "checked": false
        },
        {
          "id": "4-06",
          "kind": "test",
          "title": "특수공격의 별도 효과 삭제와 소비 아이템 효과 유지 확인",
          "detail": "마물 특수공격의 추가 효과 제거 요구를 전투 계산까지 재검증한다. 기절·중독·연막 등 소비 아이템 효과는 별도 기능이므로 함께 제거하지 않는다.",
          "checked": false
        },
        {
          "id": "4-07",
          "kind": "test",
          "title": "행동 선택 비중·배율과 전투 승리 보상 검증",
          "detail": "복수 특수공격 선택, 일반 행동과의 선택 비중, 기본 1개/추가 최대 1개/일반 아이템 별도 지급, 재접속·중복 정산 방지를 실제 전투에서 확인한다.",
          "checked": false
        }
      ]
    },
    {
      "number": 5,
      "title": "관리자 캐릭터 관리와 관리자 UI 누락",
      "specs": "15-1",
      "qa": "1.1 캐릭터 · 1.2 · 3.1~3.3",
      "sources": [
        "server/src/modules/admin/character-operations.js",
        "server/src/modules/admin/completion-repository.js",
        "frontend/src/admin/CharacterOperationsPanel.js",
        "frontend/src/admin/CharacterDetailsEditor.js",
        "frontend/src/admin/ItemPicker.js",
        "server/src/modules/admin/routes.js"
      ],
      "items": [
        {
          "id": "5-01",
          "kind": "done",
          "title": "HP·혈량·AP·코인·능력치와 상한 검사",
          "detail": "서버에서 HP/혈량/AP 상한과 영구 능력치 상한을 검사한다. 조회된 캐릭터의 max_ap는 모두 10이다. AP 10 초과 저장 차단과 오류 응답 로직이 있다.",
          "checked": true
        },
        {
          "id": "5-02",
          "kind": "done",
          "title": "사망 캐릭터 HP 보정을 일반 부활과 분리",
          "detail": "사망 캐릭터 HP를 양수로 바꾸면 혈량이 양수일 때 ALIVE, 0이면 NEAR_DEATH로 보정한다. 일반 부활 함수를 호출하지 않으며 부활 횟수·부활 공지를 추가하지 않는다. QA의 idle 의도는 이 코드의 ALIVE 상태로 대응한다.",
          "checked": true
        },
        {
          "id": "5-03",
          "kind": "done",
          "title": "이능·학습 레시피·훈련·식사·누적 횟수 관리",
          "detail": "상세 관리에 이능 보유/등급, 학습 추가·해제, 훈련 여부, 식사 횟수, 사망·부활 횟수와 수정 사유가 있다. 훈련 변경 시 last_training_date도 함께 맞춘다.",
          "checked": true
        },
        {
          "id": "5-04",
          "kind": "done",
          "title": "HP·혈량과 상태 정합성 및 누적 횟수 검증",
          "detail": "명시 상태 보정은 HP·혈량과 일치해야 한다. 누적 횟수 변경은 현재 생사 상태와의 차이를 검사한다. 임의의 일반 강제 부활 기능을 새로 추가할 필요는 없다.",
          "checked": true
        },
        {
          "id": "5-05",
          "kind": "done",
          "title": "캐릭터 인벤토리 아이템·음식 지급 및 회수 경로",
          "detail": "연결된 item_id를 사용해 최종 보유 수량을 변경하는 경로가 있다. 음식도 동일 인벤토리 구조를 사용한다. 실제 음식 데이터로 지급·사용을 이어 보는 검수는 1번에 남겨둔다.",
          "checked": true
        },
        {
          "id": "5-06",
          "kind": "done",
          "title": "전투 중 관리자 자원·상세 수정 차단 유지",
          "detail": "서버에서 requireNoActiveBattle을 호출하는 의도적 제한이다. QA도 의도적 제한이면 유지 가능하므로 단순 누락으로 분류하지 않는다.",
          "checked": true
        },
        {
          "id": "5-07",
          "kind": "done",
          "title": "기존 참조 항목 이름 조회와 선택 유지",
          "detail": "ItemPicker는 이미 선택된 ID를 별도로 조회해 이름을 복원한다. 현재 검색 결과에 없다는 이유만으로 연결을 지우는 구조는 아니다.",
          "checked": true
        },
        {
          "id": "5-08",
          "kind": "fix",
          "title": "관리자 인벤토리에서 0개 항목 숨김",
          "detail": "관리자 조회 SQL과 화면 모두 quantity>0 필터가 없다. DB에도 수량 0인 행이 1건 남아 있다. 표시 목록을 정리하되 기록 삭제가 꼭 필요한 것은 아니다.",
          "checked": false
        },
        {
          "id": "5-09",
          "kind": "fix",
          "title": "참조 선택을 전체 목록 탐색·검색으로 확장",
          "detail": "이름 검색과 음식 유형별 검색은 있으나 빈 검색어로 전체 항목을 불러올 수 없고 검색 결과의 페이지 이동도 없다. 전체 목록에서도 기존 데이터를 찾아 선택할 수 있게 한다.",
          "checked": false
        },
        {
          "id": "5-10",
          "kind": "fix",
          "title": "관리자 HP 보정 안내와 오래된 문구 정리",
          "detail": "사망 HP 보정이 가능한 현재 코드와 화면 안내가 혼동되지 않도록, 일반 부활과 관리자의 수치 정정을 분명하게 설명한다. 별도 강제 부활 기능을 추가하는 작업이 아니다.",
          "checked": false
        },
        {
          "id": "5-11",
          "kind": "test",
          "title": "저장 실패·유효성 오류의 하단 표시를 화면별 확인",
          "detail": "일부 편집기는 오류를 하단에 표시하지만 마물·조사·캐릭터 운영 패널은 상단 메시지 노드도 남아 있다. 실제 스타일 적용 화면에서 저장 버튼 아래/화면 하단 요구를 검수하고 남은 화면만 수정한다.",
          "checked": false
        },
        {
          "id": "5-12",
          "kind": "test",
          "title": "관리자 보정·상한·참조 유지·충돌 재검증",
          "detail": "DEAD HP 0→1, 혈량 0 보정, AP 10/11, 인벤토리 0개, 음식 지급, 학습 해제/추가, 훈련 재설정, 누적 횟수·동시 수정 충돌을 확인한다.",
          "checked": false
        }
      ]
    },
    {
      "number": 6,
      "title": "행동로그·전투로그 정리",
      "specs": "14-1 · 4-4",
      "qa": "기존 작업표 로그 범위",
      "sources": [
        "frontend/src/dev/RecordsPanel.js",
        "frontend/src/dev/BattlePanel.js",
        "server/src/modules/battle/repository.js",
        "frontend/src/App.js"
      ],
      "items": [
        {
          "id": "6-01",
          "kind": "done",
          "title": "일반 이용자 개인 기록과 전투 턴 기록 분리",
          "detail": "운영 로그인에서도 RecordsPanel로 내 행동·조사·발견·단서를 조회한다. 전투 화면의 턴 로그는 별도로 표시된다. DEV 전용 ActionLogPanel만 있는 상태가 아니다.",
          "checked": true
        },
        {
          "id": "6-02",
          "kind": "done",
          "title": "전투 결과의 승패·현재 상태·코인·아이템 표시 기반",
          "detail": "전투 결과 화면에 상대 마물과 결과, 지급 재화·아이템 목록이 있다. 중단과 전후 HP 변화 요약은 별도 보완이 필요하다.",
          "checked": true
        },
        {
          "id": "6-03",
          "kind": "fix",
          "title": "행동 종류와 최종 결과를 이용자용 문구로 정리",
          "detail": "현재 action_type 코드·대상 ID·상세 JSON 중심이다. 조사 결과, 획득·소모 자원, 최종 성공/실패/중단을 기본 표시에서 읽을 수 있게 한다.",
          "checked": false
        },
        {
          "id": "6-04",
          "kind": "fix",
          "title": "전투 결과와 개인 로그에 HP 변화·중단 사유 연결",
          "detail": "상대 마물, 승리/패배/중단, 전후 HP, 지급 보상을 일관된 요약으로 연결한다. 자정 종료가 패배로 남지 않도록 2번의 상태 변경과 함께 처리한다.",
          "checked": false
        },
        {
          "id": "6-05",
          "kind": "test",
          "title": "새로고침·재접속 후 결과와 로그 일치 검증",
          "detail": "확정된 턴 기록·보상·개인 로그가 중복되거나 사라지지 않는지 확인한다. 개발용 상세 JSON은 필요할 때만 펼쳐 보도록 구분한다.",
          "checked": false
        }
      ]
    },
    {
      "number": 7,
      "title": "화면별 행동 제한과 기능 연결",
      "specs": "2-7 · 2-8 · 7-6 · 16장 · 하단 UI 검토",
      "qa": "4.1 · 4.2 · 7.1 · 8.1",
      "sources": [
        "frontend/src/App.js",
        "frontend/src/public/AnemiaNotice.js",
        "frontend/src/dev/InventoryPanel.js",
        "frontend/src/dev/InvestigationPanel.js",
        "frontend/src/dev/BattlePanel.js",
        "frontend/src/dev/TrainingBloodPanel.js",
        "frontend/src/dev/RecordsPanel.js"
      ],
      "items": [
        {
          "id": "7-01",
          "kind": "done",
          "title": "홈 일일훈련·가챠 바로가기와 빈혈 단계 표시 연결",
          "detail": "현재 App에 홈 일일훈련, 주요 행동 가챠, 혈량 옆 정책 기반 AnemiaNotice가 연결되어 있다. 전체 반응형·시각적 위치 검수까지 끝났다는 뜻은 아니다.",
          "checked": true
        },
        {
          "id": "7-02",
          "kind": "done",
          "title": "조사 결과에서 전투 화면으로 이동",
          "detail": "마물 조우 결과에 #game/battle 이동 링크가 있다. 없는 기능으로 다시 만들 필요 없이 실제 라우팅만 재검증하면 된다.",
          "checked": true
        },
        {
          "id": "7-03",
          "kind": "done",
          "title": "헌혈 메뉴 제거와 전투 아이템 사용 유지",
          "detail": "현재 일일훈련·혈액팩 패널에는 헌혈 실행 메뉴가 없다. 전투 화면의 아이템 사용 기능은 유지되어 있다.",
          "checked": true
        },
        {
          "id": "7-04",
          "kind": "done",
          "title": "정보 열람과 실행 차단·로딩 표시의 기존 기반",
          "detail": "조사·인벤토리·전투 등에 사망/빈사/전투 중 실행 차단과 일부 사유 표시가 있다. 전역 처리 중 표시와 전투 로딩도 존재한다. 모든 화면의 세부 정책 일치 여부는 재검증 대상으로 남긴다.",
          "checked": true
        },
        {
          "id": "7-05",
          "kind": "done",
          "title": "서로 다른 계정의 테스트 캐릭터 2명 이상 확보",
          "detail": "읽기 조회에서 활성 계정+활성 캐릭터 연결 8건, 테스트 허용 또는 관리자 8건을 확인했다. 별도 계정 생성이 당장 필요한 상태는 아니며 교차 상호작용 검수는 별도다.",
          "checked": true
        },
        {
          "id": "7-06",
          "kind": "fix",
          "title": "일반 인벤토리에 사용 가능한 아이템 직접 사용 버튼 추가",
          "detail": "현재 일반 인벤토리는 양도·창고 넣기/꺼내기 중심이며 직접 사용 버튼은 없다. 음식·혈액팩 등 종류에 맞는 기존 사용 경로를 연결한다.",
          "checked": false
        },
        {
          "id": "7-07",
          "kind": "fix",
          "title": "전투 중 일반 인벤토리 사용 비활성화와 사유 표시",
          "detail": "새 직접 사용 버튼에도 전투 중 차단을 적용한다. 전투 화면에서 허용하는 전투 아이템 사용까지 막지 않도록 분리한다.",
          "checked": false
        },
        {
          "id": "7-08",
          "kind": "fix",
          "title": "인벤토리 압축 표시·공용창고 탭·접이식 상태창",
          "detail": "현재 개인 인벤토리와 창고가 펼쳐진 목록으로 나열된다. 기존 기능과 스타일 방향을 유지하면서 요청한 압축/탭/접이식 UI를 연결한다.",
          "checked": false
        },
        {
          "id": "7-09",
          "kind": "fix",
          "title": "전투 화면에 내 캐릭터 이미지와 이름 표시",
          "detail": "현재 전투 화면에는 마물 이미지·이름과 내 자원 수치가 있으나 내 캐릭터 이미지·이름은 없다. QA에서 필수로 요청한 항목이다.",
          "checked": false
        },
        {
          "id": "7-10",
          "kind": "test",
          "title": "혈량 단계와 HP 0 사망 우선 표시 검증",
          "detail": "80~100 정상, 60~79 빈혈, 30~59 중증 빈혈, 1~29 중증 빈혈 2단계, 0 빈사를 확인한다. HP 0은 사망이 우선이어야 한다. 컴포넌트 존재와 실제 정책값·화면의 경계 처리는 별개다.",
          "checked": false
        },
        {
          "id": "7-11",
          "kind": "test",
          "title": "사망·빈사·전투 중 화면별 열람/실행/비활성 사유 대조",
          "detail": "조사·요리·식사·인벤토리·창고·상점·가챠·훈련·치료·부활을 기존 명세와 비교한다. 낡은 DEV/AP 테스트 안내가 운영 화면에 남는지도 함께 정리한다.",
          "checked": false
        },
        {
          "id": "7-12",
          "kind": "test",
          "title": "2개 이상 계정으로 양도·치료·부활과 화면 동기화 검수",
          "detail": "아이템·코인 양도, 치료·부활의 양쪽 자원·횟수·로그를 확인하고, 조사→전투 이동·새로고침·모바일/중간 너비의 화면을 실제 브라우저에서 재검증한다.",
          "checked": false
        },
        {
          "id": "7-13",
          "kind": "decision",
          "title": "사망·부활 횟수의 일반 이용자 공개 여부 확정",
          "detail": "QA에서는 표시 필요성 확인·논의로 분류되어 있다. 확정 전 필수 구현 누락으로 취급하거나 임의 공개하지 않는다.",
          "checked": false
        },
        {
          "id": "7-14",
          "kind": "decision",
          "title": "전투 화면의 ATK·DEF·AGI 표시 여부 확정",
          "detail": "QA 필수는 내 캐릭터 이미지·이름이며 능력치 3종은 추가 표시 여부 논의다. 현재 미표시라는 이유만으로 확정 요구로 바꾸지 않는다.",
          "checked": false
        }
      ]
    },
    {
      "number": 8,
      "title": "1D100 주사위",
      "specs": "18장",
      "qa": "기존 작업표 8번",
      "sources": [
        "server/src/app.js",
        "frontend/src/admin/navigation.js",
        "frontend/src/App.js"
      ],
      "items": [
        {
          "id": "8-01",
          "kind": "fix",
          "title": "웹 1D100 결과 생성과 화면 연결",
          "detail": "검토한 API 마운트·화면 라우트·주요 컴포넌트에서는 1D100 연결을 확인하지 못했다. 결과 생성과 사용자 실행/표시 흐름을 연결한다.",
          "checked": false
        },
        {
          "id": "8-02",
          "kind": "fix",
          "title": "개인 행동로그에 주사위 결과 기록",
          "detail": "주사위 종류·결과를 웹 표시와 같은 값으로 기록한다. 마스토돈 전송과 분리하여 웹/로그 기능을 먼저 끝낸다.",
          "checked": false
        },
        {
          "id": "8-03",
          "kind": "test",
          "title": "1~100 범위·중복 요청·화면/로그 일치 검증",
          "detail": "최솟값·최댓값 범위, 반복 클릭·재시도 처리, 결과 새로고침 시 로그와의 일치를 확인한다. 발송 검증은 9번에서 진행한다.",
          "checked": false
        }
      ]
    },
    {
      "number": 9,
      "title": "자동 게시 — 마지막 작업 유지",
      "specs": "14-3 · 10-4 · 18장",
      "qa": "기존 작업표 9번",
      "sources": [
        "server/src/modules/mastodon-system/outbox.js",
        "server/src/shared/recipes.js",
        "server/src/modules/investigation/repository.js",
        "server/src/modules/battle/repository.js",
        "server/src/modules/cooking/repository.js",
        "server/src/modules/gacha/repository.js"
      ],
      "items": [
        {
          "id": "9-01",
          "kind": "done",
          "title": "자동 게시 이벤트 큐·템플릿·중복 방지·재시도 기반",
          "detail": "outbox가 death/revive/area_unlock/monster_discovery/clue_discovery/gacha/failure_food 7종을 지원한다. 게임 트랜잭션에서 큐에 넣고 중복 키·시도 횟수를 관리하는 기반이 있다.",
          "checked": true
        },
        {
          "id": "9-02",
          "kind": "done",
          "title": "마물·단서 최초 발견·가챠·실패요리 RP의 큐 연결",
          "detail": "검토한 조사·전투·가챠·요리 처리에 해당 enqueue 호출이 있다. 운영 정책에서 비활성화된 이벤트는 큐를 만들지 않으므로 실제 발송 완료로 표시하지 않는다.",
          "checked": true
        },
        {
          "id": "9-03",
          "kind": "fix",
          "title": "레시피 최초 발견 이벤트 등록과 큐 연결",
          "detail": "현재 discoverRecipe는 최초 발견·무료 학습·상점 등록·행동로그까지 수행하지만 자동 게시 호출은 없다. outbox 허용 이벤트에도 레시피 최초 발견이 없다.",
          "checked": false
        },
        {
          "id": "9-04",
          "kind": "fix",
          "title": "주사위 결과 이벤트 등록과 큐 연결",
          "detail": "현재 outbox 허용 이벤트에 주사위가 없다. 8번 웹/개인 로그 완료 후 같은 확정 결과를 전송하도록 추가한다.",
          "checked": false
        },
        {
          "id": "9-05",
          "kind": "test",
          "title": "기존 7종과 신규 2종의 실제 발송·문구·공개 범위 검수",
          "detail": "사망·부활·구역 개방·마물/단서/레시피 최초 발견·가챠·실패요리 RP·주사위의 트리거, 정책 활성화, 문구, 공개 범위, 중복 방지·재시도를 확인한다. 이번 검토에서는 발송하지 않았고 배포된 워커 일치 여부도 검증하지 않았다.",
          "checked": false
        }
      ]
    }
  ],
  "db": [
    [
      "무료 혈액팩",
      "0코인 / 혈량 +10 / 하루 수량 1개 / 활성 상품"
    ],
    [
      "일반 혈액팩",
      "2코인 / 혈량 +30 / 일일 한도 없음 / 활성 상품"
    ],
    [
      "음식 등급",
      "1~3등급 성장 15·20·25% / 혈량 회복 10·20·30"
    ],
    [
      "음식 QA 데이터",
      "food_config 1건: 비활성 MATERIAL 개발용 통조림 / 활성 정상 음식·실패요리 없음"
    ],
    [
      "레시피",
      "1건 / 활성·구역 연결·발견·상점 등록 모두 존재 / 발견 후 상점 누락 0건"
    ],
    [
      "조사 결과",
      "4건 모두 NORMAL"
    ],
    [
      "마물 중복 구역 배치",
      "0건"
    ],
    [
      "테스트 가능한 계정·캐릭터",
      "활성 연결 8건 / 테스트 허용 또는 관리자 8건 / max_ap 모두 10"
    ],
    [
      "수량 0 인벤토리",
      "1행 존재"
    ],
    [
      "자정 처리 상태",
      "start_date = NULL / last_completed_date = NULL"
    ],
    [
      "행동·레시피 이미지 스키마",
      "monster_action.description 없음 / recipe.image_url 없음"
    ]
  ],
  "migrations": [
    "20261114172222 battle_consumable_effect_validation",
    "20261114162759 create_survival_images_storage_bucket",
    "20261114154058 normalize_investigation_results_and_guard_monster_area",
    "20261114141145 blood_pack_free_standard_split",
    "20261114124959 food_grade_growth_rates_15_20_25",
    "20261114123304 monster_base_bonus_ingredient_roles",
    "20261114050410 calculated_investigation_progress_view",
    "20261114044956 area_recipe_drop_candidates"
  ],
  "labels": {
    "done": "반영 확인",
    "fix": "수정 필요",
    "setup": "데이터·설정",
    "test": "재검증",
    "decision": "논의 필요"
  }
};
export default survivalChecklist;
