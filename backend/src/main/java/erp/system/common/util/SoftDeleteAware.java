package erp.system.common.util;

import jakarta.persistence.EntityNotFoundException;
import org.hibernate.proxy.HibernateProxy;

import java.util.function.Consumer;
import java.util.function.LongSupplier;

// 소프트 삭제(@SQLRestriction("deleted=false")) 대상 엔티티가 다른 엔티티의 연관관계로
// 지연 로딩될 때, 이미 삭제된 행이면 Hibernate가 EntityNotFoundException을 던진다.
// 발령/증명서/근태/공지 등 이력성 데이터는 연관된 직원·부서 등이 나중에 삭제되어도
// 화면에 계속 표시되어야 하므로, 이 클래스로 지연 로딩 실패를 방어한다.
public final class SoftDeleteAware {

    private SoftDeleteAware() {
    }

    // touch가 프록시 초기화 중 실패하면(연관 엔티티가 소프트 삭제됨) null을 반환한다.
    public static <T> T resolve(T entity, Consumer<T> touch) {
        if (entity == null) {
            return null;
        }
        try {
            touch.accept(entity);
            return entity;
        } catch (EntityNotFoundException e) {
            return null;
        }
    }

    // DB 조회 없이 프록시에 저장된 식별자를 그대로 꺼낸다. 이미 초기화된 엔티티라면 직접 조회한다.
    public static Long identifierOf(Object entity, LongSupplier directId) {
        if (entity == null) {
            return null;
        }
        if (entity instanceof HibernateProxy proxy) {
            return (Long) proxy.getHibernateLazyInitializer().getIdentifier();
        }
        return directId.getAsLong();
    }
}
