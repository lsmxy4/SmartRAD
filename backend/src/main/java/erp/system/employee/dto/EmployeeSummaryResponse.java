package erp.system.employee.dto;

import erp.system.common.util.SoftDeleteAware;
import erp.system.department.entity.Department;
import erp.system.employee.entity.Employee;
import erp.system.position.entity.Position;

import java.time.LocalDate;

public record EmployeeSummaryResponse (
        Long employeeId,
        String employeeNo,
        String name,
        String departmentName,
        String positionName,
        String employeeStatusCode,
        String email,
        LocalDate hireDate,
        LocalDate resignationDate
){

    public static EmployeeSummaryResponse from(Employee employee) {
        Department department = SoftDeleteAware.resolve(employee.getDepartment(), Department::getDepartmentName);
        Position position = SoftDeleteAware.resolve(employee.getPosition(), Position::getPositionName);
        return new EmployeeSummaryResponse(
                employee.getEmployeeId(),
                employee.getEmployeeNo(),
                employee.getName(),
                department != null ? department.getDepartmentName() : null,
                position != null ? position.getPositionName() : null,
                employee.getEmployeeStatusCode(),
                employee.getEmail(),
                employee.getHireDate(),
                employee.getResignationDate()
        );
    }
}
