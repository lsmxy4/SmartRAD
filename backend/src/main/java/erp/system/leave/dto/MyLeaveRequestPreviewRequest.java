package erp.system.leave.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record MyLeaveRequestPreviewRequest(@NotNull Long leaveTypeId, @NotNull LocalDate startDate,
                                           @NotNull LocalDate endDate) {}
