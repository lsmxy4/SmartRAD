package erp.system.employee.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;
import java.util.List;

public record EmployeeBulkPayrollBasicRequest(
        @NotEmpty(message = "대상 사원을 선택해주세요.") @Valid List<Item> items
) {
    public record Item(
            @NotNull(message = "사원은 필수입니다.") Long employeeId,
            @NotNull(message = "기본급은 필수입니다.") @PositiveOrZero(message = "기본급은 0 이상이어야 합니다.") BigDecimal baseSalary,
            String bankName,
            String accountNumber,
            String accountHolder
    ) {
    }
}
