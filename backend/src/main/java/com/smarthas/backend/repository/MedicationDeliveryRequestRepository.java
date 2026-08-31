package com.smarthas.backend.repository;

import com.smarthas.backend.model.MedicationDeliveryRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MedicationDeliveryRequestRepository extends JpaRepository<MedicationDeliveryRequest, Long> {

    List<MedicationDeliveryRequest> findByUserIdOrderByRequestedAtDesc(Long userId);

    List<MedicationDeliveryRequest> findAllByOrderByRequestedAtDesc();
}
