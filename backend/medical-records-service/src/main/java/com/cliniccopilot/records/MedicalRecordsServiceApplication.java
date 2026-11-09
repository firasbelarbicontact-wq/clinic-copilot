package com.cliniccopilot.records;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class MedicalRecordsServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(MedicalRecordsServiceApplication.class, args);
    }
}
