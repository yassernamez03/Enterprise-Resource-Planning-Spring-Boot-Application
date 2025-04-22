package com.secureops.sales.repository;

import com.secureops.sales.entity.Product;
import com.secureops.sales.entity.Quote;
import com.secureops.sales.entity.QuoteItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuoteItemRepository extends JpaRepository<QuoteItem, Long> {

    List<QuoteItem> findByQuote(Quote quote);

    List<QuoteItem> findByProduct(Product product);

    @Query("SELECT qi FROM QuoteItem qi WHERE qi.quote.id = :quoteId")
    List<QuoteItem> findByQuoteId(@Param("quoteId") Long quoteId);

    @Query("SELECT qi FROM QuoteItem qi WHERE qi.product.id = :productId")
    List<QuoteItem> findByProductId(@Param("productId") Long productId);
}