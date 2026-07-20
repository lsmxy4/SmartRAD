package erp.system.leave.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LeaveRequestRejectRequest(
        @NotBlank(message = "반려 사유는 필수입니다.") @Size(max = 500) String rejectionReason
) {
}
