package com.cliniccopilot.administration.controller;

import com.cliniccopilot.administration.dto.ConfigurationRequest;
import com.cliniccopilot.administration.dto.ConfigurationResponse;
import com.cliniccopilot.administration.service.ConfigurationService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/configurations")
@Validated
public class ConfigurationController {

    private static final String KEY_REGEX = "^[A-Za-z0-9._-]{1,150}$";
    private final ConfigurationService service;

    public ConfigurationController(ConfigurationService service) {
        this.service = service;
    }

    @GetMapping
    public List<ConfigurationResponse> list() {
        return service.findAll();
    }

    @GetMapping("/{key}")
    public ConfigurationResponse get(@PathVariable @Pattern(regexp = KEY_REGEX) String key) {
        return service.findByKey(key);
    }

    @PutMapping("/{key}")
    public ConfigurationResponse put(@PathVariable @Pattern(regexp = KEY_REGEX) String key,
                                     @Valid @RequestBody ConfigurationRequest body, Authentication auth) {
        return service.upsert(key, body, CurrentActor.name(auth));
    }

    @DeleteMapping("/{key}")
    public ResponseEntity<Void> delete(@PathVariable @Pattern(regexp = KEY_REGEX) String key) {
        service.delete(key);
        return ResponseEntity.noContent().build();
    }
}
