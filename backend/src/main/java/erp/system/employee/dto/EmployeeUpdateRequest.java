package erp.system.employee.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record EmployeeUpdateRequest(
//        Long departmentId,
//        Long positionId,
        Long employmentTypeId,
        @NotBlank(message = "이름은 필수입니다.") @Size(max = 100) String name,
        LocalDate birthDate,
        String phone,
        @Email(message = "이메일 형식이 올바르지 않습니다.") String email,
        String address,
        LocalDate hireDate,
        LocalDate resignationDate,
        String employeeStatusCode,
        String bankName,
        String accountNumber,
        String accountHolder,
        String profileImage
) {
}
