package com.examly.springapp.controller;

import com.examly.springapp.dto.LoginRequest;
import com.examly.springapp.dto.UserRegisterRequest;
import com.examly.springapp.model.User;
import com.examly.springapp.model.Role;
import com.examly.springapp.repository.UserRepository;
import com.examly.springapp.utils.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/auth")
public class AuthenticationController {

    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@(.+)$");
    private static final Pattern PASSWORD_PATTERN =
            Pattern.compile("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%?&])[A-Za-z\\d@$!%?&]{8,}$");

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // ==============================
    // User Login
    // ==============================
@PostMapping("/login")
public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
    Optional<User> userOpt = userRepository.findByEmail(loginRequest.getEmail());

    if (userOpt.isEmpty() || !passwordEncoder.matches(loginRequest.getPassword(), userOpt.get().getPassword())) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid email or password");
    }

    User user = userOpt.get();
    user.setLastLogin(LocalDateTime.now());
    userRepository.save(user);

    String token = jwtUtil.generateToken(user.getEmail());

    // ✅ Include userId in the response
    return ResponseEntity.ok(Map.of(
        "token", token,
        "role", user.getRole().name(),
        "userId", user.getId()   // <-- Added this line
    ));
}


    // ==============================
    // Register USER
    // ==============================
    @PostMapping("/register")
    public ResponseEntity<String> registerUser(@RequestBody UserRegisterRequest userDto) {
        String validationError = validateUser(userDto);
        if (validationError != null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(validationError);
        }

        User newUser = new User();
        newUser.setName(userDto.getName());
        newUser.setEmail(userDto.getEmail());
        newUser.setPassword(passwordEncoder.encode(userDto.getPassword()));
        newUser.setRole(Role.USER);
        newUser.setCreatedAt(LocalDateTime.now());
        newUser.setActive(true);

        userRepository.save(newUser);

        return ResponseEntity.status(HttpStatus.CREATED).body("User registration successful!");
    }

    // ==============================
    // Register ADMIN
    // ==============================
    @PostMapping("/register/admin")
    public ResponseEntity<String> registerAdmin(@RequestBody UserRegisterRequest userDto) {
        String validationError = validateUser(userDto);
        if (validationError != null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(validationError);
        }

        User admin = new User();
        admin.setName(userDto.getName());
        admin.setEmail(userDto.getEmail());
        admin.setPassword(passwordEncoder.encode(userDto.getPassword()));
        admin.setRole(Role.ADMIN);
        admin.setCreatedAt(LocalDateTime.now());
        admin.setLastLogin(LocalDateTime.now());
        admin.setActive(true);

        userRepository.save(admin);

        return ResponseEntity.status(HttpStatus.CREATED).body("Admin registration successful!");
    }

    // ==============================
    // Validation
    // ==============================
    private String validateUser(UserRegisterRequest user) {
        if (!StringUtils.hasText(user.getName())) return "Name is required.";
        if (!StringUtils.hasText(user.getEmail())) return "Email is required.";
        if (!EMAIL_PATTERN.matcher(user.getEmail()).matches()) return "Invalid email format.";
        if (userRepository.existsByEmail(user.getEmail())) return "Email already exists.";
        if (!StringUtils.hasText(user.getPassword())) return "Password is required.";
        if (!PASSWORD_PATTERN.matcher(user.getPassword()).matches()) {
            return "Password must be at least 8 characters, include uppercase, lowercase, number, and special character.";
        }
        return null;
    }
}
