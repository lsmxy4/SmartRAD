package erp.system.common.file;

import erp.system.common.exception.BusinessException;
import erp.system.common.exception.ErrorCode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

/**
 * 로컬 디스크(컨테이너/서버 파일시스템)에 파일을 저장한다. 로컬 개발 및 별도 오브젝트 스토리지가 없는
 * 환경의 기본값이며, {@code file.storage.type=s3}로 설정하면 {@link S3FileStorageService}가 대신 사용된다.
 */
@Slf4j
@Service
@ConditionalOnProperty(name = "file.storage.type", havingValue = "local", matchIfMissing = true)
public class LocalFileStorageService implements FileStorageService {

    private final Path root = Paths.get("uploads");

    public LocalFileStorageService() {
        try {
            Files.createDirectories(root);
        } catch (IOException e) {
            throw new IllegalStateException("파일 업로드 디렉터리를 생성하지 못했습니다.", e);
        }
    }

    @Override
    public StoredFile store(MultipartFile file) {
        String originalName = StringUtils.cleanPath(
                file.getOriginalFilename() != null ? file.getOriginalFilename() : "file"
        );
        String storedName = UUID.randomUUID() + "_" + originalName;

        try {
            Files.copy(file.getInputStream(), root.resolve(storedName), StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new BusinessException(ErrorCode.FILE_UPLOAD_FAILED);
        }

        return new StoredFile("/uploads/" + storedName, originalName);
    }

    @Override
    public void delete(String url) {
        if (!StringUtils.hasText(url) || !url.startsWith("/uploads/")) {
            return;
        }
        try {
            Files.deleteIfExists(root.resolve(url.substring("/uploads/".length())));
        } catch (IOException e) {
            log.warn("Failed to delete local file: {}", url, e);
        }
    }
}
