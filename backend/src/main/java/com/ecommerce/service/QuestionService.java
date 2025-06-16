package com.ecommerce.service;

import com.ecommerce.model.Answer;
import com.ecommerce.model.Product;
import com.ecommerce.model.Question;
import com.ecommerce.model.User;
import com.ecommerce.repository.AnswerRepository;
import com.ecommerce.repository.ProductRepository;
import com.ecommerce.repository.QuestionRepository;
import com.ecommerce.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class QuestionService {

    @Autowired
    private QuestionRepository questionRepository;
    
    @Autowired
    private AnswerRepository answerRepository;
    
    @Autowired
    private ProductRepository productRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Transactional(readOnly = true)
    public Page<Question> getQuestionsByProductId(Long productId, Pageable pageable) {
        return questionRepository.findByProductId(productId, pageable);
    }
    
    @Transactional(readOnly = true)
    public List<Question> getAllQuestionsByProductId(Long productId) {
        return questionRepository.findByProductIdOrderByCreatedAtDesc(productId);
    }
    
    @Transactional(readOnly = true)
    public Page<Question> getQuestionsByUserId(Long userId, Pageable pageable) {
        return questionRepository.findByUserId(userId, pageable);
    }
    
    @Transactional
    public Question askQuestion(Long productId, Long userId, String text) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + productId));
        
        Question question = new Question();
        question.setText(text);
        question.setUser(user);
        question.setProduct(product);
        
        return questionRepository.save(question);
    }
    
    @Transactional
    public Answer answerQuestion(Long questionId, Long adminId, String text) {
        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new RuntimeException("Admin not found with id: " + adminId));
        
        if (!admin.isAdmin()) {
            throw new RuntimeException("Only admins can answer questions");
        }
        
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new RuntimeException("Question not found with id: " + questionId));
        
        // Check if question already has an answer
        answerRepository.findByQuestionId(questionId).ifPresent(existingAnswer -> {
            throw new RuntimeException("Question already has an answer");
        });
        
        Answer answer = new Answer();
        answer.setText(text);
        answer.setAdmin(admin);
        answer.setQuestion(question);
        
        return answerRepository.save(answer);
    }
    
    @Transactional
    public Answer updateAnswer(Long answerId, String newText, Long adminId) {
        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new RuntimeException("Admin not found with id: " + adminId));
        
        if (!admin.isAdmin()) {
            throw new RuntimeException("Only admins can update answers");
        }
        
        Answer answer = answerRepository.findById(answerId)
                .orElseThrow(() -> new RuntimeException("Answer not found with id: " + answerId));
        
        answer.setText(newText);
        
        return answerRepository.save(answer);
    }
    
    @Transactional
    public void deleteQuestion(Long questionId, Long userId) {
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new RuntimeException("Question not found with id: " + questionId));
        
        // Only allow deletion if user is the author or an admin
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        
        if (!user.isAdmin() && !question.getUser().getId().equals(userId)) {
            throw new RuntimeException("Not authorized to delete this question");
        }
        
        questionRepository.delete(question);
    }
} 