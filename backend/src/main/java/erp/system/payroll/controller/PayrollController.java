package erp.system.payroll.controller;

import erp.system.payroll.dto.PayrollBulkPayRequest;
import erp.system.payroll.dto.PayrollBulkResult;
import erp.system.payroll.dto.PayrollCalculateRequest;
import erp.system.payroll.dto.PayrollDetailedResponse;
import erp.system.payroll.dto.PayrollResponse;
import erp.system.payroll.service.PayrollService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.YearMonth;
import java.util.List;

@RestController
@RequestMapping("/api/payrolls")
@RequiredArgsConstructor
public class PayrollController {

    private final PayrollService payrollService;

    @GetMapping
    public List<PayrollResponse> getList(
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM") YearMonth payrollYearMonth
    ) {
        return payrollService.getList(employeeId, payrollYearMonth);
    }

    @GetMapping("/{id}")
    public PayrollDetailedResponse getDetail(@PathVariable Long id) {
        return payrollService.getDetail(id);
    }

    @GetMapping("/me")
    public List<PayrollResponse> getMyList(
            @AuthenticationPrincipal Long requesterId,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM") YearMonth payrollYearMonth
    ) {
        return payrollService.getList(requesterId, payrollYearMonth);
    }

    @GetMapping("/me/{id}")
    public PayrollDetailedResponse getMyDetail(@AuthenticationPrincipal Long requesterId, @PathVariable Long id) {
        return payrollService.getMyDetail(id, requesterId);
    }

    @PostMapping("/calculate")
    public ResponseEntity<PayrollDetailedResponse> calculate(@Valid @RequestBody PayrollCalculateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(payrollService.calculate(request));
    }

    @PostMapping("/calculate-all")
    public ResponseEntity<PayrollService.PayrollCalculateAllResult> calculateAll(
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM") YearMonth payrollYearMonth
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(payrollService.calculateAll(payrollYearMonth));
    }

    @PatchMapping("/{id}/pay")
    public PayrollResponse pay(@PathVariable Long id) {
        return payrollService.pay(id);
    }

    @PatchMapping("/{id}/confirm")
    public PayrollResponse confirm(@PathVariable Long id) {
        return payrollService.confirm(id);
    }

    @PatchMapping("/{id}/exclude")
    public PayrollResponse exclude(@PathVariable Long id) {
        return payrollService.exclude(id);
    }

    @PatchMapping("/{id}/review-complete")
    public PayrollResponse completeReview(@PathVariable Long id) {
        return payrollService.completeReview(id);
    }

    @PatchMapping("/{id}/hold")
    public PayrollResponse hold(@PathVariable Long id) {
        return payrollService.hold(id);
    }

    @PatchMapping("/bulk-pay")
    public List<PayrollBulkResult> bulkPay(@Valid @RequestBody PayrollBulkPayRequest request) {
        return payrollService.bulkPay(request.payrollIds());
    }
}
