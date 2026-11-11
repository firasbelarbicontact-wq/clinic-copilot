package com.cliniccopilot.administration.controller;

import com.cliniccopilot.administration.dto.PageResponse;
import com.cliniccopilot.administration.dto.SnapshotRequest;
import com.cliniccopilot.administration.dto.SnapshotResponse;
import com.cliniccopilot.administration.entity.MetricType;
import com.cliniccopilot.administration.service.DashboardService;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;

@RestController
@RequestMapping("/api/v1/dashboard/snapshots")
public class DashboardController {

    private final DashboardService service;

    public DashboardController(DashboardService service) {
        this.service = service;
    }

    @GetMapping
    public PageResponse<SnapshotResponse> list(
            @RequestParam(required = false) MetricType metricType,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        int safeSize = Math.min(Math.max(size, 1), 100);
        var pageable = PageRequest.of(Math.max(page, 0), safeSize, Sort.by(Sort.Direction.DESC, "generatedAt"));
        return service.search(metricType, from, to, pageable);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SnapshotResponse create(@Valid @RequestBody SnapshotRequest body) {
        return service.create(body);
    }
}
