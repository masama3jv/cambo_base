-- Migration Script for Campo Base Database Schema
-- Apply these ALTER TABLE statements to existing databases to migrate data
-- NOTE: Review and test each statement before running in production
-- ==============================================================================

-- Step 1: Add sport column to teams table if it doesn't exist
-- ALTER TABLE teams ADD COLUMN sport ENUM('futsal', 'basquet3x3', 'padel') NOT NULL DEFAULT 'futsal' AFTER name;

-- Step 2: Add status column to teams table if it doesn't exist
-- ALTER TABLE teams ADD COLUMN status ENUM('pendent_docs', 'pendent_pagament', 'pendent_validacio', 'inscrit', 'actiu') DEFAULT 'pendent_docs' AFTER sport;

-- Step 3: Remove description column from teams (if it exists and is no longer needed)
-- ALTER TABLE teams DROP COLUMN description;

-- Step 4: Update matches table - add tournament_id column
-- ALTER TABLE matches ADD COLUMN tournament_id INT AFTER id;
-- ALTER TABLE matches ADD FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE;
-- ALTER TABLE matches ADD INDEX idx_tournament_id (tournament_id);

-- Step 5: Rename matches.date to match_date for consistency
-- ALTER TABLE matches CHANGE COLUMN date match_date DATETIME NOT NULL;

-- Step 6: Remove location column from matches (moved to courts table)
-- ALTER TABLE matches DROP COLUMN location;

-- Step 7: Add court_id column to matches
-- ALTER TABLE matches ADD COLUMN court_id INT AFTER match_date;
-- ALTER TABLE matches ADD FOREIGN KEY (court_id) REFERENCES courts(id) ON DELETE SET NULL;
-- ALTER TABLE matches ADD INDEX idx_court_id (court_id);

-- Step 8: Update matches status ENUM values
-- ALTER TABLE matches MODIFY COLUMN status ENUM('pendent', 'en_curs', 'finalitzat', 'cancel·lat') DEFAULT 'pendent';

-- Step 9: Remove home_score and away_score from matches (will be in match_sheets)
-- ALTER TABLE matches DROP COLUMN home_score;
-- ALTER TABLE matches DROP COLUMN away_score;

-- Step 10: Migrate players table to team_players (join table)
-- This requires careful data transformation:
-- a) Create the new team_players table
-- b) Copy data from players
-- c) Drop the old players table
-- Steps shown as migration approach (full drop/recreate recommended):
-- INSERT INTO team_players (team_id, user_id, dorsal, position)
-- SELECT team_id, user_id, dorsal, position FROM players WHERE team_id IS NOT NULL;

-- Step 11: Update documents table structure
-- ALTER TABLE documents DROP COLUMN name;
-- ALTER TABLE documents MODIFY COLUMN document_type ENUM('dni', 'asseguranca') NOT NULL;
-- ALTER TABLE documents ADD COLUMN status ENUM('pendent', 'aprovat', 'rebutjat') DEFAULT 'pendent' AFTER file_path;
-- ALTER TABLE documents ADD COLUMN rejection_reason TEXT AFTER status;
-- ALTER TABLE documents MODIFY COLUMN file_path VARCHAR(500);

-- Step 12: Update inscriptions table structure (from players-matches to teams-tournaments)
-- This is a major change - full drop/recreate is recommended:
-- a) Create new inscriptions table
-- b) Migrate relevant data if applicable
-- c) Drop old inscriptions table
-- Full migration example:
-- INSERT INTO inscriptions (team_id, tournament_id, status)
-- SELECT DISTINCT t.id, (SELECT id FROM tournaments LIMIT 1), 'pendent_docs'
-- FROM teams t;

-- Step 13: Ensure teams.capita_id has correct ON DELETE constraint
-- ALTER TABLE teams DROP FOREIGN KEY teams_ibfk_1;
-- ALTER TABLE teams ADD CONSTRAINT teams_fk_capita FOREIGN KEY (capita_id) REFERENCES users(id) ON DELETE RESTRICT;

-- Step 14: Add missing indexes for performance
-- ALTER TABLE teams ADD INDEX idx_sport (sport);
-- ALTER TABLE teams ADD INDEX idx_status (status);
-- ALTER TABLE documents ADD INDEX idx_document_type (document_type);
-- ALTER TABLE documents ADD INDEX idx_status (status);
-- ALTER TABLE inscriptions ADD UNIQUE KEY unique_team_tournament (team_id, tournament_id);

-- Step 15: Make courts.tournament_id nullable (venues don't require a tournament)
-- ALTER TABLE courts MODIFY COLUMN tournament_id INT NULL;
-- ALTER TABLE courts DROP FOREIGN KEY courts_ibfk_1;
-- ALTER TABLE courts ADD CONSTRAINT courts_ibfk_1 FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE SET NULL;

-- ==============================================================================
-- RECOMMENDED APPROACH:
-- ==============================================================================
-- For a cleaner migration, it is recommended to:
-- 1. Create a backup of your current database
-- 2. Use the schema.sql file to perform a full drop/recreate in a test environment
-- 3. Verify the new schema works with your application
-- 4. Plan a migration window to apply the schema.sql to production
-- 5. Use these ALTER statements only if you need to preserve existing data
--    and have a specific reason to avoid the full drop/recreate
-- ==============================================================================
