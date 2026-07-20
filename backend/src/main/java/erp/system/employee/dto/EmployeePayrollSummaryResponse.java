package erp.system.employee.dto;

import erp.system.common.util.SoftDeleteAware;
import erp.system.department.entity.Department;
import erp.system.employee.entity.Employee;
import erp.system.employmenttype.entity.EmploymentType;
import erp.system.position.entity.Position;

import java.math.BigDecimal;
import java.time.LocalDateTime;

// 급여 기본정보관리 화면 전용 목록 응답. 직원 수만큼 상세 API를 반복 호출하지 않도록
// 급여 관련 필드까지 한 번에 담아 반환한다.
public record EmployeePayrollSummaryResponse(
        Long employeeId,
        String employeeNo,
        String name,
        String departmentName,
        String positionName,
        String employmentTypeName,
        String employeeStatusCode,
        String bankName,
        String accountNumber,
        String accountHolder,
        BigDecimal baseSalary,
        LocalDateTime updatedAt
) {
    public static EmployeePayrollSummaryResponse from(Employee employee) {
        Department department = SoftDeleteAware.resolve(employee.getDepartment(), Department::getDepartmentName);
        Position position = SoftDeleteAware.resolve(employee.getPosition(), Position::getPositionName);
        EmploymentType employmentType = SoftDeleteAware.resolve(employee.getEmploymentType(), EmploymentType::getEmploymentTypeName);

        return new EmployeePayrollSummaryResponse(
                employee.getEmployeeId(),
                employee.getEmployeeNo(),
                employee.getName(),
                department != null ? department.getDepartmentName() : null,
                position != null ? position.getPositionName() : null,
                employmentType != null ? employmentType.getEmploymentTypeName() : null,
                employee.getEmployeeStatusCode(),
                employee.getBankName(),
                employee.getAccountNumber(),
                employee.getAccountHolder(),
                employee.getBaseSalary(),
                employee.getUpdatedAt()
        );
    }
}
