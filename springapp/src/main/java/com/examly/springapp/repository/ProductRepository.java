package com.examly.springapp.repository;

import com.examly.springapp.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByCategoryContainingIgnoreCase(String category);
    List<Product> findByPriceBetween(double min, double max);
    List<Product> findByCategoryContainingIgnoreCaseAndPriceBetween(String category, double min, double max);
}
