package com.notifyhub.core.controller.communication;

import com.notifyhub.core.dto.communication.request.CommunicationApiRequest;
import com.notifyhub.core.entity.communication.CommunicationRequest;
import com.notifyhub.core.entity.user.User;
import com.notifyhub.core.service.communication.CommunicationRequestService;
import com.notifyhub.security.rateLimiter.ApiRateLimiter;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/communication-requests")
@RequiredArgsConstructor
@Slf4j
public class CommunicationRequestController {

    private final CommunicationRequestService communicationRequestService;
    private final ApiRateLimiter apiRateLimiter;

    @PostMapping
    public ResponseEntity<CommunicationRequest> create(
            @Valid @RequestBody CommunicationApiRequest request) {

        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        if (authentication == null ||
                !authentication.isAuthenticated()) {

            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .build();
        }

        /*
         * Your JWT authentication should put the authenticated
         * user/merchant object into the SecurityContext.
         *
         * Replace the cast below with YOUR actual principal class.
         */
        User principal = (User) authentication.getPrincipal();

        assert principal != null;
        String clientId =
                principal.getId().toString();

        log.info("***client Id ***"+ clientId);

        /*
         * Rate limit using the UNIQUE authenticated ID.
         *
         * Do NOT use authentication.getName()
         * because name/username may not be the identifier
         * you want for rate limiting.
         */
        if (!apiRateLimiter.allow(clientId)) {

            log.warn(
                    "Rate limit exceeded for clientId={}",
                    clientId
            );

            return ResponseEntity
                    .status(HttpStatus.TOO_MANY_REQUESTS)
                    .build();
        }

        log.info(
                "Received communication request. clientId={}, customerId={}",
                clientId,
                request.getCustomerId()
        );

        CommunicationRequest created = communicationRequestService.createCommunicationRequest(request);

        return ResponseEntity.status(HttpStatus.ACCEPTED).body(created);
    }
}