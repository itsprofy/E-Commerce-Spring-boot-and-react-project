package com.ecommerce.controller;

import com.ecommerce.model.Comment;
import com.ecommerce.service.CommentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/comments")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001"})
public class CommentController {

    @Autowired
    private CommentService commentService;
    
    @GetMapping("/product/{productId}")
    public ResponseEntity<Page<Comment>> getCommentsByProductId(
            @PathVariable Long productId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Comment> comments = commentService.getCommentsByProductId(productId, pageRequest);
        return ResponseEntity.ok(comments);
    }
    
    @GetMapping("/product/{productId}/starred")
    public ResponseEntity<Page<Comment>> getStarredCommentsByProductId(
            @PathVariable Long productId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Comment> starredComments = commentService.getStarredCommentsByProductId(productId, pageRequest);
        return ResponseEntity.ok(starredComments);
    }
    
    @PostMapping("/product/{productId}")
    public ResponseEntity<Comment> addComment(@PathVariable Long productId, @RequestBody Comment comment) {
        Comment newComment = commentService.addComment(productId, comment);
        return ResponseEntity.ok(newComment);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Comment> updateComment(@PathVariable Long id, @RequestBody Comment comment) {
        Comment updatedComment = commentService.updateComment(id, comment);
        return ResponseEntity.ok(updatedComment);
    }
    
    @PatchMapping("/{id}/toggle-star")
    public ResponseEntity<Void> toggleStarredComment(@PathVariable Long id) {
        commentService.toggleStarredComment(id);
        return ResponseEntity.ok().build();
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteComment(@PathVariable Long id) {
        commentService.deleteComment(id);
        return ResponseEntity.ok().build();
    }
} 