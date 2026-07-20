package erp.system.appointment.controller;

import erp.system.appointment.dto.EmployeeAppointmentCreateRequest;
import erp.system.appointment.dto.EmployeeAppointmentResponse;
import erp.system.appointment.service.EmployeeAppointmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.YearMonth;
import java.util.List;

@RestController
@RequestMapping("/api/appointments")
@RequiredArgsConstructor
public class EmployeeAppointmentController {

    private final EmployeeAppointmentService employeeAppointmentService;

    @GetMapping
    public List<EmployeeAppointmentResponse> getByEmployee(@RequestParam Long employeeId) {
        return employeeAppointmentService.getByEmployee(employeeId);
    }

    @GetMapping("/me")
    public List<EmployeeAppointmentResponse> getMyAppointments(@AuthenticationPrincipal Long requesterId) {
        return employeeAppointmentService.getByEmployee(requesterId);
    }

    @GetMapping("/search")
    public Page<EmployeeAppointmentResponse> getList(
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) String appointmentType,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM") YearMonth yearMonth,
            @RequestParam(required = false) String keyword,
            Pageable pageable
    ) {
        return employeeAppointmentService.getList(employeeId, appointmentType, yearMonth, keyword, pageable);
    }

    @PostMapping
    public ResponseEntity<EmployeeAppointmentResponse> create(@Valid @RequestBody EmployeeAppointmentCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(employeeAppointmentService.create(request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        employeeAppointmentService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
