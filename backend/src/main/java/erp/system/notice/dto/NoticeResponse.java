package erp.system.notice.dto;

import erp.system.common.util.SoftDeleteAware;
import erp.system.employee.entity.Employee;
import erp.system.notice.entity.Notice;

import java.time.LocalDateTime;

public record NoticeResponse(
        Long noticeId,
        Long writerId,
        String writerName,
        String title,
        String content,
        boolean pinned,
        int viewCount,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    private static final String DELETED_EMPLOYEE_LABEL = "(삭제된 직원)";

    public static NoticeResponse from(Notice notice) {
        Employee rawWriter = notice.getWriter();
        Employee writer = SoftDeleteAware.resolve(rawWriter, Employee::getName);

        return new NoticeResponse(
                notice.getNoticeId(),
                SoftDeleteAware.identifierOf(rawWriter, () -> rawWriter.getEmployeeId()),
                writer != null ? writer.getName() : DELETED_EMPLOYEE_LABEL,
                notice.getTitle(),
                notice.getContent(),
                notice.isPinned(),
                notice.getViewCount(),
                notice.getCreatedAt(),
                notice.getUpdatedAt()
        );
    }
}
