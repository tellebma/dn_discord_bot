#!/usr/bin/env node
// Wrapper CLI pour node-pg-migrate.
// Charge .env, construit DATABASE_URL depuis POSTGRES_*, puis delegue au binaire.
//
// Usage (via npm run) :
//   npm run migrate:create -- <name>    # scaffolde migrations/<ts>_<name>.sql
//   npm run migrate:up                  # applique les migrations en attente
//   npm run migrate:down                # rollback la derniere migration
//   npm run migrate:redo                # down + up sur la derniere

require('dotenv').config();
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const {
  POSTGRES_HOST = 'localhost',
  POSTGRES_PORT = '5432',
  POSTGRES_DB = 'database',
  POSTGRES_USER = 'user',
  POSTGRES_PASSWORD = '',
} = process.env;

process.env.DATABASE_URL = `postgres://${encodeURIComponent(POSTGRES_USER)}:${encodeURIComponent(
  POSTGRES_PASSWORD
)}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}`;

const bin = path.resolve(
  __dirname,
  '..',
  'node_modules',
  'node-pg-migrate',
  'bin',
  'node-pg-migrate.js'
);

const args = [bin, '-m', 'migrations', '-t', 'pgmigrations', '-j', 'sql', ...process.argv.slice(2)];

const res = spawnSync('node', args, { stdio: 'inherit', env: process.env });
process.exit(res.status ?? 1);
