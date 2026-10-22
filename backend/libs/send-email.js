import dotenv from "dotenv";
import logger from "../libs/logger.js";

dotenv.config();

const apiKey = process.env.BREVO_API_KEY;
const fromEmail = process.env.FROM_EMAIL;
const fromName = process.env.FROM_NAME || "Task Manager";

const sendEmail = async (to, subject, html) => {
  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        sender: { name: fromName, email: fromEmail },
        to: [{ email: to }],
        subject,
        htmlContent: html,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      logger.error("Brevo email send failed", {
        status: response.status,
        body,
      });
      return false;
    }

    logger.info("Email sent successfully");
    return true;
  } catch (error) {
    logger.error("Email send threw", {
      error: error.message,
      stack: error.stack,
    });
    return false;
  }
};

export { sendEmail };
