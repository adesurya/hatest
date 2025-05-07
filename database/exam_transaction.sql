-- Membuat tabel kategori ujian
CREATE TABLE IF NOT EXISTS exam_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Membuat tabel ujian
CREATE TABLE IF NOT EXISTS exams (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  category_id INT NOT NULL,
  description TEXT,
  requirements TEXT,
  location VARCHAR(255) NOT NULL,
  exam_date DATETIME NOT NULL,
  supporting_document VARCHAR(255),
  fee DECIMAL(12, 2) NOT NULL,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES exam_categories(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Membuat tabel metode pembayaran
CREATE TABLE IF NOT EXISTS payment_methods (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(5) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  description VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Membuat tabel transaksi
CREATE TABLE IF NOT EXISTS transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  merchant_order_id VARCHAR(100) NOT NULL UNIQUE,
  user_id INT NOT NULL,
  exam_id INT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  payment_method_id INT NOT NULL,
  payment_code VARCHAR(5) NOT NULL,
  status ENUM('pending', 'success', 'failed', 'expired') DEFAULT 'pending',
  reference VARCHAR(100),
  payment_url VARCHAR(255),
  va_number VARCHAR(50),
  qr_string TEXT,
  signature VARCHAR(255),
  qr_image_path VARCHAR(255),
  transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  payment_date TIMESTAMP NULL,
  expiry_date TIMESTAMP NOT NULL,
  callback_data JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (exam_id) REFERENCES exams(id),
  FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id)
);

-- Membuat tabel pendaftaran ujian
CREATE TABLE IF NOT EXISTS exam_registrations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  exam_id INT NOT NULL,
  transaction_id INT,
  status ENUM('registered', 'paid', 'cancelled', 'completed') DEFAULT 'registered',
  registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (exam_id) REFERENCES exams(id),
  FOREIGN KEY (transaction_id) REFERENCES transactions(id),
  UNIQUE KEY unique_registration (user_id, exam_id)
);

-- Insert data metode pembayaran default
INSERT INTO payment_methods (code, name, description) VALUES 
('BC', 'BCA Virtual Account', 'Pembayaran melalui BCA Virtual Account'),
('M2', 'Mandiri Virtual Account', 'Pembayaran melalui Mandiri Virtual Account'),
('VA', 'Maybank Virtual Account', 'Pembayaran melalui Maybank Virtual Account'),
('B1', 'CIMB Virtual Account', 'Pembayaran melalui CIMB Virtual Account'),
('BT', 'Permata Virtual Account', 'Pembayaran melalui Permata Virtual Account'),
('OV', 'OVO', 'Pembayaran melalui OVO'),
('DA', 'DANA', 'Pembayaran melalui DANA'),
('SP', 'ShopeePay QRIS', 'Pembayaran melalui ShopeePay QRIS');