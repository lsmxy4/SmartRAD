package erp.system.appointment.dto;

import erp.system.appointment.entity.EmployeeAppointment;
import erp.system.common.util.SoftDeleteAware;
import erp.system.department.entity.Department;
import erp.system.employee.entity.Employee;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record EmployeeAppointmentResponse(
        Long employeeAppointmentId,
        Long employeeId,
        String employeeName,
        String appointmentType,
        LocalDate appointmentDate,
        LocalDate effectiveDate,
        Long fromDepartmentId,
        String fromDepartmentName,
        Long toDepartmentId,
        String toDepartmentName,
        String fromPositionName,
        String toPositionName,
        String fromJobTitle,
        String toJobTitle,
        String reason,
        String memo,
        LocalDateTime createdAt
) {
    private static final String DELETED_EMPLOYEE_LABEL = "(삭제된 직원)";

    public static EmployeeAppointmentResponse from(EmployeeAppointment appointment) {
        Employee rawEmployee = appointment.getEmployee();
        Employee employee = SoftDeleteAware.resolve(rawEmployee, Employee::getName);
        Department fromDepartment = SoftDeleteAware.resolve(appointment.getFromDepartment(), Department::getDepartmentName);
        Department toDepartment = SoftDeleteAware.resolve(appointment.getToDepartment(), Department::getDepartmentName);

        return new EmployeeAppointmentResponse(
                appointment.getEmployeeAppointmentId(),
                SoftDeleteAware.identifierOf(rawEmployee, () -> rawEmployee.getEmployeeId()),
                employee != null ? employee.getName() : DELETED_EMPLOYEE_LABEL,
                appointment.getAppointmentType(),
                appointment.getAppointmentDate(),
                appointment.getEffectiveDate(),
                SoftDeleteAware.identifierOf(fromDepartment, () -> fromDepartment.getDepartmentId()),
                fromDepartment != null ? fromDepartment.getDepartmentName() : null,
                SoftDeleteAware.identifierOf(toDepartment, () -> toDepartment.getDepartmentId()),
                toDepartment != null ? toDepartment.getDepartmentName() : null,
                appointment.getFromPositionName(),
                appointment.getToPositionName(),
                appointment.getFromJobTitle(),
                appointment.getToJobTitle(),
                appointment.getReason(),
                appointment.getMemo(),
                appointment.getCreatedAt()
        );
    }
}
