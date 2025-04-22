package com.secureops.sales.repository;

import com.secureops.sales.entity.Client;
import com.secureops.sales.entity.Employee;
import com.secureops.sales.entity.Order;
import com.secureops.sales.entity.OrderStatus;
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
public interface OrderRepository extends JpaRepository<Order, Long> {

    Optional<Order> findByOrderNumber(String orderNumber);

    List<Order> findByClient(Client client);

    List<Order> findByEmployee(Employee employee);

    List<Order> findByStatus(OrderStatus status);

    List<Order> findByCreatedDateBetween(LocalDateTime startDate, LocalDateTime endDate);

    @Query("SELECT o FROM Order o WHERE o.client.id = :clientId")
    List<Order> findByClientId(@Param("clientId") Long clientId);

    @Query("SELECT o FROM Order o WHERE o.employee.id = :employeeId")
    List<Order> findByEmployeeId(@Param("employeeId") Long employeeId);

    @Query("SELECT o FROM Order o WHERE o.quote.id = :quoteId")
    Optional<Order> findByQuoteId(@Param("quoteId") Long quoteId);

    @Query("SELECT o FROM Order o WHERE o.client.name LIKE %:searchTerm% OR o.orderNumber LIKE %:searchTerm%")
    Page<Order> searchOrders(@Param("searchTerm") String searchTerm, Pageable pageable);

    @Query("SELECT o FROM Order o WHERE o.status != 'INVOICED'")
    List<Order> findNonInvoicedOrders();
}