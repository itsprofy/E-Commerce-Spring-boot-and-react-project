package com.ecommerce.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "product_questions")
public class ProductQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 1000)
    private String question;

    @Column(length = 1000)
    private String answer;

    @ManyToOne
    @JoinColumn(name = "answered_by")
    private User answeredBy;

    @Column(nullable = false)
    private LocalDateTime askedAt = LocalDateTime.now();

    private LocalDateTime answeredAt;

    @Column(nullable = false)
    private boolean answered = false;

    @Column(nullable = false)
    private boolean publicQuestion = true;

    // Helpful votes count
    private int helpfulVotes = 0;

    // Report count for inappropriate content
    private int reportCount = 0;

    @Column(nullable = false)
    private boolean active = true;
} 