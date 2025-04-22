package com.secureops.sales.repository;

import com.secureops.sales.entity.Client;
import com.secureops.sales.entity.Invoice;
import com.secureops.sales.entity.InvoiceStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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

    List<Invoice> findByClient(Client client);

    List<Invoice> findByStatus(InvoiceStatus status);

    List<Invoice> findByCreatedDateBetween(LocalDateTime startDate, LocalDateTime endDate);

    List<Invoice> findByPaymentDueDateBefore(LocalDateTime dueDate);

    @Query("SELECT i FROM Invoice i WHERE i.client.id = :clientId")
    List<Invoice> findByClientId(@Param("clientId") Long clientId);

    @Query("SELECT i FROM Invoice i WHERE i.order.id = :orderId")
    Optional<Invoice> findByOrderId(@Param("orderId") Long orderId);

    @Query("SELECT i FROM Invoice i WHERE i.status = 'OVERDUE'")
    List<Invoice> findOverdueInvoices();

    @Query("SELECT i FROM Invoice i WHERE i.client.name LIKE %:searchTerm% OR i.invoiceNumber LIKE %:searchTerm%")
    Page<Invoice> searchInvoices(@Param("searchTerm") String searchTerm, Pageable pageable);

    @Query("SELECT i FROM Invoice i WHERE i.status = 'PENDING' AND i.paymentDueDate < :currentDate")
    List<Invoice> findPendingInvoicesOverdue(@Param("currentDate") LocalDateTime currentDate);
}