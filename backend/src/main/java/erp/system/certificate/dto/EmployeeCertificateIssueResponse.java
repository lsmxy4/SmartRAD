package erp.system.certificate.dto;

import erp.system.certificate.entity.EmployeeCertificateIssue;
import erp.system.common.util.SoftDeleteAware;
import erp.system.employee.entity.Employee;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record EmployeeCertificateIssueResponse(
        Long employeeCertificateIssueId,
        Long employeeId,
        String employeeName,
        String applicationNo,
        String certificateType,
        LocalDate applicationDate,
        String issueStatus,
        LocalDateTime issuedAt,
        String approvalStatus,
        String purpose,
        String memo
) {
    private static final String DELETED_EMPLOYEE_LABEL = "(삭제된 직원)";

    public static EmployeeCertificateIssueResponse from(EmployeeCertificateIssue issue) {
        Employee rawEmployee = issue.getEmployee();
        Employee employee = SoftDeleteAware.resolve(rawEmployee, Employee::getName);

        return new EmployeeCertificateIssueResponse(
                issue.getEmployeeCertificateIssueId(),
                SoftDeleteAware.identifierOf(rawEmployee, () -> rawEmployee.getEmployeeId()),
                employee != null ? employee.getName() : DELETED_EMPLOYEE_LABEL,
                issue.getApplicationNo(),
                issue.getCertificateType(),
                issue.getApplicationDate(),
                issue.getIssueStatus(),
                issue.getIssuedAt(),
                issue.getApprovalStatus(),
                issue.getPurpose(),
                issue.getMemo()
        );
    }
}
