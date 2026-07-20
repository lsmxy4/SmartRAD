package erp.system.attendance.controller;

import erp.system.attendance.dto.AttendanceManualRequest;
import erp.system.attendance.dto.AttendanceMonthlySummaryResponse;
import erp.system.attendance.dto.AttendanceResponse;
import erp.system.attendance.service.AttendanceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

@RestController
@RequestMapping("/api/attendances")
@RequiredArgsConstructor
public class AttendanceController {

    private final AttendanceService attendanceService;

    @GetMapping
    public List<AttendanceResponse> getDaily(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        return attendanceService.getDaily(date);
    }

    @GetMapping("/monthly-summary")
    public List<AttendanceMonthlySummaryResponse> getMonthlySummary(
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM") YearMonth yearMonth
    ) {
        return attendanceService.getMonthlySummary(yearMonth);
    }

    @GetMapping("/me")
    public List<AttendanceResponse> getMyMonthly(
            @AuthenticationPrincipal Long requesterId,
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM") YearMonth yearMonth
    ) {
        return attendanceService.getMyMonthly(requesterId, yearMonth);
    }

    @PostMapping
    public ResponseEntity<AttendanceResponse> registerManual(@Valid @RequestBody AttendanceManualRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(attendanceService.registerManual(request));
    }

    @PostMapping("/check-in")
    public ResponseEntity<AttendanceResponse> checkIn(@AuthenticationPrincipal Long employeeId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(attendanceService.checkIn(employeeId));
    }

    @PatchMapping("/check-out")
    public AttendanceResponse checkOut(@AuthenticationPrincipal Long employeeId) {
        return attendanceService.checkOut(employeeId);
    }
}
