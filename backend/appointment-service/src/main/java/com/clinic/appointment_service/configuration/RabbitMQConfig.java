package com.clinic.appointment_service.configuration;

import org.springframework.amqp.core.*;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

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

    @Value("${app.rabbitmq.queues.booked}")
    private String bookedQueue;

    @Value("${app.rabbitmq.queues.cancelled}")
    private String cancelledQueue;

    @Value("${app.rabbitmq.queues.rescheduled}")
    private String rescheduledQueue;

    @Value("${app.rabbitmq.queues.completed}")
    private String completedQueue;

    @Value("${app.rabbitmq.doctor-validated-queue}")
    private String doctorValidatedQueue;

    // --- Exchange ---
    @Bean
    public TopicExchange appointmentExchange() {
        return new TopicExchange(exchange);
    }

    // --- Queues (published by this service) ---
    @Bean
    public Queue bookedQueue() {
        return new Queue(bookedQueue);
    }

    @Bean
    public Queue cancelledQueue() {
        return new Queue(cancelledQueue);
    }

    @Bean
    public Queue rescheduledQueue() {
        return new Queue(rescheduledQueue);
    }

    @Bean
    public Queue completedQueue() {
        return new Queue(completedQueue);
    }

    // --- Queue (consumed from other services) ---
    @Bean
    public Queue doctorValidatedQueue() {
        return new Queue(doctorValidatedQueue);
    }

    // --- Bindings ---
    @Bean
    public Binding bookedBinding() {
        return BindingBuilder.bind(bookedQueue()).to(appointmentExchange()).with(bookedKey);
    }

    @Bean
    public Binding cancelledBinding() {
        return BindingBuilder.bind(cancelledQueue()).to(appointmentExchange()).with(cancelledKey);
    }

    @Bean
    public Binding rescheduledBinding() {
        return BindingBuilder.bind(rescheduledQueue()).to(appointmentExchange()).with(rescheduledKey);
    }

    @Bean
    public Binding completedBinding() {
        return BindingBuilder.bind(completedQueue()).to(appointmentExchange()).with(completedKey);
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}