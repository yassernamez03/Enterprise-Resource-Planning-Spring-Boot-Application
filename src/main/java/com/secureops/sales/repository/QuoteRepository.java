package com.secureops.sales.repository;

import com.secureops.sales.entity.Quote;
import com.secureops.sales.entity.QuoteStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface QuoteRepository extends JpaRepository<Quote, Long> {

    Optional<Quote> findByQuoteNumber(String quoteNumber);

    List<Quote> findByClientId(Long clientId);

    List<Quote> findByStatus(QuoteStatus status);

    @Query("SELECT MAX(q.id) FROM Quote q")
    Optional<Long> findLastQuoteId();

    @Query("SELECT q FROM Quote q JOIN q.client c " +
            "WHERE LOWER(c.name) LIKE LOWER(CONCAT('%', :query, '%')) " +
            "OR LOWER(q.quoteNumber) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Quote> searchQuotes(@Param("query") String query);

    @Query("SELECT COUNT(q) FROM Quote q WHERE q.status = :status AND q.createdDate BETWEEN :startDate AND :endDate")
    Long countByStatusAndDateRange(@Param("status") QuoteStatus status, @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    @Query("SELECT q FROM Quote q WHERE q.createdDate BETWEEN :startDate AND :endDate")
    List<Quote> findByCreatedDateBetween(LocalDateTime startDate, LocalDateTime endDate);

    Optional<Quote> findTopByOrderByIdDesc();
}