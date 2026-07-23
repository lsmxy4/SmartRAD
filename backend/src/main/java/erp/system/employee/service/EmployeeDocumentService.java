package erp.system.employee.service;

import erp.system.common.exception.BusinessException;
import erp.system.common.exception.ErrorCode;
import erp.system.common.file.FileStorageService;
import erp.system.employee.dto.EmployeeDocumentResponse;
import erp.system.employee.entity.Employee;
import erp.system.employee.entity.EmployeeDocument;
import erp.system.employee.repository.EmployeeDocumentRepository;
import erp.system.employee.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EmployeeDocumentService {

    private final EmployeeDocumentRepository employeeDocumentRepository;
    private final EmployeeRepository employeeRepository;
    private final FileStorageService fileStorageService;

    public List<EmployeeDocumentResponse> getList(Long employeeId, Long requesterId, boolean requesterIsAdmin) {
        if (!requesterIsAdmin && !employeeId.equals(requesterId)) {
            throw new BusinessException(ErrorCode.ACCESS_DENIED);
        }
        return employeeDocumentRepository.findAllByEmployee_EmployeeIdOrderByCreatedAtDesc(employeeId).stream()
                .map(EmployeeDocumentResponse::from)
                .toList();
    }

    @Transactional
    public EmployeeDocumentResponse upload(Long employeeId, String documentType, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR);
        }
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new BusinessException(ErrorCode.EMPLOYEE_NOT_FOUND));

        FileStorageService.StoredFile stored = fileStorageService.store(file);

        EmployeeDocument document = employeeDocumentRepository
                .findByEmployee_EmployeeIdAndDocumentType(employeeId, documentType)
                .map(existing -> {
                    String previousUrl = existing.getAttachmentUrl();
                    existing.replace(stored.url(), stored.originalName());
                    fileStorageService.delete(previousUrl);
                    return existing;
                })
                .orElseGet(() -> employeeDocumentRepository.save(
                        EmployeeDocument.builder()
                                .employee(employee)
                                .documentType(documentType)
                                .attachmentUrl(stored.url())
                                .attachmentName(stored.originalName())
                                .build()
                ));

        return EmployeeDocumentResponse.from(document);
    }

    @Transactional
    public void delete(Long employeeId, Long documentId) {
        EmployeeDocument document = employeeDocumentRepository.findById(documentId)
                .orElseThrow(() -> new BusinessException(ErrorCode.EMPLOYEE_DOCUMENT_NOT_FOUND));
        if (!document.getEmployee().getEmployeeId().equals(employeeId)) {
            throw new BusinessException(ErrorCode.EMPLOYEE_DOCUMENT_NOT_FOUND);
        }
        employeeDocumentRepository.delete(document);
        fileStorageService.delete(document.getAttachmentUrl());
    }
}
