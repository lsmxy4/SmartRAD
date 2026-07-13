package erp.system;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

// common/employee/security가 이제 전부 erp.system 하위 패키지라 기본 컴포넌트 스캔으로 다 잡힘.
// createdAt/updatedAt 자동 채움을 위해 EnableJpaAuditing만 유지.
@SpringBootApplication
@EnableJpaAuditing
public class SystemApplication {

	public static void main(String[] args) {
		SpringApplication.run(SystemApplication.class, args);
	}

}
