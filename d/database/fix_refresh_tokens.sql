USE hrm_db;

CREATE TABLE IF NOT EXISTS refresh_tokens (
    token_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    token VARCHAR(512) NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revoked BOOLEAN DEFAULT FALSE,
    INDEX idx_token (token(255)),
    INDEX idx_user (user_id),
    INDEX idx_expires (expires_at)
);
