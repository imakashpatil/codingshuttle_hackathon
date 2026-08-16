package com.notifyhub.core.service.user;


import com.notifyhub.core.dto.user.request.AuthRequest;
import com.notifyhub.core.dto.user.request.RefreshTokenRequest;
import com.notifyhub.core.dto.user.response.AuthResponse;
import com.notifyhub.core.entity.user.User;
import com.notifyhub.core.repository.user.UserRepository;
import com.notifyhub.security.service.JwtService;
import com.notifyhub.shared.exception.ResourceNotFoundException;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final JwtService jwtService;
    private static final String USERNAME = "username";

    public AuthResponse login(AuthRequest request) {

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        String accessToken = jwtService.generateJwtAccessToken(user);

        String refreshToken = jwtService.generateJwtRefreshToken(user);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .build();
    }

    public AuthResponse refreshToken(RefreshTokenRequest request) {

        String refreshToken = request.getRefreshToken();

        if (refreshToken == null || refreshToken.isBlank()) {
            throw new RuntimeException("Invalid refresh token");
        }

        Claims claims = jwtService.getUserNameFromRefreshToken(refreshToken);
        String email = jwtService.extractClaimByKey(claims, USERNAME);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(user.getEmail(), user.getPassword())
        );

        if (!user.isActive()) {
            throw new RuntimeException("User is inactive");
        }

        String newAccessToken = jwtService.generateJwtAccessToken(user);

        String newRefreshToken = jwtService.generateJwtRefreshToken(user);

        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .build();
    }
}