package erp.system.notice.repository;

import erp.system.notice.entity.Notice;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface NoticeRepository extends JpaRepository<Notice, Long> {

    // writer는 소프트 삭제될 수 있으므로 INNER JOIN(경로 탐색 n.writer.name)을 쓰면
    // 작성자가 퇴사한 공지 전체가 조회 결과에서 사라진다. LEFT JOIN으로 방지한다.
    @Query(value = """
            SELECT n FROM Notice n LEFT JOIN n.writer w
            WHERE (:keyword IS NULL OR n.title LIKE CONCAT('%', :keyword, '%') OR w.name LIKE CONCAT('%', :keyword, '%'))
            ORDER BY n.pinned DESC, n.createdAt DESC
            """,
            countQuery = """
            SELECT COUNT(n) FROM Notice n LEFT JOIN n.writer w
            WHERE (:keyword IS NULL OR n.title LIKE CONCAT('%', :keyword, '%') OR w.name LIKE CONCAT('%', :keyword, '%'))
            """)
    Page<Notice> search(@Param("keyword") String keyword, Pageable pageable);
}
