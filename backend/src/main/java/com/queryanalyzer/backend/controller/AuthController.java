package com.queryanalyzer.backend.controller;

import com.queryanalyzer.backend.domain.User;
import com.queryanalyzer.backend.dto.AuthRequest;
import com.queryanalyzer.backend.dto.UserDTO;
import com.queryanalyzer.backend.repository.UserRepository;
import com.queryanalyzer.backend.security.JwtService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;

    @PostMapping("/register")
    public ResponseEntity<UserDTO> register(@RequestBody AuthRequest request) {
        // Check if email already exists
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
        }

        User user = User.builder()
                .email(request.getEmail())
                .fullName(request.getFullName())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role("USER")
                .build();

        user = userRepository.save(user);

        return ResponseEntity.status(HttpStatus.CREATED).body(toDTO(user));
    }

    @PostMapping("/login")
    public ResponseEntity<UserDTO> login(@RequestBody AuthRequest request, HttpServletResponse response) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }

        String token = jwtService.generateToken(user.getId().toString());

        // Set HttpOnly cookie with SameSite=Lax (not Strict) for local dev
        response.addHeader("Set-Cookie",
                "jwt=" + token + "; HttpOnly; Path=/; Max-Age=86400; SameSite=Lax");

        return ResponseEntity.ok(toDTO(user));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletResponse response) {
        response.addHeader("Set-Cookie",
                "jwt=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax");
        return ResponseEntity.ok().build();
    }

    @GetMapping("/me")
    public ResponseEntity<UserDTO> me() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal == null || "anonymousUser".equals(principal) || !(principal instanceof String userId)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
        User user = userRepository.findById(java.util.UUID.fromString(userId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
        return ResponseEntity.ok(toDTO(user));
    }

    private UserDTO toDTO(User user) {
        return UserDTO.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .build();
    }
}
