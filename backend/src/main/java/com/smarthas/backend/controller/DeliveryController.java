package com.smarthas.backend.controller;

import com.smarthas.backend.dto.DeliveryDtos.DeliveryCreateRequest;
import com.smarthas.backend.dto.DeliveryDtos.DeliveryResponse;
import com.smarthas.backend.dto.DeliveryDtos.StatusUpdateRequest;
import com.smarthas.backend.model.User;
import com.smarthas.backend.service.DeliveryService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/deliveries")
public class DeliveryController {

    private final DeliveryService deliveryService;

    public DeliveryController(DeliveryService deliveryService) {
        this.deliveryService = deliveryService;
    }

    @GetMapping
    public List<DeliveryResponse> list(@AuthenticationPrincipal User currentUser) {
        return deliveryService.list(currentUser);
    }

    @GetMapping("/{id}")
    public DeliveryResponse get(@AuthenticationPrincipal User currentUser, @PathVariable Long id) {
        return deliveryService.get(id, currentUser);
    }

    @PostMapping
    public ResponseEntity<DeliveryResponse> create(
            @AuthenticationPrincipal User currentUser,
            @Valid @RequestBody DeliveryCreateRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(deliveryService.create(request, currentUser));
    }

    @PatchMapping("/{id}/status")
    public DeliveryResponse updateStatus(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long id,
            @Valid @RequestBody StatusUpdateRequest request
    ) {
        return deliveryService.updateStatus(id, request.status(), currentUser);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal User currentUser, @PathVariable Long id) {
        deliveryService.delete(id, currentUser);
        return ResponseEntity.noContent().build();
    }
}
