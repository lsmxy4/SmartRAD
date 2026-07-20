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
                        .requestMatchers(HttpMethod.GET, "/api/employees").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/departments/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/positions/**").permitAll()

                        // 직원 관리 - 조회는 로그인만 하면 가능, 등록/수정/삭제/전사 조회는 관리자 전용
                        .requestMatchers(HttpMethod.GET, "/api/employees/payroll-summary").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/employees/*").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/employees").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/employees/*").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/employees/*").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PATCH, "/api/employees/**").hasRole("ADMIN")

                        // 인사 발령 - 본인 이력 조회는 로그인만 하면 가능, 나머지는 관리자 전용
                        .requestMatchers(HttpMethod.GET, "/api/appointments/me").authenticated()
                        .requestMatchers("/api/appointments/**").hasRole("ADMIN")

                        // 근태 - 전사 현황 조회/수동등록은 관리자, 본인 출퇴근 체크는 로그인만 하면 가능
                        .requestMatchers(HttpMethod.GET, "/api/attendances", "/api/attendances/monthly-summary").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/attendances").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/attendances/check-in").authenticated()
                        .requestMatchers(HttpMethod.PATCH, "/api/attendances/check-out").authenticated()

                        // 제증명서 - 승인/반려/발급 처리는 관리자 전용, 신청/조회는 로그인만 하면 가능
                        .requestMatchers(HttpMethod.PATCH, "/api/certificate-issues/**").hasRole("ADMIN")

                        // 휴가정책 관리 - 등록/삭제는 관리자 전용
                        .requestMatchers(HttpMethod.POST, "/api/leave-policies").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/leave-policies/**").hasRole("ADMIN")

                        // 휴가 승인/반려/일괄승인 - 관리자 전용
                        .requestMatchers(HttpMethod.PATCH, "/api/leave-requests/**").hasRole("ADMIN")

                        // 휴가 잔여일수 수동 등록 - 관리자 전용
                        .requestMatchers(HttpMethod.POST, "/api/leave-balances").hasRole("ADMIN")

                        // 공통 마스터데이터(휴가유형/고용형태/부서/직급) 등록 - 관리자 전용
                        .requestMatchers(HttpMethod.POST, "/api/leave-types", "/api/employment-types", "/api/departments", "/api/positions").hasRole("ADMIN")

                        // 공지사항 - 등록/수정/삭제는 관리자 전용, 조회는 로그인만 하면 가능
                        .requestMatchers(HttpMethod.POST, "/api/notices").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/notices/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/notices/**").hasRole("ADMIN")

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
