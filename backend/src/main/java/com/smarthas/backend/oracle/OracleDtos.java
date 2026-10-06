package com.smarthas.backend.oracle;

import java.time.LocalDateTime;
import java.util.List;

public class OracleDtos {

    public record RiskScoreResponse(int systolic, int diastolic, String classification, int riskScore) {
    }

    public record UserSummaryResponse(Long userId, String summary) {
    }

    public record DeliveryReportLine(
            String medicationName, int quantity, String status, String priority, LocalDateTime requestedAt
    ) {
    }

    public record DeliveryReportResponse(
            Long userId, int totalCount, int totalQuantity, List<DeliveryReportLine> details
    ) {
    }

    public record AlertResponse(Long readingId, boolean registered, String message) {
    }
}
