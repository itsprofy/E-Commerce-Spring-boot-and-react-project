package com.ecommerce.controller;

import com.ecommerce.model.Answer;
import com.ecommerce.model.Question;
import com.ecommerce.service.QuestionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/general-questions")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001"})
public class QuestionController {

    @Autowired
    private QuestionService questionService;

    @GetMapping("/product/{productId}")
    public ResponseEntity<Page<Question>> getQuestionsByProductId(
            @PathVariable Long productId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        PageRequest pageRequest = PageRequest.of(page, size, 
                Sort.by(Sort.Direction.DESC, "createdAt"));
        
        Page<Question> questions = questionService.getQuestionsByProductId(productId, pageRequest);
        return ResponseEntity.ok(questions);
    }

    @GetMapping("/product/{productId}/all")
    public ResponseEntity<List<Question>> getAllQuestionsByProductId(@PathVariable Long productId) {
        List<Question> questions = questionService.getAllQuestionsByProductId(productId);
        return ResponseEntity.ok(questions);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<Page<Question>> getQuestionsByUserId(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        PageRequest pageRequest = PageRequest.of(page, size, 
                Sort.by(Sort.Direction.DESC, "createdAt"));
        
        Page<Question> questions = questionService.getQuestionsByUserId(userId, pageRequest);
        return ResponseEntity.ok(questions);
    }

    @PostMapping("/product/{productId}")
    public ResponseEntity<?> askQuestion(
            @PathVariable Long productId,
            @RequestParam Long userId,
            @RequestBody Map<String, String> questionRequest) {
        
        try {
            String text = questionRequest.get("text");
            Question question = questionService.askQuestion(productId, userId, text);
            return ResponseEntity.ok(question);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Error asking question: " + e.getMessage()));
        }
    }

    @PostMapping("/{questionId}/answer")
    public ResponseEntity<?> answerQuestion(
            @PathVariable Long questionId,
            @RequestParam Long adminId,
            @RequestBody Map<String, String> answerRequest) {
        
        try {
            String text = answerRequest.get("text");
            Answer answer = questionService.answerQuestion(questionId, adminId, text);
            return ResponseEntity.ok(answer);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Error answering question: " + e.getMessage()));
        }
    }

    @PutMapping("/answer/{answerId}")
    public ResponseEntity<?> updateAnswer(
            @PathVariable Long answerId,
            @RequestParam Long adminId,
            @RequestBody Map<String, String> updateRequest) {
        
        try {
            String text = updateRequest.get("text");
            Answer answer = questionService.updateAnswer(answerId, text, adminId);
            return ResponseEntity.ok(answer);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Error updating answer: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{questionId}")
    public ResponseEntity<?> deleteQuestion(
            @PathVariable Long questionId,
            @RequestParam Long userId) {
        
        try {
            questionService.deleteQuestion(questionId, userId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Error deleting question: " + e.getMessage()));
        }
    }
} 