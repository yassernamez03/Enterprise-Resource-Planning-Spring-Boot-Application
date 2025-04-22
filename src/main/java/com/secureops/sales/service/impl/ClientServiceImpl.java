package com.secureops.sales.service.impl;

import com.secureops.sales.dto.request.ClientRequest;
import com.secureops.sales.dto.response.ClientResponse;
import com.secureops.sales.entity.Client;
import com.secureops.sales.exception.ResourceNotFoundException;
import com.secureops.sales.repository.ClientRepository;
import com.secureops.sales.service.ClientService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ClientServiceImpl implements ClientService {

    private final ClientRepository clientRepository;

    @Autowired
    public ClientServiceImpl(ClientRepository clientRepository) {
        this.clientRepository = clientRepository;
    }

    @Override
    public List<ClientResponse> getAllClients() {
        return clientRepository.findAll().stream()
                .map(this::mapToClientResponse)
                .collect(Collectors.toList());
    }

    @Override
    public ClientResponse getClientById(Long id) {
        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Client not found with id: " + id));
        return mapToClientResponse(client);
    }

    @Override
    public ClientResponse getClientByName(String name) {
        Client client = clientRepository.findByName(name)
                .orElseThrow(() -> new ResourceNotFoundException("Client not found with name: " + name));
        return mapToClientResponse(client);
    }

    @Override
    @Transactional
    public ClientResponse createClient(ClientRequest clientRequest) {
        Client client = new Client();
        client.setName(clientRequest.getName());
        client.setContactPerson(clientRequest.getContactPerson());
        client.setEmail(clientRequest.getEmail());
        client.setPhone(clientRequest.getPhone());
        client.setAddress(clientRequest.getAddress());
        client.setNotes(clientRequest.getNotes());
        client.setCreatedDate(LocalDateTime.now());

        Client savedClient = clientRepository.save(client);
        return mapToClientResponse(savedClient);
    }

    @Override
    @Transactional
    public ClientResponse updateClient(Long id, ClientRequest clientRequest) {
        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Client not found with id: " + id));

        client.setName(clientRequest.getName());
        client.setContactPerson(clientRequest.getContactPerson());
        client.setEmail(clientRequest.getEmail());
        client.setPhone(clientRequest.getPhone());
        client.setAddress(clientRequest.getAddress());
        client.setNotes(clientRequest.getNotes());
        client.setLastModifiedDate(LocalDateTime.now());

        Client updatedClient = clientRepository.save(client);
        return mapToClientResponse(updatedClient);
    }

    @Override
    @Transactional
    public void deleteClient(Long id) {
        if (!clientRepository.existsById(id)) {
            throw new ResourceNotFoundException("Client not found with id: " + id);
        }
        clientRepository.deleteById(id);
    }

    @Override
    public List<ClientResponse> searchClients(String searchTerm) {
        return clientRepository.searchClients(searchTerm).stream()
                .map(this::mapToClientResponse)
                .collect(Collectors.toList());
    }

    private ClientResponse mapToClientResponse(Client client) {
        ClientResponse response = new ClientResponse();
        response.setId(client.getId());
        response.setName(client.getName());
        response.setContactPerson(client.getContactPerson());
        response.setEmail(client.getEmail());
        response.setPhone(client.getPhone());
        response.setAddress(client.getAddress());
        response.setNotes(client.getNotes());
        response.setCreatedDate(client.getCreatedDate());
        response.setLastModifiedDate(client.getLastModifiedDate());
        return response;
    }
}