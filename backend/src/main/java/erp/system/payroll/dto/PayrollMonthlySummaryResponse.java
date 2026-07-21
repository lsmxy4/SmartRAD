package erp.system.payroll.dto;

import java.math.BigDecimal;

public record PayrollMonthlySummaryResponse(
        String payrollYearMonth,
        BigDecimal totalPayAmount,
        BigDecimal totalRealPayAmount,
        long employeeCount
) {
}
