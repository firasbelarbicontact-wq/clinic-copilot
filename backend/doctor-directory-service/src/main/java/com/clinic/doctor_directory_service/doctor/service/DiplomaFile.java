package com.clinic.doctor_directory_service.doctor.service;

import org.springframework.core.io.Resource;

public record DiplomaFile(Resource resource, String filename, String contentType, long size) {
}