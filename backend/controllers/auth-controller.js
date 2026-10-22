import User from "../models/user.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import logger from "../libs/logger.js";
import Verification from "../models/verification.js";
import { sendEmail } from "../libs/send-email.js";
import { arcjetGuard } from "../libs/arcjet-guard.js";

// A VALID bcrypt hash (of a fixed dummy password) used to flatten the
// timing of "user does not exist" paths (anti-enumeration/timing hardening).
const DUMMY_BCRYPT_HASH =
  "$2b$10$zQ2KIFdVKljsuTbTn9JywudhoySEt5HK9sUryS33LerTWuRg630Ie";
const GENERIC_RESET_MESSAGE =
  "If an account with that email exists, a reset password email has been sent.";

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!(await arcjetGuard(req, res, { email, requested: 1 }))) return;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email address already exists" });
    }
    const salt = await bcrypt.genSalt(10);

    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    const verificationToken = jwt.sign(
      { userId: newUser._id, purpose: "email-verification" },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      },
    );

    await Verification.create({
      userId: newUser._id,
      token: verificationToken,
      expiresAt: new Date(Date.now() + 1 * 60 * 60 * 1000), //1 hour
    });

    // Send verification email to the user
    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
    const emailBody = `<p>Click <a href="${verificationLink}">here</a> to verify your email address.</p>`;
    const emailSubject = "Email Verification";

    const isEmailSent = await sendEmail(email, emailSubject, emailBody);
    if (!isEmailSent) {
      await Verification.deleteMany({ userId: newUser._id });
      await User.findByIdAndDelete(newUser._id);
      return res
        .status(500)
        .json({ message: "Failed to send verification email" });
    }

    res.status(201).json({
      message:
        "Verification email sent to your email.Please check and verify your inbox.",
    });
  } catch (error) {
    // B6: the parallel-register race can reach the unique index even after
    // the pre-check in both requests miss — surface it as the same 400 copy
    // the pre-check returns, not a 500
    if (error && error.code === 11000) {
      return res.status(400).json({ message: "Email address already exists" });
    }
    logger.error("Handler error", { error: error.message, stack: error.stack });
    res.status(500).json({ message: "Internal server error" });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // G6: unthrottled credential probing + reset spam stop here
    if (!(await arcjetGuard(req, res, { requested: 1 }))) return;

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    if (!user.isEmailVerified) {
      const existingVerification = await Verification.findOne({
        userId: user._id,
      });
      if (
        existingVerification &&
        existingVerification.expiresAt > new Date()
      ) {
        return res.status(400).json({
          message: "Email not verified. Please check your inbox.",
        });
      } else {
        if (existingVerification) {
          await Verification.findByIdAndDelete(existingVerification._id);
        }
        const verificationToken = jwt.sign(
          { userId: user._id, purpose: "email-verification" },
          process.env.JWT_SECRET,
          { expiresIn: "1h" },
        );

        // send FIRST; only persist the token when the email actually left —
        // a failed send must not consume the 1h resend window
        const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
        const emailBody = `<p>Click <a href="${verificationLink}">here</a> to verify your email address.</p>`;
        const emailSubject = "Email Verification";

        const isEmailSent = await sendEmail(email, emailSubject, emailBody);

        if (!isEmailSent) {
          return res.status(500).json({
            message: "Failed to send verification email",
          });
        }

        await Verification.create({
          userId: user._id,
          token: verificationToken,
          expiresAt: new Date(Date.now() + 1 * 60 * 60 * 1000), //1 hour
        });

        return res.status(200).json({
          message: "Verification email sent successfully. Please check your inbox.",
        });
      }
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    // G13: targeted update — a concurrent profile save must not be clobbered
    // by a full-doc read-modify-write of lastLogin
    await User.findByIdAndUpdate(user._id, {
      $set: { lastLogin: new Date() },
    });

    const userData = user.toObject();
    delete userData.password;
    
    res.status(200).json({
      message: "Login successful",
      token,
      user: userData,
    });

  } catch (error) {
    logger.error("Handler error", { error: error.message, stack: error.stack });
    res.status(500).json({ message: "Internal server error" });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;

    const payload = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });
    if (!payload) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { userId, purpose } = payload;

    if (purpose !== "email-verification") {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const verification = await Verification.findOne({ userId, token });
    if (!verification) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const isTokenExpired = verification.expiresAt < new Date();
    if (isTokenExpired) {
      return res.status(401).json({ message: "Verification token expired" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (user.isEmailVerified) {
      return res.status(400).json({ message: "Email already verified" });
    }
    user.isEmailVerified = true;
    await user.save();

    await Verification.findByIdAndDelete(verification._id);

    res.status(200).json({ message: "Email verified successfully" });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ message: "Verification token expired" });
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    logger.error("Handler error", { error: error.message, stack: error.stack });
    res.status(500).json({ message: "Internal server error" });
  }
};

const resetPasswordRequest = async (req, res) => {
  try {
    const { email } = req.body;

    // G6: reset email spam is the most expensive unsolicited path
    if (!(await arcjetGuard(req, res, { email, requested: 1 }))) return;

    const user = await User.findOne({ email });
    if (!user || !user.isEmailVerified) {
      // anti-enumeration: always the same generic response, with a dummy
      // bcrypt compare so the timing matches the "email sent" path
      await bcrypt.compare(
        "dummy-password-for-tests",
        DUMMY_BCRYPT_HASH
      );
      return res.status(200).json({ message: GENERIC_RESET_MESSAGE });
    }

    // Xóa yêu cầu cũ bất kể còn hạn hay không, chỉ giữ cái mới nhất
    const existingVerification = await Verification.findOne({ userId: user._id });
    if (existingVerification) {
      await Verification.findByIdAndDelete(existingVerification._id);
    }

    const resetPasswordToken = jwt.sign(
      { userId: user._id, purpose: "reset-password" },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    await Verification.create({
      userId: user._id,
      token: resetPasswordToken,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    });

    const resetPasswordLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetPasswordToken}`;
    const emailBody = `<p>Click <a href="${resetPasswordLink}">here</a> to reset your password</p>`;
    const emailSubject = "Reset your password";

    const isEmailSent = await sendEmail(email, emailSubject, emailBody);
    if (!isEmailSent) {
      return res.status(500).json({ message: "Failed to send reset password email" });
    }

    res.status(200).json({ message: "Reset password email sent" });
  } catch (error) {
    logger.error("Handler error", { error: error.message, stack: error.stack });
    res.status(500).json({ message: "Internal server error" });
  }
};

const verifyResetPasswordTokenAndResetPassword = async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    const payload = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });
    if (!payload) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { userId, purpose } = payload;
    if (purpose !== "reset-password") {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const verification = await Verification.findOne({ userId, token });
    if (!verification) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const isTokenExpired = verification.expiresAt < new Date();
    if (isTokenExpired) {
      return res.status(401).json({ message: "Token expired" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashPassword;
    await user.save();

    await Verification.findByIdAndDelete(verification._id);

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    logger.error("Handler error", { error: error.message, stack: error.stack });
    res.status(500).json({ message: "Internal server error" });
  }
};

export {
  registerUser,
  loginUser,
  verifyEmail,
  resetPasswordRequest,
  verifyResetPasswordTokenAndResetPassword,
};
