-- Allow authenticated users to delete their own interview sessions (and scorecards via FK cascade).
-- Without FOR DELETE policies, RLS blocks deletes from the mobile app.

DROP POLICY IF EXISTS "Users can delete own sessions" ON interview_sessions;
DROP POLICY IF EXISTS "Users can delete own scorecards" ON scorecards;

CREATE POLICY "Users can delete own sessions"
  ON interview_sessions FOR DELETE
  USING (user_id IN (SELECT id FROM users WHERE email = auth.jwt()->>'email'));

CREATE POLICY "Users can delete own scorecards"
  ON scorecards FOR DELETE
  USING (user_id IN (SELECT id FROM users WHERE email = auth.jwt()->>'email'));
