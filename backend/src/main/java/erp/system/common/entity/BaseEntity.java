package erp.system.common.entity;

import jakarta.persistence.Column;
import jakarta.persistence.MappedSuperclass;
import lombok.Getter;

@Getter
@MappedSuperclass
public abstract class BaseEntity extends  DeleteTableEntity{
    @Column(name = "active",nullable = false)
    private  boolean active =true;

    @Override
    public void markDeleted(){
        super.markDeleted();
        this.active=false;
    }
}
