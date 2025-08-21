package com.examly.springapp.service;

import com.examly.springapp.dto.*;
import com.examly.springapp.model.*;
import com.examly.springapp.repository.*;
import jakarta.validation.ValidationException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository; // ✅ added

    private static final Set<String> VALID_STATUSES = Set.of(
        "PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"
    );

    // CREATE ORDER
    public Order createOrder(OrderCreateRequest request) {
        List<OrderItem> orderItems = new ArrayList<>();
        double total = 0.0;

        // ✅ Find User
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ValidationException("User not found"));

        // Prepare order
        Order order = new Order();
        order.setUser(user);
        order.setCustomerName(request.getCustomerName());
        order.setCustomerEmail(request.getCustomerEmail());
        order.setShippingAddress(request.getShippingAddress());
        order.setOrderDate(LocalDateTime.now());
        order.setStatus("PENDING");

        // Build order items
        for (OrderItemCreateRequest itemReq : request.getOrderItems()) {
            Product product = productRepository.findById(itemReq.getProductId())
                    .orElseThrow(() -> new ValidationException("Product not found"));

            if (product.getStockQuantity() < itemReq.getQuantity()) {
                throw new ValidationException("Insufficient stock for product: " + product.getName());
            }

            // reduce stock
            product.setStockQuantity(product.getStockQuantity() - itemReq.getQuantity());
            productRepository.save(product);

            // build item
            OrderItem item = OrderItem.builder()
                    .product(product)
                    .quantity(itemReq.getQuantity())
                    .priceAtPurchase(product.getPrice())
                    .order(order) // link back
                    .build();

            orderItems.add(item);
            total += product.getPrice() * itemReq.getQuantity();
        }

        order.setOrderItems(orderItems);
        order.setTotalAmount(total);

        return orderRepository.save(order); // cascades items
    }

    // GET ALL ORDERS
    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    // GET ORDER BY ID
    public Order getOrderById(Long id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found"));
    }

    // UPDATE STATUS
    public Order updateStatus(Long id, OrderStatusUpdateRequest request) {
        Order order = getOrderById(id);
        String newStatus = request.getStatus().toUpperCase().trim();

        // Handle common typo
        if ("CANCELED".equals(newStatus)) {
            newStatus = "CANCELLED";
        }

        if (!VALID_STATUSES.contains(newStatus)) {
            throw new ValidationException(
                "Invalid status: '" + request.getStatus() + "'. " +
                "Allowed values: " + VALID_STATUSES
            );
        }

        String currentStatus = order.getStatus().toUpperCase();

        // Prevent changing delivered orders
        if ("DELIVERED".equals(currentStatus)) {
            throw new ValidationException("Cannot change status of delivered order");
        }

        // Special rules for cancellation
        if ("CANCELLED".equals(newStatus)) {
            if (!Set.of("PENDING", "PROCESSING").contains(currentStatus)) {
                throw new ValidationException(
                    "Can only cancel PENDING or PROCESSING orders. Current status: " + currentStatus
                );
            }
            restoreStock(order.getOrderItems());
        }

        order.setStatus(newStatus);
        return orderRepository.save(order);
    }

    // CANCEL ORDER (Dedicated method)
    public Order cancelOrder(Long id) {
        Order order = getOrderById(id);
        String currentStatus = order.getStatus().toUpperCase();

        if (!Set.of("PENDING", "PROCESSING").contains(currentStatus)) {
            throw new ValidationException(
                "Order cannot be cancelled in status: " + currentStatus + 
                ". Only PENDING/PROCESSING orders can be cancelled."
            );
        }

        restoreStock(order.getOrderItems());
        order.setStatus("CANCELLED");
        return orderRepository.save(order);
    }

    // Helper method to restore stock
    private void restoreStock(List<OrderItem> items) {
        items.forEach(item -> {
            Product product = item.getProduct();
            product.setStockQuantity(product.getStockQuantity() + item.getQuantity());
            productRepository.save(product);
        });
    }

    // DELETE ORDER
    public void deleteOrder(Long id) {
        Order order = getOrderById(id);
        orderRepository.delete(order);
    }
}
