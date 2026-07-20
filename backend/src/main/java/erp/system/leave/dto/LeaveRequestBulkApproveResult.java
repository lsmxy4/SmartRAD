package erp.system.leave.dto;

public record LeaveRequestBulkApproveResult(
        Long leaveRequestId,
        boolean success,
        String failureReason
) {
}
