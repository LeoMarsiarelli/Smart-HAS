package com.smarthas.backend.controller;

import com.smarthas.backend.dto.ReadingDtos.ReadingRequest;
import com.smarthas.backend.dto.ReadingDtos.ReadingResponse;
import com.smarthas.backend.model.User;
import com.smarthas.backend.service.BloodPressureService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/readings")
public class ReadingController {

    private final BloodPressureService bloodPressureService;

    public ReadingController(BloodPressureService bloodPressureService) {
        this.bloodPressureService = bloodPressureService;
    }

    @GetMapping
    public List<ReadingResponse> list(
            @AuthenticationPrincipal User currentUser,
            @RequestParam(required = false) Long userId
    ) {
        return bloodPressureService.list(currentUser, userId);
    }

    @GetMapping("/{id}")
    public ReadingResponse get(@AuthenticationPrincipal User currentUser, @PathVariable Long id) {
        return bloodPressureService.get(id, currentUser);
    }

    @PostMapping
    public ResponseEntity<ReadingResponse> create(
            @AuthenticationPrincipal User currentUser,
            @Valid @RequestBody ReadingRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(bloodPressureService.create(request, currentUser));
    }

    @PutMapping("/{id}")
    public ReadingResponse update(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long id,
            @Valid @RequestBody ReadingRequest request
    ) {
        return bloodPressureService.update(id, request, currentUser);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal User currentUser, @PathVariable Long id) {
        bloodPressureService.delete(id, currentUser);
        return ResponseEntity.noContent().build();
    }
}
