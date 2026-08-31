package com.smarthas.backend.dto;

import com.smarthas.backend.model.BpClassification;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;

public class ReadingDtos {

    public record ReadingRequest(
            @NotNull @Min(40) @Max(300) Integer systolic,
            @NotNull @Min(20) @Max(200) Integer diastolic,
            @Min(20) @Max(250) Integer pulse,
            String notes,
            Instant measuredAt
    ) {
    }

    public record ReadingResponse(
            Long id,
            Long userId,
            int systolic,
            int diastolic,
            Integer pulse,
            String notes,
            Instant measuredAt,
            BpClassification classification
    ) {
    }
}
