package com.smarthas.backend.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "medication_delivery_request")
public class MedicationDeliveryRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String medicationName;

    @Column(nullable = false)
    private int quantity;

    @Column(nullable = false, length = 300)
    private String deliveryAddress;

    @Column(nullable = false)
    private Instant requestedAt = Instant.now();

    @Column(nullable = false)
    private int riskScore;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DeliveryPriority priority;

    @Column(nullable = false)
    private Instant estimatedWindowStart;

    @Column(nullable = false)
    private Instant estimatedWindowEnd;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DeliveryStatus status = DeliveryStatus.PENDENTE;

    protected MedicationDeliveryRequest() {
    }

    public MedicationDeliveryRequest(User user, String medicationName, int quantity, String deliveryAddress) {
        this.user = user;
        this.medicationName = medicationName;
        this.quantity = quantity;
        this.deliveryAddress = deliveryAddress;
    }

    public Long getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public String getMedicationName() {
        return medicationName;
    }

    public int getQuantity() {
        return quantity;
    }

    public String getDeliveryAddress() {
        return deliveryAddress;
    }

    public Instant getRequestedAt() {
        return requestedAt;
    }

    public int getRiskScore() {
        return riskScore;
    }

    public void setRiskScore(int riskScore) {
        this.riskScore = riskScore;
    }

    public DeliveryPriority getPriority() {
        return priority;
    }

    public void setPriority(DeliveryPriority priority) {
        this.priority = priority;
    }

    public Instant getEstimatedWindowStart() {
        return estimatedWindowStart;
    }

    public void setEstimatedWindowStart(Instant estimatedWindowStart) {
        this.estimatedWindowStart = estimatedWindowStart;
    }

    public Instant getEstimatedWindowEnd() {
        return estimatedWindowEnd;
    }

    public void setEstimatedWindowEnd(Instant estimatedWindowEnd) {
        this.estimatedWindowEnd = estimatedWindowEnd;
    }

    public DeliveryStatus getStatus() {
        return status;
    }

    public void setStatus(DeliveryStatus status) {
        this.status = status;
    }
}
