package erp.system.common.file;

import erp.system.common.exception.BusinessException;
import erp.system.common.exception.ErrorCode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.util.UUID;

/**
 * AWS S3 버킷에 파일을 저장한다. {@code file.storage.type=s3}로 설정했을 때만 활성화되며,
 * 자격증명은 코드에 두지 않고 AWS SDK 기본 자격증명 체인(환경변수 AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY,
 * EC2/ECS 인스턴스 역할 등)을 그대로 사용한다.
 */
@Slf4j
@Service
@ConditionalOnProperty(name = "file.storage.type", havingValue = "s3")
public class S3FileStorageService implements FileStorageService {

    private final S3Client s3Client;
    private final String bucket;
    private final String region;
    private final String publicBaseUrl;

    public S3FileStorageService(
            @Value("${aws.s3.bucket}") String bucket,
            @Value("${aws.s3.region}") String region,
            @Value("${aws.s3.public-base-url:}") String publicBaseUrl
    ) {
        if (!StringUtils.hasText(bucket)) {
            throw new IllegalStateException("file.storage.type=s3 사용 시 AWS_S3_BUCKET 환경변수가 필요합니다.");
        }
        this.bucket = bucket;
        this.region = region;
        this.publicBaseUrl = publicBaseUrl;
        this.s3Client = S3Client.builder().region(Region.of(region)).build();
    }

    @Override
    public StoredFile store(MultipartFile file) {
        String originalName = StringUtils.cleanPath(
                file.getOriginalFilename() != null ? file.getOriginalFilename() : "file"
        );
        String key = "uploads/" + UUID.randomUUID() + "_" + originalName;

        try {
            s3Client.putObject(
                    PutObjectRequest.builder()
                            .bucket(bucket)
                            .key(key)
                            .contentType(file.getContentType())
                            .build(),
                    RequestBody.fromInputStream(file.getInputStream(), file.getSize())
            );
        } catch (IOException e) {
            throw new BusinessException(ErrorCode.FILE_UPLOAD_FAILED);
        }

        return new StoredFile(toUrl(key), originalName);
    }

    @Override
    public void delete(String url) {
        String key = toKey(url);
        if (key == null) {
            return;
        }
        try {
            s3Client.deleteObject(DeleteObjectRequest.builder().bucket(bucket).key(key).build());
        } catch (Exception e) {
            log.warn("Failed to delete S3 object: {}", url, e);
        }
    }

    private String toUrl(String key) {
        if (StringUtils.hasText(publicBaseUrl)) {
            return publicBaseUrl.replaceAll("/$", "") + "/" + key;
        }
        return "https://" + bucket + ".s3." + region + ".amazonaws.com/" + key;
    }

    private String toKey(String url) {
        if (!StringUtils.hasText(url)) {
            return null;
        }
        if (StringUtils.hasText(publicBaseUrl) && url.startsWith(publicBaseUrl)) {
            return url.substring(publicBaseUrl.replaceAll("/$", "").length() + 1);
        }
        String s3Prefix = "https://" + bucket + ".s3." + region + ".amazonaws.com/";
        if (url.startsWith(s3Prefix)) {
            return url.substring(s3Prefix.length());
        }
        return null;
    }
}
