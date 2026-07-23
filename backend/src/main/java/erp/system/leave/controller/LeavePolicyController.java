package erp.system.leave.controller;

import erp.system.leave.dto.LeavePolicyCreateRequest;
import erp.system.leave.dto.LeavePolicyResponse;
import erp.system.leave.service.LeavePolicyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/leave-policies")
@RequiredArgsConstructor
public class LeavePolicyController {

    private final LeavePolicyService leavePolicyService;

    @GetMapping
    public List<LeavePolicyResponse> getAll() {
        return leavePolicyService.getAll();
    }

    @PostMapping
    public ResponseEntity<LeavePolicyResponse> create(@Valid @RequestBody LeavePolicyCreateRequest request,
                                                       @AuthenticationPrincipal Long requesterId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(leavePolicyService.create(request, requesterId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<LeavePolicyResponse> update(@PathVariable Long id, @Valid @RequestBody LeavePolicyCreateRequest request) {
        return ResponseEntity.ok(leavePolicyService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, @AuthenticationPrincipal Long requesterId) {
        leavePolicyService.delete(id, requesterId);
        return ResponseEntity.noContent().build();
    }
}
