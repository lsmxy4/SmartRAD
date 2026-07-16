package erp.system.appointment.repository;

import erp.system.appointment.entity.EmployeeAppointment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;

public interface EmployeeAppointmentRepository extends JpaRepository<EmployeeAppointment, Long>, JpaSpecificationExecutor<EmployeeAppointment> {

    List<EmployeeAppointment> findAllByEmployee_EmployeeIdOrderByEffectiveDateDesc(Long employeeId);

    Optional<EmployeeAppointment> findFirstByEmployee_EmployeeIdOrderByEffectiveDateDescEmployeeAppointmentIdDesc(Long employeeId);
}
