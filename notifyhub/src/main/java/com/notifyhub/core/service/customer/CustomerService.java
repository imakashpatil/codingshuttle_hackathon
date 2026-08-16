package com.notifyhub.core.service.customer;

import com.notifyhub.communication.repository.CommunicationRepository;
import com.notifyhub.core.dto.customer.request.CustomerRequest;
import com.notifyhub.core.dto.customer.response.CustomerResponse;
import com.notifyhub.core.entity.customer.Customer;
import com.notifyhub.core.mapper.customer.CustomerMapper;
import com.notifyhub.core.repository.communication.CommunicationDefinitionRepository;
import com.notifyhub.core.repository.customer.CustomerRepository;
import com.notifyhub.core.entity.communication.CommunicationRequest;
import com.notifyhub.core.repository.communication.CommunicationRequestRepository;
import com.notifyhub.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final CustomerMapper customerMapper;
    private final CommunicationRequestRepository communicationRequestRepository;
    private final CommunicationRepository communicationRepository;
    private final CommunicationDefinitionRepository communicationDefinitionRepository;


    public CustomerResponse create(CustomerRequest request) {
        java.util.Optional<Customer> existingOpt = customerRepository.findByCustomerCode(request.getCustomerCode());
        if (existingOpt.isPresent()) {
            Customer existing = existingOpt.get();
            customerMapper.updateEntity(request, existing);
            existing.setActive(true);
            return customerMapper.toResponse(customerRepository.save(existing));
        }
        Customer customer = customerMapper.toEntity(request);
        customer.setActive(true);
        return customerMapper.toResponse(customerRepository.save(customer));
    }




    public CustomerResponse update(UUID id, CustomerRequest request) {
        Customer customer = getEntity(id);
        customerMapper.updateEntity(request, customer);
        return customerMapper.toResponse(customerRepository.save(customer));
    }



    @Transactional(readOnly = true)
    public CustomerResponse getById(UUID id) {
        return customerMapper.toResponse(getEntity(id));
    }



    @Transactional(readOnly = true)
    public List<CustomerResponse> getAll() {
        return customerRepository.findAll()
                .stream()
                .filter(Customer::isActive)
                .map(customerMapper::toResponse)
                .toList();
    }

    public void delete(UUID id) {
        Customer customer = getEntity(id);
        customer.setActive(false);
        customerRepository.save(customer);
    }



    private Customer getEntity(UUID id) {
        return customerRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Customer not found: " + id
                        )
                );
    }

    @Transactional(readOnly = true)
    public Page<CustomerResponse> getAllByPage(Pageable pageable) {
        return customerRepository.findAllByActiveTrue(pageable)
                .map(customerMapper::toResponse);
    }

    @Transactional(readOnly = true)
    @SuppressWarnings("unchecked")
    public List<CommunicationRequest> getCommunicationsByCustomerId(UUID customerId) {
        List<CommunicationRequest> requests = communicationRequestRepository.findByCustomerIdOrderByCreatedAtDesc(customerId);
        if (requests != null) {
            for (CommunicationRequest req : requests) {
                req.setDispatches((List) communicationRepository.findByRequestId(req.getId()));
                
                String defCode = req.getCommunicationDefinitionCode();
                if (defCode != null) {
                    communicationDefinitionRepository.findByCommunicationCode(defCode)
                            .ifPresent(def -> req.setDefinitionName(def.getName()));
                }
            }
        }
        return requests;
    }

}
