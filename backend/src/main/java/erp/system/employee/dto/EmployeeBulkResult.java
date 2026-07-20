package erp.system.employee.dto;

public record EmployeeBulkResult(
        Long employeeId,
        boolean success,
        String failureReason
) {
}
