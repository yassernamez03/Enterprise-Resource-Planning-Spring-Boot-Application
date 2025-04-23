package com.secureops.sales.service.impl;

import com.secureops.sales.entity.*;
import com.secureops.sales.repository.InvoiceRepository;
import com.secureops.sales.repository.OrderItemRepository;
import com.secureops.sales.repository.OrderRepository;
import com.secureops.sales.repository.QuoteRepository;
import com.secureops.sales.service.ReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ReportServiceImpl implements ReportService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final QuoteRepository quoteRepository;
    private final InvoiceRepository invoiceRepository;

    @Autowired
    public ReportServiceImpl(
            OrderRepository orderRepository,
            OrderItemRepository orderItemRepository,
            QuoteRepository quoteRepository,
            InvoiceRepository invoiceRepository) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.quoteRepository = quoteRepository;
        this.invoiceRepository = invoiceRepository;
    }

    @Override
    public BigDecimal getTotalSales(LocalDateTime startDate, LocalDateTime endDate) {
        List<Order> orders = orderRepository.findByCreatedDateBetween(startDate, endDate);

        return orders.stream()
                .filter(order -> order.getStatus() != OrderStatus.CANCELLED)
                .map(Order::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    @Override
    public Map<String, BigDecimal> getSalesByClient(LocalDateTime startDate, LocalDateTime endDate) {
        List<Order> orders = orderRepository.findByCreatedDateBetween(startDate, endDate);

        return orders.stream()
                .filter(order -> order.getStatus() != OrderStatus.CANCELLED)
                .collect(Collectors.groupingBy(
                        order -> order.getClient().getName(),
                        Collectors.reducing(BigDecimal.ZERO, Order::getTotalAmount, BigDecimal::add)
                ));
    }

    @Override
    public Map<String, BigDecimal> getSalesByEmployee(LocalDateTime startDate, LocalDateTime endDate) {
        List<Order> orders = orderRepository.findByCreatedDateBetween(startDate, endDate);

        return orders.stream()
                .filter(order -> order.getStatus() != OrderStatus.CANCELLED)
                .collect(Collectors.groupingBy(
                        order -> order.getEmployee().getFullName(),
                        Collectors.reducing(BigDecimal.ZERO, Order::getTotalAmount, BigDecimal::add)
                ));
    }

    @Override
    public Map<String, BigDecimal> getSalesByProduct(LocalDateTime startDate, LocalDateTime endDate) {
        List<Order> orders = orderRepository.findByCreatedDateBetween(startDate, endDate);

        Map<String, BigDecimal> productSales = new HashMap<>();

        for (Order order : orders) {
            if (order.getStatus() == OrderStatus.CANCELLED) {
                continue;
            }

            List<OrderItem> orderItems = orderItemRepository.findByOrder(order);

            for (OrderItem item : orderItems) {
                String productName = item.getProduct().getName();
                BigDecimal itemTotal = item.getSubtotal();

                productSales.merge(productName, itemTotal, BigDecimal::add);
            }
        }

        return productSales;
    }

    @Override
    public List<BigDecimal> getMonthlySales(int year) {
        List<BigDecimal> monthlySales = new ArrayList<>(Collections.nCopies(12, BigDecimal.ZERO));

        LocalDateTime startOfYear = LocalDateTime.of(year, 1, 1, 0, 0);
        LocalDateTime endOfYear = LocalDateTime.of(year, 12, 31, 23, 59, 59);

        List<Order> orders = orderRepository.findByCreatedDateBetween(startOfYear, endOfYear);

        for (Order order : orders) {
            if (order.getStatus() == OrderStatus.CANCELLED) {
                continue;
            }

            int monthIndex = order.getCreatedDate().getMonth().getValue() - 1; // 0-based index
            BigDecimal currentAmount = monthlySales.get(monthIndex);
            monthlySales.set(monthIndex, currentAmount.add(order.getTotalAmount()));
        }

        return monthlySales;
    }

    @Override
    public double getQuoteConversionRate(LocalDateTime startDate, LocalDateTime endDate) {
        List<Quote> quotes = quoteRepository.findByCreatedDateBetween(startDate, endDate);

        long totalQuotes = quotes.size();
        if (totalQuotes == 0) {
            return 0.0;
        }

        long convertedQuotes = quotes.stream()
                .filter(quote -> quote.getStatus() == QuoteStatus.CONVERTED_TO_ORDER)
                .count();

        return (double) convertedQuotes / totalQuotes * 100.0;
    }

    @Override
    public BigDecimal getOutstandingInvoicesTotal() {
        List<Invoice> pendingInvoices = invoiceRepository.findByStatus(InvoiceStatus.PENDING);

        return pendingInvoices.stream()
                .map(Invoice::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    @Override
    public BigDecimal getOverdueInvoicesTotal() {
        List<Invoice> overdueInvoices = invoiceRepository.findByStatus(InvoiceStatus.OVERDUE);

        return overdueInvoices.stream()
                .map(Invoice::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    @Override
    public Map<String, BigDecimal> getTopClients(LocalDateTime startDate, LocalDateTime endDate, int limit) {
        Map<String, BigDecimal> clientSales = getSalesByClient(startDate, endDate);

        return clientSales.entrySet().stream()
                .sorted(Map.Entry.<String, BigDecimal>comparingByValue().reversed())
                .limit(limit)
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        Map.Entry::getValue,
                        (e1, e2) -> e1,
                        LinkedHashMap::new
                ));
    }

    @Override
    public Map<String, BigDecimal> getTopProducts(LocalDateTime startDate, LocalDateTime endDate, int limit) {
        Map<String, BigDecimal> productSales = getSalesByProduct(startDate, endDate);

        return productSales.entrySet().stream()
                .sorted(Map.Entry.<String, BigDecimal>comparingByValue().reversed())
                .limit(limit)
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        Map.Entry::getValue,
                        (e1, e2) -> e1,
                        LinkedHashMap::new
                ));
    }

    @Override
    public Map<LocalDateTime, BigDecimal> getSalesByDate(LocalDateTime startDate, LocalDateTime endDate) {
        List<Order> orders = orderRepository.findByCreatedDateBetween(startDate, endDate);

        // Group by day (truncate time part)
        Map<LocalDateTime, BigDecimal> salesByDate = orders.stream()
                .filter(order -> order.getStatus() != OrderStatus.CANCELLED)
                .collect(Collectors.groupingBy(
                        order -> order.getCreatedDate().toLocalDate().atStartOfDay(),
                        Collectors.reducing(BigDecimal.ZERO, Order::getTotalAmount, BigDecimal::add)
                ));

        // Create entries for days with no sales
        LocalDateTime currentDate = startDate.toLocalDate().atStartOfDay();
        while (!currentDate.isAfter(endDate)) {
            salesByDate.putIfAbsent(currentDate, BigDecimal.ZERO);
            currentDate = currentDate.plusDays(1);
        }

        // Sort by date
        return salesByDate.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        Map.Entry::getValue,
                        (e1, e2) -> e1,
                        LinkedHashMap::new
                ));
    }
}