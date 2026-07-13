package erp.system.employee.repository;

import erp.system.employee.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

public interface EmployeeRepository extends JpaRepository<Employee,Long>, JpaSpecificationExecutor<Employee> {
    Optional<Employee> findByEmployeeNoOrEmail(String employeeNo, String email);

    boolean existsByEmployeeNo(String employeeNo);

    boolean existsByEmail(String email);
}
