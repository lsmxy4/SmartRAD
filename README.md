# SmartRAD

인사관리 ERP 시스템 (tp-hr-project-2026)

Spring Boot + Next.js 기반 사내 인사관리 시스템입니다.

## 실행 방법

Docker만 설치되어 있으면 별도 설정 없이 바로 실행됩니다.

```bash
docker compose up -d --build
```

- 프론트엔드: http://localhost:3000
- 백엔드 API: http://localhost:8081
- MySQL: localhost:3307 (컨테이너 간에는 3306)

첫 기동 시 `backend/src/main/resources/data.sql`이 자동으로 실행되어 테스트용 부서/직급/직원 데이터가 채워집니다.

## 테스트 계정

모든 시드 계정의 비밀번호는 `test1234` 입니다.

| 구분 | 이메일 | 비고 |
|---|---|---|
| 관리자 | admin123@test.com | 사번 ADMIN001, role: ADMIN |
| 일반 사원 | user003@example.com | 사번 E2026003 (서지호), role: EMPLOYEE |

그 외 `user004@example.com` ~ `user050@example.com` 형태로 사원 계정이 다수 시드되어 있습니다(전부 동일 비밀번호).

## AI 비서 기능 (선택)

우측 하단 채팅 위젯에서 본인의 연차/급여/근태를 자연어로 물어보거나, 공지사항/휴가 사유를 AI로 요약할 수 있는 기능입니다. API 키가 없으면 자동으로 "AI 비서 기능이 아직 설정되지 않았습니다" 안내만 뜨고 나머지 기능엔 영향이 없습니다.

Gemini(기본값)와 Anthropic 중 하나를 골라 쓸 수 있습니다. 프로젝트 루트에 `.env` 파일을 만들고(git에 안 올라감) 아래처럼 채우세요.

**Gemini 사용 (기본값, 무료 티어 있음)**
```
GEMINI_API_KEY=여기에-발급받은-키
ASSISTANT_PROVIDER=gemini
```
[aistudio.google.com/apikey](https://aistudio.google.com/apikey)에서 "Create API key"로 발급받으세요(보통 `AIzaSy...`로 시작). 계정에 따라 무료 티어 할당량이 0으로 잡혀있을 수 있는데, 이 경우 [ai.google.dev/gemini-api/docs/rate-limits](https://ai.google.dev/gemini-api/docs/rate-limits)에서 계정 상태를 확인하세요.

**Anthropic(Claude) 사용**
```
ANTHROPIC_API_KEY=sk-ant-여기에-발급받은-키
ASSISTANT_PROVIDER=anthropic
```
[console.anthropic.com](https://console.anthropic.com)에서 가입 후 API Keys 메뉴에서 키 발급 (무료 크레딧이 없어 결제수단 등록이 필요할 수 있음).

설정 후 `docker compose up -d --build backend`로 재기동하면 반영됩니다.

## 개발 시 참고

- 백엔드 코드를 수정하면 `docker compose build backend && docker compose up -d backend`로 재빌드해야 반영됩니다.
- 프론트엔드도 동일하게 `docker compose build frontend && docker compose up -d frontend`.
- DB 데이터를 완전히 초기화하려면 `docker compose down -v`로 볼륨까지 삭제한 뒤 다시 `up`하면 됩니다.
