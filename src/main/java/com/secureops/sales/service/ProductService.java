package com.secureops.sales.service;

import com.secureops.sales.dto.request.ProductRequest;
import com.secureops.sales.dto.response.ProductResponse;

import java.util.List;

public interface ProductService {

    List<ProductResponse> getAllProducts();

    List<ProductResponse> getActiveProducts();

    ProductResponse getProductById(Long id);

    ProductResponse createProduct(ProductRequest productRequest);

    ProductResponse updateProduct(Long id, ProductRequest productRequest);

    void deleteProduct(Long id);

    List<ProductResponse> searchProducts(String searchTerm);

    List<ProductResponse> getProductsByCategory(String category);
}