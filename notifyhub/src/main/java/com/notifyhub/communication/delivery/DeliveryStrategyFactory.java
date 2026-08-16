package com.notifyhub.communication.delivery;

import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class DeliveryStrategyFactory {

    private final Map<String, DeliveryStrategy> strategies = new HashMap<>();

    public DeliveryStrategyFactory(List<DeliveryStrategy> strategyList) {

        for (DeliveryStrategy strategy : strategyList) {
            strategies.put(
                    strategy.getChannel().toUpperCase(),
                    strategy
            );
        }
    }

    public DeliveryStrategy getStrategy(String channel) {

        if (channel == null || channel.isBlank()) {
            throw new IllegalArgumentException(
                    "Communication channel cannot be null or empty"
            );
        }

        DeliveryStrategy strategy = strategies.get(channel.toUpperCase());

        if (strategy == null) {
            throw new IllegalArgumentException(
                    "Unknown outbound channel: " + channel
            );
        }
        return strategy;
    }
}