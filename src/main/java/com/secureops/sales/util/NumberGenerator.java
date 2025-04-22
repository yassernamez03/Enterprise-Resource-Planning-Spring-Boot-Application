package com.secureops.sales.util;

import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.atomic.AtomicInteger;

@Component
public class NumberGenerator {

    private final AtomicInteger quoteSequence = new AtomicInteger(1);
    private final AtomicInteger orderSequence = new AtomicInteger(1);
    private final AtomicInteger invoiceSequence = new AtomicInteger(1);

    private final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyMMdd");

    public String generateQuoteNumber() {
        String datePrefix = LocalDateTime.now().format(formatter);
        return "SO" + datePrefix.substring(0, 4) + quoteSequence.getAndIncrement();
    }

    public String generateOrderNumber() {
        String datePrefix = LocalDateTime.now().format(formatter);
        return "OR" + datePrefix.substring(0, 4) + orderSequence.getAndIncrement();
    }

    public String generateInvoiceNumber() {
        String datePrefix = LocalDateTime.now().format(formatter);
        return "INV" + datePrefix.substring(0, 4) + invoiceSequence.getAndIncrement();
    }

    // Reset sequences - could be used if needed
    public void resetSequences() {
        quoteSequence.set(1);
        orderSequence.set(1);
        invoiceSequence.set(1);
    }
}