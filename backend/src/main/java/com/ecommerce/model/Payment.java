package com.ecommerce.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "payments")
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private BigDecimal amount;

    @Column(nullable = false)
    private String status;  // "PENDING", "COMPLETED", "FAILED"

    @Column(nullable = false)
    private String paymentMethod;  // "CREDIT_CARD", "PAYPAL", etc.

    // Masked card number (only last 4 digits)
    @Column(length = 19)
    private String maskedCardNumber;

    // Transaction reference from payment processor
    private String transactionReference;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime processedAt;
} 