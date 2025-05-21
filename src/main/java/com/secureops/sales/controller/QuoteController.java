package com.secureops.sales.controller;

import com.secureops.sales.dto.request.QuoteRequest;
import com.secureops.sales.dto.response.OrderResponse;
import com.secureops.sales.dto.response.QuoteResponse;
import com.secureops.sales.entity.QuoteStatus;
import com.secureops.sales.service.QuoteService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/sales/quotes")
@RequiredArgsConstructor
public class QuoteController {

    private final QuoteService quoteService;

    @GetMapping
    public ResponseEntity<Page<QuoteResponse>> getAllQuotes(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size){
        return ResponseEntity.ok(quoteService.getAllQuotes(page,size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<QuoteResponse> getQuoteById(@PathVariable Long id) {
        return ResponseEntity.ok(quoteService.getQuoteById(id));
    }

    @GetMapping("/number/{quoteNumber}")
    public ResponseEntity<QuoteResponse> getQuoteByNumber(@PathVariable String quoteNumber) {
        return ResponseEntity.ok(quoteService.getQuoteByNumber(quoteNumber));
    }

    @PostMapping("/create")
    public ResponseEntity<QuoteResponse> createQuote(@Valid @RequestBody QuoteRequest request) {
        return new ResponseEntity<>(quoteService.createQuote(request), HttpStatus.CREATED);
    }

    @PutMapping("/update/{id}")
    public ResponseEntity<QuoteResponse> updateQuote(@PathVariable Long id, @Valid @RequestBody QuoteRequest request) {
        return ResponseEntity.ok(quoteService.updateQuote(id, request));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<QuoteResponse> updateQuoteStatus(
            @PathVariable Long id,
            @RequestParam QuoteStatus status) {
        return ResponseEntity.ok(quoteService.updateQuoteStatus(id, status));
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> deleteQuote(@PathVariable Long id) {
        quoteService.deleteQuote(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/client/{clientId}")
    public ResponseEntity<List<QuoteResponse>> getQuotesByClient(@PathVariable Long clientId) {
        return ResponseEntity.ok(quoteService.getQuotesByClient(clientId));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<QuoteResponse>> getQuotesByStatus(@PathVariable QuoteStatus status) {
        return ResponseEntity.ok(quoteService.getQuotesByStatus(status));
    }

    @GetMapping("/date-range")
    public ResponseEntity<List<QuoteResponse>> getQuotesByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        return ResponseEntity.ok(quoteService.getQuotesByDateRange(startDate, endDate));
    }

    @PostMapping("/{id}/convert")
    public ResponseEntity<OrderResponse> convertQuoteToOrder(@PathVariable Long id) {
        return ResponseEntity.ok(quoteService.convertQuoteToOrder(id));
    }
}