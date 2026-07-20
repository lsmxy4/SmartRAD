package erp.system.department.dto;

import erp.system.common.util.SoftDeleteAware;
import erp.system.department.entity.Department;

public record DepartmentResponse(
        Long departmentId,
        String departmentName,
        Long parentDepartmentId,
        String parentDepartmentName
) {
    public static DepartmentResponse from(Department department) {
        Department parent = SoftDeleteAware.resolve(department.getParentDepartment(), Department::getDepartmentName);
        return new DepartmentResponse(
                department.getDepartmentId(),
                department.getDepartmentName(),
                SoftDeleteAware.identifierOf(parent, () -> parent.getDepartmentId()),
                parent != null ? parent.getDepartmentName() : null
        );
    }
}
