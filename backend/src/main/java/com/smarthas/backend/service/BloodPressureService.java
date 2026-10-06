package com.smarthas.backend.service;

import com.smarthas.backend.dto.ReadingDtos.ReadingRequest;
import com.smarthas.backend.dto.ReadingDtos.ReadingResponse;
import com.smarthas.backend.exception.ResourceNotFoundException;
import com.smarthas.backend.model.BloodPressureReading;
import com.smarthas.backend.model.Role;
import com.smarthas.backend.model.User;
import com.smarthas.backend.oracle.OracleIntelligenceService;
import com.smarthas.backend.repository.BloodPressureReadingRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class BloodPressureService {

    private static final Logger log = LoggerFactory.getLogger(BloodPressureService.class);

    private final BloodPressureReadingRepository repository;
    private final Optional<OracleIntelligenceService> oracleIntelligenceService;

    public BloodPressureService(
            BloodPressureReadingRepository repository,
            Optional<OracleIntelligenceService> oracleIntelligenceService
    ) {
        this.repository = repository;
        this.oracleIntelligenceService = oracleIntelligenceService;
    }

    public List<ReadingResponse> list(User currentUser, Long userIdFilter) {
        Long targetUserId = resolveTargetUserId(currentUser, userIdFilter);

        List<BloodPressureReading> readings = targetUserId != null
                ? repository.findByUserIdOrderByMeasuredAtDesc(targetUserId)
                : repository.findAll();

        return readings.stream().map(BloodPressureService::toResponse).toList();
    }

    public ReadingResponse get(Long id, User currentUser) {
        BloodPressureReading reading = findOwned(id, currentUser);
        return toResponse(reading);
    }

    public ReadingResponse create(ReadingRequest request, User currentUser) {
        BloodPressureReading reading = new BloodPressureReading(
                currentUser, request.systolic(), request.diastolic(), request.pulse(), request.notes(), request.measuredAt()
        );
        ReadingResponse response = toResponse(repository.save(reading));
        replicateToOracleIfEnabled(currentUser, request, reading);
        return response;
    }

    public ReadingResponse update(Long id, ReadingRequest request, User currentUser) {
        BloodPressureReading reading = findOwned(id, currentUser);
        reading.update(request.systolic(), request.diastolic(), request.pulse(), request.notes(), request.measuredAt());
        return toResponse(repository.save(reading));
    }

    public void delete(Long id, User currentUser) {
        BloodPressureReading reading = findOwned(id, currentUser);
        repository.delete(reading);
    }

    private BloodPressureReading findOwned(Long id, User currentUser) {
        BloodPressureReading reading = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Leitura não encontrada: " + id));

        if (currentUser.getRole() != Role.ADMIN && !reading.getUser().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("Você não tem acesso a esta leitura");
        }
        return reading;
    }

    private Long resolveTargetUserId(User currentUser, Long userIdFilter) {
        if (currentUser.getRole() != Role.ADMIN) {
            return currentUser.getId();
        }
        return userIdFilter;
    }

    /**
     * Fase 6: se a camada Oracle estiver ativa (profile {@code oracle}),
     * replica a leitura recém-salva e aciona PRC_REGISTER_CRITICAL_ALERT —
     * fluxo REST -&gt; Java -&gt; JDBC -&gt; Oracle. Best-effort: uma falha aqui
     * nunca derruba a criação da leitura no datasource principal.
     */
    private void replicateToOracleIfEnabled(User currentUser, ReadingRequest request, BloodPressureReading reading) {
        oracleIntelligenceService.ifPresent(service -> {
            try {
                service.replicateReadingAndEvaluateAlert(
                        currentUser.getEmail(),
                        currentUser.getName(),
                        currentUser.getPassword(),
                        request.systolic(),
                        request.diastolic(),
                        request.pulse(),
                        request.notes(),
                        reading.getMeasuredAt() != null
                                ? java.time.LocalDateTime.ofInstant(reading.getMeasuredAt(), java.time.ZoneOffset.UTC)
                                : null
                );
            } catch (Exception ex) {
                log.warn("Falha ao replicar leitura para a camada Oracle (userId={}): {}", currentUser.getId(), ex.getMessage());
            }
        });
    }

    static ReadingResponse toResponse(BloodPressureReading reading) {
        return new ReadingResponse(
                reading.getId(),
                reading.getUser().getId(),
                reading.getSystolic(),
                reading.getDiastolic(),
                reading.getPulse(),
                reading.getNotes(),
                reading.getMeasuredAt(),
                reading.getClassification()
        );
    }
}
