package com.secureops.sales.repository;

import com.secureops.sales.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    Optional<Product> findByName(String name);

    List<Product> findByNameContainingIgnoreCase(String name);

    List<Product> findByActive(Boolean active);

    List<Product> findByCategoryAndActive(String category, Boolean active);
}