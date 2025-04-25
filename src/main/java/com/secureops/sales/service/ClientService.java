package com.secureops.sales.service;

import com.secureops.sales.dto.request.ClientRequest;
import com.secureops.sales.dto.response.ClientResponse;
import java.util.List;

public interface ClientService {
    List<ClientResponse> getAllClients();
    ClientResponse getClientById(Long id);
    ClientResponse createClient(ClientRequest request);
    ClientResponse updateClient(Long id, ClientRequest request);
    void deleteClient(Long id);
    List<ClientResponse> searchClients(String query);
}
