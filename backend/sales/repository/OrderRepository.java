package com.secureops.sales.repository;

import com.secureops.sales.entity.Order;
import com.secureops.sales.entity.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    Optional<Order> findByOrderNumber(String orderNumber);

    List<Order> findByClientId(Long clientId);

    List<Order> findByStatus(OrderStatus status);
    
    Optional<Order> findByQuoteId(Long quoteId);

    @Query("SELECT MAX(o.id) FROM Order o")
    Optional<Long> findLastOrderId();

    @Query("SELECT o FROM Order o JOIN o.client c " +
            "WHERE LOWER(c.name) LIKE LOWER(CONCAT('%', :query, '%')) " +
            "OR LOWER(o.orderNumber) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Order> searchOrders(@Param("query") String query);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.status = :status AND o.createdDate BETWEEN :startDate AND :endDate")
    Long countByStatusAndDateRange(@Param("status") OrderStatus status, @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    @Query("SELECT o FROM Order o WHERE o.createdDate BETWEEN :startDate AND :endDate")
    List<Order> findByCreatedDateBetween(LocalDateTime startDate, LocalDateTime endDate);

    @Query("SELECT o FROM Order o WHERE o.client.id = :clientId AND o.createdDate BETWEEN :startDate AND :endDate")
    List<Order> findByClientIdAndCreatedDateBetween(
            @Param("clientId") Long clientId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    Optional<Order> findTopByOrderByIdDesc();
}