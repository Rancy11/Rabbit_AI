/**
 * Simple API key middleware.
 * Checks the x-api-key header against APP_API_KEY env variable.
 * If APP_API_KEY is not set, auth is skipped (dev mode).
 */
const requireApiKey = (req, res, next) => {
  const configuredKey = process.env.APP_API_KEY;
  if (!configuredKey) {
    // Dev mode: no key configured, allow all
    return next();
  }
  const providedKey = req.headers['x-api-key'];
  if (!providedKey || providedKey !== configuredKey) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or missing API key.' });
  }
  next();
};

module.exports = { requireApiKey };
