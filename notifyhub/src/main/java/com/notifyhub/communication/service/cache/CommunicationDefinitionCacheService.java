package com.notifyhub.communication.service.cache;

import com.notifyhub.core.entity.communication.CommunicationDefinition;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import tools.jackson.databind.ObjectMapper;

import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class CommunicationDefinitionCacheService {

    private final RedisTemplate<String, String> redisTemplate;
    private final ObjectMapper objectMapper;

    @Value("${app.redis.key-prefix:notifyhub:communication-definition:}")
    private String keyPrefix;

    @Value("${app.redis.ttl-seconds:3600}")
    private long ttlSeconds;

    public CommunicationDefinition get(String communicationCode) {

        String key = keyPrefix + communicationCode;

        try {
            String value = redisTemplate.opsForValue().get(key);

            if (value == null) {
                return null;
            }

            log.debug("Redis cache HIT for communication definition: {}", communicationCode
            );

            return objectMapper.readValue(
                    value,
                    CommunicationDefinition.class
            );

        } catch (Exception e) {
            log.warn("Redis cache GET failed for key {}: {}. Falling through to DB.", key, e.getMessage());
            return null;
        }
    }

    public void put(
            String communicationCode,
            CommunicationDefinition definition) {

        String key = keyPrefix + communicationCode;

        try {

            String value = objectMapper.writeValueAsString(definition);

            redisTemplate.opsForValue().set(
                    key,
                    value,
                    ttlSeconds,
                    TimeUnit.SECONDS
            );

            log.debug(
                    "Redis cache SET for communication definition: {}",
                    communicationCode
            );

        } catch (Exception e) {
            log.warn(
                    "Redis cache SET failed for key {}: {}",
                    key,
                    e.getMessage()
            );
        }
    }

    public void evict(String communicationCode) {

        String key = keyPrefix + communicationCode;

        try {
            redisTemplate.delete(key);
            log.info(
                    "Redis cache EVICTED for communication definition: {}",
                    communicationCode
            );
        } catch (Exception e) {
            log.warn(
                    "Redis cache EVICT failed for key {}: {}",
                    key,
                    e.getMessage()
            );
        }
    }
}