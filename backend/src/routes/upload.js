const express = require('express');
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const { parseFile, rowsToText } = require('../services/fileParser');
const { generateSalesBrief } = require('../services/aiService');
const { sendSalesBrief } = require('../services/emailService');
const { uploadRateLimiter } = require('../middleware/rateLimiter');
const { requireApiKey } = require('../middleware/auth');

const router = express.Router();

// ── Multer Config ────────────────────────────────────────────────────────────
// Store in memory only; max 5 MB; only CSV/XLSX
const ALLOWED_MIMES = [
  'text/csv',
  'application/csv',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIMES.includes(file.mimetype)) return cb(null, true);
    cb(new Error('Invalid file type. Only .csv and .xlsx are allowed.'));
  },
});

// ── Validation Rules ─────────────────────────────────────────────────────────
const uploadValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('A valid recipient email is required.'),
];

/**
 * @swagger
 * tags:
 *   - name: Upload
 *     description: File upload and AI analysis endpoints
 *   - name: System
 *     description: Health and system endpoints
 */

/**
 * @swagger
 * /api/upload:
 *   post:
 *     summary: Upload a sales file and receive an AI brief via email
 *     tags: [Upload]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *               - email
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Sales data file (.csv or .xlsx, max 5MB)
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Recipient email address for the AI brief
 *     responses:
 *       200:
 *         description: Brief generated and email sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 requestId:
 *                   type: string
 *                 rowsProcessed:
 *                   type: integer
 *       400:
 *         description: Validation error or unsupported file type
 *       401:
 *         description: Unauthorized - invalid or missing API key
 *       429:
 *         description: Rate limit exceeded
 *       500:
 *         description: Internal server error
 */
router.post(
  '/upload',
  uploadRateLimiter,
  requireApiKey,
  upload.single('file'),
  uploadValidation,
  async (req, res) => {
    const requestId = uuidv4();

    // 1. Validate email
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg, requestId });
    }

    // 2. Validate file presence
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.', requestId });
    }

    const { email } = req.body;
    const { buffer, mimetype, originalname } = req.file;

    try {
      // 3. Parse file
      const { rows, headers } = parseFile(buffer, mimetype);
      if (rows.length === 0) {
        return res.status(400).json({ error: 'Uploaded file contains no data rows.', requestId });
      }

      // 4. Convert to text for AI
      const dataText = rowsToText(rows, headers);

      // 5. Generate AI brief
      const htmlBrief = await generateSalesBrief(dataText);

      // 6. Send email
      await sendSalesBrief(email, htmlBrief, originalname);

      return res.json({
        success: true,
        message: `Sales brief sent to ${email}`,
        requestId,
        rowsProcessed: rows.length,
      });
    } catch (err) {
      console.error(`[${requestId}] Error:`, err.message);
      return res.status(500).json({ error: err.message, requestId });
    }
  }
);

module.exports = router;
