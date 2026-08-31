package com.smarthas.backend.repository;

import com.smarthas.backend.model.BloodPressureReading;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BloodPressureReadingRepository extends JpaRepository<BloodPressureReading, Long> {

    List<BloodPressureReading> findByUserIdOrderByMeasuredAtDesc(Long userId);

    Optional<BloodPressureReading> findFirstByUserIdOrderByMeasuredAtDesc(Long userId);
}
