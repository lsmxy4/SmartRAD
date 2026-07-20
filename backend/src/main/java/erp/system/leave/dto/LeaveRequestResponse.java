package erp.system.leave.dto;

import erp.system.common.util.SoftDeleteAware;
import erp.system.department.entity.Department;
import erp.system.employee.entity.Employee;
import erp.system.leave.entity.LeaveRequest;
import erp.system.position.entity.Position;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record LeaveRequestResponse(
        Long leaveRequestId,
        Long employeeId,
        String employeeName,
        String employeeNo,
        Long departmentId,
        String departmentName,
        String positionName,
        String email,
        Long leaveTypeId,
        String leaveTypeName,
        LocalDate startDate,
        LocalDate endDate,
        BigDecimal leaveDays,
        String reason,
        String status,
        Long approverId,
        String approverName,
        String rejectionReason,
        LocalDateTime processedAt,
        LocalDateTime createdAt
) {
    private static final String DELETED_EMPLOYEE_LABEL = "(삭제된 직원)";

    public static LeaveRequestResponse from(LeaveRequest leaveRequest) {
        Employee rawEmployee = leaveRequest.getEmployee();
        Employee rawApprover = leaveRequest.getApprover();
        Employee employee = SoftDeleteAware.resolve(rawEmployee, Employee::getName);
        Employee approver = SoftDeleteAware.resolve(rawApprover, Employee::getName);
        Department department = employee != null
                ? SoftDeleteAware.resolve(employee.getDepartment(), Department::getDepartmentName) : null;
        Position position = employee != null
                ? SoftDeleteAware.resolve(employee.getPosition(), Position::getPositionName) : null;

        return new LeaveRequestResponse(
                leaveRequest.getLeaveRequestId(),
                SoftDeleteAware.identifierOf(rawEmployee, () -> rawEmployee.getEmployeeId()),
                employee != null ? employee.getName() : DELETED_EMPLOYEE_LABEL,
                employee != null ? employee.getEmployeeNo() : null,
                SoftDeleteAware.identifierOf(department, () -> department.getDepartmentId()),
                department != null ? department.getDepartmentName() : null,
                position != null ? position.getPositionName() : null,
                employee != null ? employee.getEmail() : null,
                leaveRequest.getLeaveType().getLeaveTypeId(),
                leaveRequest.getLeaveType().getLeaveTypeName(),
                leaveRequest.getStartDate(),
                leaveRequest.getEndDate(),
                leaveRequest.getLeaveDays(),
                leaveRequest.getReason(),
                leaveRequest.getStatus(),
                rawApprover != null ? SoftDeleteAware.identifierOf(rawApprover, () -> rawApprover.getEmployeeId()) : null,
                rawApprover != null ? (approver != null ? approver.getName() : DELETED_EMPLOYEE_LABEL) : null,
                leaveRequest.getRejectionReason(),
                leaveRequest.getProcessedAt(),
                leaveRequest.getCreatedAt()
        );
    }
}
