package erp.system.eventsupport.dto;

import erp.system.common.util.SoftDeleteAware;
import erp.system.department.entity.Department;
import erp.system.employee.entity.Employee;
import erp.system.eventsupport.entity.EventSupport;
import erp.system.position.entity.Position;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record EventSupportResponse(
        Long eventSupportId,
        Long employeeId,
        String employeeName,
        String employeeNo,
        String departmentName,
        String positionName,
        String eventType,
        LocalDate eventDate,
        BigDecimal requestAmount,
        String reason,
        String attachmentUrl,
        String attachmentName,
        String status,
        Long approverId,
        String approverName,
        String rejectionReason,
        LocalDateTime processedAt,
        LocalDate paidAt,
        LocalDateTime createdAt
) {
    private static final String DELETED_EMPLOYEE_LABEL = "(삭제된 직원)";

    public static EventSupportResponse from(EventSupport eventSupport) {
        Employee rawEmployee = eventSupport.getEmployee();
        Employee rawApprover = eventSupport.getApprover();
        Employee employee = SoftDeleteAware.resolve(rawEmployee, Employee::getName);
        Employee approver = SoftDeleteAware.resolve(rawApprover, Employee::getName);
        Department department = employee != null
                ? SoftDeleteAware.resolve(employee.getDepartment(), Department::getDepartmentName) : null;
        Position position = employee != null
                ? SoftDeleteAware.resolve(employee.getPosition(), Position::getPositionName) : null;

        return new EventSupportResponse(
                eventSupport.getEventSupportId(),
                SoftDeleteAware.identifierOf(rawEmployee, () -> rawEmployee.getEmployeeId()),
                employee != null ? employee.getName() : DELETED_EMPLOYEE_LABEL,
                employee != null ? employee.getEmployeeNo() : null,
                department != null ? department.getDepartmentName() : null,
                position != null ? position.getPositionName() : null,
                eventSupport.getEventType(),
                eventSupport.getEventDate(),
                eventSupport.getRequestAmount(),
                eventSupport.getReason(),
                eventSupport.getAttachmentUrl(),
                eventSupport.getAttachmentName(),
                eventSupport.getStatus(),
                rawApprover != null ? SoftDeleteAware.identifierOf(rawApprover, () -> rawApprover.getEmployeeId()) : null,
                rawApprover != null ? (approver != null ? approver.getName() : DELETED_EMPLOYEE_LABEL) : null,
                eventSupport.getRejectionReason(),
                eventSupport.getProcessedAt(),
                eventSupport.getPaidAt(),
                eventSupport.getCreatedAt()
        );
    }
}
