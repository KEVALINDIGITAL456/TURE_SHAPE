require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const { body, validationResult } = require("express-validator");
const nodemailer = require("nodemailer");
const axios = require("axios");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 4000;

// ─────────────────────────────────────────
//  MongoDB
// ─────────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("  ✦ MongoDB connected"))
  .catch((err) => {
    console.error("MongoDB error:", err.message);
    process.exit(1);
  });

// ── OTP record (TTL auto-delete after expiry) ──
const otpSchema = new mongoose.Schema({
  target: { type: String, required: true }, // phone digits OR email
  type: { type: String, enum: ["phone", "email"], required: true },
  code: { type: String, required: true }, // 6-digit string
  expiresAt: { type: Date, required: true },
  used: { type: Boolean, default: false },
});
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL auto-delete
const OtpModel = mongoose.model("Otp", otpSchema);

// ── Dossier ──
const dossierSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  countryCode: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  netWorth: { type: String, required: true },
  whyReconstruct: { type: String, required: true },
  sacrifice: { type: String, required: true },
  referral: { type: String, required: true, trim: true },
  phoneVerified: { type: Boolean, default: true },
  emailVerified: { type: Boolean, default: true },
  submittedAt: { type: Date, default: Date.now },
});
const Dossier = mongoose.model("Dossier", dossierSchema);

// ─────────────────────────────────────────
//  Email transporter (Nodemailer)
// ─────────────────────────────────────────
const mailer = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true",
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

// ─────────────────────────────────────────
//  WhatsApp OTP — Meta Cloud API
//  (exact payload structure from your existing code)
// ─────────────────────────────────────────
async function sendWhatsAppOtp(phone, code) {
  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: phone, // full number e.g. 919876543210
    type: "template",
    template: {
      name: process.env.WA_TEMPLATE_NAME || "otp",
      language: { code: "en" },
      components: [
        {
          type: "body",
          parameters: [{ type: "text", text: String(code) }],
        },
        {
          type: "button",
          sub_type: "url",
          index: "0",
          parameters: [
            { type: "text", text: "https" }, // required by template
          ],
        },
      ],
    },
  };

  const url = `https://graph.facebook.com/v22.0/${process.env.WA_PHONE_NUMBER_ID}/messages`;
  const token = process.env.WA_TOKEN;

  const response = await axios.post(url, payload, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  console.log(
    "[WhatsApp] OTP sent to",
    phone,
    "→",
    response.data?.messages?.[0]?.id,
  );
  return response.data;
}

