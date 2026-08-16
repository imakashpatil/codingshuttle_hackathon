package com.notifyhub.communication.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "communications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Communication {

    @Id
    private UUID id;

    @Column(name = "request_id", nullable = false)
    private UUID requestId;

    @Column(name = "customer_name", nullable = false)
    private String customerName;

    @Column(nullable = false)
    private String email;

    @Column(name = "mobile_number")
    private String mobileNumber;

    @Column(name = "postal_address", columnDefinition = "TEXT")
    private String postalAddress;

    @Column(name = "template_code", nullable = false)
    private String templateCode;

    @Column(nullable = false)
    private String status; // WAITING_FOR_PDF, PDF_GENERATED, SENT, DELIVERED, FAILED, RETRYING, DEAD_LETTER

    @Column(name = "pdf_path")
    private String pdfPath;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "rendered_body", columnDefinition = "TEXT")
    private String renderedBody;


    @Column(name = "retry_count")
    @Builder.Default
    private Integer retryCount = 0;


    @Column(name = "channel")
    private String channel; // EMAIL, SMS, POSTAL, WHATSAPP

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
