-- Up Migration
-- =============================================================================
-- Sprint 1 :
--  - cloisonnement par serveur (guild_id) sur games / activities / votes
--  - canal + message du vote (pour clôturer via channel.send au lieu du webhook
--    d'interaction qui expire au bout de 15 min)
-- Idempotent (ADD COLUMN IF NOT EXISTS). guild_id nullable : les éventuelles
-- lignes existantes restent globales, le nouveau code renseigne toujours la
-- colonne.
-- =============================================================================

ALTER TABLE games ADD COLUMN IF NOT EXISTS guild_id TEXT;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS guild_id TEXT;
ALTER TABLE votes ADD COLUMN IF NOT EXISTS guild_id TEXT;
ALTER TABLE votes ADD COLUMN IF NOT EXISTS channel_id TEXT;
ALTER TABLE votes ADD COLUMN IF NOT EXISTS message_id TEXT;

CREATE INDEX IF NOT EXISTS idx_games_guild ON games (guild_id);
CREATE INDEX IF NOT EXISTS idx_activities_guild ON activities (guild_id);
CREATE INDEX IF NOT EXISTS idx_votes_guild_actif ON votes (guild_id, actif) WHERE actif = TRUE;

-- Down Migration
DROP INDEX IF EXISTS idx_votes_guild_actif;
DROP INDEX IF EXISTS idx_activities_guild;
DROP INDEX IF EXISTS idx_games_guild;
ALTER TABLE votes DROP COLUMN IF EXISTS message_id;
ALTER TABLE votes DROP COLUMN IF EXISTS channel_id;
ALTER TABLE votes DROP COLUMN IF EXISTS guild_id;
ALTER TABLE activities DROP COLUMN IF EXISTS guild_id;
ALTER TABLE games DROP COLUMN IF EXISTS guild_id;
