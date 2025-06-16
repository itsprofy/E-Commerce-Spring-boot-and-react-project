package com.ecommerce.controller;

import com.ecommerce.model.Order;
import com.ecommerce.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001"})
public class OrderController {

    @Autowired
    private OrderService orderService;

    @GetMapping
    public ResponseEntity<List<Order>> getUserOrders(@RequestParam Long userId) {
        List<Order> orders = orderService.getUserOrders(userId);
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/paged")
    public ResponseEntity<Page<Order>> getUserOrdersPaged(
            @RequestParam Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        PageRequest pageRequest = PageRequest.of(page, size, 
                Sort.by(Sort.Direction.DESC, "createdAt"));
        
        Page<Order> orders = orderService.getUserOrdersPaged(userId, pageRequest);
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<Order> getOrderById(
            @PathVariable Long orderId,
            @RequestParam Long userId) {
        
        Order order = orderService.getOrderById(orderId, userId);
        return ResponseEntity.ok(order);
    }

    @PostMapping
    public ResponseEntity<?> createOrder(@RequestBody Map<String, Object> orderRequest) {
        try {
            Long userId = Long.valueOf(orderRequest.get("userId").toString());
            
            @SuppressWarnings("unchecked")
            Map<Long, Integer> cartItems = (Map<Long, Integer>) orderRequest.get("cartItems");
            
            String shippingName = (String) orderRequest.get("shippingName");
            String shippingAddress = (String) orderRequest.get("shippingAddress");
            String shippingCity = (String) orderRequest.get("shippingCity");
            String shippingState = (String) orderRequest.get("shippingState");
            String shippingZip = (String) orderRequest.get("shippingZip");
            String shippingCountry = (String) orderRequest.get("shippingCountry");

            Order order = orderService.createOrder(
                userId, cartItems, shippingName, shippingAddress,
                shippingCity, shippingState, shippingZip, shippingCountry
            );
            
            return ResponseEntity.ok(order);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Error creating order: " + e.getMessage()));
        }
    }

    @PatchMapping("/{orderId}/status")
    public ResponseEntity<?> updateOrderStatus(
            @PathVariable Long orderId,
            @RequestBody Map<String, String> statusUpdate) {
        
        try {
            String status = statusUpdate.get("status");
            Order order = orderService.updateOrderStatus(orderId, status);
            return ResponseEntity.ok(order);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Error updating order status: " + e.getMessage()));
        }
    }
} 