package erp.system.attendance.repository;

import erp.system.attendance.dto.AttendanceMonthlySummaryResponse;
import erp.system.attendance.entity.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface AttendanceRepository extends JpaRepository<Attendance, Long> {

    Optional<Attendance> findByEmployee_EmployeeIdAndWorkDate(Long employeeId, LocalDate workDate);

    long countByEmployee_EmployeeIdAndWorkDateBetween(Long employeeId, LocalDate start, LocalDate end);

    List<Attendance> findAllByWorkDateOrderByEmployee_EmployeeIdAsc(LocalDate workDate);

    List<Attendance> findAllByEmployee_EmployeeIdAndWorkDateBetweenOrderByWorkDateAsc(Long employeeId, LocalDate start, LocalDate end);

    @Query("""
            SELECT new erp.system.attendance.dto.AttendanceMonthlySummaryResponse(
                a.employee.employeeId, a.employee.name,
                COALESCE(SUM(a.workMinutes), 0), COALESCE(SUM(a.overtimeMinutes), 0), COUNT(a)
            )
            FROM Attendance a
            WHERE a.workDate BETWEEN :start AND :end
            GROUP BY a.employee.employeeId, a.employee.name
            ORDER BY a.employee.employeeId
            """)
    List<AttendanceMonthlySummaryResponse> summarizeMonthly(@Param("start") LocalDate start, @Param("end") LocalDate end);

    @Query("""
            SELECT COALESCE(SUM(a.overtimeMinutes), 0)
            FROM Attendance a
            WHERE a.employee.employeeId = :employeeId AND a.workDate BETWEEN :start AND :end
            """)
    Integer sumOvertimeMinutes(@Param("employeeId") Long employeeId, @Param("start") LocalDate start, @Param("end") LocalDate end);
}
