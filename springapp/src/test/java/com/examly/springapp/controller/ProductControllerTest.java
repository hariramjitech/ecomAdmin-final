package com.examly.springapp.controller;

import com.examly.springapp.model.Product;
import com.examly.springapp.repository.ProductRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.annotation.DirtiesContext;

import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
public class ProductControllerTest {
    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private ProductRepository productRepository;
    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        productRepository.deleteAll();
    }

    @Test
    void controller_productControllerCreateTest() throws Exception {
        // Valid creation
        Product p = Product.builder()
                .name("Phone")
                .description("Mobile phone.")
                .price(120.0)
                .category("Electronics")
                .stockQuantity(10)
                .imageUrl("http://example.com/p.jpg")
                .build();
        mockMvc.perform(post("/api/products")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(p)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").exists())
            .andExpect(jsonPath("$.name").value("Phone"));

        // Invalid: negative price
        p.setPrice(-5.0);
        mockMvc.perform(post("/api/products")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(p)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("Invalid product data"));

        // Invalid: missing fields
        p.setName("");
        p.setPrice(100.0);
        mockMvc.perform(post("/api/products")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(p)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("Invalid product data"));
    }

    @Test
    void controller_productControllerFilterTest() throws Exception {
        Product p1 = Product.builder()
                .name("Phone")
                .description("Mobile")
                .price(120.0)
                .category("Electronics")
                .stockQuantity(10)
                .build();
        Product p2 = Product.builder()
                .name("TV")
                .description("Smart TV")
                .price(200.0)
                .category("Electronics")
                .stockQuantity(5)
                .build();
        Product p3 = Product.builder()
                .name("Shirt")
                .description("Cotton")
                .price(30.0)
                .category("Apparel")
                .stockQuantity(15)
                .build();
        productRepository.saveAll(List.of(p1, p2, p3));

        // Filter by category
        mockMvc.perform(get("/api/products?category=Electronics"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(2)));

        // Min price
        mockMvc.perform(get("/api/products?minPrice=50"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(2)));

        // Max price
        mockMvc.perform(get("/api/products?maxPrice=150"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(2)));

        // Category + min + max
        mockMvc.perform(get("/api/products?category=Electronics&minPrice=150&maxPrice=250"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(1)))
            .andExpect(jsonPath("$[0].name").value("TV"));
    }
}
