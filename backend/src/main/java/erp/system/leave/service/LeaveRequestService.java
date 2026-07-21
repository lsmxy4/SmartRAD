package erp.system.leave.service;

import erp.system.common.exception.BusinessException;
import erp.system.common.exception.ErrorCode;
import erp.system.employee.entity.Employee;
import erp.system.employee.repository.EmployeeRepository;
import erp.system.leave.dto.LeaveRequestBulkApproveResult;
import erp.system.leave.dto.LeaveRequestCreateRequest;
import erp.system.leave.dto.LeaveRequestResponse;
import erp.system.leave.dto.LeaveRequestSummaryResponse;
import erp.system.leave.dto.MyLeaveRequestCreateRequest;
import erp.system.leave.entity.EmployeeLeaveBalance;
import erp.system.leave.entity.LeaveRequest;
import erp.system.leave.entity.LeaveType;
import erp.system.leave.repository.EmployeeLeaveBalanceRepository;
import erp.system.leave.repository.LeaveRequestRepository;
import erp.system.leave.repository.LeaveTypeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LeaveRequestService {

    private final LeaveRequestRepository leaveRequestRepository;
    private final EmployeeRepository employeeRepository;
    private final LeaveTypeRepository leaveTypeRepository;
    private final EmployeeLeaveBalanceRepository employeeLeaveBalanceRepository;

    public List<LeaveRequestResponse> getMyRequests(Long employeeId) {
        return leaveRequestRepository.findAllByEmployee_EmployeeIdOrderByCreatedAtDesc(employeeId).stream()
                .map(LeaveRequestResponse::from)
                .toList();
    }

    @Transactional
    public LeaveRequestResponse createMyRequest(Long employeeId, MyLeaveRequestCreateRequest request) {
        return createForEmployee(employeeId, request.leaveTypeId(), request.startDate(), request.endDate(), request.reason());
    }

    public List<LeaveRequestResponse> getList(Long employeeId, String status) {
        return leaveRequestRepository.findAll((root, query, cb) -> {
            var predicates = cb.conjunction();
            if (employeeId != null) {
                predicates = cb.and(predicates, cb.equal(root.get("employee").get("employeeId"), employeeId));
            }
            if (StringUtils.hasText(status)) {
                predicates = cb.and(predicates, cb.equal(root.get("status"), status));
            }
            return predicates;
        }).stream().map(LeaveRequestResponse::from).toList();
    }

    public Page<LeaveRequestResponse> getPagedList(LocalDate startDate, LocalDate endDate, Long leaveTypeId,
                                                     String status, String keyword, Long departmentId, Pageable pageable) {
        Specification<LeaveRequest> spec = buildSpecification(startDate, endDate, leaveTypeId, status, keyword, departmentId);
        return leaveRequestRepository.findAll(spec, pageable).map(LeaveRequestResponse::from);
    }

    public LeaveRequestSummaryResponse getSummary(LocalDate startDate, LocalDate endDate, Long leaveTypeId,
                                                    String keyword, Long departmentId) {
        Specification<LeaveRequest> base = buildSpecification(startDate, endDate, leaveTypeId, null, keyword, departmentId);
        long total = leaveRequestRepository.count(base);
        long pending = leaveRequestRepository.count(base.and(statusEquals(LeaveRequest.STATUS_PENDING)));
        long approved = leaveRequestRepository.count(base.and(statusEquals(LeaveRequest.STATUS_APPROVED)));
        long rejected = leaveRequestRepository.count(base.and(statusEquals(LeaveRequest.STATUS_REJECTED)));
        return new LeaveRequestSummaryResponse(total, pending, approved, rejected);
    }

    public LeaveRequestResponse getById(Long leaveRequestId) {
        return LeaveRequestResponse.from(findById(leaveRequestId));
    }

    @Transactional
    public LeaveRequestResponse create(LeaveRequestCreateRequest request) {
        return createForEmployee(request.employeeId(), request.leaveTypeId(), request.startDate(), request.endDate(), request.reason());
    }

    private LeaveRequestResponse createForEmployee(Long employeeId, Long leaveTypeId, LocalDate startDate,
                                                    LocalDate endDate, String reason) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new BusinessException(ErrorCode.EMPLOYEE_NOT_FOUND));
        LeaveType leaveType = leaveTypeRepository.findById(leaveTypeId)
                .orElseThrow(() -> new BusinessException(ErrorCode.LEAVE_TYPE_NOT_FOUND));

        if (!leaveRequestRepository.findOverlapping(employeeId, startDate, endDate).isEmpty()) {
            throw new BusinessException(ErrorCode.DUPLICATE_LEAVE_REQUEST_PERIOD);
        }

        BigDecimal leaveDays = BigDecimal.valueOf(
                ChronoUnit.DAYS.between(startDate, endDate) + 1
        );

        LeaveRequest leaveRequest = LeaveRequest.builder()
                .employee(employee)
                .leaveType(leaveType)
                .startDate(startDate)
                .endDate(endDate)
                .leaveDays(leaveDays)
                .reason(reason)
                .build();

        return LeaveRequestResponse.from(leaveRequestRepository.save(leaveRequest));
    }

    @Transactional
    public LeaveRequestResponse approve(Long leaveRequestId, Long approverId) {
        LeaveRequest leaveRequest = findById(leaveRequestId);
        Employee approver = employeeRepository.findById(approverId)
                .orElseThrow(() -> new BusinessException(ErrorCode.EMPLOYEE_NOT_FOUND));

        EmployeeLeaveBalance balance = employeeLeaveBalanceRepository
                .findByEmployee_EmployeeIdAndLeaveType_LeaveTypeId(
                        leaveRequest.getEmployee().getEmployeeId(),
                        leaveRequest.getLeaveType().getLeaveTypeId()
                )
                .orElseThrow(() -> new BusinessException(ErrorCode.LEAVE_BALANCE_NOT_FOUND));

        balance.use(leaveRequest.getLeaveDays());
        leaveRequest.approve(approver);

        return LeaveRequestResponse.from(leaveRequest);
    }

    @Transactional
    public LeaveRequestResponse reject(Long leaveRequestId, Long approverId, String rejectionReason) {
        LeaveRequest leaveRequest = findById(leaveRequestId);
        Employee approver = employeeRepository.findById(approverId)
                .orElseThrow(() -> new BusinessException(ErrorCode.EMPLOYEE_NOT_FOUND));

        leaveRequest.reject(approver, rejectionReason);

        return LeaveRequestResponse.from(leaveRequest);
    }

    @Transactional
    public List<LeaveRequestBulkApproveResult> bulkApprove(List<Long> leaveRequestIds, Long approverId) {
        return leaveRequestIds.stream()
                .map(id -> {
                    try {
                        approve(id, approverId);
                        return new LeaveRequestBulkApproveResult(id, true, null);
                    } catch (BusinessException e) {
                        return new LeaveRequestBulkApproveResult(id, false, e.getMessage());
                    }
                })
                .toList();
    }

    private Specification<LeaveRequest> buildSpecification(LocalDate startDate, LocalDate endDate, Long leaveTypeId,
                                                             String status, String keyword, Long departmentId) {
        return (root, query, cb) -> {
            var predicate = cb.conjunction();
            if (startDate != null) {
                predicate = cb.and(predicate, cb.greaterThanOrEqualTo(root.get("createdAt"), startDate.atStartOfDay()));
            }
            if (endDate != null) {
                predicate = cb.and(predicate, cb.lessThan(root.get("createdAt"), endDate.plusDays(1).atStartOfDay()));
            }
            if (leaveTypeId != null) {
                predicate = cb.and(predicate, cb.equal(root.get("leaveType").get("leaveTypeId"), leaveTypeId));
            }
            if (StringUtils.hasText(status)) {
                predicate = cb.and(predicate, cb.equal(root.get("status"), status));
            }
            if (departmentId != null) {
                predicate = cb.and(predicate, cb.equal(root.get("employee").get("department").get("departmentId"), departmentId));
            }
            if (StringUtils.hasText(keyword)) {
                String pattern = "%" + keyword + "%";
                predicate = cb.and(predicate, cb.or(
                        cb.like(root.get("employee").get("name"), pattern),
                        cb.like(root.get("employee").get("employeeNo"), pattern),
                        cb.like(root.get("employee").get("department").get("departmentName"), pattern)
                ));
            }
            return predicate;
        };
    }

    private Specification<LeaveRequest> statusEquals(String status) {
        return (root, query, cb) -> cb.equal(root.get("status"), status);
    }

    private LeaveRequest findById(Long leaveRequestId) {
        return leaveRequestRepository.findById(leaveRequestId)
                .orElseThrow(() -> new BusinessException(ErrorCode.LEAVE_REQUEST_NOT_FOUND));
    }
}
