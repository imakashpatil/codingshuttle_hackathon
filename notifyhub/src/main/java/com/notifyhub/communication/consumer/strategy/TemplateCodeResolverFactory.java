package com.notifyhub.communication.consumer.strategy;

import com.notifyhub.core.enums.CommunicationChannel;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class TemplateCodeResolverFactory {

    private final Map<String, TemplateCodeResolver> resolverMap;

    public TemplateCodeResolverFactory(List<TemplateCodeResolver> resolvers) {

        this.resolverMap = new HashMap<>();

        for (TemplateCodeResolver resolver : resolvers) {
            resolverMap.put(resolver.supports(), resolver);
        }
    }

    public TemplateCodeResolver getResolver(String channel) {

        TemplateCodeResolver resolver = resolverMap.get(channel);

        if (resolver == null) {throw new IllegalArgumentException("No template resolver found for channel: " + channel);}

        return resolver;
    }
}
