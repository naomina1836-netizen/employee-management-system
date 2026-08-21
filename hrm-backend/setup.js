
process.env.NODE_ENV = process.env.NODE_ENV || "test";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret-for-hrm-suite-only";
process.env.JWT_EXPIRE = "1h";
process.env.SKIP_BOOTSTRAP = "1";