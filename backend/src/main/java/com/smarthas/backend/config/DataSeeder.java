package com.smarthas.backend.config;

import com.smarthas.backend.model.BloodPressureReading;
import com.smarthas.backend.model.Role;
import com.smarthas.backend.model.User;
import com.smarthas.backend.repository.BloodPressureReadingRepository;
import com.smarthas.backend.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

/**
 * Popula dados de demonstração em ambiente de desenvolvimento (perfil default,
 * banco H2). Não roda se já existirem usuários (idempotente).
 */
@Component
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final BloodPressureReadingRepository readingRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(UserRepository userRepository, BloodPressureReadingRepository readingRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.readingRepository = readingRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (userRepository.count() > 0) {
            return;
        }

        User admin = new User("Admin Smart HAS", "admin@smarthas.com", passwordEncoder.encode("admin123"), Role.ADMIN);
        User patient = new User("Maria Silva", "maria@smarthas.com", passwordEncoder.encode("paciente123"), Role.PATIENT);
        userRepository.save(admin);
        userRepository.save(patient);

        Instant now = Instant.now();
        readingRepository.save(new BloodPressureReading(patient, 118, 76, 70, "Em jejum", now.minus(3, ChronoUnit.DAYS)));
        readingRepository.save(new BloodPressureReading(patient, 148, 94, 82, "Após o trabalho", now.minus(1, ChronoUnit.DAYS)));
        readingRepository.save(new BloodPressureReading(patient, 132, 85, 76, "Manhã", now.minus(2, ChronoUnit.HOURS)));

        System.out.println("[Smart HAS] Dados de demonstração criados. Login admin: admin@smarthas.com / admin123 "
                + "| paciente: maria@smarthas.com / paciente123");
    }
}
