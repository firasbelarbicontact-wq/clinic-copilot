package com.cliniccopilot.administration.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "system_configurations")
@Getter @Setter @NoArgsConstructor
public class SystemConfiguration {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "config_key", nullable = false, unique = true, length = 150)
    private String configKey;

    @Column(name = "config_value", nullable = false, length = 4000)
    private String configValue;

    @Column(length = 500)
    private String description;

    @Column(name = "updated_by", length = 100)
    private String updatedBy;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist @PreUpdate
    void touch() {
        this.updatedAt = Instant.now();
    }
}
