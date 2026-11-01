package com.practice.shop.catalog;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;

import java.util.Collection;
import java.util.List;
import java.util.Optional;


public interface ProductRepository extends JpaRepository<Product, Long> {

    @EntityGraph(attributePaths = "category")  
    @Query("""
            select p from Product p
            where p.active = true
            and (:categorySlug is null or p.category.slug = :categorySlug)
              and lower(p.name) like lower(concat('%', :search, '%'))
            """)
    Page<Product> search(@Param("categorySlug") String categorySlug,
                         @Param("search") String search,
                         Pageable pageable);

   @EntityGraph(attributePaths = "category")
   Optional<Product> findByIdAndActiveTrue(Long id);

   @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Product p where p.id in :ids order by p.id")
    List<Product> findAllByIdForUpdate(@Param("ids") Collection<Long> ids);

   @EntityGraph(attributePaths = "category")
    @Query("select p from Product p")
    Page<Product> findAllForAdmin(Pageable pageable);

   @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Product p join fetch p.category where p.id = :id")
    Optional<Product> findByIdForUpdate(@Param("id") Long id);
}
