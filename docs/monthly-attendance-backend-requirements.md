# 월간 근태 통계 백엔드 요구사항

## 현재 관련 API와 구현 가능 범위

- `GET /api/attendances?date=YYYY-MM-DD`: 날짜별 근태 기록과 상태·근무시간 조회
- `GET /api/attendances/monthly-summary?yearMonth=YYYY-MM`: 직원별 근무일수·총 근무분·총 초과근무분 조회
- `GET /api/employees`: 직원의 부서·직급 정보 조회
- `GET /api/departments`: 부서 목록 조회
- 현재 API 조합으로 일별 상태 추이, 직원·부서별 임시 통계, 초과근무 합계를 프론트에서 계산한다.

### 기간별 근태 조회 API

- 현재 상태: 날짜 단건 조회만 존재하여 월별 평일 수만큼 요청한다.
- 프론트에서 필요한 이유: 월간 통계와 차트를 한 번의 일관된 데이터로 계산해야 한다.
- 현재 임시 처리: 선택 월의 월~금 날짜를 생성해 `Promise.all`로 조회한다.
- 백엔드 요청사항: 시작일·종료일과 선택 필터를 지원하는 기간 조회 추가
- 권장 HTTP Method: GET
- 권장 API 경로: `/api/attendances/range`
- 요청 파라미터: `startDate`, `endDate`, `departmentId`, `employeeId`, `status`
- 필요한 응답 필드: `attendanceId`, `workDate`, `employeeId`, `employeeName`, `departmentId`, `departmentName`, `positionName`, `checkInTime`, `checkOutTime`, `workMinutes`, `overtimeMinutes`, `attendanceStatusCode`, `note`
- 우선순위: 필수

### 월간 전체·일별·부서별 통계 API

- 현재 상태: 직원별 근무시간 요약만 있고 상태별 전체·일별·부서별 집계가 없다.
- 프론트에서 필요한 이유: 상단 통계, 추이 차트, 도넛, 부서 비교를 정확하고 효율적으로 표시해야 한다.
- 현재 임시 처리: 날짜별 기록을 브라우저에서 상태별로 집계한다.
- 백엔드 요청사항: 월간 전체 요약과 `dailyStatistics`, `departmentStatistics` 제공
- 권장 HTTP Method: GET
- 권장 API 경로: `/api/attendances/monthly-statistics`
- 요청 파라미터: `yearMonth`, `departmentId`
- 필요한 응답 필드: `workdayCount`, `attendanceRate`, `normalCount`, `lateCount`, `absentCount`, `leaveCount`, `totalOvertimeMinutes`, `averageOvertimeMinutes`, `previousMonthComparison`, 일별 `date`·상태별 비율/건수, 부서별 `departmentId`·`departmentName`·상태별 건수/출근율
- 우선순위: 필수

### 직원별 월간 통계 DTO 보강

- 현재 상태: `employeeId`, `employeeName`, `totalWorkMinutes`, `totalOvertimeMinutes`, `workDayCount`만 제공한다.
- 프론트에서 필요한 이유: 직원별 지각·결근·휴가·출근율과 부서 필터가 필요하다.
- 현재 임시 처리: 직원 API와 날짜별 근태를 `employeeId`로 결합한다.
- 백엔드 요청사항: 월간 요약 DTO에 조직 및 상태별 집계 추가
- 권장 HTTP Method: GET
- 권장 API 경로: 기존 `/api/attendances/monthly-summary` 확장
- 요청 파라미터: `yearMonth`, `departmentId`
- 필요한 응답 필드: `employeeId`, `employeeName`, `departmentName`, `positionName`, `normalDays`, `lateCount`, `absentCount`, `leaveDays`, `workMinutes`, `overtimeMinutes`, `attendanceRate`
- 우선순위: 필수

### 휴가와 근태 상태 연계

- 현재 상태: 근태 엔티티 상태는 `NORMAL`, `LATE`, `EARLY_LEAVE`, `ABSENT`이며 휴가 요청과 자동 연결되지 않는다.
- 프론트에서 필요한 이유: 휴가 건수와 출근율 분모를 정확히 계산해야 한다.
- 현재 임시 처리: 근태 응답에 휴가 상태가 있을 때만 집계하며 없으면 0건으로 표시한다.
- 백엔드 요청사항: 승인 휴가를 일별 근태 상태 또는 월간 통계에 반영
- 권장 HTTP Method: GET
- 권장 API 경로: `/api/attendances/monthly-statistics` 응답에 포함
- 요청 파라미터: `yearMonth`
- 필요한 응답 필드: `leaveCount`, 직원별 `leaveDays`, 적용 날짜와 휴가 유형
- 우선순위: 필수

### 근무일·공휴일 및 출근율 정책

- 현재 상태: 엔티티에 09:00, 18:00, 480분 기준은 있으나 공휴일·회사 휴무일 API와 출근율 공식은 없다.
- 프론트에서 필요한 이유: 총 근무일수, 결근 판정, 출근율을 서비스 정책대로 계산해야 한다.
- 현재 임시 처리: 월~금만 근무일로 보고 공휴일은 제외하지 않는다. 출근율은 `정상 / 분류 가능한 기록`으로 계산한다.
- 백엔드 요청사항: 근무 캘린더와 출근율·지각·결근·초과근무 계산 정책 확정 및 제공
- 권장 HTTP Method: GET
- 권장 API 경로: `/api/work-schedules/calendar`
- 요청 파라미터: `yearMonth`
- 필요한 응답 필드: `date`, `workday`, `holidayName`, `standardStartTime`, `standardEndTime`, `standardWorkMinutes`
- 우선순위: 필수

### 주의 직원 판정

- 현재 상태: 경고 수준이나 판정 API가 없다.
- 프론트에서 필요한 이유: 관리자에게 관리 대상과 근거를 일관되게 제공해야 한다.
- 현재 임시 처리: `TEMP_WARNING_LATE_THRESHOLD=3`, `TEMP_WARNING_ABSENT_THRESHOLD=1`로 상위 3명을 계산한다.
- 백엔드 요청사항: 경고 정책과 월별 주의 직원 결과 제공
- 권장 HTTP Method: GET
- 권장 API 경로: `/api/attendances/monthly-warnings`
- 요청 파라미터: `yearMonth`, `departmentId`
- 필요한 응답 필드: `employeeId`, `employeeName`, `departmentName`, `warningLevel`, `warningReason`, `lateCount`, `absentCount`
- 우선순위: 권장

### 월간 리포트 다운로드

- 현재 상태: 서버 다운로드 API가 없다.
- 프론트에서 필요한 이유: 대용량·정책 확정 데이터를 동일한 기준으로 내보내야 한다.
- 현재 임시 처리: 확보된 직원별 요약을 UTF-8 BOM CSV로 생성한다.
- 백엔드 요청사항: 선택 월 및 필터 기반 CSV 또는 Excel 다운로드
- 권장 HTTP Method: GET
- 권장 API 경로: `/api/attendances/monthly-report`
- 요청 파라미터: `yearMonth`, `departmentId`, `employeeId`
- 필요한 응답 필드: 파일 응답 또는 직원별 월간 통계 전체 필드
- 우선순위: 선택

## 백엔드 요청 우선순위 요약

1. 기간 조회 또는 통합 월간 통계 API
2. 휴가·근무일·공휴일·출근율 정책 확정
3. 직원별 월간 요약 DTO 보강
4. 주의 직원 판정 API
5. 서버 월간 리포트 다운로드
