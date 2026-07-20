package erp.system.certificate.repository;

import erp.system.certificate.entity.EmployeeCertificateIssue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;

public interface EmployeeCertificateIssueRepository extends JpaRepository<EmployeeCertificateIssue, Long>, JpaSpecificationExecutor<EmployeeCertificateIssue> {

    List<EmployeeCertificateIssue> findAllByEmployee_EmployeeIdOrderByApplicationDateDesc(Long employeeId);

    boolean existsByApplicationNo(String applicationNo);
}
