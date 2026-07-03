-- Migration 002: No-op — superseded by corrected 001_initial_schema.sql
--
-- The original purpose of this migration was to fix foreign key types from
-- TEXT to match better-auth's "user".id. That fix is now baked into 001.
-- This file is kept for history but does nothing.

SELECT 1;
