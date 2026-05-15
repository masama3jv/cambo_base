-- Create database
CREATE DATABASE IF NOT EXISTS campo_base;
USE campo_base;

-- ============================================================================
-- DROP EXISTING TABLES (in reverse dependency order)
-- ============================================================================
DROP TABLE IF EXISTS match_sheets;
DROP TABLE IF EXISTS matches;
DROP TABLE IF EXISTS courts;
DROP TABLE IF EXISTS inscriptions;
DROP TABLE IF EXISTS tournaments;
DROP TABLE IF EXISTS documents;
DROP TABLE IF EXISTS team_players;
DROP TABLE IF EXISTS teams;
DROP TABLE IF EXISTS players;
DROP TABLE IF EXISTS users;

-- ============================================================================
-- CREATE TABLES (in dependency order)
-- ============================================================================

-- Users table: Core user account information with role-based access control
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'capita', 'arbitre', 'jugador') NOT NULL DEFAULT 'jugador',
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role)
);

-- Teams table: Team information with sport type and inscription status
CREATE TABLE teams (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  sport ENUM('futsal', 'basquet3x3', 'padel') NOT NULL,
  status ENUM('pendent_docs', 'pendent_pagament', 'pendent_validacio', 'inscrit', 'actiu') DEFAULT 'pendent_docs',
  capita_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (capita_id) REFERENCES users(id) ON DELETE RESTRICT,
  INDEX idx_capita_id (capita_id),
  INDEX idx_sport (sport),
  INDEX idx_status (status)
);

-- Team Players table: Join table mapping players (users) to teams with jersey number and position
CREATE TABLE team_players (
  team_id INT NOT NULL,
  user_id INT NOT NULL,
  dorsal INT,
  position VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (team_id, user_id),
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id)
);

-- Documents table: Stores required documents (DNI, insurance) for users and teams
CREATE TABLE documents (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  team_id INT,
  document_type ENUM('dni', 'asseguranca') NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  status ENUM('pendent', 'aprovat', 'rebutjat') DEFAULT 'pendent',
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_team_id (team_id),
  INDEX idx_document_type (document_type),
  INDEX idx_status (status)
);

-- Tournaments table: Defines competition formats and rules
CREATE TABLE tournaments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  format ENUM('grups', 'lliga', 'eliminatoria', 'mixt') NOT NULL,
  points_win INT DEFAULT 3,
  points_draw INT DEFAULT 1,
  points_loss INT DEFAULT 0,
  tiebreaker VARCHAR(200),
  match_duration INT NOT NULL COMMENT 'Duration in minutes',
  break_between_matches INT COMMENT 'Break in minutes',
  start_time TIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_format (format)
);

-- Inscriptions table: Team inscriptions to tournaments with payment and document status
CREATE TABLE inscriptions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  team_id INT NOT NULL,
  tournament_id INT NOT NULL,
  status ENUM('pendent_docs', 'pendent_pagament', 'pendent_validacio', 'inscrit') DEFAULT 'pendent_docs',
  amount DECIMAL(8, 2),
  payment_date TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
  UNIQUE KEY unique_team_tournament (team_id, tournament_id),
  INDEX idx_team_id (team_id),
  INDEX idx_tournament_id (tournament_id),
  INDEX idx_status (status)
);

-- Courts table: Physical courts/venues used in tournaments
CREATE TABLE courts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  tournament_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  location VARCHAR(200),
  availability JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
  INDEX idx_tournament_id (tournament_id)
);

-- Matches table: Individual matches within tournaments
CREATE TABLE matches (
  id INT PRIMARY KEY AUTO_INCREMENT,
  tournament_id INT NOT NULL,
  home_team_id INT NOT NULL,
  away_team_id INT NOT NULL,
  court_id INT,
  arbitre_id INT,
  match_date DATETIME NOT NULL,
  status ENUM('pendent', 'en_curs', 'finalitzat', 'cancel·lat') DEFAULT 'pendent',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
  FOREIGN KEY (home_team_id) REFERENCES teams(id) ON DELETE RESTRICT,
  FOREIGN KEY (away_team_id) REFERENCES teams(id) ON DELETE RESTRICT,
  FOREIGN KEY (court_id) REFERENCES courts(id) ON DELETE SET NULL,
  FOREIGN KEY (arbitre_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_tournament_id (tournament_id),
  INDEX idx_home_team_id (home_team_id),
  INDEX idx_away_team_id (away_team_id),
  INDEX idx_court_id (court_id),
  INDEX idx_arbitre_id (arbitre_id),
  INDEX idx_match_date (match_date),
  INDEX idx_status (status)
);

-- Match Sheets table: Detailed match records including incidents and results
CREATE TABLE match_sheets (
  id INT PRIMARY KEY AUTO_INCREMENT,
  match_id INT NOT NULL UNIQUE,
  incidents JSON,
  status ENUM('en_curs', 'tancada', 'immutable') DEFAULT 'en_curs',
  pdf_url VARCHAR(500),
  closed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
  INDEX idx_status (status)
);
