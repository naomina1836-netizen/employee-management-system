const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const DB_NAME = process.env.DB_NAME || "hrm_db";

async function createSetupConnection() {
  return mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    multipleStatements: true
  });
}

async function ensureRefreshTokensTable(conn) {
  await conn.query(`USE \`${DB_NAME}\``);
  await conn.query(`
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
    )
  `);
}

async function ensureDatabaseSchema() {
  const connection = await createSetupConnection();

  try {
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\``);

    const [tables] = await connection.query(
      `SELECT COUNT(*) AS count
       FROM information_schema.tables
       WHERE table_schema = ? AND table_name = 'users'`,
      [DB_NAME]
    );

    if (tables[0].count === 0) {
      const schemaPath = path.join(__dirname, "../../database/schema.sql");
      const schemaSql = fs.readFileSync(schemaPath, "utf8");
      await connection.query(schemaSql);
      await ensureRefreshTokensTable(connection);
      return { seededSchema: true, seededAdmin: false };
    }

    const usersConnection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: DB_NAME
    });

    try {
      await ensureRefreshTokensTable(usersConnection);

      const [users] = await usersConnection.query(
        "SELECT COUNT(*) AS count FROM users WHERE email = ?",
        ["admin@hrm.com"]
      );

      if (users[0].count === 0) {
        const passwordHash = await bcrypt.hash("password123", 12);
        await usersConnection.query(
          `INSERT INTO users (username, email, password, role, employee_id, status)
           VALUES (?, ?, ?, ?, ?, 'Active')`,
          ["admin", "admin@hrm.com", passwordHash, "Admin", null]
        );
        return { seededSchema: false, seededAdmin: true };
      }

      return { seededSchema: false, seededAdmin: false };
    } finally {
      await usersConnection.end();
    }
  } finally {
    await connection.end();
  }
}

module.exports = {
  ensureDatabaseSchema
};
