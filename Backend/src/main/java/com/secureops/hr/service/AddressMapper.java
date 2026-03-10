package com.secureops.hr.service;


import com.secureops.hr.dto.AddressDTO;
import com.secureops.hr.entity.Address;
import org.springframework.stereotype.Component;

@Component
public class AddressMapper {

    public AddressDTO toDto(Address address) {
        if (address == null) {
            return null;
        }

        AddressDTO dto = new AddressDTO();
        dto.setId(address.getId());
        dto.setStreet(address.getStreet());
        dto.setCity(address.getCity());
        dto.setState(address.getState());
        dto.setZipCode(address.getZipCode());
        dto.setCountry(address.getCountry());

        return dto;
    }

    public Address toEntity(AddressDTO dto) {
        if (dto == null) {
            return null;
        }

        Address address = new Address();
        address.setId(dto.getId());
        address.setStreet(dto.getStreet());
        address.setCity(dto.getCity());
        address.setState(dto.getState());
        address.setZipCode(dto.getZipCode());
        address.setCountry(dto.getCountry());

        return address;
    }

    public Address updateEntityFromDto(AddressDTO dto, Address address) {
        if (dto == null) {
            return address;
        }

        // Only update fields that are not null
        if (dto.getStreet() != null) {
            address.setStreet(dto.getStreet());
        }
        if (dto.getCity() != null) {
            address.setCity(dto.getCity());
        }
        if (dto.getState() != null) {
            address.setState(dto.getState());
        }
        if (dto.getZipCode() != null) {
            address.setZipCode(dto.getZipCode());
        }
        if (dto.getCountry() != null) {
            address.setCountry(dto.getCountry());
        }

        return address;
    }
}