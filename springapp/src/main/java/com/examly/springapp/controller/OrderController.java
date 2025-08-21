package com.examly.springapp.controller;

import com.examly.springapp.dto.OrderCreateRequest;
import com.examly.springapp.dto.OrderStatusUpdateRequest;
import com.examly.springapp.model.Order;
import com.examly.springapp.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController

@RequestMapping("/api/orders")

@CrossOrigin(origins = "http://localhost:8081")

public class OrderController {

private final OrderService orderService;



public OrderController(OrderService orderService) {

    this.orderService = orderService;

}



@PostMapping

public ResponseEntity<Order> createOrder(@Valid @RequestBody OrderCreateRequest request) {

    return ResponseEntity.status(201).body(orderService.createOrder(request));

}



@GetMapping

public ResponseEntity<List<Order>> getAllOrders() {

    return ResponseEntity.ok(orderService.getAllOrders());

}



@GetMapping("/{id}")

public ResponseEntity<Order> getOrderById(@PathVariable Long id) {

    return ResponseEntity.ok(orderService.getOrderById(id));

}



@PatchMapping("/{id}/status")

public ResponseEntity<Order> updateOrderStatus(@PathVariable Long id, @RequestBody OrderStatusUpdateRequest req) {

    return ResponseEntity.ok(orderService.updateStatus(id, req));

}

@DeleteMapping("/{id}")

public ResponseEntity<Void> deleteOrder(@PathVariable Long id) {

orderService.deleteOrder(id);

return ResponseEntity.noContent().build();

}

}

