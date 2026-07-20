package erp.system.payroll.dto;

import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record PayrollBulkPayRequest(
        @NotEmpty(message = "지급 처리할 급여를 선택해주세요.") List<Long> payrollIds
) {
}
