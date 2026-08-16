package com.notifyhub.security.service;


import com.notifyhub.core.entity.user.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;

@Component
public class JwtService {
    public static String USERNAME = "username";
    public static String NAME = "name";


    @Value("${security.jwt.secret.access-token}")
    private String accessTokenSecret;

    @Value("${security.jwt.secret.refresh-token}")
    private String refreshTokenSecret;

    @Value("${security.jwt.expiration.access-token.minutes}")
    private Integer accessTokenExpiryMinutes;

    @Value("${security.jwt.expiration.refresh-token.days}")
    private Integer refreshTokenExpiryDays;

    public SecretKey getSecretkey(String secretKeyValue){
        return Keys.hmacShaKeyFor(secretKeyValue.getBytes(StandardCharsets.UTF_8));
    }

    public String generateJwtAccessToken(User user){
        Date issuedAt = Date.from(Instant.now());
        Date accessTokenExpiry = Date.from(Instant.now().plusSeconds(accessTokenExpiryMinutes * 60L));

        return Jwts.builder()
                .subject(String.valueOf(user.getId()))
                .issuedAt(issuedAt)
                .expiration(accessTokenExpiry)
                .claim(USERNAME, user.getEmail())
                .claim(NAME, user.getName())
                .signWith(getSecretkey(this.accessTokenSecret))
                .compact();
    }

    public String generateJwtRefreshToken(User user){
        Date issuedAt = Date.from(Instant.now());
        Date refreshTokenExpiry = Date.from(Instant.now().plusSeconds(refreshTokenExpiryDays * 24 * 60 * 60L));

        return Jwts.builder()
                .subject(String.valueOf(user.getId()))
                .issuedAt(issuedAt)
                .expiration(refreshTokenExpiry)
                .claim(USERNAME,  user.getEmail())
                .claim(NAME, user.getName())
                .signWith(getSecretkey(this.refreshTokenSecret))
                .compact();
    }

    public Claims getUserNameFromAccessToken(String token){
        return Jwts.parser()
                .verifyWith(getSecretkey(accessTokenSecret))
                .build()
                .parseSignedClaims(token)
                .getPayload();

    }

    public Claims getUserNameFromRefreshToken(String token){
        return Jwts.parser()
                .verifyWith(getSecretkey(refreshTokenSecret))
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public String extractClaimByKey(Claims claims, String key){
        return claims.get(key, String.class);
    }

}

