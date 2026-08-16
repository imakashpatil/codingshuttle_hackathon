package com.notifyhub.communication.service.strategy;

import com.notifyhub.communication.dto.TemplateResolutionResult;

public interface TemplateResolutionStrategy {
    String getChannel();
    TemplateResolutionResult resolveTemplate(String templateCode);
}
