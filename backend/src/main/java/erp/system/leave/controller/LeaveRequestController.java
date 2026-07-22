package erp.system.leave.controller;

import erp.system.leave.dto.LeaveRequestBulkApproveRequest;
import erp.system.leave.dto.LeaveRequestBulkApproveResult;
import erp.system.leave.dto.LeaveRequestCreateRequest;
import erp.system.leave.dto.LeaveRequestRejectRequest;
import erp.system.leave.dto.LeaveRequestResponse;
import erp.system.leave.dto.LeaveRequestSummaryResponse;
import erp.system.leave.dto.MyLeaveRequestCreateRequest;
import erp.system.leave.dto.MyLeaveRequestPreviewRequest;
import erp.system.leave.dto.LeaveRequestPreviewResponse;
import erp.system.leave.service.LeaveRequestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/leave-requests")
@RequiredArgsConstructor
public class LeaveRequestController {

    private final LeaveRequestService leaveRequestService;

    @GetMapping("/me")
    public List<LeaveRequestResponse> getMyRequests(@AuthenticationPrincipal Long employeeId) {
        return leaveRequestService.getMyRequests(employeeId);
    }

    @PostMapping("/me")
    public ResponseEntity<LeaveRequestResponse> createMyRequest(
            @AuthenticationPrincipal Long employeeId,
            @Valid @RequestBody MyLeaveRequestCreateRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(leaveRequestService.createMyRequest(employeeId, request));
    }

    @PostMapping("/me/preview")
    public LeaveRequestPreviewResponse previewMyRequest(@AuthenticationPrincipal Long employeeId,
            @Valid @RequestBody MyLeaveRequestPreviewRequest request) {
        return leaveRequestService.previewMyRequest(employeeId, request);
    }

    @PatchMapping("/me/{id}/cancel")
    public LeaveRequestResponse cancelMyRequest(@AuthenticationPrincipal Long employeeId, @PathVariable Long id) {
        return leaveRequestService.cancelMyRequest(employeeId, id);
    }

    @GetMapping
    public List<LeaveRequestResponse> getList(
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) String status
    ) {
        return leaveRequestService.getList(employeeId, status);
    }

    @GetMapping("/search")
    public Page<LeaveRequestResponse> getPagedList(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) Long leaveTypeId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long departmentId,
            Pageable pageable
    ) {
        return leaveRequestService.getPagedList(startDate, endDate, leaveTypeId, status, keyword, departmentId, pageable);
    }

    @GetMapping("/summary")
    public LeaveRequestSummaryResponse getSummary(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) Long leaveTypeId,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long departmentId
    ) {
        return leaveRequestService.getSummary(startDate, endDate, leaveTypeId, keyword, departmentId);
    }

    @GetMapping("/{id}")
    public LeaveRequestResponse getById(@PathVariable Long id) {
        return leaveRequestService.getById(id);
    }

    @PostMapping
    public ResponseEntity<LeaveRequestResponse> create(@Valid @RequestBody LeaveRequestCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(leaveRequestService.create(request));
    }

    @PatchMapping("/{id}/approve")
    public LeaveRequestResponse approve(@PathVariable Long id, @AuthenticationPrincipal Long approverId) {
        return leaveRequestService.approve(id, approverId);
    }

    @PatchMapping("/{id}/reject")
    public LeaveRequestResponse reject(@PathVariable Long id, @AuthenticationPrincipal Long approverId,
                                        @Valid @RequestBody LeaveRequestRejectRequest request) {
        return leaveRequestService.reject(id, approverId, request.rejectionReason());
    }

    @PatchMapping("/bulk-approve")
    public List<LeaveRequestBulkApproveResult> bulkApprove(@Valid @RequestBody LeaveRequestBulkApproveRequest request,
                                                             @AuthenticationPrincipal Long approverId) {
        return leaveRequestService.bulkApprove(request.leaveRequestIds(), approverId);
    }
}
