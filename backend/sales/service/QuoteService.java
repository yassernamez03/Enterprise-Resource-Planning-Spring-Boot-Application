package com.secureops.sales.service;

import com.secureops.sales.dto.request.QuoteRequest;
import com.secureops.sales.dto.response.ClientResponse;
import com.secureops.sales.dto.response.OrderResponse;
import com.secureops.sales.dto.response.QuoteResponse;
import com.secureops.sales.entity.QuoteStatus;
import org.springframework.data.domain.Page;

import java.time.LocalDateTime;
import java.util.List;

public interface QuoteService {

    List<QuoteResponse> getAllQuotes();

    QuoteResponse getQuoteById(Long id);

    QuoteResponse getQuoteByNumber(String quoteNumber);

    QuoteResponse createQuote(QuoteRequest request);

    QuoteResponse updateQuote(Long id, QuoteRequest request);

    QuoteResponse updateQuoteStatus(Long id, QuoteStatus status);

    void deleteQuote(Long id);

    List<QuoteResponse> getQuotesByClient(Long clientId);

    List<QuoteResponse> getQuotesByStatus(QuoteStatus status);

    List<QuoteResponse> getQuotesByDateRange(LocalDateTime startDate, LocalDateTime endDate);

    OrderResponse convertQuoteToOrder(Long quoteId);

    Page<QuoteResponse> getAllQuotes(int page, int size);

}