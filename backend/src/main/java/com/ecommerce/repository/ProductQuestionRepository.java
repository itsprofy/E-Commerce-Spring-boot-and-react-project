package com.ecommerce.repository;

import com.ecommerce.model.ProductQuestion;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductQuestionRepository extends JpaRepository<ProductQuestion, Long> {
    // Find questions by product ID with pagination
    Page<ProductQuestion> findByProductIdAndPublicQuestionTrueAndActiveTrue(Long productId, Pageable pageable);
    
    // Find questions by user ID with pagination
    Page<ProductQuestion> findByUserIdAndActiveTrue(Long userId, Pageable pageable);
    
    // Find unanswered questions for admins/moderators
    Page<ProductQuestion> findByAnsweredFalseAndActiveTrue(Pageable pageable);
    
    // Find questions with high report counts
    List<ProductQuestion> findByReportCountGreaterThanAndActiveTrue(int reportThreshold);
    
    // Find most helpful questions for a product
    Page<ProductQuestion> findByProductIdAndPublicQuestionTrueAndActiveTrueOrderByHelpfulVotesDesc(
        Long productId, Pageable pageable);
} 