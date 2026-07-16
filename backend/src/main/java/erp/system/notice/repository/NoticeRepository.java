package erp.system.notice.repository;

import erp.system.notice.entity.Notice;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface NoticeRepository extends JpaRepository<Notice, Long> {

    @Query(value = """
            SELECT n FROM Notice n
            WHERE (:keyword IS NULL OR n.title LIKE CONCAT('%', :keyword, '%') OR n.writer.name LIKE CONCAT('%', :keyword, '%'))
            ORDER BY n.pinned DESC, n.createdAt DESC
            """,
            countQuery = """
            SELECT COUNT(n) FROM Notice n
            WHERE (:keyword IS NULL OR n.title LIKE CONCAT('%', :keyword, '%') OR n.writer.name LIKE CONCAT('%', :keyword, '%'))
            """)
    Page<Notice> search(@Param("keyword") String keyword, Pageable pageable);
}
