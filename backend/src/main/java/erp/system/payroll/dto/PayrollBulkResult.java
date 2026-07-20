package erp.system.payroll.dto;

public record PayrollBulkResult(Long payrollId, boolean success, String failureReason) {
}