// ─────────────────────────────────────────
//  Email OTP — Nodemailer
// ─────────────────────────────────────────
async function sendEmailOtp(email, code, minutes) {
  await mailer.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "True Shape — Email Verification Code",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#0a0a0a;padding:40px;color:#fff">
        <p style="font-family:Georgia,serif;font-size:16px;letter-spacing:6px;color:#555;margin-bottom:36px">
          TRUE SHAPE
        </p>
        <h2 style="font-size:20px;font-weight:400;margin-bottom:12px;letter-spacing:1px">
          Email Verification
        </h2>
        <p style="color:#888;font-size:14px;line-height:1.7;margin-bottom:32px">
          Your verification code. Expires in
          <strong style="color:#fff">${minutes} minutes</strong>.
        </p>
        <div style="font-size:32px;font-weight:700;letter-spacing:16px;text-align:center;
                    padding:28px 18px;background:#161616;border:1px solid #222;
                    color:#fff;margin-bottom:18px;font-family:monospace">
          ${code}
        </div>
        <p style="color:#333;font-size:11px;line-height:1.7;letter-spacing:0.5px">
          If you did not request access to True Shape, disregard this message.
          Strict NDAs apply to all communications with True Shape.
        </p>
      </div>
    `,
  });
  console.log("[Email] OTP sent to", email);
}

// ─────────────────────────────────────────
//  OTP helpers
// ─────────────────────────────────────────
function generateCode(phone) {
  // Dev bypass — test number always gets 123456
  if (phone.replace(/\D/g, "") === process.env.TEST_PHONE) return "123456";
  return crypto.randomInt(100000, 999999).toString();
}

async function createOtp(target, type) {
  const code = generateCode(target);
  const minutes = Number(process.env.OTP_EXPIRES_MINUTES) || 10;
  const expiresAt = new Date(Date.now() + minutes * 60 * 1000);

  // Invalidate previous OTPs for this target + type
  await OtpModel.deleteMany({ target: target.toLowerCase(), type });
  await OtpModel.create({
    target: target.toLowerCase(),
    type,
    code,
    expiresAt,
  });

  return { code, minutes };
}

async function verifyOtpCode(target, type, code) {
  const record = await OtpModel.findOne({
    target: target.toLowerCase(),
    type,
    used: false,
    expiresAt: { $gt: new Date() },
  }).sort({ expiresAt: -1 });

  if (!record)
    return {
      ok: false,
      reason: "OTP expired or not found. Request a new one.",
    };
  if (record.code !== code.trim())
    return { ok: false, reason: "Incorrect OTP. Please try again." };

  record.used = true;
  await record.save();
  return { ok: true };
}

// ─────────────────────────────────────────
//  Middleware
// ─────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:3000",
    credentials: true,
  }),
);
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json({ limit: "50kb" }));

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      message: "Validation failed",
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
}

const otpSendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "development" ? 100 : 10,
  message: { message: "Too many OTP requests. Please wait 15 minutes." },
});

const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "development" ? 100 : 20,
  message: { message: "Too many attempts. Please wait before trying again." },
});

const submitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: "Too many submissions. Please wait." },
});

// ─────────────────────────────────────────
//  Routes
// ─────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─────────────────────────────────────────
//  POST /api/otp/send
//  body: { target, type, countryCode? }
//    target      = phone digits OR email
//    type        = "phone" | "email"
//    countryCode = required when type="phone" (e.g. "+91")
//                  used to build the full WhatsApp number
// ─────────────────────────────────────────
app.post(
  "/api/otp/send",
  otpSendLimiter,
  [
    body("type")
      .isIn(["phone", "email"])
      .withMessage('type must be "phone" or "email"'),

    body("target")
      .trim()
      .notEmpty()
      .withMessage("target is required")
      .custom((val, { req }) => {
        if (req.body.type === "email") {
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val))
            throw new Error("Enter a valid email address");
        } else {
          const digits = val.replace(/\D/g, "");
          if (digits.length < 7 || digits.length > 15)
            throw new Error("Enter a valid phone number");
        }
        return true;
      }),

    body("countryCode")
      .if(body("type").equals("phone"))
      .notEmpty()
      .withMessage("Country code is required for phone OTP"),
  ],
  validate,
  async (req, res) => {
    try {
      const { target, type, countryCode } = req.body;
      const { code, minutes } = await createOtp(target, type);

      if (type === "phone") {
        // Build full international number: countryCode (e.g. "+91") + digits only
        const digits = target.replace(/\D/g, "");
        const fullPhone = `${countryCode.replace("+", "")}${digits}`; // e.g. 919876543210
        await sendWhatsAppOtp(fullPhone, code);
      } else {
        await sendEmailOtp(target, code, minutes);
      }

      res.json({
        message:
          type === "phone"
            ? "Verification code sent via WhatsApp"
            : `Verification code sent to ${target}`,
        expiresIn: minutes * 60,
      });
    } catch (err) {
      console.error("[otp/send]", err.message);
      res.status(500).json({ message: `Failed to send OTP: ${err.message}` });
    }
  },
);

// ─────────────────────────────────────────
//  POST /api/otp/verify
//  body: { target, type, code }
// ─────────────────────────────────────────
app.post(
  "/api/otp/verify",
  otpVerifyLimiter,
  [
    body("type").isIn(["phone", "email"]).withMessage("Invalid type"),
    body("target").trim().notEmpty().withMessage("target is required"),
    body("code")
      .trim()
      .isLength({ min: 6, max: 6 })
      .withMessage("OTP must be 6 digits")
      .isNumeric()
      .withMessage("OTP must be numeric"),
  ],
  validate,
  async (req, res) => {
    try {
      const { target, type, code } = req.body;
      const result = await verifyOtpCode(target, type, code);

      if (!result.ok) {
        return res.status(400).json({ message: result.reason });
      }

      res.json({
        verified: true,
        message: `${type === "phone" ? "Phone number" : "Email address"} verified successfully.`,
      });
    } catch (err) {
      console.error("[otp/verify]", err.message);
      res.status(500).json({ message: "Server error" });
    }
  },
);

// ─────────────────────────────────────────
//  POST /api/submit
// ─────────────────────────────────────────
app.post(
  "/api/submit",
  submitLimiter,
  [
    body("name")
      .trim()
      .notEmpty()
      .withMessage("Legal name is required")
      .isLength({ min: 2, max: 80 })
      .withMessage("Name must be 2–80 characters")
      .matches(/^[a-zA-Z\s.'`\-]+$/)
      .withMessage("Name contains invalid characters"),
    body("countryCode").notEmpty().withMessage("Country code is required"),
    body("phone")
      .trim()
      .notEmpty()
      .withMessage("Phone number is required")
      .matches(/^[\d\s\-().]+$/)
      .withMessage("Invalid phone number")
      .custom((val) => {
        const d = val.replace(/\D/g, "");
        if (d.length < 7) throw new Error("Phone number too short");
        if (d.length > 15) throw new Error("Phone number too long");
        return true;
      }),
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Enter a valid email address")
      .normalizeEmail(),
    body("netWorth")
      .notEmpty()
      .withMessage("Net worth bracket is required")
      .isIn(["₹10 Cr – ₹50 Cr", "₹50 Cr – ₹100 Cr", "₹100 Cr+"])
      .withMessage("Invalid option"),
    body("whyReconstruct")
      .trim()
      .notEmpty()
      .withMessage("Required")
      .isLength({ min: 30 })
      .withMessage("Minimum 30 characters"),
    body("sacrifice")
      .trim()
      .notEmpty()
      .withMessage("Required")
      .isLength({ min: 20 })
      .withMessage("Minimum 20 characters"),
    body("referral")
      .trim()
      .notEmpty()
      .withMessage("Referral name is required")
      .isLength({ min: 2 })
      .withMessage("Enter a valid referral name"),
    body("phoneVerified")
      .equals("true")
      .withMessage("Phone number must be verified"),
    body("emailVerified")
      .equals("true")
      .withMessage("Email address must be verified"),
  ],
  validate,
  async (req, res, next) => {
    try {
      // Server-side double-check: both OTPs must exist as used=true in DB
      const phoneDigits = req.body.phone.replace(/\D/g, "");
      const emailLower = req.body.email.toLowerCase();

      const phoneRecord = await OtpModel.findOne({
        target: phoneDigits,
        type: "phone",
        used: true,
      });
      const emailRecord = await OtpModel.findOne({
        target: emailLower,
        type: "email",
        used: true,
      });

      if (!phoneRecord) {
        return res.status(403).json({
          message: "Phone number verification required before submitting.",
        });
      }
      if (!emailRecord) {
        return res.status(403).json({
          message: "Email address verification required before submitting.",
        });
      }

      const {
        name,
        countryCode,
        phone,
        email,
        netWorth,
        whyReconstruct,
        sacrifice,
        referral,
      } = req.body;
      const dossier = await Dossier.create({
        name,
        countryCode,
        phone,
        email,
        netWorth,
        whyReconstruct,
        sacrifice,
        referral,
        phoneVerified: true,
        emailVerified: true,
      });

      console.log(`[TRUE SHAPE] Dossier logged → ${dossier._id} (${name})`);
      res.status(201).json({ status: "logged", id: dossier._id });
    } catch (err) {
      next(err);
    }
  },
);

// ─────────────────────────────────────────
//  Serve React (production)
// ─────────────────────────────────────────
const distDir = path.join(__dirname, "dist");
app.use(express.static(distDir));
app.get("*", (_req, res) => res.sendFile(path.join(distDir, "index.html")));

// ─────────────────────────────────────────
//  Error handlers
// ─────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ message: "Not found" }));

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  const message =
    process.env.NODE_ENV === "production" && status === 500
      ? "An unexpected error occurred"
      : err.message;
  console.error("[ERROR]", err.message);
  res.status(status).json({ message });
});

app.listen(PORT, () => {
  console.log(`\n  ✦ True Shape server → http://localhost:${PORT}\n`);
});
