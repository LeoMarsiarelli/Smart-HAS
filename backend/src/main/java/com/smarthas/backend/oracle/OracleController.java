package com.smarthas.backend.oracle;

import com.smarthas.backend.oracle.OracleDtos.AlertResponse;
import com.smarthas.backend.oracle.OracleDtos.DeliveryReportResponse;
import com.smarthas.backend.oracle.OracleDtos.RiskScoreResponse;
import com.smarthas.backend.oracle.OracleDtos.UserSummaryResponse;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.web.bind.annotation.*;

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
}
