package com.clinic.appointment_service.service.event;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class AppointmentEventPublisher {

    private final RabbitTemplate rabbitTemplate;

    @Value("${app.rabbitmq.exchange}")
    private String exchange;

    @Value("${app.rabbitmq.routing-keys.booked}")
    private String bookedKey;

    @Value("${app.rabbitmq.routing-keys.cancelled}")
    private String cancelledKey;

    @Value("${app.rabbitmq.routing-keys.rescheduled}")
    private String rescheduledKey;

    @Value("${app.rabbitmq.routing-keys.completed}")
    private String completedKey;

    public void publishBooked(Long appointmentId, Long patientId, Long doctorId, String startTime) {
        publish(bookedKey, Map.of(
                "appointmentId", appointmentId,
                "patientId", patientId,
                "doctorId", doctorId,
                "startTime", startTime));
    }

    public void publishCancelled(Long appointmentId, String reason) {
        publish(cancelledKey, Map.of(
                "appointmentId", appointmentId,
                "reason", reason));
    }

    public void publishRescheduled(Long appointmentId, String oldStart, String newStart) {
        publish(rescheduledKey, Map.of(
                "appointmentId", appointmentId,
                "oldStart", oldStart,
                "newStart", newStart));
    }

    public void publishCompleted(Long appointmentId, Long doctorId) {
        publish(completedKey, Map.of(
                "appointmentId", appointmentId,
                "doctorId", doctorId));
    }

    private void publish(String routingKey, Map<String, Object> payload) {
        log.info("Publishing event: {} | payload: {}", routingKey, payload);
        rabbitTemplate.convertAndSend(exchange, routingKey, payload);
    }
}