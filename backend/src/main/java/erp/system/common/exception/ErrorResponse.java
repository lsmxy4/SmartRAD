package erp.system.common.exception;

import org.springframework.validation.FieldError;

import java.time.LocalDateTime;
import java.util.List;

public record ErrorResponse (
        String code,
        String message,
        LocalDateTime timestamp,
        List<FieldError> fieldErrors
){
    public record FieldError(String field, String reason) {
    }

    public static ErrorResponse of(ErrorCode errorCode, String message) {
        return new ErrorResponse(errorCode.name(), message, LocalDateTime.now(), null);
    }

    public static ErrorResponse of(ErrorCode errorCode, String message, List<FieldError> fieldErrors) {
        return new ErrorResponse(errorCode.name(), message, LocalDateTime.now(), fieldErrors);
    }
}
