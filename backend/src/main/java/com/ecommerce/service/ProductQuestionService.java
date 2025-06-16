package com.ecommerce.service;

import com.ecommerce.model.ProductQuestion;
import com.ecommerce.model.User;
import com.ecommerce.repository.ProductQuestionRepository;
import com.ecommerce.repository.ProductRepository;
import com.ecommerce.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class ProductQuestionService {

    @Autowired
    private ProductQuestionRepository questionRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private UserRepository userRepository;

    @Transactional(readOnly = true)
    public Page<ProductQuestion> getProductQuestions(Long productId, Pageable pageable) {
        return questionRepository.findByProductIdAndPublicQuestionTrueAndActiveTrue(productId, pageable);
    }

    @Transactional(readOnly = true)
    public Page<ProductQuestion> getUserQuestions(Long userId, Pageable pageable) {
        return questionRepository.findByUserIdAndActiveTrue(userId, pageable);
    }

    @Transactional(readOnly = true)
    public Page<ProductQuestion> getUnansweredQuestions(Pageable pageable) {
        return questionRepository.findByAnsweredFalseAndActiveTrue(pageable);
    }

    @Transactional
    public ProductQuestion askQuestion(Long productId, Long userId, String questionText) {
        ProductQuestion question = new ProductQuestion();
        question.setProduct(productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found")));
        question.setUser(userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found")));
        question.setQuestion(questionText);
        return questionRepository.save(question);
    }

    @Transactional
    public ProductQuestion answerQuestion(Long questionId, Long answererId, String answerText) {
        ProductQuestion question = questionRepository.findById(questionId)
                .orElseThrow(() -> new RuntimeException("Question not found"));
        
        User answerer = userRepository.findById(answererId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        question.setAnswer(answerText);
        question.setAnsweredBy(answerer);
        question.setAnsweredAt(LocalDateTime.now());
        question.setAnswered(true);
        
        return questionRepository.save(question);
    }

    @Transactional
    public ProductQuestion voteHelpful(Long questionId) {
        ProductQuestion question = questionRepository.findById(questionId)
                .orElseThrow(() -> new RuntimeException("Question not found"));
        question.setHelpfulVotes(question.getHelpfulVotes() + 1);
        return questionRepository.save(question);
    }

    @Transactional
    public ProductQuestion reportQuestion(Long questionId) {
        ProductQuestion question = questionRepository.findById(questionId)
                .orElseThrow(() -> new RuntimeException("Question not found"));
        question.setReportCount(question.getReportCount() + 1);
        
        // If report count exceeds threshold, hide the question
        if (question.getReportCount() >= 5) {
            question.setPublicQuestion(false);
        }
        
        return questionRepository.save(question);
    }

    @Transactional
    public void deleteQuestion(Long questionId) {
        ProductQuestion question = questionRepository.findById(questionId)
                .orElseThrow(() -> new RuntimeException("Question not found"));
        question.setActive(false);
        questionRepository.save(question);
    }

    @Transactional(readOnly = true)
    public Page<ProductQuestion> getMostHelpfulQuestions(Long productId, Pageable pageable) {
        return questionRepository.findByProductIdAndPublicQuestionTrueAndActiveTrueOrderByHelpfulVotesDesc(
            productId, pageable);
    }
} 