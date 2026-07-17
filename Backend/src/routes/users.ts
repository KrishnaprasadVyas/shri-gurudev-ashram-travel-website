import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Router } from "express";
import { HttpError } from "../errors.js";
import { AuthenticatedRequest, requireAuth } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";
import { supabaseAdmin } from "../services/supabaseAdmin.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOAD_BASE_DIR = path.resolve(__dirname, "../../uploads/verifications");

// Simple HMAC-based signed URL token generation
const SIGNED_URL_SECRET = process.env.SIGNED_URL_SECRET ?? crypto.randomBytes(32).toString("hex");
const SIGNED_URL_EXPIRY_SECONDS = 300; // 5 minutes

function generateSignedToken(filePath: string, expiresAt: number): string {
  return crypto
    .createHmac("sha256", SIGNED_URL_SECRET)
    .update(`${filePath}:${expiresAt}`)
    .digest("hex");
}

function verifySignedToken(filePath: string, expiresAt: number, token: string): boolean {
  const expected = generateSignedToken(filePath, expiresAt);
  if (expected.length !== token.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(token));
}

export const usersRouter = Router();

// GET /api/users/verification-file-url — generate a signed URL for the user's own verification file
usersRouter.get("/verification-file-url", requireAuth, async (request, response, next) => {
  try {
    const authRequest = request as AuthenticatedRequest;
    const filePath = String(request.query.path ?? "").trim();

    if (!filePath) {
      throw new HttpError(400, "path query parameter is required");
    }

    // Verify the file belongs to the requesting user
    const expectedPrefix = `uploads/verifications/${authRequest.userId}/`;
    if (!filePath.startsWith(expectedPrefix)) {
      throw new HttpError(403, "File does not belong to the authenticated user");
    }

    const expiresAt = Math.floor(Date.now() / 1000) + SIGNED_URL_EXPIRY_SECONDS;
    const token = generateSignedToken(filePath, expiresAt);

    response.json({
      url: `/api/users/verification-file?path=${encodeURIComponent(filePath)}&expires=${expiresAt}&token=${token}`,
      expiresAt,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/users/verification-file — serve a verification file using a signed token (no auth needed, token is the auth)
usersRouter.get("/verification-file", async (request, response, next) => {
  try {
    const filePath = String(request.query.path ?? "").trim();
    const expiresAt = Number(request.query.expires ?? 0);
    const token = String(request.query.token ?? "").trim();

    if (!filePath || !expiresAt || !token) {
      throw new HttpError(400, "Missing required parameters");
    }

    // Verify token hasn't expired
    if (Math.floor(Date.now() / 1000) > expiresAt) {
      throw new HttpError(403, "Signed URL has expired");
    }

    // Verify token is valid
    if (!verifySignedToken(filePath, expiresAt, token)) {
      throw new HttpError(403, "Invalid signed URL token");
    }

    // Resolve and validate the actual file path (prevent path traversal)
    const absolutePath = path.resolve(
      path.dirname(UPLOAD_BASE_DIR),
      "..",
      filePath,
    );
    if (!absolutePath.startsWith(UPLOAD_BASE_DIR)) {
      throw new HttpError(403, "Invalid file path");
    }

    if (!fs.existsSync(absolutePath)) {
      throw new HttpError(404, "File not found");
    }

    // Set cache headers to match expiry
    response.set("Cache-Control", `private, max-age=${SIGNED_URL_EXPIRY_SECONDS}`);
    response.sendFile(absolutePath);
  } catch (error) {
    next(error);
  }
});


// GET /api/users/me — fetch own profile
usersRouter.get("/me", requireAuth, async (request, response, next) => {
  try {
    const authRequest = request as AuthenticatedRequest;
    const { data: user, error } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("id", authRequest.userId)
      .single();
    if (error || !user) return next(new HttpError(404, "User not found"));
    return response.json({ user });
  } catch (error) {
    next(error);
  }
});

type SubmitVerificationBody = {
  aadhaarNumber?: string;
  aadhaarImagePath?: string | null;
  selfieImagePath?: string | null;
};

// Upload Aadhaar image
// POST /api/users/upload-aadhaar
usersRouter.post(
  "/upload-aadhaar",
  requireAuth,
  upload.single("aadhaarImage"),
  async (request, response, next) => {
    try {
      const authRequest = request as AuthenticatedRequest & {
        file?: Express.Multer.File;
      };

      if (!authRequest.file) {
        throw new HttpError(400, "No image file provided");
      }

      const relativePath = `uploads/verifications/${authRequest.userId}/${authRequest.file.filename}`;

      response.status(200).json({ path: relativePath });
    } catch (error) {
      next(error);
    }
  },
);

// Upload selfie image
// POST /api/users/upload-selfie
usersRouter.post(
  "/upload-selfie",
  requireAuth,
  upload.single("selfieImage"),
  async (request, response, next) => {
    try {
      const authRequest = request as AuthenticatedRequest & {
        file?: Express.Multer.File;
      };

      if (!authRequest.file) {
        throw new HttpError(400, "No image file provided");
      }

      const relativePath = `uploads/verifications/${authRequest.userId}/${authRequest.file.filename}`;

      response.status(200).json({ path: relativePath });
    } catch (error) {
      next(error);
    }
  },
);

usersRouter.post(
  "/verification/submit",
  requireAuth,
  async (request, response, next) => {
    try {
      const { aadhaarNumber, aadhaarImagePath, selfieImagePath } =
        request.body as SubmitVerificationBody;

      // 1. Validate Aadhaar number is present and correct format
      if (
        !aadhaarNumber ||
        typeof aadhaarNumber !== "string" ||
        !aadhaarNumber.trim()
      ) {
        throw new HttpError(
          400,
          "aadhaarNumber is required and cannot be empty",
        );
      }

      const trimmedAadhaar = aadhaarNumber.trim();

      // Aadhaar number must be exactly 12 digits
      if (!/^\d{12}$/.test(trimmedAadhaar)) {
        throw new HttpError(
          400,
          "aadhaarNumber must be exactly 12 numeric digits",
        );
      }

      // Validate aadhaarImagePath is present and non-empty
      if (
        !aadhaarImagePath ||
        typeof aadhaarImagePath !== "string" ||
        !aadhaarImagePath.trim()
      ) {
        throw new HttpError(
          400,
          "aadhaarImagePath is required and cannot be empty",
        );
      }

      // Validate selfieImagePath is present and non-empty
      if (
        !selfieImagePath ||
        typeof selfieImagePath !== "string" ||
        !selfieImagePath.trim()
      ) {
        throw new HttpError(
          400,
          "selfieImagePath is required and cannot be empty",
        );
      }

      const authRequest = request as AuthenticatedRequest;

      // Validate that uploaded file paths belong to the authenticated user
      const expectedPrefix = `uploads/verifications/${authRequest.userId}/`;
      if (!aadhaarImagePath.startsWith(expectedPrefix)) {
        throw new HttpError(
          403,
          "Aadhaar image path does not belong to the authenticated user",
        );
      }
      if (!selfieImagePath.startsWith(expectedPrefix)) {
        throw new HttpError(
          403,
          "Selfie image path does not belong to the authenticated user",
        );
      }

      // 2. Check that user hasn't already submitted verification
      const { data: existingUser, error: fetchError } = await supabaseAdmin
        .from("users")
        .select("verification_status")
        .eq("id", authRequest.userId)
        .maybeSingle();

      if (fetchError) {
        throw new HttpError(500, "Failed to load user profile");
      }

      if (!existingUser) {
        throw new HttpError(404, "User profile not found");
      }

      if (
        existingUser.verification_status === "submitted" ||
        existingUser.verification_status === "verified"
      ) {
        throw new HttpError(409, "Verification has already been submitted");
      }
      // 3. Update the users table with verification data
      const { data: updatedUser, error: updateError } = await supabaseAdmin
        .from("users")
        .update({
          aadhaar_number: trimmedAadhaar,
          aadhaar_image_path: aadhaarImagePath ?? null,
          selfie_image_path: selfieImagePath ?? null,
          verification_status: "submitted",
        })
        .eq("id", authRequest.userId)
        .select("*")
        .single();
      if (updateError || !updatedUser) {
        throw new HttpError(
          500,
          updateError?.message ?? "Failed to submit verification",
        );
      }

      response.status(200).json({ user: updatedUser });
    } catch (error) {
      next(error);
    }
  },
);

usersRouter.put(
  "/profile",
  requireAuth,
  async (request, response, next) => {
    try {
      const authRequest = request as AuthenticatedRequest;
      const { full_name, phone } = request.body;

      if (!full_name || typeof full_name !== "string" || !full_name.trim()) {
        throw new HttpError(400, "Full name is required");
      }

      if (!phone || typeof phone !== "string" || !/^\d{10}$/.test(phone)) {
        throw new HttpError(400, "Mobile number must be exactly 10 digits");
      }

      const { data: updatedUser, error: updateError } = await supabaseAdmin
        .from("users")
        .update({
          full_name: full_name.trim(),
          phone: phone,
        })
        .eq("id", authRequest.userId)
        .select("*")
        .single();

      if (updateError || !updatedUser) {
        throw new HttpError(
          500,
          updateError?.message ?? "Failed to update profile",
        );
      }

      response.status(200).json({ user: updatedUser });
    } catch (error) {
      next(error);
    }
  }
);
