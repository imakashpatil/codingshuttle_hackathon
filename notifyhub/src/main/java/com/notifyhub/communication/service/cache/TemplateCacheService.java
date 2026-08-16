package com.notifyhub.communication.service.cache;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class TemplateCacheService {

    private final RedisTemplate<String, String> redisTemplate;

    @Value("${app.redis.key-prefix:notifyhub:template:}")
    private String keyPrefix;

    @Value("${app.redis.ttl-seconds:3600}")
    private long ttlSeconds;


    public String get(String templateCode) {
        String key = keyPrefix + templateCode;
        try {
            String value = redisTemplate.opsForValue().get(key);
            if (value != null) {
                log.debug("Redis cache HIT for template: {}", templateCode);
            }
            return value;
        } catch (Exception e) {
            log.warn("Redis cache GET failed for key {}: {}. Falling through to DB.", key, e.getMessage());
            return null;
        }
    }


    public void put(String templateCode, String value) {
        String key = keyPrefix + templateCode;
        try {
            redisTemplate.opsForValue().set(key, value, ttlSeconds, TimeUnit.SECONDS);
            log.debug("Redis cache SET for template: {} (TTL {}s)", templateCode, ttlSeconds);
        } catch (Exception e) {
            log.warn("Redis cache SET failed for key {}: {}. Continuing without cache.", key, e.getMessage());
        }
    }


    public void evict(String templateCode) {
        String key = keyPrefix + templateCode;
        try {
            redisTemplate.delete(key);
            log.info("Redis cache EVICTED for template: {}", templateCode);
        } catch (Exception e) {
            log.warn("Redis cache EVICT failed for key {}: {}", key, e.getMessage());
        }
    }
}
