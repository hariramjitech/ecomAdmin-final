package com.examly.springapp.dto;

public class UserRegisterRequest {

    private String name;
    private String email;
    private String password;

    // --- Constructors ---
    public UserRegisterRequest() {}

    public UserRegisterRequest(String name, String email, String password) {
        this.name = name;
        this.email = email;
        this.password = password;
    }

    // --- Getters & Setters ---
    public String getName() {
        return name;
    }
    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }
    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }
    public void setPassword(String password) {
        this.password = password;
    }
}
