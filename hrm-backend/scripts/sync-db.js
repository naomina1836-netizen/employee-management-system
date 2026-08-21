const { ensureDatabaseSchema } = require("../config/bootstrap");

ensureDatabaseSchema()
  .then(() => {
    console.log("Database schema is synchronized.");
  })
  .catch((error) => {
    console.error("Database schema synchronization failed.");
    console.error(error.message);
    process.exitCode = 1;
  });
