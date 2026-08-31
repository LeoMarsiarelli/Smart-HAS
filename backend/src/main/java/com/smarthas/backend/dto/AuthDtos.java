package com.smarthas.backend.dto;

import com.smarthas.backend.model.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public class AuthDtos {

    public record RegisterRequest(
            @NotBlank(message = "name é obrigatório") String name,
            @NotBlank(message = "email é obrigatório") @Email(message = "email inválido") String email,
            @NotBlank(message = "password é obrigatório") @Size(min = 6, message = "password deve ter ao menos 6 caracteres") String password
    ) {
    }

    public record LoginRequest(
            @NotBlank @Email(message = "email inválido") String email,
            @NotBlank String password
    ) {
    }

    public record UserResponse(Long id, String name, String email, Role role, Instant createdAt) {
    }

    public record AuthResponse(String token, UserResponse user) {
    }
}
