package com.notifyhub.communication.consumer;

import com.notifyhub.communication.consumer.strategy.TemplateCodeResolver;
import com.notifyhub.communication.consumer.strategy.TemplateCodeResolverFactory;
import com.notifyhub.communication.service.cache.TemplateCacheService;
import com.notifyhub.core.enums.CommunicationChannel;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TemplateCodeService {

    private final TemplateCacheService templateCacheService;
    private final TemplateCodeResolverFactory resolverFactory;

    public String getTemplateCode(UUID templateId, String channel) {

        if (templateId == null) {
            return "DEFAULT_TEMPLATE";
        }

        String cacheKey = channel + ":" + templateId;

        // 1. Check Redis
        String cachedTemplate = templateCacheService.get(cacheKey);

        if (cachedTemplate != null) {
            return cachedTemplate;
        }

        // 2. Get appropriate strategy
        TemplateCodeResolver resolver = resolverFactory.getResolver(channel);

        // 3. Fetch from DB using strategy
        String templateCode = resolver.resolve(templateId);

        // 4. Store in Redis
        templateCacheService.put(cacheKey, templateCode);

        return templateCode;
    }
}