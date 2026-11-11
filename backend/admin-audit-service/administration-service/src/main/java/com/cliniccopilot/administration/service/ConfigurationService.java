package com.cliniccopilot.administration.service;

import com.cliniccopilot.administration.dto.ConfigurationRequest;
import com.cliniccopilot.administration.dto.ConfigurationResponse;
import com.cliniccopilot.administration.entity.SystemConfiguration;
import com.cliniccopilot.administration.exception.ResourceNotFoundException;
import com.cliniccopilot.administration.repository.SystemConfigurationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ConfigurationService {

    private final SystemConfigurationRepository repository;

    public ConfigurationService(SystemConfigurationRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<ConfigurationResponse> findAll() {
        return repository.findAll().stream().map(ConfigurationResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public ConfigurationResponse findByKey(String key) {
        return ConfigurationResponse.from(get(key));
    }

    /** Crée ou met à jour (upsert) un réglage. */
    @Transactional
    public ConfigurationResponse upsert(String key, ConfigurationRequest req, String actor) {
        SystemConfiguration c = repository.findByConfigKey(key).orElseGet(() -> {
            SystemConfiguration n = new SystemConfiguration();
            n.setConfigKey(key);
            return n;
        });
        c.setConfigValue(req.value());
        if (req.description() != null) c.setDescription(req.description());
        c.setUpdatedBy(actor);
        return ConfigurationResponse.from(repository.save(c));
    }

    @Transactional
    public void delete(String key) {
        repository.delete(get(key));
    }

    private SystemConfiguration get(String key) {
        return repository.findByConfigKey(key)
                .orElseThrow(() -> new ResourceNotFoundException("Configuration introuvable: " + key));
    }
}
