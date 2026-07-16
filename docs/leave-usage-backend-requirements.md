# 휴가 사용 현황 백엔드 요구사항

## 현재 구현

- `GET /api/leave-balances?employeeId=`: `employeeLeaveBalanceId`, `employeeId`, `leaveTypeId`, `leaveTypeName`, `totalDays`, `usedDays`, `remainDays`, `expireDate`
- `GET /api/leave-requests?employeeId=&status=`: 휴가 유형·기간·`leaveDays`·상태·신청일
- `GET /api/employees`, `/api/departments`, `/api/positions`, `/api/leave-types`
- 상태: `PENDING`, `APPROVED`, `REJECTED`; 휴가 유형은 DB 기반 ID와 이름이며 고정 코드가 없다.

### 전사·직원별 연차 현황 API

- 현재 상태: 잔액은 직원 ID 단건만 조회할 수 있고 연도 필드가 없다.
- 프론트에서 필요한 이유: 전사 통계와 목록을 N+1 없이 연도 기준으로 조회해야 한다.
- 현재 임시 처리: 재직 직원별 잔액 API를 병렬 호출하고 반환된 현재 잔액을 합산한다.
- 백엔드 요청사항: 연도·조직 필터와 페이지를 지원하는 전사 잔액 조회
- 권장 HTTP Method: GET
- 권장 API 경로: `/api/leave-balances/summary`
- 요청 파라미터: `year`, `departmentId`, `positionId`, `keyword`, `page`, `size`, `sort`
- 필요한 응답 필드: `employeeCount`, `totalGrantedDays`, `totalUsedDays`, `totalRemainingDays`, `usageRate`, `remainingRate`, 직원별 사번·조직·`baseGrantedDays`·`carriedOverDays`·`adjustedDays`·`pendingDays`·잔액 필드
- 우선순위: 필수

### 부서·월·휴가 유형 통계 API

- 현재 상태: 전용 통계 API가 없다.
- 프론트에서 필요한 이유: 여러 달 휴가와 휴일 정책을 반영한 정확한 추이가 필요하다.
- 현재 임시 처리: 부서는 현재 잔액으로 집계하고 유형은 기간 안에 완전히 포함된 승인 신청으로 계산한다. 월별 추이는 시작·종료 월이 같은 승인 신청만 표시한다.
- 백엔드 요청사항: 부서별 지급/사용/잔여, 월별 실제 사용일, 유형별 사용 일수 통계
- 권장 HTTP Method: GET
- 권장 API 경로: `/api/leave-balances/statistics`
- 요청 파라미터: `startDate`, `endDate`, `departmentId`, `positionId`
- 필요한 응답 필드: 부서별 `employeeCount`, `grantedDays`, `usedDays`, `remainingDays`, `usageRate`; 월별 `year`, `month`, `usedDays`; 유형별 `leaveTypeId`, `leaveTypeName`, `usedDays`, `percentage`
- 우선순위: 필수

### 직원별 휴가 상세 이력 API

- 현재 상태: 휴가 신청 전체 배열을 프론트에서 직원별로 나눈다. 처리일이 없다.
- 프론트에서 필요한 이유: 대량 이력 페이지네이션과 정확한 기간 검색이 필요하다.
- 현재 임시 처리: 전체 신청 목록을 재사용하며 처리일은 표시하지 않는다.
- 백엔드 요청사항: 직원별 기간·상태·유형 검색과 페이지네이션
- 권장 HTTP Method: GET
- 권장 API 경로: 기존 `/api/leave-requests` 검색 조건 확장
- 요청 파라미터: `employeeId`, `startDate`, `endDate`, `status`, `leaveTypeId`, `page`, `size`
- 필요한 응답 필드: 현재 DTO와 `processedAt`
- 우선순위: 권장

### 연차 지급 구성과 계산 정책

- 현재 상태: 잔액 DTO는 총 지급·사용·잔여만 제공한다. 기본 지급은 직급 level에 따라 14일+level이며 이월·조정·소멸 구분이 없다.
- 프론트에서 필요한 이유: 상세에서 지급 근거와 연도 귀속을 설명해야 한다.
- 현재 임시 처리: 총 지급·사용·잔여만 실제 값으로 표시하고 기본·이월·조정은 `-`로 표시한다.
- 백엔드 요청사항: 회계/입사일 기준, 1년 미만 월차, 이월·조정·소멸·취소 복구·반차·주말·공휴일 정책과 필드 제공
- 권장 HTTP Method: GET
- 권장 API 경로: `/api/leave-balances?employeeId=&year=` 확장
- 요청 파라미터: `employeeId`, `year`
- 필요한 응답 필드: `baseGrantedDays`, `carriedOverDays`, `adjustedDays`, `expiredDays`, `pendingDays`, `year`
- 우선순위: 필수

### Excel·리포트 다운로드

- 현재 상태: XLSX/PDF 다운로드 API가 없다.
- 프론트에서 필요한 이유: 선택 직원과 검색 조건 기준 정식 문서가 필요하다.
- 현재 임시 처리: UTF-8 BOM CSV와 브라우저 인쇄를 사용한다.
- 백엔드 요청사항: 필터·직원 ID를 받는 XLSX 및 PDF/인쇄 데이터 API
- 권장 HTTP Method: GET
- 권장 API 경로: `/api/leave-balances/export`
- 요청 파라미터: `startDate`, `endDate`, `departmentId`, `positionId`, `keyword`, `employeeIds`, `format`
- 필요한 응답 필드: 파일 응답
- 우선순위: 선택

## 우선순위

1. 전사 연도별 연차 현황 API와 지급 구성 필드
2. 부서·월·유형별 통계 API
3. 직원별 이력 검색·처리일
4. Excel/PDF 다운로드
