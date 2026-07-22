package erp.system.eventsupport.repository;

import erp.system.eventsupport.entity.EventSupport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;

public interface EventSupportRepository extends JpaRepository<EventSupport, Long>, JpaSpecificationExecutor<EventSupport> {

    List<EventSupport> findAllByEmployee_EmployeeIdOrderByCreatedAtDesc(Long employeeId);
}
