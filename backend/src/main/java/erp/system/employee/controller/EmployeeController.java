package erp.system.employee.controller;

import erp.system.employee.dto.EmployeeBaseSalaryUpdateRequest;
import erp.system.employee.dto.EmployeeBulkEmploymentTypeRequest;
import erp.system.employee.dto.EmployeeBulkPayrollBasicRequest;
import erp.system.employee.dto.EmployeeBulkResult;
import erp.system.employee.dto.EmployeeCreateRequest;
import erp.system.employee.dto.EmployeePayrollSummaryResponse;
import erp.system.employee.dto.EmployeeResponse;
import erp.system.employee.dto.EmployeeSummaryResponse;
import erp.system.employee.dto.EmployeeUpdateRequest;
import erp.system.employee.service.EmployeeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

import org.springframework.web.bind.annotation.DeleteMapping;

@RestController
@RequestMapping("/api/employees")
@RequiredArgsConstructor
public class EmployeeController {

    private final EmployeeService employeeService;

    @GetMapping
    public Page<EmployeeSummaryResponse> getList(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) String status,
            Pageable pageable
    ) {
        return employeeService.getList(keyword, departmentId, status, pageable);
    }

    @GetMapping("/payroll-summary")
    public List<EmployeePayrollSummaryResponse> getPayrollSummaryList() {
        return employeeService.getPayrollSummaryList();
    }

    @GetMapping("/{id}")
    public EmployeeResponse getById(@PathVariable Long id, @AuthenticationPrincipal Long requesterId,
                                     Authentication authentication) {
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals("ROLE_ADMIN"));
        return employeeService.getById(id, requesterId, isAdmin);
    }

    @PostMapping
    public ResponseEntity<EmployeeResponse> create(@Valid @RequestBody EmployeeCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(employeeService.create(request));
    }

    @PutMapping("/{id}")
    public EmployeeResponse update(@PathVariable Long id, @Valid @RequestBody EmployeeUpdateRequest request) {
        return employeeService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        employeeService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/base-salary")
    public EmployeeResponse updateBaseSalary(@PathVariable Long id, @Valid @RequestBody EmployeeBaseSalaryUpdateRequest request) {
        return employeeService.updateBaseSalary(id, request);
    }

    @PatchMapping("/bulk-employment-type")
    public List<EmployeeBulkResult> bulkUpdateEmploymentType(@Valid @RequestBody EmployeeBulkEmploymentTypeRequest request) {
        return employeeService.bulkUpdateEmploymentType(request.employeeIds(), request.employmentTypeId());
    }

    @PatchMapping("/bulk-payroll-basic")
    public List<EmployeeBulkResult> bulkRegisterPayrollBasic(@Valid @RequestBody EmployeeBulkPayrollBasicRequest request) {
        return employeeService.bulkRegisterPayrollBasic(request.items());
    }
}
