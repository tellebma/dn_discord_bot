-- Up Migration
-- =============================================================================
-- Baseline : schema initial du bot (jeux, activites, canaux, votes, stats).
--
-- 100% idempotent (CREATE TABLE IF NOT EXISTS) — safe a rejouer. node-pg-migrate
-- marque ce fichier comme applique dans la table `pgmigrations`.
--
-- Toute evolution future doit creer un NOUVEAU fichier
-- migrations/<timestamp>_<name>.sql (via `npm run migrate:create -- <name>`).
-- Ce fichier baseline ne doit plus jamais etre modifie.
-- =============================================================================

CREATE TABLE IF NOT EXISTS games (
  id          TEXT PRIMARY KEY,
  nom         TEXT NOT NULL,
  description TEXT,
  plateforme  TEXT,
  genre       TEXT,
  joueurs_min INTEGER,
  joueurs_max INTEGER,
  actif       BOOLEAN NOT NULL DEFAULT TRUE,
  ajoute_par  TEXT NOT NULL,
  ajoute_le   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS activities (
  id          TEXT PRIMARY KEY,
  nom         TEXT NOT NULL,
  description TEXT,
  categorie   TEXT,
  actif       BOOLEAN NOT NULL DEFAULT TRUE,
  cree_par    TEXT NOT NULL,
  cree_le     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS channels (
  guild_id TEXT NOT NULL,
  type     TEXT NOT NULL,
  canal_id TEXT NOT NULL,
  PRIMARY KEY (guild_id, type)
);

CREATE TABLE IF NOT EXISTS votes (
  id       TEXT PRIMARY KEY,
  duree    INTEGER NOT NULL,
  actif    BOOLEAN NOT NULL DEFAULT TRUE,
  cree_par TEXT NOT NULL,
  cree_le  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Jeux proposes dans une session de vote (nom denormalise pour survivre a la
-- suppression d'un jeu du pool).
CREATE TABLE IF NOT EXISTS vote_games (
  vote_id TEXT NOT NULL REFERENCES votes(id) ON DELETE CASCADE,
  jeu_id  TEXT NOT NULL,
  nom     TEXT NOT NULL,
  PRIMARY KEY (vote_id, jeu_id)
);

-- Un bulletin par (vote, jeu, utilisateur) : empeche le double vote tout en
-- autorisant un utilisateur a voter pour plusieurs jeux.
CREATE TABLE IF NOT EXISTS vote_ballots (
  vote_id TEXT NOT NULL REFERENCES votes(id) ON DELETE CASCADE,
  jeu_id  TEXT NOT NULL,
  user_id TEXT NOT NULL,
  cree_le TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (vote_id, jeu_id, user_id)
);

CREATE TABLE IF NOT EXISTS stats (
  cle    TEXT PRIMARY KEY,
  valeur BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_votes_actif ON votes (actif) WHERE actif = TRUE;
CREATE INDEX IF NOT EXISTS idx_ballots_vote ON vote_ballots (vote_id);

-- Down Migration
DROP TABLE IF EXISTS vote_ballots;
DROP TABLE IF EXISTS vote_games;
DROP TABLE IF EXISTS votes;
DROP TABLE IF EXISTS channels;
DROP TABLE IF EXISTS activities;
DROP TABLE IF EXISTS games;
DROP TABLE IF EXISTS stats;
