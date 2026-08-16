package com.notifyhub.core.batch.communication;

import com.notifyhub.core.batch.dto.CommunicationImportRecord;
import com.notifyhub.core.entity.communication.CommunicationRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.batch.core.listener.SkipListener;

@Slf4j
@RequiredArgsConstructor
public class CommunicationSkipListener implements SkipListener<CommunicationImportRecord, CommunicationRequest> {

    private final CommunicationFailedRecordWriter failedRecordWriter;

    @Override
    public void onSkipInRead(Throwable throwable) {
        log.error("Communication record skipped while reading", throwable);
    }

    @Override
    public void onSkipInProcess(CommunicationImportRecord item, Throwable throwable) {
        log.error("Communication skipped: customerId={}, reason={}",
                item.getCustomerId(), throwable.getMessage());

        failedRecordWriter.write(
                item,
                throwable instanceof Exception exception ? exception : new RuntimeException(throwable)
        );
    }

    @Override
    public void onSkipInWrite(CommunicationRequest item, Throwable throwable) {
        log.error("Communication skipped while writing: id={}, reason={}", item.getId(), throwable.getMessage());
    }
}
