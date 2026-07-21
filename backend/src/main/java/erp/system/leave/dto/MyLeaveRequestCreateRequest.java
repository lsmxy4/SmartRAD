package erp.system.leave.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record MyLeaveRequestCreateRequest(
        @NotNull(message = "휴가 유형은 필수입니다.") Long leaveTypeId,
        @NotNull(message = "시작일은 필수입니다.") LocalDate startDate,
        @NotNull(message = "종료일은 필수입니다.") LocalDate endDate,
        @Size(max = 500) String reason
) {
}
