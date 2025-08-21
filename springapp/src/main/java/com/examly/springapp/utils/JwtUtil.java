package com.examly.springapp.utils;
// import io.jsonwebtoken.Claims;
// import io.jsonwebtoken.Jwts;
// import io.jsonwebtoken.SignatureAlgorithm;
// import io.jsonwebtoken.security.Keys;
// import org.springframework.beans.factory.annotation.Value;
// import org.springframework.security.core.userdetails.UserDetails;
// import org.springframework.stereotype.Component;

// import com.example.springapp.model.User.Role;

// import java.security.Key;
// import java.util.Date;

// @Component
// public class JwtUtil {

//     private final Key signingKey;

//     public JwtUtil(@Value("${jwt.secret}") String secretKeyString) {
//         this.signingKey = Keys.hmacShaKeyFor(secretKeyString.getBytes());
//     }

//     public String generateToken(String email,Role role) {
//         return Jwts.builder()
//                 .setSubject(email)
//                 .claim("Role", role)
//                 .setIssuedAt(new Date(System.currentTimeMillis()))
//                 .setExpiration(new Date(System.currentTimeMillis() + 1000 * 60 * 60 * 10)) // 10 hours
//                 .signWith(signingKey, SignatureAlgorithm.HS256)
//                 .compact();
//     }

//     public String extractRole(String token) {
//         return extractAllClaims(token).get("Role", String.class);
//     }

//     public String extractEmail(String token) {
//         return extractAllClaims(token).getSubject();
//     }

//     private Claims extractAllClaims(String token) {
//         return Jwts.parserBuilder()
//                 .setSigningKey(signingKey)
//                 .build()
//                 .parseClaimsJws(token)
//                 .getBody();
//     }

//     public Boolean validateToken(String token, UserDetails userDetails) {
//         final String username = extractUsername(token);
//         return (username.equals(userDetails.getUsername()) && !isTokenExpired(token));
//     }
// }

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import com.examly.springapp.model.Role;

import java.security.Key;
import java.util.Date;

@Component
public class JwtUtil {

    private static final String SECRET_KEY = "bwqkjefef72r379r32ure3r9y29ry23ourgyi3ggwegfbwefgefge2r2";
    private static final long EXPIRATION_TIME = 1000 * 60 * 60; // 1 hour

    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(SECRET_KEY.getBytes());
    }

    // Generate token with email + role
    public String generateToken(String email) {
        return Jwts.builder()
                .setSubject(email) // custom claim for role
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    // Extract email (subject)
    public String extractEmail(String token) {
        return getClaims(token).getSubject();
    }

    // Extract role (custom claim)
    public String extractRole(String token) {
        return (String) getClaims(token).get("role");
    }

    private Claims getClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    // Validate token
    public boolean validateToken(String token, String email) {
        return email.equals(extractEmail(token)) && !isTokenExpired(token);
    }

    private boolean isTokenExpired(String token) {
        return getClaims(token).getExpiration().before(new Date());
    }
}