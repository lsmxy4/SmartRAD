package erp.system.payroll.service;

import erp.system.payroll.entity.Payroll;
import erp.system.payroll.repository.PayrollRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

// 지급 실패 상태 전환은 이후 예외로 인해 호출부 트랜잭션이 롤백되더라도
// 반드시 커밋되어야 하므로 별도 트랜잭션(REQUIRES_NEW)으로 분리한다.
@Component
@RequiredArgsConstructor
public class PayrollFailureRecorder {

    private final PayrollRepository payrollRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void markFailed(Long payrollId) {
        payrollRepository.findById(payrollId).ifPresent(Payroll::markPayFailed);
    }
}
