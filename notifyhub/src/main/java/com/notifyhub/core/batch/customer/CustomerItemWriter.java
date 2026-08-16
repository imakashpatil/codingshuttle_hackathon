package com.notifyhub.core.batch.customer;


import com.notifyhub.core.entity.customer.Customer;
import com.notifyhub.core.repository.customer.CustomerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.batch.infrastructure.item.Chunk;
import org.springframework.batch.infrastructure.item.ItemWriter;


@Slf4j
@RequiredArgsConstructor
public class CustomerItemWriter implements ItemWriter<Customer> {

    private final CustomerRepository customerRepository;

    @Override
    public void write(Chunk<? extends Customer> chunk) {
        log.info("Batch Customer writer writing chunk of size: {}", chunk.size());

        for (Customer incoming : chunk.getItems()) {
            Customer customer = customerRepository
                    .findByCustomerCode(incoming.getCustomerCode())
                    .orElse(null);

            if (customer == null) {
                log.info("Creating new customer from batch ingestion with code: {}", incoming.getCustomerCode());
                customerRepository.save(incoming);
                continue;
            }

            log.info("Updating existing customer from batch ingestion with code: {}", incoming.getCustomerCode());

            customer.setName(incoming.getName());
            customer.setEmail(incoming.getEmail());
            customer.setMobileNumber(incoming.getMobileNumber());
            customer.setPreferredLanguage(incoming.getPreferredLanguage());
            customer.setPreferredChannels(incoming.getPreferredChannels());
            customer.setAddressLine1(incoming.getAddressLine1());
            customer.setAddressLine2(incoming.getAddressLine2());
            customer.setAddressLine3(incoming.getAddressLine3());
            customer.setCity(incoming.getCity());
            customer.setPostalCode(incoming.getPostalCode());
            customer.setActive(true);

            customerRepository.save(customer);
        }
    }
}
