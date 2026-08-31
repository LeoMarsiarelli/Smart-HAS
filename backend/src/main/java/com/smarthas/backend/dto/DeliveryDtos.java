package com.smarthas.backend.dto;

import com.smarthas.backend.model.DeliveryPriority;
import com.smarthas.backend.model.DeliveryStatus;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;

public class DeliveryDtos {

    public record DeliveryCreateRequest(
            @NotBlank String medicationName,
            @NotNull @Min(1) Integer quantity,
            @NotBlank String deliveryAddress
    ) {
    }

    public record StatusUpdateRequest(@NotNull DeliveryStatus status) {
    }

    public record DeliveryResponse(
            Long id,
            Long userId,
            String medicationName,
            int quantity,
            String deliveryAddress,
            Instant requestedAt,
            int riskScore,
            DeliveryPriority priority,
            Instant estimatedWindowStart,
            Instant estimatedWindowEnd,
            DeliveryStatus status
    ) {
    }
}
