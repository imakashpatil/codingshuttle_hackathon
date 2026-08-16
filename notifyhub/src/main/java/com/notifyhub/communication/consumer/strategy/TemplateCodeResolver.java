package com.notifyhub.communication.consumer.strategy;

import java.util.UUID;

public interface TemplateCodeResolver {

    String resolve(UUID templateId);

    String supports();
}
