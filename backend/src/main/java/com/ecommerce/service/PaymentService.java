package com.ecommerce.service;

import com.ecommerce.model.Order;
import com.ecommerce.model.Payment;
import com.ecommerce.model.User;
import com.ecommerce.repository.OrderRepository;
import com.ecommerce.repository.PaymentRepository;
import com.ecommerce.repository.UserRepository;
import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import com.stripe.model.PaymentMethod;
import com.stripe.param.PaymentIntentCreateParams;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class PaymentService {

    @Value("${stripe.api.key:sk_test_yourDefaultTestKeyHere}")
    private String stripeApiKey;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private UserRepository userRepository;

    @PostConstruct
    public void init() {
        Stripe.apiKey = stripeApiKey;
    }

    @Transactional
    public Payment processPayment(Long orderId, String cardToken, Long userId) throws StripeException {
        // Fetch order and verify it exists
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + orderId));

        // Fetch user and verify it exists
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        // Create Stripe payment intent
        PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                .setCurrency("usd")
                .setAmount(order.getTotal().multiply(BigDecimal.valueOf(100)).longValue()) // Convert to cents
                .setReceiptEmail(user.getEmail())
                .setDescription("Order #" + order.getId())
                .setConfirm(true)
                .setPaymentMethod(cardToken)
                .build();

        PaymentIntent intent = PaymentIntent.create(params);

        // Get payment method details
        PaymentMethod paymentMethod = PaymentMethod.retrieve(cardToken);
        String last4 = paymentMethod.getCard().getLast4();

        // Save payment to database
        Payment payment = new Payment();
        payment.setUser(user);
        payment.setAmount(order.getTotal());
        payment.setStatus("COMPLETED");
        payment.setPaymentMethod("CREDIT_CARD");
        payment.setTransactionReference(intent.getId());
        payment.setProcessedAt(LocalDateTime.now());
        payment.setMaskedCardNumber("xxxx-xxxx-xxxx-" + last4);
        
        Payment savedPayment = paymentRepository.save(payment);

        // Update order with payment information
        order.setPayment(savedPayment);
        order.setStatus("PAID");
        order.setUpdatedAt(LocalDateTime.now());
        orderRepository.save(order);

        return savedPayment;
    }

    @Transactional(readOnly = true)
    public List<Payment> getUserPayments(Long userId) {
        return paymentRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Transactional(readOnly = true)
    public Page<Payment> getUserPaymentsPaged(Long userId, Pageable pageable) {
        return paymentRepository.findByUserId(userId, pageable);
    }

    @Transactional(readOnly = true)
    public Payment getPaymentById(Long paymentId, Long userId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("Payment not found with id: " + paymentId));

        // Ensure payment belongs to the user
        if (!payment.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized access to payment");
        }

        return payment;
    }
} 