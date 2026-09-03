const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const { sendMail } = require("../utils/mailer");

async function main() {
  const to = process.env.TEST_EMAIL_TO || process.argv[2];

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error("SMTP_USER and SMTP_PASS must be set before testing mail.");
    process.exitCode = 1;
    return;
  }

  if (!to) {
    console.error("Provide a recipient with TEST_EMAIL_TO or as the first argument.");
    process.exitCode = 1;
    return;
  }

  const sent = await sendMail({
    to,
    subject: "HRM SMTP test",
    text: "This is a test email from the HRM employee management system."
  });

  if (!sent) {
    console.error(`Failed to send test email to ${to}.`);
    process.exitCode = 1;
    return;
  }

  console.log(`Test email sent to ${to}.`);
}

main().catch((error) => {
  console.error("SMTP test failed:");
  console.error(error);
  process.exitCode = 1;
});
