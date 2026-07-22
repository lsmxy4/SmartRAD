package erp.system.leave.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record LeaveRequestPreviewResponse(Long leaveTypeId, String leaveTypeName, LocalDate startDate,
        LocalDate endDate, BigDecimal requestedDays, BigDecimal currentRemainDays,
        BigDecimal remainDaysAfterRequest, boolean available, String message) {}
