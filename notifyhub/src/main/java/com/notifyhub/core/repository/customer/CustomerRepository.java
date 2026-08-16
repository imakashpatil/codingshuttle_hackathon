package com.notifyhub.core.repository.customer;


import com.notifyhub.core.entity.customer.Customer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface CustomerRepository extends JpaRepository<Customer, UUID> {
    Page<Customer> findAllByActiveTrue(Pageable pageable);

    Optional<Customer> findByCustomerCode(String customerCode);
}
