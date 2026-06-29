package com.queryanalyzer.backend.security;

import com.queryanalyzer.backend.domain.User;
import com.queryanalyzer.backend.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserRepository userRepository;

    /**
     * Skip this filter entirely for public endpoints.
     * This is the FIRST line of defense — if shouldNotFilter returns true,
     * doFilterInternal is never called.
     */
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        // Skip auth endpoints except /me (which needs JWT validation)
        return (path.startsWith("/api/v1/auth") && !path.equals("/api/v1/auth/me"))
                || path.startsWith("/api/v1/ingest")
                || path.startsWith("/ws-querylens")
                || path.startsWith("/v3/api-docs")
                || path.startsWith("/api-docs")
                || path.startsWith("/swagger-ui")
                || path.equals("/error");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        // 1. Extract JWT token from cookie first
        String token = null;
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if ("jwt".equals(cookie.getName())) {
                    token = cookie.getValue();
                    break;
                }
            }
        }

        // 2. Fallback to Authorization header (for Postman / curl testing)
        if (token == null) {
            String authHeader = request.getHeader("Authorization");
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                token = authHeader.substring(7);
            }
        }

        // 3. No token found — pass through (Spring Security will deny if endpoint requires auth)
        if (token == null) {
            filterChain.doFilter(request, response);
            return;
        }

        // 4. Invalid token — pass through
        if (!jwtService.isTokenValid(token)) {
            filterChain.doFilter(request, response);
            return;
        }

        // 5. Valid token — set authentication
        String userId = jwtService.extractUserId(token);
        Optional<User> user = userRepository.findById(UUID.fromString(userId));

        if (user.isPresent()) {
            UsernamePasswordAuthenticationToken auth =
                    new UsernamePasswordAuthenticationToken(user.get().getId().toString(), null, List.of());
            SecurityContextHolder.getContext().setAuthentication(auth);
        }

        filterChain.doFilter(request, response);
    }
}
