package com.examly.springapp.controller;

import com.examly.springapp.model.*;
import com.examly.springapp.repository.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.annotation.DirtiesContext;
import java.util.*;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
public class OrderControllerTest {
    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private ProductRepository productRepository;
    @Autowired
    private OrderRepository orderRepository;
    @Autowired
    private ObjectMapper objectMapper;

    private Product product1;
    private Product product2;

    @BeforeEach
    void setUp() {
        orderRepository.deleteAll();
        productRepository.deleteAll();
        product1 = Product.builder().name("Phone").description("Phone").price(100.0).category("Electronics").stockQuantity(10).build();
        product2 = Product.builder().name("TV").description("TV").price(300.0).category("Electronics").stockQuantity(5).build();
        productRepository.saveAll(List.of(product1, product2));
    }

    @Test
    void controller_orderControllerCreateTest() throws Exception {
        var orderPayload = new HashMap<>();
        orderPayload.put("customerName", "John Doe");
        orderPayload.put("customerEmail", "john@example.com");
        orderPayload.put("shippingAddress", "123 Main St");
        List<Map<String, Object>> orderItems = List.of(
                Map.of("productId", product1.getId(), "quantity", 2),
                Map.of("productId", product2.getId(), "quantity", 1)
        );
        orderPayload.put("orderItems", orderItems);
        List<Map<String, Object>> invalidOrderItems = List.of(
                Map.of("productId", 999999, "quantity", 2)
        );
        // Success
        mockMvc.perform(post("/api/orders")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(
                    Map.of(
                        "customerName", "John Doe",
                        "customerEmail", "john@example.com",
                        "shippingAddress", "123 Main St",
                        "orderItems", orderItems
                    )))
        )
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.customerName").value("John Doe"))
                .andExpect(jsonPath("$.orderItems", hasSize(2)))
                .andExpect(jsonPath("$.totalAmount", is(closeTo(500.0, 0.01))));

        // Product missing
        mockMvc.perform(post("/api/orders")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(
                    Map.of(
                        "customerName", "Jane",
                        "customerEmail", "jane@example.com",
                        "shippingAddress", "1 King St",
                        "orderItems", invalidOrderItems
                    )
                )))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Product not found"));

        // Insufficient stock
        List<Map<String, Object>> overstockItems = List.of(
                Map.of("productId", product2.getId(), "quantity", 100)
        );
        mockMvc.perform(post("/api/orders")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(
                    Map.of(
                        "customerName", "Bob",
                        "customerEmail", "bob@example.com",
                        "shippingAddress", "101 Ocean",
                        "orderItems", overstockItems
                    )
                )))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Insufficient stock"));

        // Check stock update
        Optional<Product> p = productRepository.findById(product1.getId());
        assert(p.isPresent());
        assert(p.get().getStockQuantity() == 8);
    }

    @Test
    void controller_orderControllerUpdateStatusTest() throws Exception {
        // Create order
        var orderPayload =  Map.of(
            "customerName", "Harry",
            "customerEmail", "harry@example.com",
            "shippingAddress", "11 Lane",
            "orderItems", List.of(Map.of("productId", product1.getId(), "quantity", 1))
        );
        String response = mockMvc.perform(post("/api/orders")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(orderPayload)))
                .andReturn().getResponse().getContentAsString();
        Order createdOrder = objectMapper.readValue(response, Order.class);
        Long id = createdOrder.getId();

        // Change status to SHIPPED
        mockMvc.perform(patch("/api/orders/" + id + "/status")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("status", "SHIPPED"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("SHIPPED"));
        // Invalid status
        mockMvc.perform(patch("/api/orders/" + id + "/status")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("status", "NOT-A-STATUS"))))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("Invalid status"));
        // Not found
        mockMvc.perform(patch("/api/orders/99999/status")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("status", "SHIPPED"))))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.message").value("Order not found"));
    }
}
