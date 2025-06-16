package com.ecommerce.repository;

import com.ecommerce.model.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    @Query(value = "SELECT DISTINCT p FROM Product p LEFT JOIN FETCH p.category",
           countQuery = "SELECT COUNT(DISTINCT p) FROM Product p")
    Page<Product> findAll(Pageable pageable);

    @Query(value = "SELECT DISTINCT p FROM Product p LEFT JOIN FETCH p.category WHERE p.name LIKE %:name%",
           countQuery = "SELECT COUNT(DISTINCT p) FROM Product p WHERE p.name LIKE %:name%")
    Page<Product> findByNameContainingIgnoreCase(@Param("name") String name, Pageable pageable);

    @Query(value = "SELECT DISTINCT p FROM Product p LEFT JOIN FETCH p.category WHERE p.category.id = :categoryId",
           countQuery = "SELECT COUNT(DISTINCT p) FROM Product p WHERE p.category.id = :categoryId")
    Page<Product> findByCategoryId(@Param("categoryId") Long categoryId, Pageable pageable);

    @Query(value = "SELECT DISTINCT p FROM Product p LEFT JOIN FETCH p.category WHERE p.category.name LIKE %:categoryName%",
           countQuery = "SELECT COUNT(DISTINCT p) FROM Product p WHERE p.category.name LIKE %:categoryName%")
    Page<Product> findByCategoryNameContainingIgnoreCase(@Param("categoryName") String categoryName, Pageable pageable);

    @Query(value = "SELECT DISTINCT p FROM Product p LEFT JOIN FETCH p.category WHERE p.featured = true",
           countQuery = "SELECT COUNT(DISTINCT p) FROM Product p WHERE p.featured = true")
    Page<Product> findFeaturedProducts(Pageable pageable);

    Page<Product> findByFeaturedTrue(Pageable pageable);
    
    @Query(value = "SELECT DISTINCT p FROM Product p LEFT JOIN FETCH p.category WHERE p.name LIKE %:name% AND p.category.id = :categoryId",
           countQuery = "SELECT COUNT(DISTINCT p) FROM Product p WHERE p.name LIKE %:name% AND p.category.id = :categoryId")
    Page<Product> findByNameContainingIgnoreCaseAndCategoryId(@Param("name") String name, @Param("categoryId") Long categoryId, Pageable pageable);
} 