package com.examly.springapp.service;

import com.examly.springapp.model.Product;
import com.examly.springapp.repository.ProductRepository;
import jakarta.validation.ValidationException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;

    public Product createProduct(Product product) {
        if (product.getName() == null || product.getName().isBlank() ||
            product.getDescription() == null || product.getDescription().isBlank() ||
            product.getPrice() <= 0 || product.getCategory() == null || product.getCategory().isBlank()) {
            throw new ValidationException("Invalid product data");
        }
        return productRepository.save(product);
    }

    public List<Product> getAllProducts(String category, Double minPrice, Double maxPrice) {
        if (category != null && minPrice != null && maxPrice != null) {
            return productRepository.findByCategoryContainingIgnoreCaseAndPriceBetween(category, minPrice, maxPrice);
        } else if (category != null) {
            return productRepository.findByCategoryContainingIgnoreCase(category);
        } else if (minPrice != null && maxPrice != null) {
            return productRepository.findByPriceBetween(minPrice, maxPrice);
        } else {
            return productRepository.findAll();
        }
    }

    public Product getProductById(Long id) {
        return productRepository.findById(id).orElseThrow(() -> new RuntimeException("Product not found"));
    }

    public Product updateProduct(Long id, Product updated) {
        Product product = getProductById(id);
        product.setName(updated.getName());
        product.setDescription(updated.getDescription());
        product.setPrice(updated.getPrice());
        product.setCategory(updated.getCategory());
        product.setStockQuantity(updated.getStockQuantity());
        product.setImageUrl(updated.getImageUrl());
        return productRepository.save(product);
    }

    public void deleteProduct(Long id) {
        productRepository.deleteById(id);
    }

}
