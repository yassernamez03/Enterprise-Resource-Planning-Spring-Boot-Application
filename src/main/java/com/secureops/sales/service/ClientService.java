package com.secureops.sales.service;

import com.secureops.sales.dto.request.ClientRequest;
import com.secureops.sales.dto.response.ClientResponse;

import java.util.List;

public interface ClientService {

    List<ClientResponse> getAllClients();

    ClientResponse getClientById(Long id);

    ClientResponse getClientByName(String name);

    ClientResponse createClient(ClientRequest clientRequest);

    ClientResponse updateClient(Long id, ClientRequest clientRequest);

    void deleteClient(Long id);

    List<ClientResponse> searchClients(String searchTerm);
}