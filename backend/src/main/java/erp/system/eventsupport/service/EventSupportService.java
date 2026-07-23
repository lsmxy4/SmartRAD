package erp.system.eventsupport.service;

import erp.system.auditlog.entity.AuditLog;
import erp.system.auditlog.service.AuditLogService;
import erp.system.common.exception.BusinessException;
import erp.system.common.exception.ErrorCode;
import erp.system.common.file.FileStorageService;
import erp.system.employee.entity.Employee;
import erp.system.employee.repository.EmployeeRepository;
import erp.system.eventsupport.dto.EventSupportResponse;
import erp.system.eventsupport.entity.EventSupport;
import erp.system.eventsupport.repository.EventSupportRepository;
import erp.system.notification.entity.Notification;
import erp.system.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EventSupportService {

    private final EventSupportRepository eventSupportRepository;
    private final EmployeeRepository employeeRepository;
    private final FileStorageService fileStorageService;
    private final NotificationService notificationService;
    private final AuditLogService auditLogService;

    private static String eventTypeLabel(String eventType) {
        return switch (eventType) {
            case EventSupport.TYPE_SELF_MARRIAGE -> "본인 결혼";
            case EventSupport.TYPE_CHILD_BIRTH -> "자녀 출산";
            case EventSupport.TYPE_CHILD_MARRIAGE -> "자녀 결혼";
            case EventSupport.TYPE_PARENT_DEATH -> "부모상";
            case EventSupport.TYPE_SPOUSE_DEATH -> "배우자상";
            case EventSupport.TYPE_CHILD_DEATH -> "자녀상";
            default -> "기타";
        };
    }

    private static BigDecimal calculatePolicyAmount(String eventType) {
        return switch (eventType) {
            case EventSupport.TYPE_SELF_MARRIAGE -> new BigDecimal("1000000");
            case EventSupport.TYPE_CHILD_BIRTH -> new BigDecimal("500000");
            case EventSupport.TYPE_CHILD_MARRIAGE -> new BigDecimal("500000");
            case EventSupport.TYPE_PARENT_DEATH -> new BigDecimal("1000000");
            case EventSupport.TYPE_SPOUSE_DEATH -> new BigDecimal("2000000");
            case EventSupport.TYPE_CHILD_DEATH -> new BigDecimal("1000000");
            default -> new BigDecimal("300000");
        };
    }

    public List<EventSupportResponse> getMine(Long employeeId) {
        return eventSupportRepository.findAllByEmployee_EmployeeIdOrderByCreatedAtDesc(employeeId).stream()
                .map(EventSupportResponse::from)
                .toList();
    }

    public Page<EventSupportResponse> getList(String eventType, String status, String keyword, Pageable pageable) {
        Specification<EventSupport> spec = (root, query, cb) -> {
            var predicate = cb.conjunction();
            if (StringUtils.hasText(eventType)) {
                predicate = cb.and(predicate, cb.equal(root.get("eventType"), eventType));
            }
            if (StringUtils.hasText(status)) {
                predicate = cb.and(predicate, cb.equal(root.get("status"), status));
            }
            if (StringUtils.hasText(keyword)) {
                predicate = cb.and(predicate, cb.like(root.join("employee").get("name"), "%" + keyword + "%"));
            }
            return predicate;
        };
        return eventSupportRepository.findAll(spec, pageable).map(EventSupportResponse::from);
    }

    @Transactional
    public EventSupportResponse createMine(Long employeeId, String eventType, LocalDate eventDate,
                                            String reason, MultipartFile attachment) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new BusinessException(ErrorCode.EMPLOYEE_NOT_FOUND));

        String attachmentUrl = null;
        String attachmentName = null;
        if (attachment != null && !attachment.isEmpty()) {
            FileStorageService.StoredFile stored = fileStorageService.store(attachment);
            attachmentUrl = stored.url();
            attachmentName = stored.originalName();
        }

        BigDecimal supportAmount = calculatePolicyAmount(eventType);

        EventSupport eventSupport = EventSupport.builder()
                .employee(employee)
                .eventType(eventType)
                .eventDate(eventDate)
                .supportAmount(supportAmount)
                .reason(reason)
                .attachmentUrl(attachmentUrl)
                .attachmentName(attachmentName)
                .build();

        EventSupport saved = eventSupportRepository.save(eventSupport);

        notificationService.notifyAdmins(
                Notification.TYPE_EVENT_SUPPORT_REQUESTED,
                "경조비 신청",
                employee.getName() + "님이 [" + eventTypeLabel(eventType) + "] 경조비를 신청했습니다.",
                "/events"
        );

        return EventSupportResponse.from(saved);
    }

    @Transactional
    public EventSupportResponse approve(Long id, Long approverId) {
        EventSupport eventSupport = findActive(id);
        Employee approver = employeeRepository.findById(approverId)
                .orElseThrow(() -> new BusinessException(ErrorCode.EMPLOYEE_NOT_FOUND));

        eventSupport.approve(approver);

        notificationService.notify(
                eventSupport.getEmployee().getEmployeeId(),
                Notification.TYPE_EVENT_SUPPORT_APPROVED,
                "경조비 승인",
                "신청하신 경조비가 승인되었습니다.",
                "/events/my"
        );

        auditLogService.log(
                approverId,
                AuditLog.ACTION_EVENT_SUPPORT_APPROVE,
                "경조비 승인: " + eventSupport.getEmployee().getName() + " (" + eventTypeLabel(eventSupport.getEventType()) + ")",
                null
        );

        return EventSupportResponse.from(eventSupport);
    }

    @Transactional
    public EventSupportResponse reject(Long id, Long approverId, String rejectionReason) {
        EventSupport eventSupport = findActive(id);
        Employee approver = employeeRepository.findById(approverId)
                .orElseThrow(() -> new BusinessException(ErrorCode.EMPLOYEE_NOT_FOUND));

        eventSupport.reject(approver, rejectionReason);

        notificationService.notify(
                eventSupport.getEmployee().getEmployeeId(),
                Notification.TYPE_EVENT_SUPPORT_REJECTED,
                "경조비 반려",
                "신청하신 경조비가 반려되었습니다." + (rejectionReason != null && !rejectionReason.isBlank() ? " 사유: " + rejectionReason : ""),
                "/events/my"
        );

        auditLogService.log(
                approverId,
                AuditLog.ACTION_EVENT_SUPPORT_REJECT,
                "경조비 반려: " + eventSupport.getEmployee().getName() + " (" + eventTypeLabel(eventSupport.getEventType()) + ")",
                rejectionReason
        );

        return EventSupportResponse.from(eventSupport);
    }

    @Transactional
    public EventSupportResponse pay(Long id, Long actorId) {
        EventSupport eventSupport = findActive(id);
        eventSupport.pay(LocalDate.now());

        notificationService.notify(
                eventSupport.getEmployee().getEmployeeId(),
                Notification.TYPE_EVENT_SUPPORT_PAID,
                "경조비 지급 완료",
                "신청하신 경조비가 지급되었습니다.",
                "/events/my"
        );

        auditLogService.log(
                actorId,
                AuditLog.ACTION_EVENT_SUPPORT_PAY,
                "경조비 지급 처리: " + eventSupport.getEmployee().getName() + " (" + eventTypeLabel(eventSupport.getEventType()) + ")",
                null
        );

        return EventSupportResponse.from(eventSupport);
    }

    private EventSupport findActive(Long id) {
        return eventSupportRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.EVENT_SUPPORT_NOT_FOUND));
    }
}
