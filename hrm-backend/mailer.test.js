describe("mailer", () => {
  const mailEnvKeys = [
    "SMTP_USER",
    "SMTP_PASS",
    "SMTP_HOST",
    "SMTP_PORT",
    "SMTP_SECURE",
    "MAIL_FROM",
    "MAIL_FROM_NAME",
  ];
  let warnSpy;

  beforeEach(() => {
    warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    jest.resetModules();
    mailEnvKeys.forEach((key) => {
      delete process.env[key];
    });
  });

  afterEach(() => {
    warnSpy.mockRestore();
    jest.clearAllMocks();
  });

  test("returns false and skips transport when SMTP is not configured", async () => {
    const createTransport = jest.fn();
    jest.doMock("nodemailer", () => ({
      createTransport,
    }));

    const mailer = require("./utils/mailer");

    await expect(
      mailer.sendMail({
        to: "user@example.com",
        subject: "Hi",
        text: "Body",
      })
    ).resolves.toBe(false);

    expect(createTransport).not.toHaveBeenCalled();
  });

  test("builds a custom SMTP transport and sends a password setup link", async () => {
    process.env.SMTP_USER = "noreply@example.com";
    process.env.SMTP_PASS = "super-secret";
    process.env.SMTP_HOST = "smtp.example.com";
    process.env.SMTP_PORT = "587";
    process.env.SMTP_SECURE = "false";
    process.env.MAIL_FROM_NAME = "HRM System";

    const sendMail = jest.fn().mockResolvedValue({ messageId: "msg-1" });
    const createTransport = jest.fn(() => ({ sendMail }));

    jest.doMock("nodemailer", () => ({
      createTransport,
    }));

    const mailer = require("./utils/mailer");

    await expect(
      mailer.sendPasswordSetupLink({
        to: "employee@example.com",
        name: "Ari Tesfaye",
        username: "ari",
        setupUrl: "http://localhost:5173/set-password?token=test-token",
        role: "Employee",
      })
    ).resolves.toBe(true);

    expect(createTransport).toHaveBeenCalledWith({
      host: "smtp.example.com",
      port: 587,
      secure: false,
      auth: {
        user: "noreply@example.com",
        pass: "super-secret",
      },
    });

    expect(sendMail).toHaveBeenCalledTimes(1);

    const mail = sendMail.mock.calls[0][0];
    expect(mail).toMatchObject({
      to: "employee@example.com",
      subject: "Set up your HRM password",
      from: {
        name: "HRM System",
        address: "noreply@example.com",
      },
      replyTo: "noreply@example.com",
    });
    expect(mail.text).toContain("Login email: employee@example.com");
    expect(mail.text).toContain("Username: ari");
    expect(mail.text).toContain("Setup link: http://localhost:5173/set-password?token=test-token");
    expect(mail.html).toContain("Set your password");
    expect(mail.html).toContain("http://localhost:5173/set-password?token=test-token");
  });
});
