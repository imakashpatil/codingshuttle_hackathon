package com.notifyhub.core.batch.customer;

import com.notifyhub.core.batch.dto.CustomerImportRecord;
import com.notifyhub.core.entity.customer.Customer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jspecify.annotations.NonNull;
import org.springframework.batch.core.listener.SkipListener;

@Slf4j
@RequiredArgsConstructor
public class CustomerSkipListener implements SkipListener<CustomerImportRecord, Customer> {

    private final CustomerFailedRecordWriter failedRecordWriter;

    @Override
    public void onSkipInRead(@NonNull Throwable throwable) {
        log.error("Customer record skipped while reading", throwable
        );
    }

    @Override
    public void onSkipInProcess(CustomerImportRecord item, Throwable throwable) {
        log.error("Customer skipped: code={}, reason={}", item.getCustomerCode(), throwable.getMessage());

        failedRecordWriter.write(
                item,
                throwable instanceof Exception exception ? exception : new RuntimeException(throwable)
        );
    }

    @Override
    public void onSkipInWrite(Customer item, Throwable throwable) {
        log.error("Customer skipped while writing: code={}, reason={}", item.getCustomerCode(), throwable.getMessage());
    }
}
