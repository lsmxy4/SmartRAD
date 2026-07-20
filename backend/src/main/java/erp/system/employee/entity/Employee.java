package erp.system.employee.entity;

import erp.system.common.entity.BaseEntity;
import erp.system.department.entity.Department;
import erp.system.employmenttype.entity.EmploymentType;
import erp.system.position.entity.Position;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLRestriction;

import java.math.BigDecimal;
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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "position_id")
    private Position position;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employment_type_id")
    private EmploymentType employmentType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manager_id")
    private Employee manager;

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

    @Column(name = "base_salary", precision = 12, scale = 0)
    private BigDecimal baseSalary;

    @Column(name = "password", nullable = false, length = 100)
    private String password;

    @Column(name = "profile_image", columnDefinition = "LONGTEXT")
    private String profileImage;


    @Builder
    public Employee(String employeeNo, Department department, Position position, EmploymentType employmentType,
                    Employee manager, String name, LocalDate birthDate, String phone, String email, String address, LocalDate hireDate,
                    String employeeStatusCode, String bankName, String accountNumber, String accountHolder, String password,
                    String profileImage) {
        this.employeeNo = employeeNo;
        this.department = department;
        this.position = position;
        this.employmentType = employmentType;
        this.manager = manager;
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
        this.profileImage = profileImage;
    }


    public void update(EmploymentType employmentType, String name,
                       LocalDate birthDate, String phone, String email, String address, LocalDate hireDate,
                       LocalDate resignationDate, String employeeStatusCode, String bankName, String accountNumber,
                       String accountHolder, String profileImage) {

        this.employmentType = employmentType;
        this.name = name;
        this.birthDate = birthDate;
        this.phone = phone;
        this.email = email;
        this.address = address;
        this.hireDate = hireDate;
        this.resignationDate = resignationDate;
        this.profileImage = profileImage;
        this.employeeStatusCode = employeeStatusCode;
        this.bankName = bankName;
        this.accountNumber = accountNumber;
        this.accountHolder = accountHolder;
    }

    public void changePassword(String encodedPassword) {
        this.password = encodedPassword;
    }

    public void updateBaseSalary(BigDecimal baseSalary) {
        this.baseSalary = baseSalary;
    }

    public void changeEmploymentType(EmploymentType employmentType) {
        this.employmentType = employmentType;
    }

    public void updatePayrollAccount(String bankName, String accountNumber, String accountHolder) {
        this.bankName = bankName;
        this.accountNumber = accountNumber;
        this.accountHolder = accountHolder;
    }

    public boolean isLoginable() {
        return isActive() && !isDeleted() && !STATUS_RESIGNED.equals(this.employeeStatusCode);
    }

    public void applyAppointment(Department department, Position position) {
        if (department != null) {
            this.department = department;
        }
        if (position != null) {
            this.position = position;
        }
    }

    public void resign(LocalDate resignationDate) {
        this.resignationDate = resignationDate;
        this.employeeStatusCode = STATUS_RESIGNED;
    }
}
