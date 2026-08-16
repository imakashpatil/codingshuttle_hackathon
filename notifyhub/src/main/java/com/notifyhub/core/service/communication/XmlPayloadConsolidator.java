package com.notifyhub.core.service.communication;

import org.springframework.stereotype.Component;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;
import org.xml.sax.InputSource;

import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.transform.OutputKeys;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.dom.DOMSource;
import javax.xml.transform.stream.StreamResult;
import java.io.StringReader;
import java.io.StringWriter;
import java.util.List;
import java.util.Set;

@Component
public class XmlPayloadConsolidator {

    private static final Set<String> COMMUNICATION_WRAPPERS = Set.of(
            "email",
            "sms",
            "whatsapp"
    );

    public String consolidate(List<String> xmlPayloads) {

        try {
            DocumentBuilderFactory factory =
                    DocumentBuilderFactory.newInstance();

            factory.setNamespaceAware(false);

            Document targetDocument =
                    factory.newDocumentBuilder().newDocument();

            Element communicationData =
                    targetDocument.createElement("communicationData");

            targetDocument.appendChild(communicationData);

            Element communicationDefinitionCode =
                    targetDocument.createElement("communicationDefinitionCode");
            communicationData.appendChild(communicationDefinitionCode);

            for (String xmlPayload : xmlPayloads) {

                if (xmlPayload == null || xmlPayload.isBlank()) {
                    continue;
                }

                Document sourceDocument =
                        factory.newDocumentBuilder().parse(
                                new InputSource(
                                        new StringReader(xmlPayload)
                                )
                        );

                Element sourceRoot =
                        sourceDocument.getDocumentElement();

                mergeSourceRoot(
                        targetDocument,
                        communicationData,
                        sourceRoot
                );
            }

            return convertToXml(targetDocument);

        } catch (Exception exception) {
            throw new IllegalStateException(
                    "Unable to consolidate XML payloads",
                    exception
            );
        }
    }

    private void mergeSourceRoot(
            Document targetDocument,
            Element targetRoot,
            Element sourceRoot) {

        String sourceRootName =
                sourceRoot.getTagName().toLowerCase();

        /*
         * Email/SMS/WhatsApp are transport/template wrappers.
         *
         * Example:
         *
         * <email>
         *     <invoice>
         *         ...
         *     </invoice>
         * </email>
         *
         * We don't want "email" in communicationData.
         */
        if (COMMUNICATION_WRAPPERS.contains(sourceRootName)) {

            mergeChildren(
                    targetDocument,
                    targetRoot,
                    sourceRoot
            );

            return;
        }

        /*
         * Document template:
         *
         * <invoice>
         *     ...
         * </invoice>
         *
         * invoice itself is a business node,
         * so merge the root element.
         */
        mergeElement(
                targetDocument,
                targetRoot,
                sourceRoot
        );
    }

    private void mergeElement(
            Document targetDocument,
            Element targetParent,
            Element sourceElement) {

        String elementName =
                sourceElement.getTagName();

        Element targetElement =
                findDirectChild(
                        targetParent,
                        elementName
                );

        if (targetElement == null) {

            targetElement =
                    targetDocument.createElement(elementName);

            targetParent.appendChild(targetElement);
        }

        /*
         * If the source element has no child elements,
         * it is a leaf node.
         *
         * We intentionally don't copy its value because
         * this is the consolidated XML schema.
         */
        if (!hasElementChildren(sourceElement)) {
            return;
        }

        mergeChildren(
                targetDocument,
                targetElement,
                sourceElement
        );
    }

    private void mergeChildren(
            Document targetDocument,
            Element targetParent,
            Element sourceParent) {

        NodeList children =
                sourceParent.getChildNodes();

        for (int index = 0;
             index < children.getLength();
             index++) {

            Node node =
                    children.item(index);

            if (node.getNodeType() != Node.ELEMENT_NODE) {
                continue;
            }

            Element sourceElement =
                    (Element) node;

            mergeElement(
                    targetDocument,
                    targetParent,
                    sourceElement
            );
        }
    }

    private Element findDirectChild(
            Element parent,
            String elementName) {

        NodeList children =
                parent.getChildNodes();

        for (int index = 0;
             index < children.getLength();
             index++) {

            Node node =
                    children.item(index);

            if (node.getNodeType() != Node.ELEMENT_NODE) {
                continue;
            }

            Element child =
                    (Element) node;

            if (child.getTagName().equals(elementName)) {
                return child;
            }
        }

        return null;
    }

    private boolean hasElementChildren(
            Element element) {

        NodeList children =
                element.getChildNodes();

        for (int index = 0;
             index < children.getLength();
             index++) {

            if (children.item(index).getNodeType()
                    == Node.ELEMENT_NODE) {

                return true;
            }
        }

        return false;
    }

    private String convertToXml(
            Document document) {

        try {

            Transformer transformer =
                    TransformerFactory
                            .newInstance()
                            .newTransformer();

            transformer.setOutputProperty(
                    OutputKeys.INDENT,
                    "yes"
            );

            transformer.setOutputProperty(
                    "{http://xml.apache.org/xslt}indent-amount",
                    "4"
            );

            transformer.setOutputProperty(
                    OutputKeys.OMIT_XML_DECLARATION,
                    "yes"
            );

            StringWriter writer =
                    new StringWriter();

            transformer.transform(
                    new DOMSource(document),
                    new StreamResult(writer)
            );

            return writer.toString();

        } catch (Exception exception) {

            throw new IllegalStateException(
                    "Unable to convert consolidated XML to string",
                    exception
            );
        }
    }
}