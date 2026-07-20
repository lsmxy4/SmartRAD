package erp.system.notice.dto;

import erp.system.common.util.SoftDeleteAware;
import erp.system.employee.entity.Employee;
import erp.system.notice.entity.Notice;

import java.time.LocalDateTime;

public record NoticeSummaryResponse(
        Long noticeId,
        String writerName,
        String title,
        boolean pinned,
        int viewCount,
        LocalDateTime createdAt
) {
    private static final String DELETED_EMPLOYEE_LABEL = "(삭제된 직원)";

    public static NoticeSummaryResponse from(Notice notice) {
        Employee writer = SoftDeleteAware.resolve(notice.getWriter(), Employee::getName);

        return new NoticeSummaryResponse(
                notice.getNoticeId(),
                writer != null ? writer.getName() : DELETED_EMPLOYEE_LABEL,
                notice.getTitle(),
                notice.isPinned(),
                notice.getViewCount(),
                notice.getCreatedAt()
        );
    }
}
