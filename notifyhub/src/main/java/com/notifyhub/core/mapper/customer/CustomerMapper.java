package com.notifyhub.core.mapper.customer;

import com.notifyhub.core.dto.customer.request.CustomerRequest;
import com.notifyhub.core.dto.customer.response.CustomerResponse;
import com.notifyhub.core.entity.customer.Customer;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface CustomerMapper {

    Customer toEntity(CustomerRequest request);

    CustomerResponse toResponse(Customer entity);

    void updateEntity(CustomerRequest request, @MappingTarget Customer entity);
}