package erp.system.employee.service;

import erp.system.common.exception.BusinessException;
import erp.system.common.exception.ErrorCode;
import erp.system.employee.dto.EmployeeCreateRequest;
import erp.system.employee.dto.EmployeeResponse;
import erp.system.employee.entity.Employee;
import erp.system.employee.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EmployeeService {
    private final EmployeeRepository employeeRepository;
//    private final DepartmentRepository departmentRepository;
//    private final PositionRepository positionRepository;
//    private final EmploymentTypeRepository employmentTypeRepository;
    private final PasswordEncoder passwordEncoder;

    public EmployeeResponse getById(Long employeeId){
        return EmployeeResponse.from(findActive(employeeId));
    }


    @Transactional
    public EmployeeResponse create(EmployeeCreateRequest request){
        if(employeeRepository.existsByEmployeeNo(request.employeeNo())){
            throw new BusinessException(ErrorCode.DUPLICATE_EMPLOYEE_NO);
        }
        if (request.email() != null && employeeRepository.existsByEmail(request.email())) {
            throw new BusinessException(ErrorCode.DUPLICATE_EMAIL);
        }
        Employee employee = Employee.builder()
                .employeeNo(request.employeeNo())
//                .department(resolveDepartment(request.departmentId()))
//                .position(resolvePosition(request.positionId()))
//                .employmentType(resolveEmploymentType(request.employmentTypeId()))
                .name(request.name())
                .birthDate(request.birthDate())
                .phone(request.phone())
                .email(request.email())
                .address(request.address())
                .hireDate(request.hireDate())
                .employeeStatusCode(request.employeeStatusCode())
                .bankName(request.bankName())
                .accountNumber(request.accountNumber())
                .accountHolder(request.accountHolder())
                .password(passwordEncoder.encode(request.password()))
                .build();

        return EmployeeResponse.from(employeeRepository.save(employee));
    }
    private Employee findActive(Long employeeId) {
        return employeeRepository.findById(employeeId)
                .orElseThrow(()->new BusinessException(ErrorCode.EMPLOYEE_NOT_FOUND));

    }
}
