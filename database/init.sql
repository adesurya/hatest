-- Membuat database
CREATE DATABASE IF NOT EXISTS healthcare_app;
USE healthcare_app;

-- Membuat tabel kategori user
CREATE TABLE IF NOT EXISTS user_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Membuat tabel users
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  phone_number VARCHAR(20) NOT NULL,
  password VARCHAR(255) NOT NULL,
  birth_place VARCHAR(100) NOT NULL,
  birth_date DATE NOT NULL,
  category_id INT NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  is_admin BOOLEAN DEFAULT FALSE,
  verification_token VARCHAR(255),
  reset_token VARCHAR(255),
  reset_token_expires TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES user_categories(id)
);

-- Membuat tabel tokens
CREATE TABLE IF NOT EXISTS tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token VARCHAR(255) NOT NULL,
  type ENUM('verification', 'reset') NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Menambahkan kategori user
INSERT INTO user_categories (name) VALUES ('Dokter'), ('dokterMuda'), ('Administrator');

-- Menambahkan user administrator default
-- Password: Admin123! (di-hash dengan bcrypt)
INSERT INTO users (
  full_name, 
  email, 
  phone_number, 
  password, 
  birth_place, 
  birth_date, 
  category_id, 
  is_verified, 
  is_admin
) VALUES (
  'Admin System', 
  'admin@healthcare.com', 
  '081234567890', 
  '$2b$10$6L.L9DLg9CdPe1mPakxY8.N4aG4xNO9HQbJUdCn1aQQNcZWoNLEqK', 
  'Jakarta', 
  '1990-01-01', 
  3, -- Administrator
  TRUE, 
  TRUE
);