package com.smarthas.backend.service;

import com.smarthas.backend.dto.ReadingDtos.ReadingRequest;
import com.smarthas.backend.dto.ReadingDtos.ReadingResponse;
import com.smarthas.backend.exception.ResourceNotFoundException;
import com.smarthas.backend.model.BloodPressureReading;
import com.smarthas.backend.model.Role;
import com.smarthas.backend.model.User;
import com.smarthas.backend.repository.BloodPressureReadingRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class BloodPressureService {

    private final BloodPressureReadingRepository repository;

    public BloodPressureService(BloodPressureReadingRepository repository) {
        this.repository = repository;
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
        return toResponse(repository.save(reading));
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
