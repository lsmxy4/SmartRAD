package erp.system.certificate.controller;

import erp.system.certificate.dto.EmployeeCertificateIssueCreateRequest;
import erp.system.certificate.dto.EmployeeCertificateIssueRejectRequest;
import erp.system.certificate.dto.EmployeeCertificateIssueResponse;
import erp.system.certificate.service.EmployeeCertificateIssueService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/certificate-issues")
@RequiredArgsConstructor
public class EmployeeCertificateIssueController {

    private final EmployeeCertificateIssueService certificateIssueService;

    @GetMapping
    public List<EmployeeCertificateIssueResponse> getByEmployee(@RequestParam Long employeeId) {
        return certificateIssueService.getByEmployee(employeeId);
    }

    @GetMapping("/search")
    public Page<EmployeeCertificateIssueResponse> getList(
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) String certificateType,
            @RequestParam(required = false) String approvalStatus,
            @RequestParam(required = false) String keyword,
            Pageable pageable
    ) {
        return certificateIssueService.getList(employeeId, certificateType, approvalStatus, keyword, pageable);
    }

    @PostMapping
    public ResponseEntity<EmployeeCertificateIssueResponse> create(@Valid @RequestBody EmployeeCertificateIssueCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(certificateIssueService.create(request));
    }

    @PatchMapping("/{id}/approve")
    public EmployeeCertificateIssueResponse approve(@PathVariable Long id) {
        return certificateIssueService.approve(id);
    }

    @PatchMapping("/{id}/reject")
    public EmployeeCertificateIssueResponse reject(@PathVariable Long id, @Valid @RequestBody EmployeeCertificateIssueRejectRequest request) {
        return certificateIssueService.reject(id, request.memo());
    }

    @PatchMapping("/{id}/issue")
    public EmployeeCertificateIssueResponse issue(@PathVariable Long id) {
        return certificateIssueService.issue(id);
    }
}
