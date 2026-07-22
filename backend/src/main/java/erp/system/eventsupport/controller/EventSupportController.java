package erp.system.eventsupport.controller;

import erp.system.eventsupport.dto.EventSupportRejectRequest;
import erp.system.eventsupport.dto.EventSupportResponse;
import erp.system.eventsupport.service.EventSupportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/event-supports")
@RequiredArgsConstructor
public class EventSupportController {

    private final EventSupportService eventSupportService;

    @GetMapping("/me")
    public List<EventSupportResponse> getMine(@AuthenticationPrincipal Long employeeId) {
        return eventSupportService.getMine(employeeId);
    }

    @PostMapping(value = "/me", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<EventSupportResponse> createMine(
            @AuthenticationPrincipal Long employeeId,
            @RequestParam String eventType,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate eventDate,
            @RequestParam BigDecimal requestAmount,
            @RequestParam(required = false) String reason,
            @RequestParam(required = false) MultipartFile attachment
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(eventSupportService.createMine(employeeId, eventType, eventDate, requestAmount, reason, attachment));
    }

    @GetMapping("/search")
    public Page<EventSupportResponse> getList(
            @RequestParam(required = false) String eventType,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String keyword,
            Pageable pageable
    ) {
        return eventSupportService.getList(eventType, status, keyword, pageable);
    }

    @PatchMapping("/{id}/approve")
    public EventSupportResponse approve(@PathVariable Long id, @AuthenticationPrincipal Long approverId) {
        return eventSupportService.approve(id, approverId);
    }

    @PatchMapping("/{id}/reject")
    public EventSupportResponse reject(@PathVariable Long id, @AuthenticationPrincipal Long approverId,
                                        @Valid @RequestBody EventSupportRejectRequest request) {
        return eventSupportService.reject(id, approverId, request.rejectionReason());
    }

    @PatchMapping("/{id}/pay")
    public EventSupportResponse pay(@PathVariable Long id) {
        return eventSupportService.pay(id);
    }
}
