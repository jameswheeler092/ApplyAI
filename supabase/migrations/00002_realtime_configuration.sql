-- S0-A3: Realtime Configuration
-- Add applications and documents tables to supabase_realtime publication
-- so the frontend can subscribe to live status updates during document generation.

ALTER PUBLICATION supabase_realtime ADD TABLE documents;
ALTER PUBLICATION supabase_realtime ADD TABLE applications;
