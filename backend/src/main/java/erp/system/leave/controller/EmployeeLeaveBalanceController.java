package erp.system.leave.controller;

import erp.system.leave.dto.EmployeeLeaveBalanceGrantRequest;
import erp.system.leave.dto.EmployeeLeaveBalanceResponse;
import erp.system.leave.service.EmployeeLeaveBalanceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/leave-balances")
@RequiredArgsConstructor
public class EmployeeLeaveBalanceController {

    private final EmployeeLeaveBalanceService employeeLeaveBalanceService;

    @GetMapping("/me")
    public List<EmployeeLeaveBalanceResponse> getMine(@AuthenticationPrincipal Long employeeId) {
        return employeeLeaveBalanceService.getByEmployee(employeeId);
    }

    @GetMapping
    public List<EmployeeLeaveBalanceResponse> getByEmployee(@RequestParam Long employeeId) {
        return employeeLeaveBalanceService.getByEmployee(employeeId);
    }

    @PostMapping
    public ResponseEntity<EmployeeLeaveBalanceResponse> grant(@Valid @RequestBody EmployeeLeaveBalanceGrantRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(employeeLeaveBalanceService.grant(request));
    }
}
