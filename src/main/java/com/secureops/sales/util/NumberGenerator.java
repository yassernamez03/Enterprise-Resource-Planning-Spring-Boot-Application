package com.secureops.sales.util;

import com.secureops.sales.entity.Order;
import com.secureops.sales.entity.Quote;
import com.secureops.sales.repository.QuoteRepository;
import com.secureops.sales.repository.OrderRepository;
import com.secureops.sales.repository.InvoiceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;


/**
 * Utility class for generating unique sequential numbers for quotes, orders, and invoices
 */
@Component
public class NumberGenerator {

    private static final String QUOTE_PREFIX = "SO";
    private static final String ORDER_PREFIX = "OR";
    private static final String INVOICE_PREFIX = "INV";

    private final QuoteRepository quoteRepository;
    private final OrderRepository orderRepository;
    private final InvoiceRepository invoiceRepository;

    @Autowired
    public NumberGenerator(QuoteRepository quoteRepository,
                           OrderRepository orderRepository,
                           InvoiceRepository invoiceRepository) {
        this.quoteRepository = quoteRepository;
        this.orderRepository = orderRepository;
        this.invoiceRepository = invoiceRepository;
    }

    /**
     * Generates a unique quote number in the format SO + sequential number
     * E.g., SO8640
     */
    public String generateQuoteNumber() {
        Long lastQuoteId = quoteRepository.findTopByOrderByIdDesc()
                .map(Quote::getId)
                .orElse(0L);

        return QUOTE_PREFIX + (lastQuoteId + 1);
    }

    public String generateOrderNumber() {
        Long lastOrderId = orderRepository.findTopByOrderByIdDesc()
                .map(Order::getId)
                .orElse(0L);

        return ORDER_PREFIX + (lastOrderId + 1);
    }

    public String generateInvoiceNumber() {
        // Current date in format YYMMDD
        String datePrefix = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyMMdd"));

        // Get last invoice created today
        Long sequentialNumber = invoiceRepository.countByInvoiceNumberContaining(STR."INV\{datePrefix}") + 1;

        return STR."INV\{datePrefix}-\{sequentialNumber}";
    }
}