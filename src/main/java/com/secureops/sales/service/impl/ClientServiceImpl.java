package com.secureops.sales.service.impl;

import com.secureops.sales.dto.request.ClientRequest;
import com.secureops.sales.dto.response.ClientResponse;
import com.secureops.sales.entity.Client;
import com.secureops.sales.exception.ResourceNotFoundException;
import com.secureops.sales.repository.ClientRepository;
import com.secureops.sales.service.ClientService;
import com.secureops.sales.util.DateUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class ClientServiceImpl implements ClientService {

    private final ClientRepository clientRepository;

    @Override
    public List<ClientResponse> getAllClients() {
        return clientRepository.findAll().stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public Page<ClientResponse> getAllClients(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return clientRepository.findAll(pageable)
                .map(this::convertToResponse);
    }

    @Override
    public ClientResponse getClientById(Long id) {
        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Client", "id", id));
        return convertToResponse(client);
    }

    @Override
    @Transactional
    public ClientResponse createClient(ClientRequest request) {
        Client client = convertToEntity(request);
        client.setCreatedDate(DateUtils.getCurrentDateTime());
        Client savedClient = clientRepository.save(client);
        return convertToResponse(savedClient);
    }

    @Override
    @Transactional
    public ClientResponse updateClient(Long id, ClientRequest request) {
        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Client", "id", id));

        client.setName(request.getName());
        client.setContactPerson(request.getContactPerson());
        client.setEmail(request.getEmail());
        client.setPhone(request.getPhone());
        client.setAddress(request.getAddress());
        client.setNotes(request.getNotes());
        client.setLastModifiedDate(DateUtils.getCurrentDateTime());

        Client updatedClient = clientRepository.save(client);
        return convertToResponse(updatedClient);
    }

    @Override
    @Transactional
    public void deleteClient(Long id) {
        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Client", "id", id));
        clientRepository.delete(client);
    }

    @Override
    public List<ClientResponse> searchClients(String query) {
        if (query == null || query.trim().isEmpty()) {
            return getAllClients();
        }

        List<Client> nameResults = clientRepository.findByNameContainingIgnoreCase(query);
        List<Client> emailResults = clientRepository.findByEmailContainingIgnoreCase(query);

        return Stream.concat(nameResults.stream(), emailResults.stream())
                .distinct()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    private ClientResponse convertToResponse(Client client) {
        return ClientResponse.builder()
                .id(client.getId())
                .name(client.getName())
                .contactPerson(client.getContactPerson())
                .email(client.getEmail())
                .phone(client.getPhone())
                .address(client.getAddress())
                .createdDate(client.getCreatedDate())
                .notes(client.getNotes())
                .build();
    }

    private Client convertToEntity(ClientRequest request) {
        Client client = new Client();
        client.setName(request.getName());
        client.setContactPerson(request.getContactPerson());
        client.setEmail(request.getEmail());
        client.setPhone(request.getPhone());
        client.setAddress(request.getAddress());
        client.setNotes(request.getNotes());
        return client;
    }
}