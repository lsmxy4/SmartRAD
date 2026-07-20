package erp.system.allowance.dto;

import erp.system.allowance.entity.Allowance;
import erp.system.allowance.entity.EmployeeAllowance;
import erp.system.common.util.SoftDeleteAware;
import erp.system.employee.entity.Employee;

import java.math.BigDecimal;
import java.time.LocalDate;

public record EmployeeAllowanceResponse(
        Long employeeAllowanceId,
        Long employeeId,
        Long allowanceId,
        String allowanceName,
        BigDecimal amount,
        LocalDate startDate,
        LocalDate endDate,
        boolean active
) {
    private static final String DELETED_ALLOWANCE_LABEL = "(삭제된 수당)";

    public static EmployeeAllowanceResponse from(EmployeeAllowance employeeAllowance) {
        Employee rawEmployee = employeeAllowance.getEmployee();
        Allowance rawAllowance = employeeAllowance.getAllowance();
        Allowance allowance = SoftDeleteAware.resolve(rawAllowance, Allowance::getAllowanceName);

        return new EmployeeAllowanceResponse(
                employeeAllowance.getEmployeeAllowanceId(),
                SoftDeleteAware.identifierOf(rawEmployee, () -> rawEmployee.getEmployeeId()),
                SoftDeleteAware.identifierOf(rawAllowance, () -> rawAllowance.getAllowanceId()),
                allowance != null ? allowance.getAllowanceName() : DELETED_ALLOWANCE_LABEL,
                employeeAllowance.getAmount(),
                employeeAllowance.getStartDate(),
                employeeAllowance.getEndDate(),
                employeeAllowance.isActive()
        );
    }
}
