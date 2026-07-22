package erp.system.eventsupport.entity;

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
@Table(name = "event_support")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class EventSupport extends CreatedAtEntity {

    public static final String TYPE_SELF_MARRIAGE = "SELF_MARRIAGE";
    public static final String TYPE_CHILD_BIRTH = "CHILD_BIRTH";
    public static final String TYPE_CHILD_MARRIAGE = "CHILD_MARRIAGE";
    public static final String TYPE_PARENT_DEATH = "PARENT_DEATH";
    public static final String TYPE_SPOUSE_DEATH = "SPOUSE_DEATH";
    public static final String TYPE_CHILD_DEATH = "CHILD_DEATH";
    public static final String TYPE_OTHER = "OTHER";

    public static final String STATUS_PENDING = "PENDING";
    public static final String STATUS_APPROVED = "APPROVED";
    public static final String STATUS_REJECTED = "REJECTED";
    public static final String STATUS_PAID = "PAID";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "event_support_id")
    private Long eventSupportId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(name = "event_type", nullable = false, length = 30)
    private String eventType;

    @Column(name = "event_date", nullable = false)
    private LocalDate eventDate;

    @Column(name = "request_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal requestAmount;

    @Column(name = "reason", length = 500)
    private String reason;

    @Column(name = "attachment_url", length = 300)
    private String attachmentUrl;

    @Column(name = "attachment_name", length = 200)
    private String attachmentName;

    @Column(name = "status", nullable = false, length = 30)
    private String status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approver_id")
    private Employee approver;

    @Column(name = "rejection_reason", length = 500)
    private String rejectionReason;

    @Column(name = "processed_at")
    private LocalDateTime processedAt;

    @Column(name = "paid_at")
    private LocalDate paidAt;

    @Builder
    public EventSupport(Employee employee, String eventType, LocalDate eventDate, BigDecimal requestAmount,
                         String reason, String attachmentUrl, String attachmentName) {
        this.employee = employee;
        this.eventType = eventType;
        this.eventDate = eventDate;
        this.requestAmount = requestAmount;
        this.reason = reason;
        this.attachmentUrl = attachmentUrl;
        this.attachmentName = attachmentName;
        this.status = STATUS_PENDING;
    }

    public void approve(Employee approver) {
        validateStatus(STATUS_PENDING);
        this.status = STATUS_APPROVED;
        this.approver = approver;
        this.processedAt = LocalDateTime.now();
    }

    public void reject(Employee approver, String rejectionReason) {
        validateStatus(STATUS_PENDING);
        this.status = STATUS_REJECTED;
        this.approver = approver;
        this.rejectionReason = rejectionReason;
        this.processedAt = LocalDateTime.now();
    }

    public void pay(LocalDate paidAt) {
        validateStatus(STATUS_APPROVED);
        this.status = STATUS_PAID;
        this.paidAt = paidAt;
    }

    private void validateStatus(String expected) {
        if (!expected.equals(this.status)) {
            throw new BusinessException(ErrorCode.INVALID_EVENT_SUPPORT_STATUS);
        }
    }
}
