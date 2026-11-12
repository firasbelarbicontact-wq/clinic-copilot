package com.clinic.appointment_service.service.event;

import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

public final class TransactionAfterCommit {

    private TransactionAfterCommit() {
    }

    public static void execute(Runnable action) {

        if (TransactionSynchronizationManager.isSynchronizationActive()) {

            TransactionSynchronizationManager.registerSynchronization(
                    new TransactionSynchronization() {

                        @Override
                        public void afterCommit() {
                            action.run();
                        }
                    });

        } else {
            action.run();
        }
    }
}