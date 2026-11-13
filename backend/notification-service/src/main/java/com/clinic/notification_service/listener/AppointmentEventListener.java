package com.clinic.notification_service.listener;

import com.clinic.notification_service.service.NotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.support.AmqpHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Component;

import java.util.Locale;
import java.util.Map;

@Component
public class AppointmentEventListener {

    private static final Logger log = LoggerFactory.getLogger(AppointmentEventListener.class);

    private final NotificationService notifications;

    public AppointmentEventListener(NotificationService notifications) {
        this.notifications = notifications;
    }

    @RabbitListener(queues = "${app.rabbit.queue}")
    public void onEvent(Map<String, Object> event,
                        @Header(AmqpHeaders.RECEIVED_ROUTING_KEY) String routingKey) {

        String kind = detectKind(routingKey, text(event, "type", "eventType", "status"));
        if (kind == null) {
            log.warn("Événement ignoré (routingKey={})", routingKey);
            return;
        }

        String appointmentId = text(event, "appointmentId", "id");
        String patientId = text(event, "patientId", "patient_id");
        String doctorId = text(event, "doctorId", "doctor_id");
        String when = text(event, "startTime", "startsAt", "dateTime", "date");
        String suffix = when == null ? "" : " (" + when + ")";

        switch (kind) {
            case "BOOKED" -> {
                send(patientId, "APPOINTMENT_CONFIRMED", "Rendez-vous confirmé",
                        "Votre rendez-vous est confirmé" + suffix + ".", appointmentId);
                send(doctorId, "APPOINTMENT_NEW", "Nouveau rendez-vous",
                        "Un patient a réservé un rendez-vous" + suffix + ".", appointmentId);
            }
            case "CANCELLED" -> {
                send(patientId, "APPOINTMENT_CANCELLED", "Rendez-vous annulé",
                        "Le rendez-vous" + suffix + " a été annulé.", appointmentId);
                send(doctorId, "APPOINTMENT_CANCELLED", "Rendez-vous annulé",
                        "Un rendez-vous" + suffix + " a été annulé.", appointmentId);
            }
            case "RESCHEDULED" -> {
                send(patientId, "APPOINTMENT_RESCHEDULED", "Rendez-vous déplacé",
                        "Votre rendez-vous a été déplacé" + suffix + ".", appointmentId);
                send(doctorId, "APPOINTMENT_RESCHEDULED", "Rendez-vous déplacé",
                        "Un rendez-vous a été déplacé" + suffix + ".", appointmentId);
            }
            default -> log.warn("Type d'événement non géré : {}", kind);
        }
    }

    private void send(String userId, String type, String title, String message, String referenceId) {
        if (userId == null) {
            return;
        }
        notifications.create(userId, type, title, message, referenceId);
    }

    private static String detectKind(String routingKey, String type) {
        String source = ((routingKey == null ? "" : routingKey) + " " + (type == null ? "" : type))
                .toLowerCase(Locale.ROOT);
        if (source.contains("resched") || source.contains("moved")) return "RESCHEDULED";
        if (source.contains("cancel")) return "CANCELLED";
        if (source.contains("book") || source.contains("creat") || source.contains("confirm")) return "BOOKED";
        return null;
    }

    private static String text(Map<String, Object> event, String... keys) {
        for (String key : keys) {
            Object value = event.get(key);
            if (value != null && !String.valueOf(value).isBlank()) {
                return String.valueOf(value);
            }
        }
        return null;
    }
}