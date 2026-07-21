package erp.system.notice.controller;

import erp.system.notice.dto.NoticeCreateRequest;
import erp.system.notice.dto.NoticeResponse;
import erp.system.notice.dto.NoticeSummaryResponse;
import erp.system.notice.dto.NoticeUpdateRequest;
import erp.system.notice.service.NoticeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notices")
@RequiredArgsConstructor
public class NoticeController {

    private final NoticeService noticeService;

    @GetMapping
    public Page<NoticeSummaryResponse> getList(
            @RequestParam(required = false) String keyword,
            Pageable pageable
    ) {
        return noticeService.getList(keyword, pageable);
    }

    @GetMapping("/{id}")
    public NoticeResponse getById(@PathVariable Long id, @AuthenticationPrincipal Long employeeId) {
        return noticeService.getById(id, employeeId);
    }

    @PostMapping
    public ResponseEntity<NoticeResponse> create(
            @AuthenticationPrincipal Long writerId,
            @Valid @RequestBody NoticeCreateRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(noticeService.create(writerId, request));
    }

    @PutMapping("/{id}")
    public NoticeResponse update(@PathVariable Long id, @Valid @RequestBody NoticeUpdateRequest request) {
        return noticeService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        noticeService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
