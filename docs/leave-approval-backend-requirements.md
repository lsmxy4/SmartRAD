# 휴가 승인/관리 백엔드 요구사항

## 현재 구현 현황

- 목록: `GET /api/leave-requests?employeeId=&status=` (전체 배열)
- 승인: `PATCH /api/leave-requests/{id}/approve`
- 반려: `PATCH /api/leave-requests/{id}/reject` (요청 body 없음)
- 휴가 유형: `GET /api/leave-types`
- 상태 코드: `PENDING`, `APPROVED`, `REJECTED`
- 휴가 유형은 고정 코드 enum이 아니라 DB의 `leaveTypeId`, `leaveTypeName`으로 관리된다.
- 응답 필드: `leaveRequestId`, `employeeId`, `employeeName`, `leaveTypeId`, `leaveTypeName`, `startDate`, `endDate`, `leaveDays`, `reason`, `status`, `approverId`, `approverName`, `createdAt`

### 휴가 신청 목록 검색 및 페이지네이션

- 현재 상태: `employeeId`, `status`만 지원하며 전체 배열을 반환한다.
- 프론트에서 필요한 이유: 기간·유형·직원·부서 검색과 대량 데이터 페이지 처리가 필요하다.
- 현재 임시 처리: 전체 목록을 신청일(`createdAt`) 기준으로 클라이언트 필터링·페이지네이션한다.
- 백엔드 요청사항: 검색 Specification과 `Page` 응답 지원
- 권장 HTTP Method: GET
- 권장 API 경로: 기존 `/api/leave-requests` 확장
- 요청 파라미터 또는 Body: `startDate`, `endDate`, `leaveTypeId`, `status`, `keyword`, `departmentId`, `page`, `size`, `sort`
- 필요한 응답 필드: `content`, `totalElements`, `totalPages`, `number`, `size`
- 우선순위: 필수

### 휴가 신청 상세 조회와 DTO 보강

- 현재 상태: 상세 API가 없고 목록 DTO에 조직·처리일·반려 사유가 없다.
- 프론트에서 필요한 이유: 상세 모달과 감사 가능한 승인 결과 표시가 필요하다.
- 현재 임시 처리: 목록 응답과 직원 API를 결합하고 없는 값은 `-`로 표시한다.
- 백엔드 요청사항: 상세 조회 및 DTO 보강
- 권장 HTTP Method: GET
- 권장 API 경로: `/api/leave-requests/{id}`
- 요청 파라미터 또는 Body: 경로의 `id`
- 필요한 응답 필드: `employeeNo`, `departmentId`, `departmentName`, `positionName`, `email`, `processedAt`, `rejectionReason`, `updatedAt`과 현재 DTO 필드
- 우선순위: 필수

### 반려 사유 지원

- 현재 상태: 반려 PATCH는 body가 없고 엔티티에 `rejectionReason`, `processedAt`이 없다.
- 프론트에서 필요한 이유: 관리자는 반려 근거를 입력하고 신청자는 이를 확인해야 한다.
- 현재 임시 처리: 반려 API를 호출하지 않고 미지원 안내를 표시한다.
- 백엔드 요청사항: 필수 반려 사유 DTO, 최대 길이 검증, 반려자·처리일 저장
- 권장 HTTP Method: PATCH
- 권장 API 경로: 기존 `/api/leave-requests/{id}/reject` 확장
- 요청 파라미터 또는 Body: `{ "rejectionReason": "..." }`
- 필요한 응답 필드: `status`, `approverId`, `approverName`, `processedAt`, `rejectionReason`
- 우선순위: 필수

### 선택 일괄 승인 API

- 현재 상태: 개별 승인만 존재한다.
- 프론트에서 필요한 이유: 여러 신청의 원자적 처리와 실패 사유 제공이 필요하다.
- 현재 임시 처리: 승인 대기 ID만 `Promise.allSettled`로 개별 승인하고 성공·실패 건수를 표시한다.
- 백엔드 요청사항: 트랜잭션 정책이 정의된 일괄 승인 API
- 권장 HTTP Method: PATCH
- 권장 API 경로: `/api/leave-requests/bulk-approve`
- 요청 파라미터 또는 Body: `{ "leaveRequestIds": [1, 2, 3] }`
- 필요한 응답 필드: ID별 `success`, `failureReason`, 최종 상태
- 우선순위: 권장

### 휴가 요약 통계 API

- 현재 상태: 통계 API가 없다.
- 프론트에서 필요한 이유: 서버 필터 기준과 동일한 전체·대기·승인·반려 건수가 필요하다.
- 현재 임시 처리: 상태 필터를 제외한 클라이언트 필터 결과로 집계한다.
- 백엔드 요청사항: 기간·유형·키워드 조건을 받는 요약 API
- 권장 HTTP Method: GET
- 권장 API 경로: `/api/leave-requests/summary`
- 요청 파라미터 또는 Body: `startDate`, `endDate`, `leaveTypeId`, `keyword`, `departmentId`
- 필요한 응답 필드: `totalCount`, `pendingCount`, `approvedCount`, `rejectedCount`
- 우선순위: 권장

### 휴가 일수·중복·잔여 일수 정책

- 현재 상태: 생성 시 시작일~종료일을 단순 포함 일수로 계산하고, 승인 시 잔여 일수를 차감한다. 주말·공휴일·반차·중복 신청 정책이 확인되지 않는다.
- 프론트에서 필요한 이유: 실제 사용 일수와 승인 가능 여부를 정확히 판단해야 한다.
- 현재 임시 처리: 서버가 반환한 `leaveDays`를 그대로 표시한다.
- 백엔드 요청사항: 주말·공휴일·반차 계산, 기간 중복, 잔여 부족, 승인 취소 복구 정책 및 검증
- 권장 HTTP Method: 기존 생성·승인 API에 적용
- 권장 API 경로: 기존 `/api/leave-requests` 계열
- 요청 파라미터 또는 Body: 휴가 유형과 기간
- 필요한 응답 필드: 계산된 `leaveDays`, 검증 실패 코드와 메시지
- 우선순위: 필수

### 감사 이력

- 현재 상태: 승인자만 저장되고 처리일·상태 변경 이력이 없다.
- 프론트에서 필요한 이유: 승인/반려 책임과 변경 근거 추적이 필요하다.
- 현재 임시 처리: 승인자만 표시하고 처리일은 `-`로 표시한다.
- 백엔드 요청사항: 상태 변경 감사 로그 저장 및 조회
- 권장 HTTP Method: GET
- 권장 API 경로: `/api/leave-requests/{id}/histories`
- 요청 파라미터 또는 Body: 경로의 `id`
- 필요한 응답 필드: `previousStatus`, `newStatus`, `processedBy`, `processedAt`, `reason`
- 우선순위: 선택

## 구현 우선순위

1. 반려 사유·처리일과 상세 DTO
2. 목록 서버 검색·페이지네이션
3. 휴가 일수·중복·잔여 정책 보강
4. 일괄 승인과 요약 통계
5. 감사 이력
