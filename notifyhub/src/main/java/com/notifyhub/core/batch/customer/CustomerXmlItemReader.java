package com.notifyhub.core.batch.customer;


import com.notifyhub.core.batch.dto.CustomerImportRecord;
import org.jspecify.annotations.NonNull;
import org.springframework.batch.infrastructure.item.ExecutionContext;
import org.springframework.batch.infrastructure.item.ItemStreamReader;

import javax.xml.stream.XMLInputFactory;
import javax.xml.stream.XMLStreamConstants;
import javax.xml.stream.XMLStreamException;
import javax.xml.stream.XMLStreamReader;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;

public class CustomerXmlItemReader implements ItemStreamReader<CustomerImportRecord> {

    private final Path xmlPath;
    private XMLStreamReader reader;
    private InputStream inputStream;

    public CustomerXmlItemReader(Path xmlPath) {
        this.xmlPath = xmlPath;
    }

    @Override
    public CustomerImportRecord read() throws Exception {
        while (reader.hasNext()) {
            int event = reader.next();
            if (event == XMLStreamConstants.START_ELEMENT && "customer".equals(reader.getLocalName())) {
                return readCustomer();
            }
        }
        return null;
    }

    private CustomerImportRecord readCustomer() throws Exception {

        String customerCode = null;
        String name = null;
        String email = null;
        String mobileNumber = null;
        String preferredLanguage = null;
        String preferredChannels =  null;
        String city = null;
        String postalCode = null;
        String addressLine1 = null;
        String addressLine2 = null;
        String addressLine3 = null;

        while (reader.hasNext()) {
            int event = reader.next();
            if (event == XMLStreamConstants.START_ELEMENT) {
                String element = reader.getLocalName();
                switch (element) {
                    case "customerCode" -> customerCode = reader.getElementText();
                    case "name"         -> name = reader.getElementText();
                    case "email"        -> email = reader.getElementText();
                    case "mobileNumber" -> mobileNumber = reader.getElementText();
                    case "preferredLanguage" -> preferredLanguage = reader.getElementText();
                    case "city"         -> city = reader.getElementText();
                    case "postalCode"   -> postalCode = reader.getElementText();
                    case "addressLine1" -> addressLine1 = reader.getElementText();
                    case "addressLine2" -> addressLine2 = reader.getElementText();
                    case "addressLine3" -> addressLine3 = reader.getElementText();
                    case "preferredChannels" -> preferredChannels = reader.getElementText();
                }
            }

            if (event == XMLStreamConstants.END_ELEMENT && "customer".equals(reader.getLocalName())) {
                break;
            }
        }

        return CustomerImportRecord.builder()
                .customerCode(customerCode)
                .name(name)
                .email(email)
                .mobileNumber(mobileNumber)
                .preferredLanguage(preferredLanguage)
                .preferredChannels(preferredChannels)
                .city(city)
                .postalCode(postalCode)
                .addressLine1(addressLine1)
                .addressLine2(addressLine2)
                .addressLine3(addressLine3)
                .build();
    }

    @Override
    public void open(@NonNull ExecutionContext executionContext) {

        try {
            inputStream = Files.newInputStream(xmlPath);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }

        XMLInputFactory factory = XMLInputFactory.newFactory();

        try {
            reader = factory.createXMLStreamReader(inputStream);
        } catch (XMLStreamException e) {
            throw new RuntimeException(e);
        }
    }


    @Override
    public void close() {
        if (reader != null) {
            try {
                reader.close();
            } catch (XMLStreamException e) {
                throw new RuntimeException(e);
            }
        }

        if (inputStream != null) {
            try {
                inputStream.close();
            } catch (IOException e) {
                throw new RuntimeException(e);
            }
        }
    }
}