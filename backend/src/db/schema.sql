-- Create database
CREATE DATABASE IF NOT EXISTS campo_base;
USE campo_base;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'capita', 'arbitre', 'jugador') DEFAULT 'capita',
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email)
);

-- Teams table
CREATE TABLE IF NOT EXISTS teams (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  capita_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (capita_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_capita (capita_id)
);

-- Players table
CREATE TABLE IF NOT EXISTS players (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  team_id INT,
  dorsal INT,
  position VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL,
  INDEX idx_user (user_id),
  INDEX idx_team (team_id)
);

-- Matches table
CREATE TABLE IF NOT EXISTS matches (
  id INT PRIMARY KEY AUTO_INCREMENT,
  home_team_id INT,
  away_team_id INT,
  arbitre_id INT,
  date DATETIME NOT NULL,
  location VARCHAR(255),
  status ENUM('scheduled', 'in_progress', 'finished', 'cancelled') DEFAULT 'scheduled',
  home_score INT,
  away_score INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (home_team_id) REFERENCES teams(id) ON DELETE SET NULL,
  FOREIGN KEY (away_team_id) REFERENCES teams(id) ON DELETE SET NULL,
  FOREIGN KEY (arbitre_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_date (date),
  INDEX idx_status (status)
);

-- Inscriptions table
CREATE TABLE IF NOT EXISTS inscriptions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  player_id INT NOT NULL,
  match_id INT NOT NULL,
  status ENUM('pending', 'confirmed', 'rejected', 'cancelled') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
  FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
  INDEX idx_player (player_id),
  INDEX idx_match (match_id),
  UNIQUE KEY unique_inscription (player_id, match_id)
);

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  team_id INT,
  name VARCHAR(255) NOT NULL,
  file_path VARCHAR(255) NOT NULL,
  document_type VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_team (team_id)
);
