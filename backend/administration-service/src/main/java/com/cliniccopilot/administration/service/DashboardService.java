package com.cliniccopilot.administration.service;

import com.cliniccopilot.administration.dto.PageResponse;
import com.cliniccopilot.administration.dto.SnapshotRequest;
import com.cliniccopilot.administration.dto.SnapshotResponse;
import com.cliniccopilot.administration.entity.DashboardSnapshot;
import com.cliniccopilot.administration.entity.MetricType;
import com.cliniccopilot.administration.repository.DashboardSnapshotRepository;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Service
public class DashboardService {

    private final DashboardSnapshotRepository repository;

    public DashboardService(DashboardSnapshotRepository repository) {
        this.repository = repository;
    }

    /** Filtre optionnel par type de métrique et par période [from, to] (inclus sur periodStart/periodEnd). */
    @Transactional(readOnly = true)
    public PageResponse<SnapshotResponse> search(MetricType type, Instant from, Instant to, Pageable pageable) {
        Specification<DashboardSnapshot> spec = (root, q, cb) -> {
            List<Predicate> p = new ArrayList<>();
            if (type != null) p.add(cb.equal(root.get("metricType"), type));
            if (from != null) p.add(cb.greaterThanOrEqualTo(root.get("periodStart"), from));
            if (to != null) p.add(cb.lessThanOrEqualTo(root.get("periodEnd"), to));
            return cb.and(p.toArray(new Predicate[0]));
        };
        return PageResponse.from(repository.findAll(spec, pageable).map(SnapshotResponse::from));
    }

    @Transactional
    public SnapshotResponse create(SnapshotRequest req) {
        if (req.periodEnd().isBefore(req.periodStart())) {
            throw new IllegalArgumentException("periodEnd doit être postérieure à periodStart");
        }
        DashboardSnapshot s = new DashboardSnapshot();
        s.setMetricType(req.metricType());
        s.setPeriodStart(req.periodStart());
        s.setPeriodEnd(req.periodEnd());
        s.setValue(req.value());
        s.setDetails(req.details());
        return SnapshotResponse.from(repository.save(s));
    }
}
