package com.smarthas.backend.oracle;

import com.smarthas.backend.oracle.OracleDtos.AlertResponse;
import com.smarthas.backend.oracle.OracleDtos.DeliveryReportResponse;
import com.smarthas.backend.oracle.OracleDtos.ReadingSearchLine;
import com.smarthas.backend.oracle.OracleDtos.RiskScoreResponse;
import com.smarthas.backend.oracle.OracleDtos.UserSummaryResponse;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Expõe a camada de inteligência Oracle (Fase 6) via REST. Só fica registrado
 * quando {@code smarthas.oracle.enabled=true} (profile {@code oracle}) — nos
 * demais perfis esses endpoints simplesmente não existem (404), em vez de
 * falhar por falta de conexão com o banco.
 */
@RestController
@RequestMapping("/api/oracle")
@ConditionalOnProperty(prefix = "smarthas.oracle", name = "enabled", havingValue = "true")
public class OracleController {

    private final OracleIntelligenceService oracleIntelligenceService;

    public OracleController(OracleIntelligenceService oracleIntelligenceService) {
        this.oracleIntelligenceService = oracleIntelligenceService;
    }

    @GetMapping("/risk-score")
    public RiskScoreResponse riskScore(@RequestParam int systolic, @RequestParam int diastolic) {
        return oracleIntelligenceService.calcRiskScore(systolic, diastolic);
    }

    @GetMapping("/users/{userId}/summary")
    public UserSummaryResponse userSummary(@PathVariable Long userId) {
        return oracleIntelligenceService.getUserSummary(userId);
    }

    @GetMapping("/users/{userId}/delivery-report")
    public DeliveryReportResponse deliveryReport(@PathVariable Long userId) {
        return oracleIntelligenceService.getUserDeliveryReport(userId);
    }

    @PostMapping("/alerts/{readingId}")
    public AlertResponse registerAlert(@PathVariable Long readingId) {
        return oracleIntelligenceService.registerCriticalAlert(readingId);
    }

    /**
     * Busca flexível de leituras (PRC_SEARCH_READINGS, Dynamic SQL). Todos os
     * filtros são opcionais; {@code since} no formato ISO-8601
     * (ex.: 2026-11-01T00:00:00). {@code orderBy}: MEASURED_AT_DESC (padrão),
     * MEASURED_AT_ASC, SYSTOLIC_DESC ou RISK_DESC.
     */
    @GetMapping("/readings/search")
    public List<ReadingSearchLine> searchReadings(
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) String classification,
            @RequestParam(required = false) String since,
            @RequestParam(required = false) String orderBy
    ) {
        LocalDateTime sinceParsed = since != null ? LocalDateTime.parse(since) : null;
        return oracleIntelligenceService.searchReadings(userId, classification, sinceParsed, orderBy);
    }
}
