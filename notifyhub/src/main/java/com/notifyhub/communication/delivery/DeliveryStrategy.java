package com.notifyhub.communication.delivery;

import com.notifyhub.communication.entity.Communication;
import java.util.Map;

public interface DeliveryStrategy {
    void send(Communication comm, Map<String, Object> payload) throws Exception;
    public String getChannel();
}
