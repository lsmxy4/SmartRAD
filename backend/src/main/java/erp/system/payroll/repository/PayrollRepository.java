package erp.system.payroll.repository;

import erp.system.payroll.entity.Payroll;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PayrollRepository extends JpaRepository<Payroll, Long>, JpaSpecificationExecutor<Payroll> {

    Optional<Payroll> findByEmployee_EmployeeIdAndPayrollYearMonth(Long employeeId, String payrollYearMonth);

    @Query("""
            SELECT p.payrollYearMonth, SUM(p.totalPayAmount), SUM(p.realPayAmount), COUNT(p)
            FROM Payroll p
            WHERE p.payrollYearMonth >= :fromYearMonth
            GROUP BY p.payrollYearMonth
            ORDER BY p.payrollYearMonth
            """)
    List<Object[]> sumByYearMonthFrom(@Param("fromYearMonth") String fromYearMonth);
}
