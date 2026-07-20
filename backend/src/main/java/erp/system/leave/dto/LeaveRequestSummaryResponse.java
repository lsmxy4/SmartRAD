package erp.system.leave.dto;

public record LeaveRequestSummaryResponse(
        long totalCount,
        long pendingCount,
        long approvedCount,
        long rejectedCount
) {
}
