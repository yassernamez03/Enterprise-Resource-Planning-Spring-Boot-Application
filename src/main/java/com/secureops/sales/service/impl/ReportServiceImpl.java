package com.secureops.sales.service.impl;

import com.secureops.sales.dto.response.*;
import com.secureops.sales.entity.*;
import com.secureops.sales.exception.ResourceNotFoundException;
import com.secureops.sales.repository.*;
import com.secureops.sales.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportServiceImpl implements ReportService {

    private final QuoteRepository quoteRepository;
    private final OrderRepository orderRepository;
    private final InvoiceRepository invoiceRepository;
    private final SalesEmployeeRepository salesEmployeeRepository;
    private final ClientRepository clientRepository;

    private static final DateTimeFormatter MONTH_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM");

    @Override
    public SalesSummaryReport getSalesSummary(LocalDateTime startDate, LocalDateTime endDate) {
        // Get all quotes within date range
        List<Quote> quotes = quoteRepository.findByCreatedDateBetween(startDate, endDate);

        // Get all orders within date range
        List<Order> orders = orderRepository.findByCreatedDateBetween(startDate, endDate);

        // Get all invoices within date range
        List<Invoice> invoices = invoiceRepository.findByCreatedDateBetween(startDate, endDate);

        // Calculate totals
        int totalQuotes = quotes.size();
        int acceptedQuotes = (int) quotes.stream()
                .filter(q -> q.getStatus() == QuoteStatus.ACCEPTED || q.getStatus() == QuoteStatus.CONVERTED_TO_ORDER)
                .count();
        int rejectedQuotes = (int) quotes.stream()
                .filter(q -> q.getStatus() == QuoteStatus.REJECTED)
                .count();

        int totalOrders = orders.size();
        int completedOrders = (int) orders.stream()
                .filter(o -> o.getStatus() == OrderStatus.COMPLETED || o.getStatus() == OrderStatus.INVOICED)
                .count();
        int cancelledOrders = (int) orders.stream()
                .filter(o -> o.getStatus() == OrderStatus.CANCELLED)
                .count();

        int totalInvoices = invoices.size();
        int paidInvoices = (int) invoices.stream()
                .filter(i -> i.getStatus() == InvoiceStatus.PAID)
                .count();
        int overdueInvoices = (int) invoices.stream()
                .filter(i -> i.getStatus() == InvoiceStatus.OVERDUE)
                .count();

        // Calculate total sales and average order value
        BigDecimal totalSales = orders.stream()
                .filter(o -> o.getStatus() != OrderStatus.CANCELLED)
                .map(Order::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal averageOrderValue = totalOrders > 0 ?
                totalSales.divide(BigDecimal.valueOf(totalOrders), 2, RoundingMode.HALF_UP) :
                BigDecimal.ZERO;

        // Generate monthly sales data
        Map<String, BigDecimal> monthlySales = orders.stream()
                .filter(o -> o.getStatus() != OrderStatus.CANCELLED)
                .collect(Collectors.groupingBy(
                        o -> o.getCreatedDate().format(MONTH_FORMATTER),
                        Collectors.mapping(
                                Order::getTotalAmount,
                                Collectors.reducing(BigDecimal.ZERO, BigDecimal::add)
                        )
                ));

        return SalesSummaryReport.builder()
                .totalSales(totalSales)
                .totalQuotes(totalQuotes)
                .acceptedQuotes(acceptedQuotes)
                .rejectedQuotes(rejectedQuotes)
                .totalOrders(totalOrders)
                .completedOrders(completedOrders)
                .cancelledOrders(cancelledOrders)
                .totalInvoices(totalInvoices)
                .paidInvoices(paidInvoices)
                .overdueInvoices(overdueInvoices)
                .averageOrderValue(averageOrderValue)
                .monthlySales(monthlySales)
                .build();
    }

    @Override
    public EmployeePerformanceReport getEmployeePerformance(Long employeeId, LocalDateTime startDate, LocalDateTime endDate) {
        // Verify employee exists
        Employee employee = salesEmployeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", employeeId));

        // Get employee quotes
        List<Quote> quotes = quoteRepository.findByEmployeeIdAndCreatedDateBetween(
                employeeId, startDate, endDate);

        // Get employee orders
        List<Order> orders = orderRepository.findByEmployeeIdAndCreatedDateBetween(
                employeeId, startDate, endDate);

        int totalQuotes = quotes.size();
        int acceptedQuotes = (int) quotes.stream()
                .filter(q -> q.getStatus() == QuoteStatus.ACCEPTED || q.getStatus() == QuoteStatus.CONVERTED_TO_ORDER)
                .count();

        // Calculate conversion rate
        BigDecimal conversionRate = totalQuotes > 0 ?
                BigDecimal.valueOf(acceptedQuotes)
                        .divide(BigDecimal.valueOf(totalQuotes), 2, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100)) :
                BigDecimal.ZERO;

        // Calculate total sales
        BigDecimal totalSales = orders.stream()
                .filter(o -> o.getStatus() != OrderStatus.CANCELLED)
                .map(Order::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Calculate average order value
        BigDecimal averageOrderValue = !orders.isEmpty() ?
                totalSales.divide(BigDecimal.valueOf(orders.size()), 2, RoundingMode.HALF_UP) :
                BigDecimal.ZERO;

        // Generate monthly sales data
        Map<String, BigDecimal> monthlySales = orders.stream()
                .filter(o -> o.getStatus() != OrderStatus.CANCELLED)
                .collect(Collectors.groupingBy(
                        o -> o.getCreatedDate().format(MONTH_FORMATTER),
                        Collectors.mapping(
                                Order::getTotalAmount,
                                Collectors.reducing(BigDecimal.ZERO, BigDecimal::add)
                        )
                ));

        return EmployeePerformanceReport.builder()
                .employeeId(employeeId)
                .employeeName(employee.getFullName())
                .totalQuotes(totalQuotes)
                .acceptedQuotes(acceptedQuotes)
                .conversionRate(conversionRate)
                .totalSales(totalSales)
                .averageOrderValue(averageOrderValue)
                .monthlySales(monthlySales)
                .build();
    }

    @Override
    public ClientSpendingReport getClientSpendingReport(Long clientId, LocalDateTime startDate, LocalDateTime endDate) {
        // Verify client exists
        Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> new ResourceNotFoundException("Client", "id", clientId));

        // Get client orders within date range
        List<Order> orders = orderRepository.findByClientIdAndCreatedDateBetween(
                clientId, startDate, endDate);

        int orderCount = orders.size();

        // Calculate total spent
        BigDecimal totalSpent = orders.stream()
                .filter(o -> o.getStatus() != OrderStatus.CANCELLED)
                .map(Order::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Calculate average order value
        BigDecimal averageOrderValue = orderCount > 0 ?
                totalSpent.divide(BigDecimal.valueOf(orderCount), 2, RoundingMode.HALF_UP) :
                BigDecimal.ZERO;

        // Find last order date
        LocalDateTime lastOrderDate = orders.stream()
                .map(Order::getCreatedDate)
                .max(Comparator.naturalOrder())
                .orElse(null);

        // Generate monthly spending data
        Map<String, BigDecimal> monthlySpending = orders.stream()
                .filter(o -> o.getStatus() != OrderStatus.CANCELLED)
                .collect(Collectors.groupingBy(
                        o -> o.getCreatedDate().format(MONTH_FORMATTER),
                        Collectors.mapping(
                                Order::getTotalAmount,
                                Collectors.reducing(BigDecimal.ZERO, BigDecimal::add)
                        )
                ));

        // Find top products
        Map<Product, Integer> productQuantities = new HashMap<>();
        Map<Product, BigDecimal> productRevenues = new HashMap<>();

        orders.stream()
                .filter(o -> o.getStatus() != OrderStatus.CANCELLED)
                .flatMap(o -> o.getItems().stream())
                .forEach(item -> {
                    Product product = item.getProduct();
                    productQuantities.merge(product, item.getQuantity(), Integer::sum);
                    productRevenues.merge(product, item.getSubtotal(), BigDecimal::add);
                });

        List<ProductSalesSummary> topProducts = productQuantities.entrySet().stream()
                .map(entry -> ProductSalesSummary.builder()
                        .productId(entry.getKey().getId())
                        .productName(entry.getKey().getName())
                        .quantitySold(entry.getValue())
                        .totalRevenue(productRevenues.get(entry.getKey()))
                        .build())
                .sorted(Comparator.comparing(ProductSalesSummary::getTotalRevenue).reversed())
                .limit(5)
                .collect(Collectors.toList());

        return ClientSpendingReport.builder()
                .clientId(clientId)
                .clientName(client.getName())
                .totalSpent(totalSpent)
                .orderCount(orderCount)
                .averageOrderValue(averageOrderValue)
                .lastOrderDate(lastOrderDate)
                .monthlySpending(monthlySpending)
                .topProducts(topProducts)
                .build();
    }

    @Override
    public ProductSalesReport getProductSalesReport(LocalDateTime startDate, LocalDateTime endDate) {
        // Get all orders within date range
        List<Order> orders = orderRepository.findByCreatedDateBetween(startDate, endDate)
                .stream()
                .filter(o -> o.getStatus() != OrderStatus.CANCELLED)
                .collect(Collectors.toList());

        // Calculate product sales metrics
        Map<Product, Integer> productQuantities = new HashMap<>();
        Map<Product, BigDecimal> productRevenues = new HashMap<>();

        orders.stream()
                .flatMap(o -> o.getItems().stream())
                .forEach(item -> {
                    Product product = item.getProduct();
                    productQuantities.merge(product, item.getQuantity(), Integer::sum);
                    productRevenues.merge(product, item.getSubtotal(), BigDecimal::add);
                });

        List<ProductSalesSummary> productSales = productQuantities.entrySet().stream()
                .map(entry -> ProductSalesSummary.builder()
                        .productId(entry.getKey().getId())
                        .productName(entry.getKey().getName())
                        .quantitySold(entry.getValue())
                        .totalRevenue(productRevenues.get(entry.getKey()))
                        .build())
                .sorted(Comparator.comparing(ProductSalesSummary::getTotalRevenue).reversed())
                .collect(Collectors.toList());

        int totalProductsSold = productQuantities.values().stream()
                .mapToInt(Integer::intValue)
                .sum();

        return ProductSalesReport.builder()
                .totalProductsSold(totalProductsSold)
                .productSales(productSales)
                .build();
    }
}