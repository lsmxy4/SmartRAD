package erp.system.leave.service;

import erp.system.auditlog.entity.AuditLog;
import erp.system.auditlog.service.AuditLogService;
import erp.system.common.exception.BusinessException;
import erp.system.common.exception.ErrorCode;
import erp.system.leave.dto.LeavePolicyCreateRequest;
import erp.system.leave.dto.LeavePolicyResponse;
import erp.system.leave.entity.LeavePolicy;
import erp.system.leave.repository.LeavePolicyRepository;
import erp.system.position.entity.Position;
import erp.system.position.repository.PositionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LeavePolicyService {

    private final LeavePolicyRepository leavePolicyRepository;
    private final PositionRepository positionRepository;
    private final AuditLogService auditLogService;

    public List<LeavePolicyResponse> getAll() {
        return leavePolicyRepository.findAll().stream()
                .map(LeavePolicyResponse::from)
                .toList();
    }

    @Transactional
    public LeavePolicyResponse create(LeavePolicyCreateRequest request, Long actorId) {
        Position position = positionRepository.findById(request.positionId())
                .orElseThrow(() -> new BusinessException(ErrorCode.POSITION_NOT_FOUND));

        LeavePolicy leavePolicy = LeavePolicy.builder()
                .position(position)
                .annualLeaveDays(request.annualLeaveDays())
                .maxCarryOverDays(request.maxCarryOverDays())
                .halfDayAllowed(request.halfDayAllowed())
                .note(request.note())
                .build();

        LeavePolicy saved = leavePolicyRepository.save(leavePolicy);
        auditLogService.log(
                actorId,
                AuditLog.ACTION_LEAVE_POLICY_CREATE,
                "휴가정책 등록: " + position.getPositionName() + " (연차 " + request.annualLeaveDays() + "일)",
                null
        );
        return LeavePolicyResponse.from(saved);
    }

    @Transactional
    public LeavePolicyResponse update(Long leavePolicyId, LeavePolicyCreateRequest request) {
        LeavePolicy leavePolicy = leavePolicyRepository.findById(leavePolicyId)
                .orElseThrow(() -> new BusinessException(ErrorCode.LEAVE_POLICY_NOT_FOUND));

        leavePolicy.update(
                request.annualLeaveDays(),
                request.maxCarryOverDays(),
                request.halfDayAllowed(),
                request.note()
        );

        return LeavePolicyResponse.from(leavePolicy);
    }

    @Transactional
    public void delete(Long leavePolicyId, Long actorId) {
        LeavePolicy leavePolicy = leavePolicyRepository.findById(leavePolicyId)
                .orElseThrow(() -> new BusinessException(ErrorCode.LEAVE_POLICY_NOT_FOUND));
        String description = "휴가정책 삭제: " + leavePolicy.getPosition().getPositionName();
        leavePolicyRepository.deleteById(leavePolicyId);
        auditLogService.log(actorId, AuditLog.ACTION_LEAVE_POLICY_DELETE, description, null);
    }
}
