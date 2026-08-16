package com.notifyhub.security.rateLimiter;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Collections;
@Component
@RequiredArgsConstructor
@Slf4j
public class ApiRateLimiter {

    private static final String RATE_LIMIT_KEY_PREFIX = "ratelimit:api:";

    private final StringRedisTemplate redisTemplate;

    @Value("${app.rate-limit.requests}")
    private long capacity;

    @Value("${app.rate-limit.seconds}")
    private long refillSeconds;

    private final DefaultRedisScript<Long> rateLimitLuaScript =
            createRateLimitScript();

    public boolean allow(String apiKey) {

        String key = RATE_LIMIT_KEY_PREFIX + apiKey;

        Long result = redisTemplate.execute(
                rateLimitLuaScript,
                Collections.singletonList(key),
                String.valueOf(capacity),
                String.valueOf(refillSeconds),
                String.valueOf(Instant.now().getEpochSecond())
        );
        log.info("***client Id ***"+ result);
        return Long.valueOf(1).equals(result);
    }

    private DefaultRedisScript<Long> createRateLimitScript() {

        DefaultRedisScript<Long> script =
                new DefaultRedisScript<>();

        script.setResultType(Long.class);

        script.setScriptText("""
                local key = KEYS[1]
                local capacity = tonumber(ARGV[1])
                local refill_secs = tonumber(ARGV[2])
                local now = tonumber(ARGV[3])

                local data = redis.call(
                    'HMGET',
                    key,
                    'tokens',
                    'last_refill'
                )

                local tokens = tonumber(data[1]) or capacity
                local last_refill = tonumber(data[2]) or now

                local elapsed = now - last_refill

                local refill = math.floor(
                    elapsed / refill_secs * capacity
                )

                tokens = math.min(
                    capacity,
                    tokens + refill
                )

                if tokens > 0 then
                    tokens = tokens - 1

                    redis.call(
                        'HMSET',
                        key,
                        'tokens', tokens,
                        'last_refill', now
                    )

                    redis.call(
                        'EXPIRE',
                        key,
                        refill_secs * 2
                    )

                    return 1
                else
                    return 0
                end
                """);

        return script;
    }
}