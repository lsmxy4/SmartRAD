package erp.system.leave.entity;

import erp.system.common.entity.CreatedAtEntity;
import erp.system.position.entity.Position;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Getter
@Entity
@Table(name = "leave_policy")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class LeavePolicy extends CreatedAtEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "leave_policy_id")
    private Long leavePolicyId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "position_id")
    private Position position;

    @Column(name = "annual_leave_days", precision = 4, scale = 1)
    private BigDecimal annualLeaveDays;

    @Column(name = "max_carry_over_days", precision = 4, scale = 1)
    private BigDecimal maxCarryOverDays;

    @Column(name = "half_day_allowed")
    private boolean halfDayAllowed;

    @Column(name = "note", length = 255)
    private String note;

    @Builder
    public LeavePolicy(Position position, BigDecimal annualLeaveDays, BigDecimal maxCarryOverDays, boolean halfDayAllowed, String note) {
        this.position = position;
        this.annualLeaveDays = annualLeaveDays;
        this.maxCarryOverDays = maxCarryOverDays;
        this.halfDayAllowed = halfDayAllowed;
        this.note = note;
    }

    public void update(BigDecimal annualLeaveDays, BigDecimal maxCarryOverDays, boolean halfDayAllowed, String note) {
        this.annualLeaveDays = annualLeaveDays;
        this.maxCarryOverDays = maxCarryOverDays;
        this.halfDayAllowed = halfDayAllowed;
        this.note = note;
    }
}
