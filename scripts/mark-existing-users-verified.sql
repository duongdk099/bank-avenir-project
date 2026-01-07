-- Mark all existing users as email verified
-- Run this script in DBeaver or pgAdmin to update existing users

UPDATE users
SET
  is_email_verified = true,
  email_verified_at = NOW()
WHERE is_email_verified = false;

-- Verify the update
SELECT id, email, is_email_verified, email_verified_at, role
FROM users
ORDER BY created_at DESC;
