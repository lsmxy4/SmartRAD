package erp.system.common.file;

import org.springframework.web.multipart.MultipartFile;

public interface FileStorageService {

    StoredFile store(MultipartFile file);

    /**
     * @param url {@link StoredFile#url()}로 반환했던 값. 알 수 없는 형식(예: 레거시 base64 값)이면 조용히 무시한다.
     */
    void delete(String url);

    record StoredFile(String url, String originalName) {
    }
}
