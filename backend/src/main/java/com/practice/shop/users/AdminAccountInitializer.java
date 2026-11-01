package com.practice.shop.users;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;


@Component
public class AdminAccountInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminAccountInitializer.class);
    private static final int MIN_PASSWORD_LENGTH = 12;

    private final AppUserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final String email;
    private final String password;
    private final String fullName;

    public AdminAccountInitializer(AppUserRepository users, PasswordEncoder passwordEncoder, @Value("${shop.admin.email}") String email, @Value("${shop.admin.password}") String password, @Value("${shop.admin.name}") String fullName) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.email = email.trim().toLowerCase(Locale.ROOT);
        this.password = password;
        this.fullName = fullName.trim();
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (email.isBlank() || password.isBlank()) {
            log.warn("ADMIN_EMAIL / ADMIN_PASSWORD not set: no admin account was created.");
            return;
        }

        AppUser existing = users.findByEmail(email).orElse(null);
        if (existing != null) {
            if (existing.getRole() == Role.ADMIN) {
                log.info("Admin account {} already exists.", email);
            } else {
                log.warn("{} already exists as {}: it was NOT made ADMIN. Choose another ADMIN_EMAIL.",
                        email, existing.getRole());
            }
            return;
        }
        if (password.length() < MIN_PASSWORD_LENGTH) {
            throw new IllegalStateException(
                    "ADMIN_PASSWORD must be at least " + MIN_PASSWORD_LENGTH + " characters long."
            );
        }
        users.save(new AppUser(email, passwordEncoder.encode(password), fullName, Role.ADMIN));
        log.info("Admin account {} created.", email);
    }
}
