package com.secureops.sales.controller;

import com.secureops.sales.dto.request.InvoiceRequest;
import com.secureops.sales.dto.response.InvoiceResponse;
import com.secureops.sales.entity.InvoiceStatus;
import com.secureops.sales.service.InvoiceService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/sales/invoices")
@RequiredArgsConstructor
public class InvoiceController {

    private final InvoiceService invoiceService;

    @GetMapping
    public ResponseEntity<List<InvoiceResponse>> getAllInvoices() {
        return ResponseEntity.ok(invoiceService.getAllInvoices());
    }

    @GetMapping("/{id}")
    public ResponseEntity<InvoiceResponse> getInvoiceById(@PathVariable Long id) {
        return ResponseEntity.ok(invoiceService.getInvoiceById(id));
    }

    @GetMapping("/number/{invoiceNumber}")
    public ResponseEntity<InvoiceResponse> getInvoiceByNumber(@PathVariable String invoiceNumber) {
        return ResponseEntity.ok(invoiceService.getInvoiceByNumber(invoiceNumber));
    }

    @PostMapping("/create")
    public ResponseEntity<InvoiceResponse> createInvoice(@Valid @RequestBody InvoiceRequest request) {
        return new ResponseEntity<>(invoiceService.createInvoice(request), HttpStatus.CREATED);
    }

    @PutMapping("/update/{id}")
    public ResponseEntity<InvoiceResponse> updateInvoice(@PathVariable Long id, @Valid @RequestBody InvoiceRequest request) {
        return ResponseEntity.ok(invoiceService.updateInvoice(id, request));
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> deleteInvoice(@PathVariable Long id) {
        invoiceService.deleteInvoice(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/client/{clientId}")
    public ResponseEntity<List<InvoiceResponse>> getInvoicesByClient(@PathVariable Long clientId) {
        return ResponseEntity.ok(invoiceService.getInvoicesByClient(clientId));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<InvoiceResponse>> getInvoicesByStatus(@PathVariable InvoiceStatus status) {
        return ResponseEntity.ok(invoiceService.getInvoicesByStatus(status));
    }

    @GetMapping("/date-range")
    public ResponseEntity<List<InvoiceResponse>> getInvoicesByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        return ResponseEntity.ok(invoiceService.getInvoicesByDateRange(startDate, endDate));
    }

    @PostMapping("/{id}/mark-as-paid")
    public ResponseEntity<InvoiceResponse> markInvoiceAsPaid(
            @PathVariable Long id,
            @RequestParam String paymentMethod) {
        return ResponseEntity.ok(invoiceService.markInvoiceAsPaid(id, paymentMethod));
    }
}