package com.clinic.appointment_service.service.event;

import com.clinic.appointment_service.service.availability.SlotGenerationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;

import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class DoctorEventConsumer {

    private final SlotGenerationService slotGenerationService;

    /**
     * Consomme l evenement doctor.validated emis par admin-audit-service (M6).
     * Permet d initialiser un emploi du temps par defaut pour le medecin valide.
     */
    @RabbitListener(queues = "${app.rabbitmq.doctor-validated-queue}")
    public void onDoctorValidated(Map<String, Object> event) {
        log.info("Received doctor.validated event: {}", event);
        Long doctorId = Long.valueOf(event.get("doctorId").toString());
        // TODO: initialize a default schedule for the newly validated doctor
        log.info("Doctor {} validated - schedule initialization pending", doctorId);
    }
}