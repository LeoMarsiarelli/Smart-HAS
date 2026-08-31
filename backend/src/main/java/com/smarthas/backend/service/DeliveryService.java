package com.smarthas.backend.service;

import com.smarthas.backend.dto.DeliveryDtos.DeliveryCreateRequest;
import com.smarthas.backend.dto.DeliveryDtos.DeliveryResponse;
import com.smarthas.backend.exception.ResourceNotFoundException;
import com.smarthas.backend.model.DeliveryStatus;
import com.smarthas.backend.model.MedicationDeliveryRequest;
import com.smarthas.backend.model.Role;
import com.smarthas.backend.model.User;
import com.smarthas.backend.repository.BloodPressureReadingRepository;
import com.smarthas.backend.repository.MedicationDeliveryRequestRepository;
import com.smarthas.backend.service.LogisticsAiService.DeliveryPlan;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class DeliveryService {

    private final MedicationDeliveryRequestRepository deliveryRepository;
    private final BloodPressureReadingRepository readingRepository;
    private final LogisticsAiService logisticsAiService;

    public DeliveryService(
            MedicationDeliveryRequestRepository deliveryRepository,
            BloodPressureReadingRepository readingRepository,
            LogisticsAiService logisticsAiService
    ) {
        this.deliveryRepository = deliveryRepository;
        this.readingRepository = readingRepository;
        this.logisticsAiService = logisticsAiService;
    }

    public List<DeliveryResponse> list(User currentUser) {
        List<MedicationDeliveryRequest> deliveries = currentUser.getRole() == Role.ADMIN
                ? deliveryRepository.findAllByOrderByRequestedAtDesc()
                : deliveryRepository.findByUserIdOrderByRequestedAtDesc(currentUser.getId());

        return deliveries.stream().map(DeliveryService::toResponse).toList();
    }

    public DeliveryResponse get(Long id, User currentUser) {
        return toResponse(findOwned(id, currentUser));
    }

    public DeliveryResponse create(DeliveryCreateRequest request, User currentUser) {
        MedicationDeliveryRequest delivery = new MedicationDeliveryRequest(
                currentUser, request.medicationName(), request.quantity(), request.deliveryAddress()
        );

        DeliveryPlan plan = logisticsAiService.computePlan(
                readingRepository.findFirstByUserIdOrderByMeasuredAtDesc(currentUser.getId())
        );
        delivery.setRiskScore(plan.riskScore());
        delivery.setPriority(plan.priority());
        delivery.setEstimatedWindowStart(plan.windowStart());
        delivery.setEstimatedWindowEnd(plan.windowEnd());

        return toResponse(deliveryRepository.save(delivery));
    }

    public DeliveryResponse updateStatus(Long id, DeliveryStatus status, User currentUser) {
        MedicationDeliveryRequest delivery = findOwned(id, currentUser);
        delivery.setStatus(status);
        return toResponse(deliveryRepository.save(delivery));
    }

    public void delete(Long id, User currentUser) {
        MedicationDeliveryRequest delivery = findOwned(id, currentUser);
        deliveryRepository.delete(delivery);
    }

    private MedicationDeliveryRequest findOwned(Long id, User currentUser) {
        MedicationDeliveryRequest delivery = deliveryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pedido de entrega não encontrado: " + id));

        if (currentUser.getRole() != Role.ADMIN && !delivery.getUser().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("Você não tem acesso a este pedido de entrega");
        }
        return delivery;
    }

    static DeliveryResponse toResponse(MedicationDeliveryRequest delivery) {
        return new DeliveryResponse(
                delivery.getId(),
                delivery.getUser().getId(),
                delivery.getMedicationName(),
                delivery.getQuantity(),
                delivery.getDeliveryAddress(),
                delivery.getRequestedAt(),
                delivery.getRiskScore(),
                delivery.getPriority(),
                delivery.getEstimatedWindowStart(),
                delivery.getEstimatedWindowEnd(),
                delivery.getStatus()
        );
    }
}
