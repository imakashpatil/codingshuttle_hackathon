package com.notifyhub.core.batch.communication;

import com.notifyhub.core.batch.dto.CommunicationImportRecord;
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

public class CommunicationXmlItemReader implements ItemStreamReader<CommunicationImportRecord> {

    private final Path xmlPath;
    private XMLStreamReader reader;
    private InputStream inputStream;

    public CommunicationXmlItemReader(Path xmlPath) {
        this.xmlPath = xmlPath;
    }

    @Override
    public CommunicationImportRecord read() throws Exception {
        while (reader.hasNext()) {
            int event = reader.next();
            if (event == XMLStreamConstants.START_ELEMENT && "communication".equals(reader.getLocalName())) {
                return readCommunication();
            }
        }
        return null;
    }

    private CommunicationImportRecord readCommunication() throws Exception {
        String customerId = null;
        String communicationDefinitionCode = null;
        String communicationData = null;

        while (reader.hasNext()) {
            int event = reader.next();
            if (event == XMLStreamConstants.START_ELEMENT) {
                String element = reader.getLocalName();
                switch (element) {
                    case "customerId" -> customerId = reader.getElementText();
                    case "communicationDefinitionCode" -> communicationDefinitionCode = reader.getElementText();
                    case "communicationData" -> communicationData = readElementXml(reader);
                }
            }
            if (event == XMLStreamConstants.END_ELEMENT && "communication".equals(reader.getLocalName())) {
                break;
            }
        }

        String code = communicationDefinitionCode;

        if ((code == null || code.isBlank()) && communicationData != null) {
            code = extractCode(communicationData);
        }

        return CommunicationImportRecord.builder()
                .customerId(customerId)
                .communicationDefinitionCode(code)
                .communicationData(communicationData)
                .build();
    }

    private String extractCode(String xml) {
        if (xml == null) return null;
        String start = "<communicationDefinitionCode>";
        String end = "</communicationDefinitionCode>";
        int startIndex = xml.indexOf(start);
        if (startIndex != -1) {
            int endIndex = xml.indexOf(end, startIndex);
            if (endIndex != -1) {
                return xml.substring(startIndex + start.length(), endIndex).trim();
            }
        }
        return null;
    }

    private String readElementXml(XMLStreamReader reader) throws XMLStreamException {
        StringBuilder sb = new StringBuilder();
        String tagName = reader.getLocalName();
        sb.append("<").append(tagName);
        for (int i = 0; i < reader.getAttributeCount(); i++) {
            sb.append(" ").append(reader.getAttributeLocalName(i))
              .append("=\"").append(reader.getAttributeValue(i)).append("\"");
        }
        sb.append(">");

        int depth = 1;
        while (reader.hasNext() && depth > 0) {
            int event = reader.next();
            if (event == XMLStreamConstants.START_ELEMENT) {
                depth++;
                sb.append("<").append(reader.getLocalName());
                for (int i = 0; i < reader.getAttributeCount(); i++) {
                    sb.append(" ").append(reader.getAttributeLocalName(i))
                      .append("=\"").append(reader.getAttributeValue(i)).append("\"");
                }
                sb.append(">");
            } else if (event == XMLStreamConstants.END_ELEMENT) {
                depth--;
                sb.append("</").append(reader.getLocalName()).append(">");
            } else if (event == XMLStreamConstants.CHARACTERS) {
                sb.append(reader.getText());
            }
        }
        return sb.toString().trim();
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
    public void update(@NonNull ExecutionContext executionContext) {
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
