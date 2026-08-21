const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");

require("dotenv").config({
  path: path.resolve(__dirname, "../.env"),
});

const DB_NAME = process.env.DB_NAME || "hrm_db";

async function createSetupConnection() {
  console.log("BOOTSTRAP DB CONFIG:", {
    host: process.env.DB_HOST || "127.0.0.1",
    port: process.env.DB_PORT || "3306",
    user: process.env.DB_USER || "root",
    passwordLength: (process.env.DB_PASSWORD || "").length,
    database: DB_NAME,
  });

  return mysql.createConnection({
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    multipleStatements: true,
  });
}

async function databaseHasTables(connection) {
  const [tables] = await connection.query(
    `
    SELECT COUNT(*) AS count
    FROM information_schema.tables
    WHERE table_schema = ?
    `,
    [DB_NAME]
  );

  return Number(tables[0].count) > 0;
}

async function runSchema(connection) {
  const schemaPath = path.resolve(__dirname, "../database/schema.sql");

  if (!fs.existsSync(schemaPath)) {
    throw new Error(`schema.sql not found: ${schemaPath}`);
  }

  const schemaSql = fs.readFileSync(schemaPath, "utf8");

  if (!schemaSql.trim()) {
    throw new Error("schema.sql is empty.");
  }

  await connection.query(`USE \`${DB_NAME}\``);
  await connection.query(schemaSql);

  console.log("Database schema initialized successfully.");
}

async function columnExists(connection, tableName, columnName) {
  const [columns] = await connection.query(
    `
    SELECT COUNT(*) AS count
    FROM information_schema.columns
    WHERE table_schema = ? AND table_name = ? AND column_name = ?
    `,
    [DB_NAME, tableName, columnName]
  );

  return Number(columns[0].count) > 0;
}

async function tableExists(connection, tableName) {
  const [tables] = await connection.query(
    `
    SELECT COUNT(*) AS count
    FROM information_schema.tables
    WHERE table_schema = ? AND table_name = ?
    `,
    [DB_NAME, tableName]
  );

  return Number(tables[0].count) > 0;
}

async function syncSchemaMigrations(connection) {
  await connection.query(`USE \`${DB_NAME}\``);

  if (!(await tableExists(connection, "leave_types"))) {
    return;
  }

  if (!(await columnExists(connection, "leave_types", "max_days"))) {
    await connection.query(
      "ALTER TABLE leave_types ADD COLUMN max_days SMALLINT UNSIGNED NOT NULL DEFAULT 0 AFTER description"
    );
    console.log("Added leave_types.max_days to the existing database.");
  }

  await connection.query(
    `
    INSERT INTO leave_types (leave_name, description, max_days) VALUES
      ('Annual Leave', 'Paid annual leave', 21),
      ('Sick Leave', 'Medical leave', 14),
      ('Maternity Leave', 'Maternity leave', 90),
      ('Paternity Leave', 'Paternity leave', 10),
      ('Unpaid Leave', 'Unpaid leave', 0)
    ON DUPLICATE KEY UPDATE
      max_days = CASE WHEN max_days = 0 THEN VALUES(max_days) ELSE max_days END
    `
  );
}

async function seedDefaultAdmin(connection) {
  try {
    await connection.query(`USE \`${DB_NAME}\``);

    const [tables] = await connection.query(
      `
      SELECT COUNT(*) AS count
      FROM information_schema.tables
      WHERE table_schema = ?
      AND table_name = 'users'
      `,
      [DB_NAME]
    );

    if (Number(tables[0].count) === 0) {
      console.log("users table does not exist. Skipping admin seed.");
      return false;
    }

    const [users] = await connection.query("SELECT COUNT(*) AS count FROM users");

    if (Number(users[0].count) > 0) {
      console.log("Users already exist. Admin seed skipped.");
      return false;
    }

    const password = process.env.ADMIN_PASSWORD;

    if (!password) {
      console.warn(
        "ADMIN_PASSWORD is not set. No default admin was created. Set it before starting with an empty database."
      );
      return false;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await connection.query(
      `
      INSERT INTO users
      (username, email, password, role, employee_id, status)
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        "admin",
        "admin@hrm.com",
        passwordHash,
        "Admin",
        null,
        "Active",
      ]
    );

    console.log("Default admin created.");
    return true;
  } catch (error) {
    console.log("Admin seed skipped:", error.message);
    return false;
  }
}

async function ensureDatabaseSchema() {
  let connection;

  try {
    console.log("Starting database initialization...");

    connection = await createSetupConnection();

    console.log("Connected to MySQL successfully.");

    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\``);

    console.log(`Database "${DB_NAME}" is ready.`);

    await connection.query(`USE \`${DB_NAME}\``);

    const hasTables = await databaseHasTables(connection);

    let seededSchema = false;

    if (!hasTables) {
      console.log("No tables found. Running schema.sql...");
      await runSchema(connection);
      seededSchema = true;
    } else {
      console.log("Database tables already exist.");
      await syncSchemaMigrations(connection);
      await runSchema(connection);
    }

    await syncSchemaMigrations(connection);

    const seededAdmin = await seedDefaultAdmin(connection);

    console.log("Database initialization completed.");

    return { seededSchema, seededAdmin };
  } catch (error) {
    console.error("Failed to initialize database:");
    console.error(error);

    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

module.exports = {
  ensureDatabaseSchema,
};
