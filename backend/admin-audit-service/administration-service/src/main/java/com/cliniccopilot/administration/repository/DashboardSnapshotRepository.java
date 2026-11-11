package com.cliniccopilot.administration.repository;

import com.cliniccopilot.administration.entity.DashboardSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.UUID;

public interface DashboardSnapshotRepository
        extends JpaRepository<DashboardSnapshot, UUID>, JpaSpecificationExecutor<DashboardSnapshot> {
}
