package erp.system.employee.entity;

import erp.system.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDate;

@Getter
@Setter
@Entity
@Table(name = "employee")
@SQLRestriction("deleted=false")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Employee extends BaseEntity {

    public static final String STATUS_ACTIVE = "ACTIVE";
    public static final String STATUS_RESIGNED = "RESIGNED";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "employee_id")
    private Long employeeId;
    @Column(name = "employee_no", nullable = false, length = 30, unique = true)
    private String employeeNo;

//    @ManyToOne(fetch = FetchType.LAZY)
//    @JoinColumn(name = "department_id")
//    private Department department;
//
//    @ManyToOne(fetch = FetchType.LAZY)
//    @JoinColumn(name = "position_id")
//    private Position position;
//
//    @ManyToOne(fetch = FetchType.LAZY)
//    @JoinColumn(name = "employment_type_id")
//    private EmploymentType employmentType;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "birth_date")
    private LocalDate birthDate;

    @Column(name = "phone", length = 30)
    private String phone;

    @Column(name = "email", length = 100, unique = true)
    private String email;

    @Column(name = "address", length = 255)
    private String address;

    @Column(name = "hire_date")
    private LocalDate hireDate;

    @Column(name = "resignation_date")
    private LocalDate resignationDate;

    @Column(name = "employee_status_code", length = 30)
    private String employeeStatusCode;

    @Column(name = "bank_name", length = 100)
    private String bankName;

    @Column(name = "account_number", length = 100)
    private String accountNumber;

    @Column(name = "account_holder", length = 100)
    private String accountHolder;

    @Column(name = "password", nullable = false, length = 100)
    private String password;


    @Builder
    public Employee(String employeeNo, String name, LocalDate birthDate, String phone, String email, String address, LocalDate hireDate,
                    String employeeStatusCode, String bankName, String accountNumber, String accountHolder, String password) {
        this.employeeNo = employeeNo;
        this.name = name;
        this.birthDate = birthDate;
        this.phone = phone;
        this.email = email;
        this.address = address;
        this.hireDate = hireDate;
        this.employeeStatusCode = employeeStatusCode == null ? STATUS_ACTIVE : employeeStatusCode;
        this.bankName = bankName;
        this.accountNumber = accountNumber;
        this.accountHolder = accountHolder;
        this.password = password;
    }


    public void update(String name,
                       LocalDate birthDate, String phone, String email, String address, LocalDate hireDate,
                       LocalDate resignationDate, String employeeStatusCode, String bankName, String accountNumber,
                       String accountHolder) {

        this.name = name;
        this.birthDate = birthDate;
        this.phone = phone;
        this.email = email;
        this.address = address;
        this.hireDate = hireDate;
        this.resignationDate = resignationDate;
        this.employeeStatusCode = employeeStatusCode;
        this.bankName = bankName;
        this.accountNumber = accountNumber;
        this.accountHolder = accountHolder;
    }

    public void changePassword(String encodedPassword) {
        this.password = encodedPassword;
    }

    public boolean isLoginable() {
        return isActive() && !isDeleted() && !STATUS_RESIGNED.equals(this.employeeStatusCode);
    }
}
