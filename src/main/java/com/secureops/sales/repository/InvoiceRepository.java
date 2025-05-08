package com.secureops.sales.repository;

import com.secureops.sales.entity.Invoice;
import com.secureops.sales.entity.InvoiceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {

    Optional<Invoice> findByInvoiceNumber(String invoiceNumber);

    List<Invoice> findByClientId(Long clientId);

    List<Invoice> findByStatus(InvoiceStatus status);

    List<Invoice> findByCreatedDateBetween(LocalDateTime startDate, LocalDateTime endDate);

    Optional<Invoice> findByOrderId(Long orderId);

    @Query("SELECT MAX(i.id) FROM Invoice i")
    Optional<Long> findLastInvoiceId();

    @Query("SELECT i FROM Invoice i JOIN i.client c " +
            "WHERE LOWER(c.name) LIKE LOWER(CONCAT('%', :query, '%')) " +
            "OR LOWER(i.invoiceNumber) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Invoice> searchInvoices(@Param("query") String query);

    @Query("SELECT SUM(i.totalAmount) FROM Invoice i WHERE i.status = :status AND i.createdDate BETWEEN :startDate AND :endDate")
    Optional<Double> sumTotalAmountByStatusAndDateRange(@Param("status") InvoiceStatus status, @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    @Query("SELECT COUNT(i) FROM Invoice i WHERE i.status = :status AND i.createdDate BETWEEN :startDate AND :endDate")
    Long countByStatusAndDateRange(@Param("status") InvoiceStatus status, @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    Long countByInvoiceNumberContaining(String prefix);

}