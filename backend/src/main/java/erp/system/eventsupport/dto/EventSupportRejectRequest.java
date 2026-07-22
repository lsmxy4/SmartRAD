package erp.system.eventsupport.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record EventSupportRejectRequest(
        @NotBlank(message = "반려 사유는 필수입니다.") @Size(max = 500) String rejectionReason
) {
}
