
-- Enable RLS on backup_metadata table
ALTER TABLE backup_metadata ENABLE ROW LEVEL SECURITY;

-- Only admins can view backup metadata
CREATE POLICY "Only admins can view backup metadata"
  ON backup_metadata
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- System can insert backup metadata
CREATE POLICY "System can insert backup metadata"
  ON backup_metadata
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- System can delete old backups
CREATE POLICY "System can delete old backups"
  ON backup_metadata
  FOR DELETE
  TO authenticated
  USING (true);
