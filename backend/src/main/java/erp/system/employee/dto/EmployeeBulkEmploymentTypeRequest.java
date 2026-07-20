package erp.system.employee.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record EmployeeBulkEmploymentTypeRequest(
        @NotEmpty(message = "대상 사원을 선택해주세요.") List<Long> employeeIds,
        @NotNull(message = "급여형태는 필수입니다.") Long employmentTypeId
) {
}
