package com.ecommerce.service;

import com.ecommerce.model.Comment;
import com.ecommerce.model.Product;
import com.ecommerce.repository.CommentRepository;
import com.ecommerce.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CommentService {

    @Autowired
    private CommentRepository commentRepository;
    
    @Autowired
    private ProductRepository productRepository;
    
    public Page<Comment> getCommentsByProductId(Long productId, Pageable pageable) {
        return commentRepository.findByProductId(productId, pageable);
    }
    
    public Page<Comment> getStarredCommentsByProductId(Long productId, Pageable pageable) {
        return commentRepository.findByProductIdAndStarredTrue(productId, pageable);
    }
    
    @Transactional
    public Comment addComment(Long productId, Comment comment) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + productId));
        
        comment.setProduct(product);
        return commentRepository.save(comment);
    }
    
    @Transactional
    public Comment updateComment(Long id, Comment commentDetails) {
        Comment comment = commentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Comment not found with id: " + id));
        
        // Update fields
        comment.setText(commentDetails.getText());
        comment.setRating(commentDetails.getRating());
        comment.setStarred(commentDetails.isStarred());
        
        return commentRepository.save(comment);
    }
    
    @Transactional
    public void toggleStarredComment(Long id) {
        Comment comment = commentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Comment not found with id: " + id));
        
        comment.setStarred(!comment.isStarred());
        commentRepository.save(comment);
    }
    
    @Transactional
    public void deleteComment(Long id) {
        if (!commentRepository.existsById(id)) {
            throw new RuntimeException("Comment not found with id: " + id);
        }
        commentRepository.deleteById(id);
    }
} 