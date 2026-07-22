package erp.system.security;

import erp.system.auth.jwt.JwtAuthenticationEntryPoint;
import erp.system.auth.jwt.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // 403 발생 시 서블릿 컨테이너가 내부적으로 /error로 forward하는데, 이 경로가 인증을 요구하면
                        // 재요청 시 인증 정보가 없어 403이 401로 덮어써지므로 명시적으로 열어둔다.
                        .requestMatchers("/error").permitAll()
                        .requestMatchers("/api/auth/**").permitAll()
                        // 업로드된 첨부파일은 추측 불가능한 파일명(UUID 접두사)으로만 접근 가능하며,
                        // <a href> 다운로드/새 탭 열기 시 Authorization 헤더가 실리지 않으므로 permitAll 처리
                        .requestMatchers("/uploads/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/employees").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/departments/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/positions/**").permitAll()

                        // 직원 관리 - 조회는 로그인만 하면 가능, 수정은 본인 또는 관리자(컨트롤러에서 체크),
                        // 등록/삭제/전사 조회는 관리자 전용
                        .requestMatchers(HttpMethod.GET, "/api/employees/payroll-summary").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/employees/*").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/employees").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/employees/*").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/api/employees/*").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PATCH, "/api/employees/**").hasRole("ADMIN")

                        // 직원 첨부 서류 - 조회는 본인 또는 관리자(컨트롤러에서 체크), 업로드/삭제는 관리자 전용
                        .requestMatchers(HttpMethod.GET, "/api/employees/*/documents").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/employees/*/documents").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/employees/*/documents/*").hasRole("ADMIN")

                        // 인사 발령 - 본인 이력 조회는 로그인만 하면 가능, 나머지는 관리자 전용
                        .requestMatchers(HttpMethod.GET, "/api/appointments/me").authenticated()
                        .requestMatchers("/api/appointments/**").hasRole("ADMIN")

                        // 근태 - 전사 현황 조회/수동등록은 관리자, 본인 출퇴근 체크는 로그인만 하면 가능
                        .requestMatchers(HttpMethod.GET, "/api/attendances", "/api/attendances/monthly-summary").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/attendances").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/attendances/check-in").authenticated()
                        .requestMatchers(HttpMethod.PATCH, "/api/attendances/check-out").authenticated()

                        // 제증명서 - 본인 신청/내역 조회는 로그인만 하면 가능, 승인/반려/발급 처리 및
                        // 임의 사번 지정 조회·등록은 관리자 전용
                        .requestMatchers(HttpMethod.GET, "/api/certificate-issues/me").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/certificate-issues/me").authenticated()
                        .requestMatchers(HttpMethod.PATCH, "/api/certificate-issues/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/certificate-issues").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/certificate-issues").hasRole("ADMIN")

                        // 경조비 신청 - 본인 신청/내역 조회는 로그인만 하면 가능, 승인/반려/지급 처리 및 전체 조회는 관리자 전용
                        .requestMatchers(HttpMethod.GET, "/api/event-supports/me").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/event-supports/me").authenticated()
                        .requestMatchers(HttpMethod.PATCH, "/api/event-supports/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/event-supports/search").hasRole("ADMIN")

                        // 휴가정책 관리 - 등록/삭제는 관리자 전용
                        .requestMatchers(HttpMethod.POST, "/api/leave-policies").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/leave-policies/**").hasRole("ADMIN")

                        // 휴가 승인/반려/일괄승인 - 관리자 전용
                        .requestMatchers(HttpMethod.PATCH, "/api/leave-requests/me/*/cancel").authenticated()
                        .requestMatchers(HttpMethod.PATCH, "/api/leave-requests/**").hasRole("ADMIN")

                        // 휴가 잔여일수 수동 등록 - 관리자 전용
                        .requestMatchers(HttpMethod.POST, "/api/leave-balances").hasRole("ADMIN")

                        // 공통 마스터데이터(휴가유형/고용형태/부서/직급) 등록 - 관리자 전용
                        .requestMatchers(HttpMethod.POST, "/api/leave-types", "/api/employment-types", "/api/departments", "/api/positions").hasRole("ADMIN")

                        // 공지사항 - 등록/수정/삭제는 관리자 전용, 조회는 로그인만 하면 가능
                        .requestMatchers(HttpMethod.POST, "/api/notices").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/notices/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/notices/**").hasRole("ADMIN")

                        // AI 비서 - 로그인만 하면 가능 (본인 데이터만 근거로 답변)
                        .requestMatchers(HttpMethod.POST, "/api/assistant/**").authenticated()

                        // 급여 - 본인 명세서 조회는 로그인만 하면 가능, 계산/지급처리/항목관리/수당관리는 관리자 전용
                        .requestMatchers(HttpMethod.GET, "/api/payrolls/me", "/api/payrolls/me/*").authenticated()
                        .requestMatchers("/api/payrolls/**").hasRole("ADMIN")
                        .requestMatchers("/api/payroll-items/**").hasRole("ADMIN")
                        .requestMatchers("/api/allowances/**").hasRole("ADMIN")
                        .requestMatchers("/api/employee-allowances/**").hasRole("ADMIN")

                        .anyRequest().authenticated())
                .exceptionHandling(ex -> ex.authenticationEntryPoint(jwtAuthenticationEntryPoint))
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("http://localhost:3000"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
