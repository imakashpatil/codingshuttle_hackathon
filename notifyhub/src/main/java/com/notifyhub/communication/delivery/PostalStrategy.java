package com.notifyhub.communication.delivery;

import com.notifyhub.communication.entity.Communication;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Map;

@Component
@Slf4j
public class PostalStrategy implements DeliveryStrategy {

    private static final String SPOOL_DIR = "../uploaded-files/postal_spool";

    @Override
    public void send(Communication comm, Map<String, Object> payload) throws Exception {
        log.info("Executing Postal Mail Strategy for Communication ID: {}", comm.getId());

        String address = comm.getPostalAddress();
        if (address == null || address.trim().isEmpty()) {
            throw new IllegalArgumentException("Postal dispatch address is mandatory for POSTAL routing");
        }

        Files.createDirectories(Paths.get(SPOOL_DIR));

        String manifestPath = SPOOL_DIR + "/" + comm.getId() + "_spool.txt";
        String content = String.format("JOB_ID: %s\nRECIPIENT: %s\nDELIVERY_ADDRESS: %s\nINVOICE_PDF: %s\nSPOOL_TIME: %s\n",
                comm.getId(), comm.getCustomerName(), address, comm.getPdfPath(), java.time.LocalDateTime.now());

        Files.write(Paths.get(manifestPath), content.getBytes());

        log.info("[POSTAL MOCK SERVICE] Spooled dispatch manifest metadata file successfully: {}", manifestPath);
    }

    @Override
    public String getChannel() {
        return "POSTAL";
    }
}
