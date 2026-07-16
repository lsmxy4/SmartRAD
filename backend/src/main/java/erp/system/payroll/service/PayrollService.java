package erp.system.payroll.service;

import erp.system.allowance.entity.EmployeeAllowance;
import erp.system.allowance.repository.EmployeeAllowanceRepository;
import erp.system.attendance.repository.AttendanceRepository;
import erp.system.common.exception.BusinessException;
import erp.system.common.exception.ErrorCode;
import erp.system.employee.entity.Employee;
import erp.system.employee.repository.EmployeeRepository;
import erp.system.payroll.dto.PayrollCalculateRequest;
import erp.system.payroll.dto.PayrollDetailedResponse;
import erp.system.payroll.dto.PayrollResponse;
import erp.system.payroll.entity.Payroll;
import erp.system.payroll.entity.PayrollDetail;
import erp.system.payroll.entity.PayrollItemMaster;
import erp.system.payroll.repository.PayrollDetailRepository;
import erp.system.payroll.repository.PayrollItemMasterRepository;
import erp.system.payroll.repository.PayrollRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PayrollService {

    private static final DateTimeFormatter YEAR_MONTH_KEY = DateTimeFormatter.ofPattern("yyyyMM");
    private static final BigDecimal STANDARD_MONTHLY_HOURS = BigDecimal.valueOf(209);
    private static final BigDecimal OVERTIME_MULTIPLIER = BigDecimal.valueOf(1.5);
    private static final BigDecimal MINUTES_PER_HOUR = BigDecimal.valueOf(60);

    private final PayrollRepository payrollRepository;
    private final PayrollDetailRepository payrollDetailRepository;
    private final PayrollItemMasterRepository payrollItemMasterRepository;
    private final EmployeeRepository employeeRepository;
    private final EmployeeAllowanceRepository employeeAllowanceRepository;
    private final AttendanceRepository attendanceRepository;

    public List<PayrollResponse> getList(Long employeeId, YearMonth payrollYearMonth) {
        return payrollRepository.findAll((root, query, cb) -> {
            var predicate = cb.conjunction();
            if (employeeId != null) {
                predicate = cb.and(predicate, cb.equal(root.get("employee").get("employeeId"), employeeId));
            }
            if (payrollYearMonth != null) {
                predicate = cb.and(predicate, cb.equal(root.get("payrollYearMonth"), payrollYearMonth.format(YEAR_MONTH_KEY)));
            }
            return predicate;
        }).stream().map(PayrollResponse::from).toList();
    }

    public PayrollDetailedResponse getDetail(Long payrollId) {
        Payroll payroll = findPayroll(payrollId);
        List<PayrollDetail> details = payrollDetailRepository.findAllByPayroll_PayrollId(payrollId);
        return PayrollDetailedResponse.of(payroll, details);
    }

    @Transactional
    public PayrollDetailedResponse calculate(PayrollCalculateRequest request) {
        Employee employee = employeeRepository.findById(request.employeeId())
                .orElseThrow(() -> new BusinessException(ErrorCode.EMPLOYEE_NOT_FOUND));

        return calculateForEmployee(employee, request.payrollYearMonth());
    }

    @Transactional
    public PayrollCalculateAllResult calculateAll(YearMonth payrollYearMonth) {
        List<Employee> employees = employeeRepository.findAll().stream()
                .filter(Employee::isActive)
                .toList();

        int calculated = 0;
        int skipped = 0;
        for (Employee employee : employees) {
            if (employee.getBaseSalary() == null) {
                skipped++;
                continue;
            }
            String yearMonthKey = payrollYearMonth.format(YEAR_MONTH_KEY);
            boolean alreadyPaid = payrollRepository.findByEmployee_EmployeeIdAndPayrollYearMonth(employee.getEmployeeId(), yearMonthKey)
                    .map(payroll -> Payroll.STATUS_PAID.equals(payroll.getPayrollStatusCode()))
                    .orElse(false);
            if (alreadyPaid) {
                skipped++;
                continue;
            }
            calculateForEmployee(employee, payrollYearMonth);
            calculated++;
        }

        return new PayrollCalculateAllResult(calculated, skipped);
    }

    private PayrollDetailedResponse calculateForEmployee(Employee employee, YearMonth payrollYearMonth) {
        if (employee.getBaseSalary() == null) {
            throw new BusinessException(ErrorCode.BASE_SALARY_NOT_SET);
        }

        String yearMonthKey = payrollYearMonth.format(YEAR_MONTH_KEY);
        Payroll payroll = payrollRepository.findByEmployee_EmployeeIdAndPayrollYearMonth(employee.getEmployeeId(), yearMonthKey)
                .orElseGet(() -> payrollRepository.save(
                        Payroll.builder().employee(employee).payrollYearMonth(yearMonthKey).build()
                ));

        if (Payroll.STATUS_PAID.equals(payroll.getPayrollStatusCode())) {
            throw new BusinessException(ErrorCode.ALREADY_PAID_PAYROLL);
        }

        payrollDetailRepository.deleteAllByPayroll_PayrollId(payroll.getPayrollId());

        List<PayrollDetail> details = new ArrayList<>();
        BigDecimal totalEarning = BigDecimal.ZERO;
        BigDecimal totalDeduction = BigDecimal.ZERO;

        // 기본급
        details.add(earningDetail(payroll, null, "기본급", employee.getBaseSalary()));
        totalEarning = totalEarning.add(employee.getBaseSalary());

        // 사원별 수당 (해당 월에 유효한 것만)
        for (EmployeeAllowance ea : employeeAllowanceRepository.findAllByEmployee_EmployeeId(employee.getEmployeeId())) {
            if (ea.appliesTo(payrollYearMonth)) {
                details.add(earningDetail(payroll, null, ea.getAllowance().getAllowanceName(), ea.getAmount()));
                totalEarning = totalEarning.add(ea.getAmount());
            }
        }

        // 근태 연동 초과근무수당
        BigDecimal overtimePay = calculateOvertimePay(employee, payrollYearMonth);
        if (overtimePay.compareTo(BigDecimal.ZERO) > 0) {
            details.add(earningDetail(payroll, null, "초과근무수당", overtimePay));
            totalEarning = totalEarning.add(overtimePay);
        }

        // 공제 항목 (마스터에 등록된 활성 공제 항목 전부 자동 적용)
        for (PayrollItemMaster item : payrollItemMasterRepository.findAllByItemTypeCodeAndActiveTrue(PayrollItemMaster.TYPE_DEDUCTION)) {
            BigDecimal amount = item.isFixed()
                    ? (item.getDefaultAmount() != null ? item.getDefaultAmount() : BigDecimal.ZERO)
                    : totalEarning.multiply(item.getRate() != null ? item.getRate() : BigDecimal.ZERO)
                            .setScale(0, RoundingMode.HALF_UP);

            details.add(PayrollDetail.builder()
                    .payroll(payroll)
                    .payrollItemMaster(item)
                    .itemNameSnapshot(item.getItemName())
                    .itemTypeCode(PayrollItemMaster.TYPE_DEDUCTION)
                    .amount(amount)
                    .build());
            totalDeduction = totalDeduction.add(amount);
        }

        payrollDetailRepository.saveAll(details);

        BigDecimal realPay = totalEarning.subtract(totalDeduction);
        payroll.applyCalculation(
                totalEarning, totalDeduction, realPay,
                employee.getName(),
                employee.getDepartment() != null ? employee.getDepartment().getDepartmentName() : null,
                employee.getPosition() != null ? employee.getPosition().getPositionName() : null
        );

        return PayrollDetailedResponse.of(payroll, details);
    }

    public record PayrollCalculateAllResult(int calculated, int skipped) {
    }

    @Transactional
    public PayrollResponse pay(Long payrollId) {
        Payroll payroll = findPayroll(payrollId);

        if (Payroll.STATUS_PAID.equals(payroll.getPayrollStatusCode())) {
            throw new BusinessException(ErrorCode.ALREADY_PAID_PAYROLL);
        }
        if (!Payroll.STATUS_CALCULATED.equals(payroll.getPayrollStatusCode())) {
            throw new BusinessException(ErrorCode.PAYROLL_NOT_CALCULATED);
        }

        payroll.pay(LocalDate.now());
        return PayrollResponse.from(payroll);
    }

    private BigDecimal calculateOvertimePay(Employee employee, YearMonth yearMonth) {
        LocalDate start = yearMonth.atDay(1);
        LocalDate end = yearMonth.atEndOfMonth();
        Integer overtimeMinutes = attendanceRepository.sumOvertimeMinutes(employee.getEmployeeId(), start, end);
        if (overtimeMinutes == null || overtimeMinutes == 0) {
            return BigDecimal.ZERO;
        }

        BigDecimal overtimeHours = BigDecimal.valueOf(overtimeMinutes).divide(MINUTES_PER_HOUR, 4, RoundingMode.HALF_UP);
        BigDecimal hourlyRate = employee.getBaseSalary().divide(STANDARD_MONTHLY_HOURS, 2, RoundingMode.HALF_UP);

        return hourlyRate.multiply(overtimeHours).multiply(OVERTIME_MULTIPLIER).setScale(0, RoundingMode.HALF_UP);
    }

    private PayrollDetail earningDetail(Payroll payroll, PayrollItemMaster item, String name, BigDecimal amount) {
        return PayrollDetail.builder()
                .payroll(payroll)
                .payrollItemMaster(item)
                .itemNameSnapshot(name)
                .itemTypeCode(PayrollItemMaster.TYPE_EARNING)
                .amount(amount)
                .build();
    }

    private Payroll findPayroll(Long payrollId) {
        return payrollRepository.findById(payrollId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PAYROLL_NOT_FOUND));
    }
}
