package erp.system.employee.service;

import erp.system.allowance.entity.Allowance;
import erp.system.allowance.entity.EmployeeAllowance;
import erp.system.allowance.repository.EmployeeAllowanceRepository;
import erp.system.auditlog.entity.AuditLog;
import erp.system.auditlog.service.AuditLogService;
import erp.system.common.exception.BusinessException;
import erp.system.common.exception.ErrorCode;
import erp.system.common.file.FileStorageService;
import erp.system.common.util.SoftDeleteAware;
import erp.system.department.entity.Department;
import erp.system.department.repository.DepartmentRepository;
import erp.system.employee.dto.EmployeeBaseSalaryUpdateRequest;
import erp.system.employee.dto.EmployeeBulkCreateResult;
import erp.system.employee.dto.EmployeeBulkEmploymentTypeRequest;
import erp.system.employee.dto.EmployeeBulkPayrollBasicRequest;
import erp.system.employee.dto.EmployeeBulkResult;
import erp.system.employee.dto.EmployeeCreateRequest;
import erp.system.employee.dto.EmployeePayrollSummaryResponse;
import erp.system.employee.dto.EmployeeResponse;
import erp.system.employee.dto.EmployeeSummaryResponse;
import erp.system.employee.dto.EmployeeUpdateRequest;
import erp.system.employee.entity.Employee;
import erp.system.employee.repository.EmployeeRepository;
import erp.system.employmenttype.entity.EmploymentType;
import erp.system.employmenttype.repository.EmploymentTypeRepository;
import erp.system.leave.service.EmployeeLeaveBalanceService;
import erp.system.leave.service.LeaveRequestService;
import erp.system.notification.entity.Notification;
import erp.system.notification.service.NotificationService;
import erp.system.position.entity.Position;
import erp.system.position.repository.PositionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.Year;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EmployeeService {
    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;
    private final PositionRepository positionRepository;
    private final EmploymentTypeRepository employmentTypeRepository;
    private final EmployeeAllowanceRepository employeeAllowanceRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmployeeLeaveBalanceService employeeLeaveBalanceService;
    private final LeaveRequestService leaveRequestService;
    private final NotificationService notificationService;
    private final AuditLogService auditLogService;
    private final FileStorageService fileStorageService;

    private static String employeeStatusLabel(String status) {
        if (status == null) return "-";
        return switch (status) {
            case "ACTIVE" -> "재직중";
            case "LEAVE" -> "휴직중";
            case Employee.STATUS_RESIGNED -> "퇴사";
            default -> status;
        };
    }

    public EmployeeResponse getById(Long employeeId, Long requesterId, boolean requesterIsAdmin) {
        boolean includeSensitive = requesterIsAdmin || employeeId.equals(requesterId);
        return EmployeeResponse.from(findActive(employeeId), includeSensitive);
    }

    public Page<EmployeeSummaryResponse> getList(String keyword, Long departmentId, String status, Pageable pageable) {
        Specification<Employee> spec = (root, query, cb) -> {
            var predicate = cb.conjunction();
            if (StringUtils.hasText(keyword)) {
                String pattern = "%" + keyword + "%";
                predicate = cb.and(predicate, cb.or(
                        cb.like(root.get("name"), pattern),
                        cb.like(root.get("employeeNo"), pattern),
                        cb.like(root.get("email"), pattern)
                ));
            }
            if (departmentId != null) {
                predicate = cb.and(predicate, cb.equal(root.get("department").get("departmentId"), departmentId));
            }
            if (StringUtils.hasText(status)) {
                predicate = cb.and(predicate, cb.equal(root.get("employeeStatusCode"), status));
            }
            return predicate;
        };

        return employeeRepository.findAll(spec, pageable).map(EmployeeSummaryResponse::from);
    }

    public List<EmployeePayrollSummaryResponse> getPayrollSummaryList() {
        Map<Long, BigDecimal> fixedAllowanceByEmployee = employeeAllowanceRepository.findAll().stream()
                .filter(ea -> {
                    Allowance allowance = SoftDeleteAware.resolve(ea.getAllowance(), Allowance::getAllowanceName);
                    return allowance != null && allowance.isFixed();
                })
                .collect(Collectors.groupingBy(
                        ea -> SoftDeleteAware.identifierOf(ea.getEmployee(), () -> ea.getEmployee().getEmployeeId()),
                        Collectors.reducing(BigDecimal.ZERO, EmployeeAllowance::getAmount, BigDecimal::add)
                ));

        return employeeRepository.findAll().stream()
                .map(employee -> EmployeePayrollSummaryResponse.from(
                        employee,
                        fixedAllowanceByEmployee.getOrDefault(employee.getEmployeeId(), BigDecimal.ZERO)
                ))
                .toList();
    }

    @Transactional
    public EmployeeResponse create(EmployeeCreateRequest request, Long actorId){
        Employee savedEmployee = createInternal(request);

        auditLogService.log(
                actorId,
                AuditLog.ACTION_EMPLOYEE_CREATE,
                "직원 등록: " + savedEmployee.getName() + "(" + savedEmployee.getEmployeeNo() + ")",
                null
        );

        return EmployeeResponse.from(savedEmployee);
    }

    @Transactional
    public List<EmployeeBulkCreateResult> bulkCreate(List<EmployeeCreateRequest> items, Long actorId) {
        List<EmployeeBulkCreateResult> results = new ArrayList<>();
        int successCount = 0;

        for (int i = 0; i < items.size(); i++) {
            EmployeeCreateRequest item = items.get(i);
            try {
                Employee savedEmployee = createInternal(item);
                results.add(new EmployeeBulkCreateResult(i, item.name(), true, savedEmployee.getEmployeeNo(), null));
                successCount++;
            } catch (BusinessException e) {
                results.add(new EmployeeBulkCreateResult(i, item.name(), false, null, e.getMessage()));
            } catch (Exception e) {
                results.add(new EmployeeBulkCreateResult(i, item.name(), false, null, "등록 중 오류가 발생했습니다."));
            }
        }

        auditLogService.log(
                actorId,
                AuditLog.ACTION_EMPLOYEE_BULK_CREATE,
                "직원 일괄등록: 총 " + items.size() + "명 중 " + successCount + "명 성공",
                null
        );

        return results;
    }

    private Employee createInternal(EmployeeCreateRequest request) {
        String employeeNo = StringUtils.hasText(request.employeeNo()) ? request.employeeNo() : generateEmployeeNo();
        if(employeeRepository.existsByEmployeeNo(employeeNo)){
            throw new BusinessException(ErrorCode.DUPLICATE_EMPLOYEE_NO);
        }
        if (request.email() != null && employeeRepository.existsByEmail(request.email())) {
            throw new BusinessException(ErrorCode.DUPLICATE_EMAIL);
        }
        Employee employee = Employee.builder()
                .employeeNo(employeeNo)
                .department(resolveDepartment(request.departmentId()))
                .position(resolvePosition(request.positionId()))
                .employmentType(resolveEmploymentType(request.employmentTypeId()))
                .manager(resolveManager(request.managerId()))
                .name(request.name())
                .birthDate(request.birthDate())
                .phone(request.phone())
                .email(request.email())
                .address(request.address())
                .hireDate(request.hireDate())
                .employeeStatusCode(request.employeeStatusCode())
                .bankName(request.bankName())
                .accountNumber(request.accountNumber())
                .accountHolder(request.accountHolder())
                .password(passwordEncoder.encode(request.password()))
                .profileImage(request.profileImage())
                .build();

        Employee savedEmployee = employeeRepository.save(employee);
        employeeLeaveBalanceService.grantDefaultAnnualLeave(savedEmployee);
        return savedEmployee;
    }

    @Transactional
    public EmployeeResponse update(Long employeeId, EmployeeUpdateRequest request, Long actorId, boolean actorIsAdmin) {
        Employee employee = findActive(employeeId);
        String previousStatus = employee.getEmployeeStatusCode();
        String previousProfileImage = employee.getProfileImage();

        employee.update(
                resolveEmploymentType(request.employmentTypeId()),
                request.name(),
                request.birthDate(),
                request.phone(),
                request.email(),
                request.address(),
                request.hireDate(),
                request.resignationDate(),
                request.employeeStatusCode(),
                request.bankName(),
                request.accountNumber(),
                request.accountHolder(),
                request.profileImage()
        );

        if (StringUtils.hasText(previousProfileImage)
                && !previousProfileImage.equals(request.profileImage())) {
            fileStorageService.delete(previousProfileImage);
        }

        boolean actorIsSomeoneElse = actorId != null && !actorId.equals(employeeId);
        if (actorIsAdmin && actorIsSomeoneElse && !employee.getEmployeeStatusCode().equals(previousStatus)) {
            notificationService.notify(
                    employeeId,
                    Notification.TYPE_EMPLOYEE_STATUS_CHANGED,
                    "재직 상태 변경",
                    "재직 상태가 " + employeeStatusLabel(previousStatus) + "에서 " + employeeStatusLabel(employee.getEmployeeStatusCode()) + "(으)로 변경되었습니다.",
                    "/profile"
            );
        }

        if (actorIsAdmin) {
            auditLogService.log(
                    actorId,
                    AuditLog.ACTION_EMPLOYEE_UPDATE,
                    "직원 정보 수정: " + employee.getName() + "(" + employee.getEmployeeNo() + ")",
                    null
            );
        }

        return EmployeeResponse.from(employee);
    }

    @Transactional
    public String uploadProfileImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR);
        }
        return fileStorageService.store(file).url();
    }

    @Transactional
    public void delete(Long employeeId, Long actorId) {
        Employee employee = findActive(employeeId);
        int cancelledLeaveRequests = leaveRequestService.cancelAllPendingForEmployee(employeeId);

        String description = "직원 삭제: " + employee.getName() + "(" + employee.getEmployeeNo() + ")"
                + (cancelledLeaveRequests > 0 ? " - 대기중 휴가신청 " + cancelledLeaveRequests + "건 자동 취소" : "");
        employee.markDeleted();
        auditLogService.log(actorId, AuditLog.ACTION_EMPLOYEE_DELETE, description, null);
    }

    @Transactional
    public EmployeeResponse updateBaseSalary(Long employeeId, EmployeeBaseSalaryUpdateRequest request, Long actorId) {
        Employee employee = findActive(employeeId);
        BigDecimal previousSalary = employee.getBaseSalary();
        employee.updateBaseSalary(request.baseSalary());

        if (previousSalary == null || previousSalary.compareTo(request.baseSalary()) != 0) {
            notificationService.notify(
                    employeeId,
                    Notification.TYPE_BASE_SALARY_CHANGED,
                    "연봉 정보 변경",
                    "연봉 정보가 변경되었습니다.",
                    "/payroll/mine"
            );
            auditLogService.log(
                    actorId,
                    AuditLog.ACTION_PAYROLL_BASE_SALARY_UPDATE,
                    "연봉 정보 변경: " + employee.getName() + "(" + employee.getEmployeeNo() + ")",
                    null
            );
        }

        return EmployeeResponse.from(employee);
    }

    @Transactional
    public List<EmployeeBulkResult> bulkUpdateEmploymentType(List<Long> employeeIds, Long employmentTypeId, Long actorId) {
        EmploymentType employmentType = employmentTypeRepository.findById(employmentTypeId)
                .orElseThrow(() -> new BusinessException(ErrorCode.EMPLOYMENT_TYPE_NOT_FOUND));

        List<EmployeeBulkResult> results = employeeIds.stream()
                .map(employeeId -> {
                    try {
                        Employee employee = findActive(employeeId);
                        employee.changeEmploymentType(employmentType);
                        return new EmployeeBulkResult(employeeId, true, null);
                    } catch (BusinessException e) {
                        return new EmployeeBulkResult(employeeId, false, e.getMessage());
                    }
                })
                .toList();

        long successCount = results.stream().filter(EmployeeBulkResult::success).count();
        auditLogService.log(
                actorId,
                AuditLog.ACTION_PAYROLL_BULK_EMPLOYMENT_TYPE,
                "급여형태 일괄변경: 총 " + employeeIds.size() + "명 중 " + successCount + "명 성공 (" + employmentType.getEmploymentTypeName() + ")",
                null
        );

        return results;
    }

    @Transactional
    public List<EmployeeBulkResult> bulkRegisterPayrollBasic(List<EmployeeBulkPayrollBasicRequest.Item> items, Long actorId) {
        List<EmployeeBulkResult> results = items.stream()
                .map(item -> {
                    try {
                        Employee employee = findActive(item.employeeId());
                        employee.updateBaseSalary(item.baseSalary());
                        employee.updatePayrollAccount(item.bankName(), item.accountNumber(), item.accountHolder());
                        return new EmployeeBulkResult(item.employeeId(), true, null);
                    } catch (BusinessException e) {
                        return new EmployeeBulkResult(item.employeeId(), false, e.getMessage());
                    }
                })
                .toList();

        long successCount = results.stream().filter(EmployeeBulkResult::success).count();
        auditLogService.log(
                actorId,
                AuditLog.ACTION_PAYROLL_BULK_BASIC_REGISTER,
                "급여정보 일괄등록: 총 " + items.size() + "명 중 " + successCount + "명 성공",
                null
        );

        return results;
    }

    private String generateEmployeeNo() {
        String year = String.valueOf(Year.now().getValue());
        Integer maxSequence = employeeRepository.findMaxEmployeeNoSequence(year);
        int nextSequence = (maxSequence == null ? 0 : maxSequence) + 1;
        return "E" + year + String.format("%03d", nextSequence);
    }

    private Employee findActive(Long employeeId) {
        return employeeRepository.findById(employeeId)
                .orElseThrow(()->new BusinessException(ErrorCode.EMPLOYEE_NOT_FOUND));

    }

    private Department resolveDepartment(Long departmentId) {
        if (departmentId == null) {
            return null;
        }
        return departmentRepository.findById(departmentId)
                .orElseThrow(() -> new BusinessException(ErrorCode.DEPARTMENT_NOT_FOUND));
    }

    private Position resolvePosition(Long positionId) {
        if (positionId == null) {
            return null;
        }
        return positionRepository.findById(positionId)
                .orElseThrow(() -> new BusinessException(ErrorCode.POSITION_NOT_FOUND));
    }

    private EmploymentType resolveEmploymentType(Long employmentTypeId) {
        if (employmentTypeId == null) {
            return null;
        }
        return employmentTypeRepository.findById(employmentTypeId)
                .orElseThrow(() -> new BusinessException(ErrorCode.EMPLOYMENT_TYPE_NOT_FOUND));
    }

    private Employee resolveManager(Long managerId) {
        if (managerId == null) {
            return null;
        }
        return employeeRepository.findById(managerId)
                .orElseThrow(() -> new BusinessException(ErrorCode.EMPLOYEE_NOT_FOUND));
    }
}
