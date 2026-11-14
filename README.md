# QA Board

간단한 팀 QA 협업 대시보드. React CRA(JavaScript) + Supabase + GitHub Pages. Playwright나 GitHub Actions 자동 테스트는 사용하지 않습니다.

## 빠른 실행 (Supabase 없이 UI 확인)

```bash
npm install
npm start
```

`.env`가 없으면 **체험 모드**로 열립니다. 프로젝트/QA 항목 등록, 수정, 삭제, 상태 변경을 시험할 수 있습니다. 체험 데이터는 새로고침 시 초기화되고 이미지 첨부는 비활성화됩니다.

## Supabase 연결

1. Supabase 프로젝트를 만듭니다.
2. SQL Editor에서 `supabase/schema.sql`을 실행합니다. (처음 한 번만 실행; 정책이 이미 존재하면 중복 생성 오류가 날 수 있습니다.)
3. Authentication > Users에서 팀원 이메일 계정을 생성합니다. 공개 회원가입을 허용하지 않을 계획이면 Authentication 설정에서 신규 가입을 비활성화하세요.
4. `.env.example`을 `.env`로 복사하고 Project URL과 publishable key(또는 legacy anon key)를 입력합니다. **service_role 키는 절대 넣지 마세요.**
5. `npm start`를 다시 실행하고 로그인합니다.

로그인한 사용자는 모든 프로젝트와 QA 항목을 공유합니다. 소규모 신뢰된 팀용 MVP이므로 조직별 접근 제한/역할 분리는 구현하지 않았습니다. 사용자 초대 전에 권한 정책을 검토하세요.

## GitHub Pages 배포

CRA 빌드 결과물인 `build/` 폴더를 GitHub Pages에 정적 배포하면 됩니다. `package.json`의 `homepage`가 `.`으로 설정되어 상대 경로를 사용합니다. 배포 시 환경변수는 **빌드 시점**에 주입되어야 합니다. `.env`는 Git에 커밋하지 마세요. 브라우저에 노출되는 publishable/anon 키는 공개 가능한 키이며, 데이터 접근은 RLS로 제어합니다.

예: 로컬에서 `npm run build` 후 생성된 `build/` 내용을 Pages 게시 브랜치 또는 디렉터리에 업로드합니다. 저장소 설정에서 Pages 배포 소스를 지정하세요. 자동 배포 파이프라인은 포함하지 않았습니다.

## 기능

- 프로젝트 등록/선택
- QA 항목 등록/수정/삭제, 검색 및 상태 필터
- 대기 / 진행 / 수정완료 / 통과 상태 변경
- 담당자, 우선순위, 설명
- 실시간 DB 변경 수신 (Supabase Realtime)
- 이미지 첨부 (PNG/JPEG/WEBP, 최대 10MB, 비공개 Storage, 60초 서명 URL)
- 이메일/비밀번호 로그인 (Supabase Auth)

## 참고

- 스크린샷은 **기존 QA 항목을 저장한 다음** 상세 편집 화면에서 첨부합니다.
- QA 항목 삭제 시 첨부 메타데이터는 삭제되지만 Storage의 파일 자체는 자동 제거되지 않습니다. 운영용으로 확장할 때 서버 측 정리 작업을 추가하세요.
- 변경 사항은 Realtime을 통해 갱신되며, 브라우저 네트워크가 끊기면 수동 새로고침 버튼으로 동기화할 수 있습니다.
- 자동 QA, AI 체크리스트 생성, 댓글, 감사 로그, 조직별 권한은 이번 MVP 범위에 포함되지 않습니다.


## 로그인 없는 사용

로그인 화면과 세션 검사를 제거했습니다. 서울 QA_LL_Seoul 프로젝트에 `allow_public_qa_access` 마이그레이션이 적용되어 있어야 합니다. 공개 URL을 아는 사람 외에도 API 접근자가 데이터를 수정할 수 있으므로 민감한 정보를 올리지 마세요.


## 생존밥 QA 체크리스트 추가
- 기존 QA Board의 QA 항목 탭은 그대로 유지됩니다.
- 생존밥 프로젝트 선택 후 `생존밥 체크리스트` 탭에서 `첨부 체크리스트 77개 등록`을 한 번 누르면 데이터가 Supabase에 등록됩니다.
- 등록 시 기존 항목은 덮어쓰지 않으며, 체크 상태는 실시간 동기화됩니다.
- SQL로 먼저 넣고 싶다면 `supabase/seed_survival_checklist.sql`을 SQL Editor에서 실행할 수 있습니다. 둘 중 하나만 실행해도 됩니다.
- 현재 공개 익명 접근 정책이므로 URL 및 API 접근이 가능한 사람이 체크 상태를 변경할 수 있습니다.
