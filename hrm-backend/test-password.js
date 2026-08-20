require("dotenv").config();

const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");

async function testPassword() {
  let connection;
  const email = process.env.ADMIN_EMAIL || "admin@hrm.com";
  const password = process.env.PASSWORD_TO_VERIFY;

  if (!password) {
    console.error("ERROR: Set PASSWORD_TO_VERIFY before running this script.");
    process.exitCode = 1;
    return;
  }

  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || "127.0.0.1",
      port: Number(process.env.DB_PORT || 3307),
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "hrm_db",
    });

    console.log("Database connected.");

    const [rows] = await connection.query(
      `SELECT email, password, LENGTH(password) AS hash_length
       FROM users
       WHERE email = ?`,
      [email]
    );

    if (rows.length === 0) {
      console.log("ERROR: Admin user not found.");
      process.exitCode = 1;
      return;
    }

    const admin = rows[0];

    console.log("Email:", admin.email);
    console.log("Hash length:", admin.hash_length);

    const match = await bcrypt.compare(password, admin.password);

    console.log("Password match:", match);
    process.exitCode = match ? 0 : 1;

  } catch (error) {
    console.error("ERROR:", error.message);
    process.exitCode = 1;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testPassword();
