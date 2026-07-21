package erp.system.notice.repository;

import erp.system.notice.entity.NoticeView;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NoticeViewRepository extends JpaRepository<NoticeView, Long> {
    boolean existsByNotice_NoticeIdAndEmployee_EmployeeId(Long noticeId, Long employeeId);
}
