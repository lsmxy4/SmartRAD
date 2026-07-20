package erp.system.leave.dto;

import erp.system.common.util.SoftDeleteAware;
import erp.system.leave.entity.LeavePolicy;
import erp.system.position.entity.Position;

import java.math.BigDecimal;

public record LeavePolicyResponse(
        Long leavePolicyId,
        Long positionId,
        String positionName,
        BigDecimal annualLeaveDays,
        BigDecimal maxCarryOverDays,
        boolean halfDayAllowed,
        String note
) {
    public static LeavePolicyResponse from(LeavePolicy leavePolicy) {
        Position position = SoftDeleteAware.resolve(leavePolicy.getPosition(), Position::getPositionName);

        return new LeavePolicyResponse(
                leavePolicy.getLeavePolicyId(),
                SoftDeleteAware.identifierOf(position, () -> position.getPositionId()),
                position != null ? position.getPositionName() : null,
                leavePolicy.getAnnualLeaveDays(),
                leavePolicy.getMaxCarryOverDays(),
                leavePolicy.isHalfDayAllowed(),
                leavePolicy.getNote()
        );
    }
}
