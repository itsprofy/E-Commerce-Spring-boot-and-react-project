package com.ecommerce.controller;

import com.ecommerce.model.Payment;
import com.ecommerce.service.PaymentService;
import com.stripe.exception.StripeException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001"})
public class PaymentController {

    @Autowired
    private PaymentService paymentService;

    @PostMapping("/process")
    public ResponseEntity<?> processPayment(@RequestBody Map<String, Object> paymentRequest,
                                          @RequestParam Long userId) {
        try {
            Long orderId = Long.valueOf(paymentRequest.get("orderId").toString());
            String cardToken = paymentRequest.get("cardToken").toString();
            
            Payment payment = paymentService.processPayment(orderId, cardToken, userId);
            return ResponseEntity.ok(payment);
        } catch (StripeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Error processing payment: " + e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<List<Payment>> getUserPayments(@RequestParam Long userId) {
        List<Payment> payments = paymentService.getUserPayments(userId);
        return ResponseEntity.ok(payments);
    }

    @GetMapping("/paged")
    public ResponseEntity<Page<Payment>> getUserPaymentsPaged(
            @RequestParam Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        PageRequest pageRequest = PageRequest.of(page, size, 
                Sort.by(Sort.Direction.DESC, "createdAt"));
        
        Page<Payment> payments = paymentService.getUserPaymentsPaged(userId, pageRequest);
        return ResponseEntity.ok(payments);
    }

    @GetMapping("/{paymentId}")
    public ResponseEntity<Payment> getPaymentById(
            @PathVariable Long paymentId,
            @RequestParam Long userId) {
        
        Payment payment = paymentService.getPaymentById(paymentId, userId);
        return ResponseEntity.ok(payment);
    }
} 