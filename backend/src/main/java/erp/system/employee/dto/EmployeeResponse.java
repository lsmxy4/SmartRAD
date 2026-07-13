package erp.system.employee.dto;

import erp.system.employee.entity.Employee;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record EmployeeResponse (
        Long employeeId,
        String employeeNo,
//        Long departmentId,
//        String departmentName,
//        Long positionId,
//        String positionName,
//        Long employmentTypeId,
//        String employmentTypeName,
        String name,
        LocalDate birthDate,
        String phone,
        String email,
        String address,
        LocalDate hireDate,
        LocalDate resignationDate,
        String employeeStatusCode,
        String bankName,
        String accountNumber,
        String accountHolder,
        boolean active,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
){
    public static EmployeeResponse from(Employee employee) {
        return new EmployeeResponse(
                employee.getEmployeeId(),
                employee.getEmployeeNo(),
//                employee.getDepartment() != null ? employee.getDepartment().getDepartmentId() : null,
//                employee.getDepartment() != null ? employee.getDepartment().getDepartmentName() : null,
//                employee.getPosition() != null ? employee.getPosition().getPositionId() : null,
//                employee.getPosition() != null ? employee.getPosition().getPositionName() : null,
//                employee.getEmploymentType() != null ? employee.getEmploymentType().getEmploymentTypeId() : null,
//                employee.getEmploymentType() != null ? employee.getEmploymentType().getEmploymentTypeName() : null,
                employee.getName(),
                employee.getBirthDate(),
                employee.getPhone(),
                employee.getEmail(),
                employee.getAddress(),
                employee.getHireDate(),
                employee.getResignationDate(),
                employee.getEmployeeStatusCode(),
                employee.getBankName(),
                employee.getAccountNumber(),
                employee.getAccountHolder(),
                employee.isActive(),
                employee.getCreatedAt(),
                employee.getUpdatedAt()
        );
    }
}
