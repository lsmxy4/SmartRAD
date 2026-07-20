package erp.system.leave.entity;

import erp.system.common.entity.CreatedAtEntity;
import erp.system.common.exception.BusinessException;
import erp.system.common.exception.ErrorCode;
import erp.system.employee.entity.Employee;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Entity
@Table(name = "leave_request")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class LeaveRequest extends CreatedAtEntity {

    public static final String STATUS_PENDING = "PENDING";
    public static final String STATUS_APPROVED = "APPROVED";
    public static final String STATUS_REJECTED = "REJECTED";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "leave_request_id")
    private Long leaveRequestId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "leave_type_id", nullable = false)
    private LeaveType leaveType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(name = "leave_days", nullable = false, precision = 4, scale = 1)
    private BigDecimal leaveDays;

    @Column(name = "reason", length = 500)
    private String reason;

    @Column(name = "status", nullable = false, length = 30)
    private String status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approver_id")
    private Employee approver;

    @Column(name = "rejection_reason", length = 500)
    private String rejectionReason;

    @Column(name = "processed_at")
    private LocalDateTime processedAt;

    @Builder
    public LeaveRequest(LeaveType leaveType, Employee employee, LocalDate startDate, LocalDate endDate, BigDecimal leaveDays, String reason) {
        this.leaveType = leaveType;
        this.employee = employee;
        this.startDate = startDate;
        this.endDate = endDate;
        this.leaveDays = leaveDays;
        this.reason = reason;
        this.status = STATUS_PENDING;
    }

    public void approve(Employee approver) {
        validatePending();
        this.status = STATUS_APPROVED;
        this.approver = approver;
        this.processedAt = LocalDateTime.now();
    }

    public void reject(Employee approver, String rejectionReason) {
        validatePending();
        this.status = STATUS_REJECTED;
        this.approver = approver;
        this.rejectionReason = rejectionReason;
        this.processedAt = LocalDateTime.now();
    }

    private void validatePending() {
        if (!STATUS_PENDING.equals(this.status)) {
            throw new BusinessException(ErrorCode.INVALID_LEAVE_REQUEST_STATUS);
        }
    }
}
