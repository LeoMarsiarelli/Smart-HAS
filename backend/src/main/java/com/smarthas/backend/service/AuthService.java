package com.smarthas.backend.service;

import com.smarthas.backend.dto.AuthDtos.*;
import com.smarthas.backend.exception.DuplicateEmailException;
import com.smarthas.backend.model.Role;
import com.smarthas.backend.model.User;
import com.smarthas.backend.repository.UserRepository;
import com.smarthas.backend.security.JwtService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            AuthenticationManager authenticationManager
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
    }

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new DuplicateEmailException(request.email());
        }

        User user = new User(request.name(), request.email(), passwordEncoder.encode(request.password()), Role.PATIENT);
        userRepository.save(user);

        String token = jwtService.generateToken(user);
        return new AuthResponse(token, toUserResponse(user));
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password())
        );

        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new IllegalStateException("Usuário autenticado não encontrado"));

        String token = jwtService.generateToken(user);
        return new AuthResponse(token, toUserResponse(user));
    }

    public static UserResponse toUserResponse(User user) {
        return new UserResponse(user.getId(), user.getName(), user.getEmail(), user.getRole(), user.getCreatedAt());
    }
}
