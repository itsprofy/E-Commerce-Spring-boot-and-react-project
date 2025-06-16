package com.ecommerce.controller;

import com.ecommerce.model.ProductQuestion;
import com.ecommerce.service.ProductQuestionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/questions")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001"})
public class ProductQuestionController {

    @Autowired
    private ProductQuestionService questionService;

    @GetMapping("/product/{productId}")
    public ResponseEntity<Page<ProductQuestion>> getProductQuestions(
            @PathVariable Long productId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "askedAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDirection) {
        
        PageRequest pageRequest = PageRequest.of(page, size, 
            Sort.Direction.valueOf(sortDirection), sortBy);
        
        Page<ProductQuestion> questions = questionService.getProductQuestions(productId, pageRequest);
        return ResponseEntity.ok(questions);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<Page<ProductQuestion>> getUserQuestions(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        PageRequest pageRequest = PageRequest.of(page, size, 
            Sort.Direction.DESC, "askedAt");
        
        Page<ProductQuestion> questions = questionService.getUserQuestions(userId, pageRequest);
        return ResponseEntity.ok(questions);
    }

    @GetMapping("/unanswered")
    public ResponseEntity<Page<ProductQuestion>> getUnansweredQuestions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        PageRequest pageRequest = PageRequest.of(page, size, 
            Sort.Direction.ASC, "askedAt");
        
        Page<ProductQuestion> questions = questionService.getUnansweredQuestions(pageRequest);
        return ResponseEntity.ok(questions);
    }

    @PostMapping("/ask")
    public ResponseEntity<?> askQuestion(@RequestBody Map<String, Object> request) {
        try {
            Long productId = Long.valueOf(request.get("productId").toString());
            Long userId = Long.valueOf(request.get("userId").toString());
            String questionText = request.get("question").toString();
            
            ProductQuestion question = questionService.askQuestion(productId, userId, questionText);
            return ResponseEntity.ok(question);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Error asking question: " + e.getMessage()));
        }
    }

    @PostMapping("/{questionId}/answer")
    public ResponseEntity<?> answerQuestion(
            @PathVariable Long questionId,
            @RequestBody Map<String, Object> request) {
        try {
            Long answererId = Long.valueOf(request.get("answererId").toString());
            String answerText = request.get("answer").toString();
            
            ProductQuestion question = questionService.answerQuestion(questionId, answererId, answerText);
            return ResponseEntity.ok(question);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Error answering question: " + e.getMessage()));
        }
    }

    @PostMapping("/{questionId}/vote")
    public ResponseEntity<?> voteHelpful(@PathVariable Long questionId) {
        try {
            ProductQuestion question = questionService.voteHelpful(questionId);
            return ResponseEntity.ok(question);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Error voting for question: " + e.getMessage()));
        }
    }

    @PostMapping("/{questionId}/report")
    public ResponseEntity<?> reportQuestion(@PathVariable Long questionId) {
        try {
            ProductQuestion question = questionService.reportQuestion(questionId);
            return ResponseEntity.ok(question);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Error reporting question: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{questionId}")
    public ResponseEntity<?> deleteQuestion(@PathVariable Long questionId) {
        try {
            questionService.deleteQuestion(questionId);
            return ResponseEntity.ok(Map.of("message", "Question deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Error deleting question: " + e.getMessage()));
        }
    }

    @GetMapping("/product/{productId}/helpful")
    public ResponseEntity<Page<ProductQuestion>> getMostHelpfulQuestions(
            @PathVariable Long productId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size) {
        
        PageRequest pageRequest = PageRequest.of(page, size);
        Page<ProductQuestion> questions = questionService.getMostHelpfulQuestions(productId, pageRequest);
        return ResponseEntity.ok(questions);
    }
} 