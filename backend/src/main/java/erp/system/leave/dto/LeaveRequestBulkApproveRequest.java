package erp.system.leave.dto;

import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record LeaveRequestBulkApproveRequest(
        @NotEmpty(message = "승인할 휴가 신청을 선택해주세요.") List<Long> leaveRequestIds
) {
}
