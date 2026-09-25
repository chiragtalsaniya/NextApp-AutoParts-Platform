import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { executeQuery } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateRequest, loginSchema, changePasswordSchema } from '../middleware/validation.js';

const router = express.Router();

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      console.error('FATAL: JWT_SECRET is not set. Refusing to start in production without a secret.');
      process.exit(1);
    }
    return 'dev-only-insecure-secret';
  }
  return secret;
}

function issueTokens(user) {
  const payload = { userId: user.id, email: user.email, role: user.role };

  return {
    token: jwt.sign({ ...payload, tokenType: 'access' }, getJwtSecret(), { expiresIn: '24h' }),
    refreshToken: jwt.sign({ ...payload, tokenType: 'refresh' }, getJwtSecret(), { expiresIn: '30d' }),
    expiresIn: 86400,
  };
}

// Login endpoint
router.post('/login', validateRequest(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;

    // Get user from database
    const users = await executeQuery(
      'SELECT * FROM users WHERE email = ? AND is_active = TRUE',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await executeQuery(
      'UPDATE users SET last_login = NOW() WHERE id = ?',
      [user.id]
    );

    const tokens = issueTokens(user);

    // Remove password from response
    const { password_hash, ...userResponse } = user;

    res.json({
      ...tokens,
      user: userResponse
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const { password_hash, ...userProfile } = req.user;
    res.json(userProfile);
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Change password
router.post('/change-password', authenticateToken, validateRequest(changePasswordSchema), async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, req.user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await executeQuery(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [hashedPassword, req.user.id]
    );

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Refresh token. This endpoint intentionally does not require the expired access token.
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }

    const decoded = jwt.verify(refreshToken, getJwtSecret());
    if (decoded.tokenType !== 'refresh') {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const users = await executeQuery(
      'SELECT * FROM users WHERE id = ? AND is_active = TRUE',
      [decoded.userId],
    );
    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const tokens = issueTokens(users[0]);

    res.json(tokens);
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
});

// Logout endpoint
router.post('/logout', authenticateToken, async (req, res) => {
  // JWT is stateless - client simply discards the token.
  // Update last_logout timestamp for audit purposes.
  try {
    await executeQuery(
      'UPDATE users SET last_logout = NOW() WHERE id = ?',
      [req.user.id]
    );
  } catch {
    // Non-critical: logout succeeds even if DB update fails
  }
  res.json({ message: 'Logged out successfully' });
});

export default router;
