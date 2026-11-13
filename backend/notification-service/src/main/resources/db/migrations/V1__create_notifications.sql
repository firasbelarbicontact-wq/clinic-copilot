CREATE TABLE notifications (
                               id           UUID PRIMARY KEY,
                               user_id      VARCHAR(255) NOT NULL,
                               type         VARCHAR(40)  NOT NULL,
                               title        VARCHAR(120) NOT NULL,
                               message      VARCHAR(500) NOT NULL,
                               reference_id VARCHAR(255),
                               seen         BOOLEAN      NOT NULL DEFAULT FALSE,
                               created_at   TIMESTAMPTZ  NOT NULL
);

CREATE INDEX idx_notifications_user ON notifications (user_id, created_at);