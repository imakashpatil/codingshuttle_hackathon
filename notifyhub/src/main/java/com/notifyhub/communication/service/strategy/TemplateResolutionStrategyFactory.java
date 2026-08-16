package com.notifyhub.communication.service.strategy;

import com.notifyhub.communication.service.strategy.TemplateResolutionStrategy;
import org.springframework.stereotype.Component;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class TemplateResolutionStrategyFactory {

    private final Map<String, TemplateResolutionStrategy> strategies = new HashMap<>();

    public TemplateResolutionStrategyFactory(List<TemplateResolutionStrategy> strategyList) {
        for (TemplateResolutionStrategy strategy : strategyList) {
            strategies.put(strategy.getChannel().toUpperCase(), strategy);
        }
    }

    public TemplateResolutionStrategy getStrategy(String channel) {
        if (channel == null) {
            throw new IllegalArgumentException("Channel cannot be null");
        }
        TemplateResolutionStrategy strategy = strategies.get(channel.toUpperCase());
        if (strategy == null) {
            throw new IllegalArgumentException("No template resolution strategy found for channel: " + channel);
        }
        return strategy;
    }
}
