package erp.system.attendance.dto;

import erp.system.attendance.entity.Attendance;
import erp.system.common.util.SoftDeleteAware;
import erp.system.employee.entity.Employee;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record AttendanceResponse(
        Long attendanceId,
        Long employeeId,
        String employeeName,
        LocalDate workDate,
        LocalDateTime checkInTime,
        LocalDateTime checkOutTime,
        Integer workMinutes,
        Integer overtimeMinutes,
        Integer nightWorkMinutes,
        Integer lateMinutes,
        Integer earlyLeaveMinutes,
        String attendanceStatusCode
) {
    private static final String DELETED_EMPLOYEE_LABEL = "(삭제된 직원)";

    public static AttendanceResponse from(Attendance attendance) {
        Employee rawEmployee = attendance.getEmployee();
        Employee employee = SoftDeleteAware.resolve(rawEmployee, Employee::getName);

        return new AttendanceResponse(
                attendance.getAttendanceId(),
                SoftDeleteAware.identifierOf(rawEmployee, () -> rawEmployee.getEmployeeId()),
                employee != null ? employee.getName() : DELETED_EMPLOYEE_LABEL,
                attendance.getWorkDate(),
                attendance.getCheckInTime(),
                attendance.getCheckOutTime(),
                attendance.getWorkMinutes(),
                attendance.getOvertimeMinutes(),
                attendance.getNightWorkMinutes(),
                attendance.getLateMinutes(),
                attendance.getEarlyLeaveMinutes(),
                attendance.getAttendanceStatusCode()
        );
    }
}
