package com.secureops.sales.service;

import com.secureops.sales.dto.request.ProductRequest;
import com.secureops.sales.dto.response.ProductResponse;
import java.util.List;

public interface ProductService {
    List<ProductResponse> getAllProducts();
    ProductResponse getProductById(Long id);
    ProductResponse createProduct(ProductRequest request);
    ProductResponse updateProduct(Long id, ProductRequest request);
    void deleteProduct(Long id);
    List<ProductResponse> searchProducts(String query);
    List<ProductResponse> getProductsByCategory(String category);
}