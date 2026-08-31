package com.smarthas.backend.controller;

import com.smarthas.backend.dto.AuthDtos.UserResponse;
import com.smarthas.backend.model.User;
import com.smarthas.backend.service.AuthService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @GetMapping("/me")
    public UserResponse me(@AuthenticationPrincipal User currentUser) {
        return AuthService.toUserResponse(currentUser);
    }
}
