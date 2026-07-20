package erp.system.payroll.dto;

import erp.system.payroll.entity.Payroll;

import java.math.BigDecimal;
import java.time.LocalDate;

public record PayrollResponse(
        Long payrollId,
        Long employeeId,
        String employeeNameSnapshot,
        String departmentNameSnapshot,
        String positionNameSnapshot,
        String payrollYearMonth,
        LocalDate paymentDate,
        BigDecimal totalPayAmount,
        BigDecimal totalDeductionAmount,
        BigDecimal realPayAmount,
        String payrollStatusCode,
        String reviewStatusCode
) {
    public static PayrollResponse from(Payroll payroll) {
        return new PayrollResponse(
                payroll.getPayrollId(),
                payroll.getEmployee().getEmployeeId(),
                payroll.getEmployeeNameSnapshot(),
                payroll.getDepartmentNameSnapshot(),
                payroll.getPositionNameSnapshot(),
                payroll.getPayrollYearMonth(),
                payroll.getPaymentDate(),
                payroll.getTotalPayAmount(),
                payroll.getTotalDeductionAmount(),
                payroll.getRealPayAmount(),
                payroll.getPayrollStatusCode(),
                payroll.getReviewStatusCode()
        );
    }
}
