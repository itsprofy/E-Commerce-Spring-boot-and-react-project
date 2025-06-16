package com.ecommerce.repository;

import com.ecommerce.model.Comment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {
    Page<Comment> findByProductId(Long productId, Pageable pageable);
    Page<Comment> findByProductIdAndStarredTrue(Long productId, Pageable pageable);
} 