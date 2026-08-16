package com.notifyhub.communication.service;

import com.notifyhub.communication.dto.ResolvedMessage;
import com.notifyhub.communication.dto.TemplateResolutionResult;
import com.notifyhub.communication.entity.Communication;
import com.notifyhub.communication.repository.CommunicationRepository;
import com.notifyhub.communication.service.cache.TemplateCacheService;
import com.notifyhub.communication.service.strategy.TemplateResolutionStrategy;
import com.notifyhub.communication.service.strategy.TemplateResolutionStrategyFactory;
import com.notifyhub.core.entity.template.DocumentTemplate;
import com.notifyhub.core.repository.template.DocumentTemplateRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class TemplateResolverService {

    private final TemplateResolutionStrategyFactory templateResolutionStrategyFactory;

    private final DocumentTemplateRepository documentTemplateRepository;
    private final PdfGenerationService pdfGenerationService;
    private final CommunicationRepository communicationRepository;
    private final TemplateCacheService templateCacheService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    public ResolvedMessage resolveAndCompile(UUID communicationId, UUID requestId, String channel, String templateCode, String xmlData) throws Exception {
        // Parse raw XML payload into flat/nested map properties
        Map<String, Object> payload = parseXmlToMap(xmlData);

        // Fetch using the strategy factory pattern
        TemplateResolutionStrategy strategy = templateResolutionStrategyFactory.getStrategy(channel);
        TemplateResolutionResult result = strategy.resolveTemplate(templateCode);

        String htmlContent = "";
        String cssContent = "";
        String subject = "";
        String pdfPath = null;
        boolean isRealAttachment = false;

        if (result != null) {
            htmlContent = result.getContent() != null ? result.getContent() : "";
            cssContent = result.getCssContent() != null ? result.getCssContent() : "";
            subject = result.getSubject() != null ? result.getSubject() : "";
            
            // Check if PDF needs to be generated first
            if (result.getDocumentTemplates() != null && !result.getDocumentTemplates().isEmpty()) {
                isRealAttachment = true;
                DocumentTemplate docTpl = result.getDocumentTemplates().get(0);
                
                String existingPdfPath = findExistingPdf(requestId, docTpl.getId());
                if (existingPdfPath != null) {
                    pdfPath = existingPdfPath;
                    log.info("Reusing existing PDF compiled for DocumentTemplate: {}", docTpl.getId());
                } else {
                    pdfPath = pdfGenerationService.generatePdf(communicationId, docTpl.getHtmlContent(), docTpl.getCssContent(), payload);
                }
            }
        }

        // Fallback checks — Redis cache-aside before hitting PostgreSQL
        if (htmlContent == null || htmlContent.trim().isEmpty()) {
            String cached = templateCacheService.get(templateCode);
            if (cached != null) {
                try {
                    @SuppressWarnings("unchecked")
                    Map<String, String> cachedMap = objectMapper.readValue(cached, java.util.Map.class);
                    htmlContent = cachedMap.getOrDefault("html", "");
                    cssContent = cachedMap.getOrDefault("css", "");

                    log.info("Template '{}' loaded from Redis cache.", templateCode);
                } catch (Exception ex) {
                    log.warn("Failed to deserialize cached template '{}', falling through to DB.", templateCode);
                }
            }

            if (htmlContent == null || htmlContent.trim().isEmpty()) {
                DocumentTemplate tpl = documentTemplateRepository.findByTemplateCode(templateCode).orElse(null);
                if (tpl != null) {
                    htmlContent = tpl.getHtmlContent();
                    cssContent = tpl.getCssContent() != null ? tpl.getCssContent() : "";

                    // Store in Redis for subsequent dispatches
                    try {
                        java.util.Map<String, String> toCache = new java.util.HashMap<>();
                        toCache.put("html", htmlContent);
                        toCache.put("css", cssContent);
                        templateCacheService.put(templateCode, objectMapper.writeValueAsString(toCache));
                    } catch (Exception ex) {
                        log.warn("Failed to cache template '{}' in Redis: {}", templateCode, ex.getMessage());
                    }
                }
            }
        }

        if (htmlContent == null || htmlContent.trim().isEmpty()) {
            throw new IllegalStateException("Failed to retrieve valid template structure for code: " + templateCode);
        }

        String compiledHtml = compileHtmlTemplate(htmlContent, cssContent, payload);
        String resolvedSubject = compileCustomTemplate(subject, payload);

        if (isRealAttachment && pdfPath == null) {
            pdfPath = pdfGenerationService.generatePdf(communicationId, htmlContent, cssContent, payload);
        }

        return ResolvedMessage.builder()
                .htmlContent(compiledHtml)
                .subject(resolvedSubject)
                .pdfPath(pdfPath)
                .realAttachment(isRealAttachment)
                .build();
    }

    public Map<String, Object> parseXmlToMap(String xml) {
        try {
            DocumentBuilderFactory dbFactory = DocumentBuilderFactory.newInstance();
            DocumentBuilder dBuilder = dbFactory.newDocumentBuilder();
            Document doc = dBuilder.parse(new org.xml.sax.InputSource(new java.io.StringReader(xml)));
            doc.getDocumentElement().normalize();
            
            Object parsed = parseNode(doc.getDocumentElement());
            if (parsed instanceof Map) {
                Map<String, Object> payloadMap = (Map<String, Object>) parsed;
                if (payloadMap.containsKey("invoice") && payloadMap.get("invoice") instanceof Map) {
                    payloadMap.putAll((Map<String, Object>) payloadMap.get("invoice"));
                }
                return payloadMap;
            } else {
                Map<String, Object> rootMap = new HashMap<>();
                rootMap.put(doc.getDocumentElement().getNodeName(), parsed);
                return rootMap;
            }
        } catch (Exception e) {
            log.error("Failed to parse XML data into nested map structure: {}", xml, e);
            return new HashMap<>();
        }
    }

    @SuppressWarnings("unchecked")
    private Object parseNode(Node node) {
        if (node.getNodeType() == Node.ELEMENT_NODE) {
            Element element = (Element) node;
            NodeList children = element.getChildNodes();
            
            boolean hasElementChildren = false;
            for (int i = 0; i < children.getLength(); i++) {
                if (children.item(i).getNodeType() == Node.ELEMENT_NODE) {
                    hasElementChildren = true;
                    break;
                }
            }
            if (!hasElementChildren) {
                return element.getTextContent().trim();
            }

            Map<String, Object> childMap = new HashMap<>();
            for (int i = 0; i < children.getLength(); i++) {
                Node child = children.item(i);
                if (child.getNodeType() == Node.ELEMENT_NODE) {
                    String childName = child.getNodeName();
                    Object parsedChild = parseNode(child);
                    
                    if (childMap.containsKey(childName)) {
                        Object existing = childMap.get(childName);
                        if (existing instanceof List) {
                            ((List<Object>) existing).add(parsedChild);
                        } else {
                            List<Object> list = new ArrayList<>();
                            list.add(existing);
                            list.add(parsedChild);
                            childMap.put(childName, list);
                        }
                    } else {
                        childMap.put(childName, parsedChild);
                    }
                }
            }
            return childMap;
        }
        return "";
    }

    private String compileHtmlTemplate(String templateHtml, String templateCss, Map<String, Object> payload) {
        String renderedHtml = compileCustomTemplate(templateHtml, payload);

        String lowerHtml = renderedHtml.toLowerCase();
        if (templateCss != null && !templateCss.trim().isEmpty()) {
            if (lowerHtml.contains("</head>")) {
                int idx = lowerHtml.indexOf("</head>");
                renderedHtml = renderedHtml.substring(0, idx)
                        + "<style>" + templateCss + "</style>"
                        + renderedHtml.substring(idx);
                lowerHtml = renderedHtml.toLowerCase();
            }
        }

        if (!lowerHtml.contains("<html")) {
            String cssBlock = (templateCss != null && !templateCss.trim().isEmpty())
                    ? templateCss
                    : "body { font-family: sans-serif; padding: 20px; }";
            renderedHtml = "<!DOCTYPE html><html><head><meta charset=\"UTF-8\" /><style>"
                    + cssBlock
                    + "</style></head><body>"
                    + renderedHtml
                    + "</body></html>";
        }

        return renderedHtml;
    }

    @SuppressWarnings("unchecked")
    private String compileCustomTemplate(String template, Map<String, Object> context) {
        if (template == null || template.isEmpty()) {
            return "";
        }
        String output = template;

        // 1. Compile {{#eachPage path size=N}} ... {{/eachPage}}
        Pattern eachPagePattern = Pattern.compile(
                "\\{\\{\\#eachPage\\s+([a-zA-Z0-9_\\.\\/]+)\\s+size=(\\d+)\\}\\}([\\s\\S]*?)\\{\\{\\/eachPage\\}\\}");
        while (true) {
            Matcher matcher = eachPagePattern.matcher(output);
            if (!matcher.find()) {
                break;
            }
            String fullMatch = matcher.group(0);
            String path = matcher.group(1);
            int size = Integer.parseInt(matcher.group(2));
            String innerTemplate = matcher.group(3);

            Object resolved = resolvePath(context, path);
            StringBuilder sb = new StringBuilder();
            List<Object> list = new ArrayList<>();
            if (resolved instanceof List) {
                list.addAll((List<?>) resolved);
            } else if (resolved != null) {
                list.add(resolved);
            }

            if (!list.isEmpty()) {
                int totalPages = (int) Math.ceil((double) list.size() / size);
                if (totalPages == 0) totalPages = 1;
                for (int i = 0; i < list.size(); i += size) {
                    int end = Math.min(i + size, list.size());
                    List<?> chunk = list.subList(i, end);
                    int pageNum = (i / size) + 1;

                    Map<String, Object> pageContext = new HashMap<>(context);
                    pageContext.put("thisPageItems", chunk);
                    pageContext.put("pageNumber", pageNum);
                    pageContext.put("totalPages", totalPages);
                    pageContext.put("isLastPage", pageNum == totalPages);

                    sb.append(compileCustomTemplate(innerTemplate, pageContext));
                }
            }
            output = output.replace(fullMatch, sb.toString());
        }

        // 2. Compile {{#each path}} ... {{/each}}
        Pattern eachPattern = Pattern.compile(
                "\\{\\{\\#each\\s+([a-zA-Z0-9_\\.\\/]+)\\}\\}([\\s\\S]*?)\\{\\{\\/each\\}\\}");
        while (true) {
            Matcher matcher = eachPattern.matcher(output);
            if (!matcher.find()) {
                break;
            }
            String fullMatch = matcher.group(0);
            String path = matcher.group(1);
            String innerTemplate = matcher.group(2);

            Object resolved = resolvePath(context, path);
            StringBuilder sb = new StringBuilder();
            List<Object> list = new ArrayList<>();
            if (resolved instanceof List) {
                list.addAll((List<?>) resolved);
            } else if (resolved != null) {
                list.add(resolved);
            }

            for (Object item : list) {
                Map<String, Object> itemContext = new HashMap<>(context);
                if (item instanceof Map) {
                    itemContext.putAll((Map<String, Object>) item);
                } else {
                    itemContext.put("this", item);
                }
                sb.append(compileCustomTemplate(innerTemplate, itemContext));
            }
            output = output.replace(fullMatch, sb.toString());
        }

        // 3. Compile {{#if path}} ... {{/if}}
        Pattern ifPattern = Pattern.compile(
                "\\{\\{\\#if\\s+([a-zA-Z0-9_\\.\\/]+)\\}\\}([\\s\\S]*?)(?:\\{\\{else\\}\\}([\\s\\S]*?))?\\{\\{\\/if\\}\\}");
        while (true) {
            Matcher matcher = ifPattern.matcher(output);
            if (!matcher.find()) {
                break;
            }
            String fullMatch = matcher.group(0);
            String path = matcher.group(1);
            String truthyTemplate = matcher.group(2);
            String falseyTemplate = matcher.group(3) != null ? matcher.group(3) : "";

            Object resolved = resolvePath(context, path);
            boolean isTruthy = false;
            if (resolved != null) {
                if (resolved instanceof Boolean) {
                    isTruthy = (Boolean) resolved;
                } else if (resolved instanceof String) {
                    isTruthy = !((String) resolved).isEmpty();
                } else if (resolved instanceof java.util.Collection) {
                    isTruthy = !((java.util.Collection<?>) resolved).isEmpty();
                } else {
                    isTruthy = true;
                }
            }

            String selectedTemplate = isTruthy ? truthyTemplate : falseyTemplate;
            output = output.replace(fullMatch, compileCustomTemplate(selectedTemplate, context));
        }

        // 4. Variable interpolation {{path}}
        Pattern varPattern = Pattern.compile(
                "\\{\\{([a-zA-Z0-9_\\.\\/]+)\\}\\}");
        while (true) {
            Matcher matcher = varPattern.matcher(output);
            if (!matcher.find()) {
                break;
            }
            String fullMatch = matcher.group(0);
            String path = matcher.group(1);

            Object resolved = resolvePath(context, path);
            String value = resolved != null ? String.valueOf(resolved) : "";
            output = output.replace(fullMatch, value);
        }

        return output;
    }

    private Object resolvePath(Map<String, Object> context, String path) {
        if (path == null || path.isEmpty()) return null;
        String normalizedPath = path.replace("/", ".");
        String[] parts = normalizedPath.split("\\.");

        Object current = context;
        for (String part : parts) {
            if (current == null) return null;
            if (current instanceof Map) {
                current = ((Map<?, ?>) current).get(part);
            } else {
                return null;
            }
        }
        return current;
    }

    private String findExistingPdf(UUID requestId, UUID documentTemplateId) {
        if (requestId == null || documentTemplateId == null) return null;
        try {
            List<Communication> comms = communicationRepository.findByRequestId(requestId);

            for (Communication comm : comms) {
                if (comm.getPdfPath() != null && !comm.getPdfPath().isEmpty()) {
                    TemplateResolutionStrategy strategy = templateResolutionStrategyFactory.getStrategy(comm.getChannel());
                    TemplateResolutionResult result = strategy.resolveTemplate(comm.getTemplateCode());
                    if (result != null && result.getDocumentTemplates() != null && !result.getDocumentTemplates().isEmpty()) {
                        if (result.getDocumentTemplates().get(0).getId().equals(documentTemplateId)) {
                            return comm.getPdfPath();
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Failed to find existing PDF for requestId: {}, docTemplateId: {}", requestId, documentTemplateId, e);
        }
        return null;
    }
}
