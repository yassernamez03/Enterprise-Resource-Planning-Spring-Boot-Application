package com.secureops.sales.repository;

import com.secureops.sales.entity.Client;
import com.secureops.sales.entity.Employee;
import com.secureops.sales.entity.Quote;
import com.secureops.sales.entity.QuoteStatus;
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
public interface QuoteRepository extends JpaRepository<Quote, Long> {

    Optional<Quote> findByQuoteNumber(String quoteNumber);

    List<Quote> findByClient(Client client);

    List<Quote> findByEmployee(Employee employee);

    List<Quote> findByStatus(QuoteStatus status);

    List<Quote> findByCreatedDateBetween(LocalDateTime startDate, LocalDateTime endDate);

    @Query("SELECT q FROM Quote q WHERE q.client.id = :clientId")
    List<Quote> findByClientId(@Param("clientId") Long clientId);

    @Query("SELECT q FROM Quote q WHERE q.employee.id = :employeeId")
    List<Quote> findByEmployeeId(@Param("employeeId") Long employeeId);

    @Query("SELECT q FROM Quote q WHERE q.client.name LIKE %:searchTerm% OR q.quoteNumber LIKE %:searchTerm%")
    Page<Quote> searchQuotes(@Param("searchTerm") String searchTerm, Pageable pageable);
}