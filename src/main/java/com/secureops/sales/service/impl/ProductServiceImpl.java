package com.secureops.sales.service.impl;

import com.secureops.sales.dto.request.ProductRequest;
import com.secureops.sales.dto.response.ProductResponse;
import com.secureops.sales.entity.Product;
import com.secureops.sales.exception.ResourceNotFoundException;
import com.secureops.sales.repository.ProductRepository;
import com.secureops.sales.service.ProductService;
import com.secureops.sales.util.DateUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;

    @Override
    public List<ProductResponse> getAllProducts() {
        return productRepository.findAll()
                .stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public ProductResponse getProductById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", id));
        return convertToResponse(product);
    }

    @Override
    @Transactional
    public ProductResponse createProduct(ProductRequest request) {
        Product product = convertToEntity(request);
        product.setCreatedDate(DateUtils.getCurrentDateTime());
        product.setLastModifiedDate(DateUtils.getCurrentDateTime());
        product.setActive(true);

        Product savedProduct = productRepository.save(product);
        return convertToResponse(savedProduct);
    }

    @Override
    @Transactional
    public ProductResponse updateProduct(Long id, ProductRequest request) {
        Product existingProduct = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", id));

        existingProduct.setName(request.getName());
        existingProduct.setDescription(request.getDescription());
        existingProduct.setUnitPrice(request.getUnitPrice());
        existingProduct.setCategory(request.getCategory());
        existingProduct.setActive(request.getActive());
        existingProduct.setLastModifiedDate(DateUtils.getCurrentDateTime());

        Product updatedProduct = productRepository.save(existingProduct);
        return convertToResponse(updatedProduct);
    }

    @Override
    @Transactional
    public void deleteProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", id));

        // Soft delete - just mark as inactive
        product.setActive(false);
        product.setLastModifiedDate(DateUtils.getCurrentDateTime());
        productRepository.save(product);
    }

    @Override
    public List<ProductResponse> searchProducts(String query) {
        if (query == null || query.isEmpty()) {
            return getAllProducts();
        }

        // Search by name
        List<Product> byName = productRepository.findByNameContainingIgnoreCase(query);

        // Deduplicate and convert to response
        return byName.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<ProductResponse> getProductsByCategory(String category) {
        List<Product> products = productRepository.findByCategoryIgnoreCase(category);
        return products.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    private ProductResponse convertToResponse(Product product) {
        return ProductResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .description(product.getDescription())
                .unitPrice(product.getUnitPrice())
                .category(product.getCategory())
                .active(product.getActive())
                .build();
    }

    private Product convertToEntity(ProductRequest request) {
        Product product = new Product();
        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setUnitPrice(request.getUnitPrice());
        product.setCategory(request.getCategory());
        product.setActive(request.getActive() != null ? request.getActive() : true);
        return product;
    }
}