package com.smarthas.backend.service;

import com.smarthas.backend.model.BloodPressureReading;
import com.smarthas.backend.model.BpClassification;
import com.smarthas.backend.model.DeliveryPriority;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

/**
 * AI Logistics Extension: motor de regras (heurística explicável) que
 * prioriza entregas de medicamento a partir do risco clínico do paciente.
 * <p>
 * É uma IA baseada em regras (rule-based/expert system), não um modelo de ML
 * treinado — escolha deliberada para manter o resultado 100% explicável e
 * auditável nesta fase. O roadmap (ver README) prevê evoluir para um modelo
 * de classificação treinado com dados históricos reais.
 */
@Service
public class LogisticsAiService {

    public record DeliveryPlan(int riskScore, DeliveryPriority priority, Instant windowStart, Instant windowEnd) {
    }

    public DeliveryPlan computePlan(Optional<BloodPressureReading> latestReading) {
        Instant now = Instant.now();
        BpClassification classification = latestReading.map(BloodPressureReading::getClassification)
                .orElse(BpClassification.NORMAL);

        return switch (classification) {
            case CRISE_HIPERTENSIVA -> new DeliveryPlan(
                    95, DeliveryPriority.URGENTE, now.plus(1, ChronoUnit.HOURS), now.plus(2, ChronoUnit.HOURS));
            case HAS_ESTAGIO_2 -> new DeliveryPlan(
                    75, DeliveryPriority.ALTA, now.plus(2, ChronoUnit.HOURS), now.plus(4, ChronoUnit.HOURS));
            case HAS_ESTAGIO_1 -> new DeliveryPlan(
                    50, DeliveryPriority.MEDIA, now.plus(4, ChronoUnit.HOURS), now.plus(8, ChronoUnit.HOURS));
            case ELEVADA -> new DeliveryPlan(
                    30, DeliveryPriority.BAIXA, now.plus(24, ChronoUnit.HOURS), now.plus(30, ChronoUnit.HOURS));
            case NORMAL -> new DeliveryPlan(
                    15, DeliveryPriority.BAIXA, now.plus(24, ChronoUnit.HOURS), now.plus(30, ChronoUnit.HOURS));
        };
    }
}
