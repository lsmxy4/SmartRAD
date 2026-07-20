package erp.system.payroll.entity;

import erp.system.common.entity.BaseEntity;
import erp.system.common.exception.BusinessException;
import erp.system.common.exception.ErrorCode;
import erp.system.employee.entity.Employee;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.SQLRestriction;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Entity
@Table(name = "payroll")
@SQLRestriction("deleted=false")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Payroll extends BaseEntity {

    public static final String STATUS_CALCULATED = "CALCULATED";
    public static final String STATUS_CONFIRMED = "CONFIRMED";
    public static final String STATUS_EXCLUDED = "EXCLUDED";
    public static final String STATUS_HOLD = "HOLD";
    public static final String STATUS_FAILED = "FAILED";
    public static final String STATUS_PAID = "PAID";

    public static final String REVIEW_NORMAL = "NORMAL";
    public static final String REVIEW_NEEDS_REVIEW = "NEEDS_REVIEW";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "payroll_id")
    private Long payrollId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(name = "payroll_year_month", nullable = false, length = 6)
    private String payrollYearMonth;

    @Column(name = "payment_date")
    private LocalDate paymentDate;

    @Column(name = "total_pay_amount", precision = 15, scale = 2)
    private BigDecimal totalPayAmount;

    @Column(name = "total_deduction_amount", precision = 15, scale = 2)
    private BigDecimal totalDeductionAmount;

    @Column(name = "real_pay_amount", precision = 15, scale = 2)
    private BigDecimal realPayAmount;

    @Column(name = "payroll_status_code", nullable = false, length = 30)
    private String payrollStatusCode;

    @Column(name = "review_status_code", nullable = false, length = 30)
    private String reviewStatusCode = REVIEW_NORMAL;

    @Column(name = "employee_name_snapshot", length = 100)
    private String employeeNameSnapshot;

    @Column(name = "department_name_snapshot", length = 100)
    private String departmentNameSnapshot;

    @Column(name = "position_name_snapshot", length = 100)
    private String positionNameSnapshot;

    @Builder
    public Payroll(Employee employee, String payrollYearMonth) {
        this.employee = employee;
        this.payrollYearMonth = payrollYearMonth;
        this.payrollStatusCode = STATUS_CALCULATED;
    }

    public void applyCalculation(BigDecimal totalPayAmount, BigDecimal totalDeductionAmount, BigDecimal realPayAmount,
                                 String employeeNameSnapshot, String departmentNameSnapshot, String positionNameSnapshot,
                                 boolean needsReview) {
        this.totalPayAmount = totalPayAmount;
        this.totalDeductionAmount = totalDeductionAmount;
        this.realPayAmount = realPayAmount;
        this.employeeNameSnapshot = employeeNameSnapshot;
        this.departmentNameSnapshot = departmentNameSnapshot;
        this.positionNameSnapshot = positionNameSnapshot;
        this.payrollStatusCode = STATUS_CALCULATED;
        this.reviewStatusCode = needsReview ? REVIEW_NEEDS_REVIEW : REVIEW_NORMAL;
    }

    public void pay(LocalDate paymentDate) {
        if (STATUS_PAID.equals(this.payrollStatusCode)) {
            throw new BusinessException(ErrorCode.ALREADY_PAID_PAYROLL);
        }
        if (!STATUS_CALCULATED.equals(this.payrollStatusCode) && !STATUS_CONFIRMED.equals(this.payrollStatusCode)
                && !STATUS_HOLD.equals(this.payrollStatusCode) && !STATUS_FAILED.equals(this.payrollStatusCode)) {
            throw new BusinessException(ErrorCode.PAYROLL_NOT_CALCULATED);
        }
        this.paymentDate = paymentDate;
        this.payrollStatusCode = STATUS_PAID;
    }

    public void markPayFailed() {
        this.payrollStatusCode = STATUS_FAILED;
    }

    public void confirm() {
        if (!STATUS_CALCULATED.equals(this.payrollStatusCode)) {
            throw new BusinessException(ErrorCode.PAYROLL_INVALID_STATUS);
        }
        this.payrollStatusCode = STATUS_CONFIRMED;
    }

    public void exclude() {
        if (STATUS_PAID.equals(this.payrollStatusCode)) {
            throw new BusinessException(ErrorCode.ALREADY_PAID_PAYROLL);
        }
        this.payrollStatusCode = STATUS_EXCLUDED;
    }

    public void hold() {
        if (STATUS_PAID.equals(this.payrollStatusCode)) {
            throw new BusinessException(ErrorCode.ALREADY_PAID_PAYROLL);
        }
        this.payrollStatusCode = STATUS_HOLD;
    }

    public void completeReview() {
        this.reviewStatusCode = REVIEW_NORMAL;
    }
}
