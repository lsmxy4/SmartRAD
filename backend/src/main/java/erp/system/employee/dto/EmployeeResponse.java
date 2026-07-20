package erp.system.employee.dto;

import erp.system.common.util.SoftDeleteAware;
import erp.system.department.entity.Department;
import erp.system.employee.entity.Employee;
import erp.system.employmenttype.entity.EmploymentType;
import erp.system.position.entity.Position;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record EmployeeResponse (
        Long employeeId,
        String employeeNo,
        Long departmentId,
        String departmentName,
        Long positionId,
        String positionName,
        Long employmentTypeId,
        String employmentTypeName,
        Long managerId,
        String managerName,
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
        BigDecimal baseSalary,
        String profileImage,
        boolean active,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
){
    public static EmployeeResponse from(Employee employee) {
        Department department = SoftDeleteAware.resolve(employee.getDepartment(), Department::getDepartmentName);
        Position position = SoftDeleteAware.resolve(employee.getPosition(), Position::getPositionName);
        EmploymentType employmentType = SoftDeleteAware.resolve(employee.getEmploymentType(), EmploymentType::getEmploymentTypeName);
        Employee manager = SoftDeleteAware.resolve(employee.getManager(), Employee::getName);

        return new EmployeeResponse(
                employee.getEmployeeId(),
                employee.getEmployeeNo(),
                SoftDeleteAware.identifierOf(department, () -> department.getDepartmentId()),
                department != null ? department.getDepartmentName() : null,
                SoftDeleteAware.identifierOf(position, () -> position.getPositionId()),
                position != null ? position.getPositionName() : null,
                SoftDeleteAware.identifierOf(employmentType, () -> employmentType.getEmploymentTypeId()),
                employmentType != null ? employmentType.getEmploymentTypeName() : null,
                SoftDeleteAware.identifierOf(manager, () -> manager.getEmployeeId()),
                manager != null ? manager.getName() : null,
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
                employee.getBaseSalary(),
                employee.getProfileImage(),
                employee.isActive(),
                employee.getCreatedAt(),
                employee.getUpdatedAt()
        );
    }

    public static EmployeeResponse from(Employee employee, boolean includeSensitive) {
        EmployeeResponse response = from(employee);
        if (includeSensitive) {
            return response;
        }
        return new EmployeeResponse(
                response.employeeId(), response.employeeNo(), response.departmentId(), response.departmentName(),
                response.positionId(), response.positionName(), response.employmentTypeId(), response.employmentTypeName(),
                response.managerId(), response.managerName(), response.name(), response.birthDate(), response.phone(),
                response.email(), response.address(), response.hireDate(), response.resignationDate(),
                response.employeeStatusCode(), null, null, null, null, response.profileImage(),
                response.active(), response.createdAt(), response.updatedAt()
        );
    }
}
