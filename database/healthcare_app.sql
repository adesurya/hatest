-- MySQL dump 10.13  Distrib 8.0.30, for Win64 (x86_64)
--
-- Host: localhost    Database: healthcare_app
-- ------------------------------------------------------
-- Server version	8.0.30

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `about_profiles`
--

DROP TABLE IF EXISTS `about_profiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `about_profiles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(200) NOT NULL,
  `description` text NOT NULL,
  `image_path` varchar(255) DEFAULT NULL,
  `display_order` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `created_by` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `about_profiles_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `about_profiles`
--

LOCK TABLES `about_profiles` WRITE;
/*!40000 ALTER TABLE `about_profiles` DISABLE KEYS */;
/*!40000 ALTER TABLE `about_profiles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `activity_agenda`
--

DROP TABLE IF EXISTS `activity_agenda`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `activity_agenda` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(200) NOT NULL,
  `description` text,
  `location` varchar(255) DEFAULT NULL,
  `start_date` datetime NOT NULL,
  `end_date` datetime NOT NULL,
  `image_path` varchar(255) DEFAULT NULL,
  `is_published` tinyint(1) DEFAULT '0',
  `created_by` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `activity_agenda_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activity_agenda`
--

LOCK TABLES `activity_agenda` WRITE;
/*!40000 ALTER TABLE `activity_agenda` DISABLE KEYS */;
/*!40000 ALTER TABLE `activity_agenda` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `article_categories`
--

DROP TABLE IF EXISTS `article_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `article_categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `slug` varchar(100) NOT NULL,
  `description` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `article_categories`
--

LOCK TABLES `article_categories` WRITE;
/*!40000 ALTER TABLE `article_categories` DISABLE KEYS */;
INSERT INTO `article_categories` VALUES (1,'Medical Research Updates','medical-research-updates','Latest updates on medical research and studies','2025-05-13 16:47:36','2025-05-13 16:48:39');
/*!40000 ALTER TABLE `article_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `articles`
--

DROP TABLE IF EXISTS `articles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `articles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(200) NOT NULL,
  `slug` varchar(250) NOT NULL,
  `content` text NOT NULL,
  `excerpt` text,
  `category_id` int NOT NULL,
  `featured_image` varchar(255) DEFAULT NULL,
  `status` enum('draft','published','archived') DEFAULT 'draft',
  `created_by` int NOT NULL,
  `published_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `created_by` (`created_by`),
  KEY `article_slug_idx` (`slug`),
  KEY `article_category_idx` (`category_id`),
  KEY `article_status_idx` (`status`),
  CONSTRAINT `articles_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `article_categories` (`id`),
  CONSTRAINT `articles_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `articles`
--

LOCK TABLES `articles` WRITE;
/*!40000 ALTER TABLE `articles` DISABLE KEYS */;
/*!40000 ALTER TABLE `articles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `contacts`
--

DROP TABLE IF EXISTS `contacts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contacts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(100) NOT NULL,
  `address` text NOT NULL,
  `phone` varchar(20) NOT NULL,
  `email` varchar(100) NOT NULL,
  `website` varchar(100) DEFAULT NULL,
  `open_hours` text,
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `contacts_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contacts`
--

LOCK TABLES `contacts` WRITE;
/*!40000 ALTER TABLE `contacts` DISABLE KEYS */;
INSERT INTO `contacts` VALUES (1,'Kantor Pusat Healthcare (Updated)','Jl. Kesehatan No. 123, Jakarta Selatan','021-7654321','contact@healthcare.com','https://healthcare.com','Senin - Jumat: 08.00 - 17.00\nSabtu: 08.00 - 13.00',1,'2025-05-13 17:36:10','2025-05-13 17:42:04');
/*!40000 ALTER TABLE `contacts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `doctor_verification_history`
--

DROP TABLE IF EXISTS `doctor_verification_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `doctor_verification_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `doctor_id` int NOT NULL,
  `previous_status` enum('Terverifikasi','Belum Terverifikasi','Ditolak') DEFAULT NULL,
  `new_status` enum('Terverifikasi','Belum Terverifikasi','Ditolak') NOT NULL,
  `notes` text,
  `verified_by` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `doctor_id` (`doctor_id`),
  KEY `verified_by` (`verified_by`),
  CONSTRAINT `doctor_verification_history_ibfk_1` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`id`),
  CONSTRAINT `doctor_verification_history_ibfk_2` FOREIGN KEY (`verified_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `doctor_verification_history`
--

LOCK TABLES `doctor_verification_history` WRITE;
/*!40000 ALTER TABLE `doctor_verification_history` DISABLE KEYS */;
/*!40000 ALTER TABLE `doctor_verification_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `doctors`
--

DROP TABLE IF EXISTS `doctors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `doctors` (
  `id` int NOT NULL AUTO_INCREMENT,
  `full_name` varchar(100) NOT NULL,
  `str_number` varchar(50) NOT NULL,
  `nik_number` varchar(20) NOT NULL,
  `gender` enum('Laki-laki','Perempuan') NOT NULL,
  `birth_date` date NOT NULL,
  `birth_place` varchar(100) NOT NULL,
  `address` text NOT NULL,
  `phone_number` varchar(20) NOT NULL,
  `email` varchar(100) NOT NULL,
  `membership_status` enum('Aktif','Tidak Aktif','Ditangguhkan') DEFAULT 'Aktif',
  `specialization` varchar(100) NOT NULL,
  `education_institution` varchar(200) NOT NULL,
  `graduation_year` year NOT NULL,
  `practice_location` text NOT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `verification_status` enum('Terverifikasi','Belum Terverifikasi','Ditolak') DEFAULT 'Belum Terverifikasi',
  `profile_photo` varchar(255) DEFAULT NULL,
  `supporting_document` varchar(255) DEFAULT NULL,
  `created_by` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `str_number` (`str_number`),
  UNIQUE KEY `nik_number` (`nik_number`),
  UNIQUE KEY `email` (`email`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `doctors_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `doctors`
--

LOCK TABLES `doctors` WRITE;
/*!40000 ALTER TABLE `doctors` DISABLE KEYS */;
/*!40000 ALTER TABLE `doctors` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `dokter_muda_profiles`
--

DROP TABLE IF EXISTS `dokter_muda_profiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dokter_muda_profiles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `nama_lengkap` varchar(100) NOT NULL,
  `nomor_str` varchar(50) NOT NULL,
  `nomor_nik` varchar(20) NOT NULL,
  `jenis_kelamin` enum('Laki-laki','Perempuan') NOT NULL,
  `tanggal_lahir` date NOT NULL,
  `tempat_lahir` varchar(100) NOT NULL,
  `alamat_tinggal` text NOT NULL,
  `no_hp` varchar(20) NOT NULL,
  `email` varchar(100) NOT NULL,
  `status_keanggotaan` enum('Aktif','Tidak Aktif','Ditangguhkan') DEFAULT 'Aktif',
  `spesialisasi` varchar(100) NOT NULL,
  `institusi_pendidikan` varchar(150) NOT NULL,
  `tahun_lulus` year NOT NULL,
  `lokasi_praktek` varchar(200) NOT NULL,
  `koordinat_longitude` decimal(11,8) DEFAULT NULL,
  `koordinat_latitude` decimal(10,8) DEFAULT NULL,
  `status_verifikasi` enum('Pending','Verified','Rejected') DEFAULT 'Pending',
  `foto_profil` varchar(255) DEFAULT NULL,
  `dokumen_pendukung` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nomor_str` (`nomor_str`),
  UNIQUE KEY `nomor_nik` (`nomor_nik`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_dokter_muda_user_id` (`user_id`),
  KEY `idx_dokter_muda_status` (`status_verifikasi`),
  KEY `idx_dokter_muda_status_keanggotaan` (`status_keanggotaan`),
  CONSTRAINT `dokter_muda_profiles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dokter_muda_profiles`
--

LOCK TABLES `dokter_muda_profiles` WRITE;
/*!40000 ALTER TABLE `dokter_muda_profiles` DISABLE KEYS */;
/*!40000 ALTER TABLE `dokter_muda_profiles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `event_registrations`
--

DROP TABLE IF EXISTS `event_registrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `event_registrations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `event_id` int NOT NULL,
  `transaction_id` int DEFAULT NULL,
  `status` enum('registered','paid','attended','completed','cancelled') DEFAULT 'registered',
  `certificate_path` varchar(255) DEFAULT NULL,
  `registration_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_registration` (`user_id`,`event_id`),
  KEY `event_id` (`event_id`),
  KEY `transaction_id` (`transaction_id`),
  KEY `idx_user_id_event_id` (`user_id`,`event_id`),
  CONSTRAINT `event_registrations_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `event_registrations_ibfk_2` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`),
  CONSTRAINT `event_registrations_ibfk_3` FOREIGN KEY (`transaction_id`) REFERENCES `transactions` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `event_registrations`
--

LOCK TABLES `event_registrations` WRITE;
/*!40000 ALTER TABLE `event_registrations` DISABLE KEYS */;
INSERT INTO `event_registrations` VALUES (1,1,1,NULL,'completed',NULL,'2025-05-13 14:37:02');
/*!40000 ALTER TABLE `event_registrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `events`
--

DROP TABLE IF EXISTS `events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `events` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(200) NOT NULL,
  `description` text,
  `event_date` datetime NOT NULL,
  `fee` decimal(12,2) NOT NULL DEFAULT '0.00',
  `location` varchar(255) NOT NULL,
  `points` int NOT NULL DEFAULT '0' COMMENT 'Points awarded to users who complete this event',
  `supporting_document` varchar(255) DEFAULT NULL,
  `image` varchar(255) DEFAULT NULL COMMENT 'Path to event image',
  `created_by` int NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`),
  KEY `idx_event_date` (`event_date`),
  CONSTRAINT `events_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `events`
--

LOCK TABLES `events` WRITE;
/*!40000 ALTER TABLE `events` DISABLE KEYS */;
INSERT INTO `events` VALUES (1,'Introduction to Medical Ethics Webinar 1','Introduction to Medical Ethics Webinar 1','2025-06-18 00:00:00',0.00,'Online Zoom Meeting',10,NULL,'/uploads/events/images/1747146306931-309086671.png',1,1,'2025-05-13 14:25:06','2025-05-13 14:26:49');
/*!40000 ALTER TABLE `events` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `exam_categories`
--

DROP TABLE IF EXISTS `exam_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `exam_categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `exam_categories`
--

LOCK TABLES `exam_categories` WRITE;
/*!40000 ALTER TABLE `exam_categories` DISABLE KEYS */;
/*!40000 ALTER TABLE `exam_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `exam_registrations`
--

DROP TABLE IF EXISTS `exam_registrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `exam_registrations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `exam_id` int NOT NULL,
  `transaction_id` int DEFAULT NULL,
  `status` enum('registered','paid','cancelled','completed') DEFAULT 'registered',
  `registration_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_registration` (`user_id`,`exam_id`),
  KEY `exam_id` (`exam_id`),
  KEY `transaction_id` (`transaction_id`),
  CONSTRAINT `exam_registrations_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `exam_registrations_ibfk_2` FOREIGN KEY (`exam_id`) REFERENCES `exams` (`id`),
  CONSTRAINT `exam_registrations_ibfk_3` FOREIGN KEY (`transaction_id`) REFERENCES `transactions` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `exam_registrations`
--

LOCK TABLES `exam_registrations` WRITE;
/*!40000 ALTER TABLE `exam_registrations` DISABLE KEYS */;
/*!40000 ALTER TABLE `exam_registrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `exams`
--

DROP TABLE IF EXISTS `exams`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `exams` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(200) NOT NULL,
  `category_id` int NOT NULL,
  `description` text,
  `requirements` text,
  `location` varchar(255) NOT NULL,
  `exam_date` datetime NOT NULL,
  `supporting_document` varchar(255) DEFAULT NULL,
  `fee` decimal(12,2) NOT NULL,
  `created_by` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `category_id` (`category_id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `exams_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `exam_categories` (`id`),
  CONSTRAINT `exams_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `exams`
--

LOCK TABLES `exams` WRITE;
/*!40000 ALTER TABLE `exams` DISABLE KEYS */;
/*!40000 ALTER TABLE `exams` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `kurikulum_pendidikan`
--

DROP TABLE IF EXISTS `kurikulum_pendidikan`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `kurikulum_pendidikan` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nama_fakultas` varchar(200) NOT NULL,
  `tahun_kurikulum` year NOT NULL,
  `file_kurikulum` varchar(255) DEFAULT NULL,
  `deskripsi_kurikulum` text,
  `biaya_semester` decimal(12,2) NOT NULL,
  `catatan` text,
  `created_by` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`),
  KEY `idx_fak_tahun` (`nama_fakultas`,`tahun_kurikulum`),
  CONSTRAINT `kurikulum_pendidikan_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `kurikulum_pendidikan`
--

LOCK TABLES `kurikulum_pendidikan` WRITE;
/*!40000 ALTER TABLE `kurikulum_pendidikan` DISABLE KEYS */;
INSERT INTO `kurikulum_pendidikan` VALUES (1,'Fakultas Kedokteran UGM Top',2024,NULL,'Kurikulum Fakultas Kedokteran UGM tahun 2023 dengan fokus pada pendekatan berbasis kompetensi',15000000.00,'Diberlakukan mulai semester ganjil tahun ajaran 2023/2024',1,'2025-05-13 14:52:17','2025-05-13 14:53:48');
/*!40000 ALTER TABLE `kurikulum_pendidikan` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `medical_faculties`
--

DROP TABLE IF EXISTS `medical_faculties`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `medical_faculties` (
  `id` int NOT NULL AUTO_INCREMENT,
  `faculty_name` varchar(100) NOT NULL,
  `university_name` varchar(100) NOT NULL,
  `location` varchar(100) NOT NULL,
  `accreditation` varchar(10) DEFAULT NULL,
  `internal_grade` varchar(10) DEFAULT NULL,
  `active_students` int DEFAULT NULL,
  `established_year` int DEFAULT NULL,
  `website` varchar(255) DEFAULT NULL,
  `contact_info` varchar(255) DEFAULT NULL,
  `notes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_faculty_name` (`faculty_name`),
  KEY `idx_university_name` (`university_name`),
  KEY `idx_location` (`location`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `medical_faculties`
--

LOCK TABLES `medical_faculties` WRITE;
/*!40000 ALTER TABLE `medical_faculties` DISABLE KEYS */;
/*!40000 ALTER TABLE `medical_faculties` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `organization_benefits`
--

DROP TABLE IF EXISTS `organization_benefits`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `organization_benefits` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(100) NOT NULL,
  `description` text NOT NULL,
  `icon` varchar(100) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `sort_order` int DEFAULT '0',
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `organization_benefits_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `organization_benefits`
--

LOCK TABLES `organization_benefits` WRITE;
/*!40000 ALTER TABLE `organization_benefits` DISABLE KEYS */;
/*!40000 ALTER TABLE `organization_benefits` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `organization_history`
--

DROP TABLE IF EXISTS `organization_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `organization_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(200) NOT NULL,
  `content` text NOT NULL,
  `year` varchar(4) NOT NULL,
  `image_path` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_by` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `organization_history_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `organization_history`
--

LOCK TABLES `organization_history` WRITE;
/*!40000 ALTER TABLE `organization_history` DISABLE KEYS */;
INSERT INTO `organization_history` VALUES (1,'Awal Mula Organisasi','Pada tahun 1950, sekelompok dokter Indonesia mendirikan organisasi ini dengan tujuan meningkatkan kualitas pelayanan kesehatan di Indonesia. Organisasi ini awalnya terdiri dari 25 dokter yang memiliki visi bersama untuk mengembangkan sistem kesehatan nasional yang lebih baik dan terjangkau untuk semua lapisan masyarakat.','1950',NULL,1,1,'2025-05-13 17:47:17','2025-05-13 17:47:17'),(2,'Masa Peralihan','Pada tahun 1975, organisasi mengalami masa peralihan dengan perubahan struktur organisasi dan sistem kerja. Pada masa ini, organisasi mulai memperluas jangkauannya ke berbagai daerah di Indonesia dan membentuk cabang-cabang baru. Ini juga menjadi titik awal kolaborasi dengan organisasi kesehatan internasional.','1975',NULL,1,1,'2025-05-13 17:47:17','2025-05-13 17:47:17'),(3,'Era Reformasi','Tahun 1998 menjadi tahun penting dalam sejarah organisasi. Seiring dengan reformasi di Indonesia, organisasi melakukan transformasi besar dalam kebijakan, struktur, dan tujuan programnya. Fokus utama beralih pada peningkatan transparansi, akuntabilitas, dan partisipasi anggota dalam pengambilan keputusan.','1998',NULL,1,1,'2025-05-13 17:47:17','2025-05-13 17:47:17'),(4,'Era Digital','Memasuki tahun 2010, organisasi mulai mengadopsi berbagai teknologi digital untuk meningkatkan efisiensi dan jangkauan layanannya. Sistem informasi kesehatan terintegrasi mulai diimplementasikan, dan berbagai platform digital dikembangkan untuk memudahkan komunikasi antara anggota dan masyarakat.','2010',NULL,1,1,'2025-05-13 17:47:17','2025-05-13 17:47:17');
/*!40000 ALTER TABLE `organization_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `organization_structure`
--

DROP TABLE IF EXISTS `organization_structure`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `organization_structure` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(200) NOT NULL,
  `description` text,
  `image_path` varchar(255) DEFAULT NULL,
  `position` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `created_by` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `organization_structure_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `organization_structure`
--

LOCK TABLES `organization_structure` WRITE;
/*!40000 ALTER TABLE `organization_structure` DISABLE KEYS */;
/*!40000 ALTER TABLE `organization_structure` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payment_methods`
--

DROP TABLE IF EXISTS `payment_methods`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment_methods` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(5) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payment_methods`
--

LOCK TABLES `payment_methods` WRITE;
/*!40000 ALTER TABLE `payment_methods` DISABLE KEYS */;
INSERT INTO `payment_methods` VALUES (1,'BC','BCA Virtual Account','Pembayaran melalui BCA Virtual Account',1,'2025-05-13 09:24:28','2025-05-13 09:24:28'),(2,'M2','Mandiri Virtual Account','Pembayaran melalui Mandiri Virtual Account',1,'2025-05-13 09:24:28','2025-05-13 09:24:28'),(3,'VA','Maybank Virtual Account','Pembayaran melalui Maybank Virtual Account',1,'2025-05-13 09:24:28','2025-05-13 09:24:28'),(4,'B1','CIMB Virtual Account','Pembayaran melalui CIMB Virtual Account',1,'2025-05-13 09:24:28','2025-05-13 09:24:28'),(5,'BT','Permata Virtual Account','Pembayaran melalui Permata Virtual Account',1,'2025-05-13 09:24:28','2025-05-13 09:24:28'),(6,'OV','OVO','Pembayaran melalui OVO',1,'2025-05-13 09:24:28','2025-05-13 09:24:28'),(7,'DA','DANA','Pembayaran melalui DANA',1,'2025-05-13 09:24:28','2025-05-13 09:24:28'),(8,'SP','ShopeePay QRIS','Pembayaran melalui ShopeePay QRIS',1,'2025-05-13 09:24:28','2025-05-13 09:24:28');
/*!40000 ALTER TABLE `payment_methods` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sliders`
--

DROP TABLE IF EXISTS `sliders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sliders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(100) NOT NULL,
  `description` text,
  `image_path` varchar(255) NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `order_number` int DEFAULT '0',
  `created_by` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `sliders_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sliders`
--

LOCK TABLES `sliders` WRITE;
/*!40000 ALTER TABLE `sliders` DISABLE KEYS */;
/*!40000 ALTER TABLE `sliders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `testimonials`
--

DROP TABLE IF EXISTS `testimonials`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `testimonials` (
  `id` int NOT NULL AUTO_INCREMENT,
  `organization_name` varchar(100) NOT NULL,
  `representative_name` varchar(100) NOT NULL,
  `representative_position` varchar(100) NOT NULL,
  `content` text NOT NULL,
  `logo_path` varchar(255) DEFAULT NULL,
  `rating` int NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_by` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `testimonials_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  CONSTRAINT `testimonials_chk_1` CHECK (((`rating` >= 1) and (`rating` <= 5)))
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `testimonials`
--

LOCK TABLES `testimonials` WRITE;
/*!40000 ALTER TABLE `testimonials` DISABLE KEYS */;
/*!40000 ALTER TABLE `testimonials` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tokens`
--

DROP TABLE IF EXISTS `tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tokens` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `token` varchar(255) NOT NULL,
  `type` enum('verification','reset') NOT NULL,
  `expires_at` timestamp NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `tokens_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tokens`
--

LOCK TABLES `tokens` WRITE;
/*!40000 ALTER TABLE `tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `transactions`
--

DROP TABLE IF EXISTS `transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `transactions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `merchant_order_id` varchar(100) NOT NULL,
  `user_id` int NOT NULL,
  `exam_id` int NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `payment_method_id` int NOT NULL,
  `payment_code` varchar(5) NOT NULL,
  `status` enum('pending','success','failed','expired') DEFAULT 'pending',
  `reference` varchar(100) DEFAULT NULL,
  `payment_url` varchar(255) DEFAULT NULL,
  `va_number` varchar(50) DEFAULT NULL,
  `qr_string` text,
  `signature` varchar(255) DEFAULT NULL,
  `qr_image_path` varchar(255) DEFAULT NULL,
  `transaction_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `payment_date` timestamp NULL DEFAULT NULL,
  `expiry_date` timestamp NOT NULL,
  `callback_data` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `merchant_order_id` (`merchant_order_id`),
  KEY `user_id` (`user_id`),
  KEY `exam_id` (`exam_id`),
  KEY `payment_method_id` (`payment_method_id`),
  CONSTRAINT `transactions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `transactions_ibfk_2` FOREIGN KEY (`exam_id`) REFERENCES `exams` (`id`),
  CONSTRAINT `transactions_ibfk_3` FOREIGN KEY (`payment_method_id`) REFERENCES `payment_methods` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `transactions`
--

LOCK TABLES `transactions` WRITE;
/*!40000 ALTER TABLE `transactions` DISABLE KEYS */;
/*!40000 ALTER TABLE `transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_categories`
--

DROP TABLE IF EXISTS `user_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_categories`
--

LOCK TABLES `user_categories` WRITE;
/*!40000 ALTER TABLE `user_categories` DISABLE KEYS */;
INSERT INTO `user_categories` VALUES (1,'Dokter','2025-05-13 09:24:02','2025-05-13 09:24:02'),(2,'dokterMuda','2025-05-13 09:24:02','2025-05-13 09:24:02'),(3,'Administrator','2025-05-13 09:24:02','2025-05-13 09:24:02'),(4,'AnggotaRegular','2025-05-13 14:56:24','2025-05-13 14:56:24'),(5,'AnggotaLuar','2025-05-13 14:56:24','2025-05-13 14:56:24');
/*!40000 ALTER TABLE `user_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_points`
--

DROP TABLE IF EXISTS `user_points`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_points` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `event_id` int NOT NULL,
  `points` int NOT NULL DEFAULT '0',
  `earned_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `notes` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_event` (`user_id`,`event_id`),
  KEY `event_id` (`event_id`),
  KEY `idx_user_id` (`user_id`),
  CONSTRAINT `user_points_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `user_points_ibfk_2` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_points`
--

LOCK TABLES `user_points` WRITE;
/*!40000 ALTER TABLE `user_points` DISABLE KEYS */;
INSERT INTO `user_points` VALUES (2,1,1,100,'2025-05-13 14:42:20','Bonus points for presentation during the workshop','2025-05-13 14:42:20');
/*!40000 ALTER TABLE `user_points` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary view structure for view `user_total_points`
--

DROP TABLE IF EXISTS `user_total_points`;
/*!50001 DROP VIEW IF EXISTS `user_total_points`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `user_total_points` AS SELECT 
 1 AS `user_id`,
 1 AS `total_points`,
 1 AS `last_earned_date`*/;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `full_name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `phone_number` varchar(20) NOT NULL,
  `password` varchar(255) NOT NULL,
  `birth_place` varchar(100) NOT NULL,
  `birth_date` date NOT NULL,
  `category_id` int NOT NULL,
  `institution` varchar(255) DEFAULT NULL,
  `collegium_certificate_number` varchar(100) DEFAULT NULL,
  `id_card_photo` varchar(255) DEFAULT NULL,
  `profile_photo` varchar(255) DEFAULT NULL,
  `membership_status` enum('active','inactive','suspended') DEFAULT 'inactive',
  `is_verified` tinyint(1) DEFAULT '0',
  `is_admin` tinyint(1) DEFAULT '0',
  `verification_token` varchar(255) DEFAULT NULL,
  `reset_token` varchar(255) DEFAULT NULL,
  `reset_token_expires` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `category_id` (`category_id`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `user_categories` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Admin System','admin@healthcare.com','081234567890','$2b$10$PVUy8dlw9SfG1vyw.OXJueft49UF5HelvVN6iMLTcFIoLrQYWA72e','Jakarta','1990-01-01',3,NULL,NULL,NULL,NULL,'inactive',1,1,NULL,NULL,NULL,'2025-05-13 09:24:09','2025-05-13 09:26:36'),(2,'dr. Ahmad Zulkifli','ahmad.zulkifli@example.com','081234567891','$2b$10$BsB809SMoKHhx48Tz5cj4.xkHvbHsv./aPjweMsa1WwRcz3ygxIK.','Surabaya','1988-12-10',2,NULL,NULL,NULL,NULL,'inactive',1,0,NULL,NULL,NULL,'2025-05-13 11:17:56','2025-05-13 11:17:56'),(3,'Ade Surya Iskandar','adesurya.tkj@gmail.com','08170261628','$2b$10$i/b5p5x40N3/VXDyzNmhNOZ48qGtTR97h0qGhnAmOlvOwQQJW/ThC','Jakarta','1990-01-01',1,NULL,NULL,NULL,NULL,'inactive',0,0,'2cc467f1-6cda-4c37-8a76-9962221d6136',NULL,NULL,'2025-05-13 14:28:42','2025-05-13 14:28:42'),(4,'John Doe','john.doe@example.com','081234567890','$2b$10$C83Ypf0N8zo.SSvGqXY3buaI9NITF7DaBngPKMHzQGzibHbOCPacG','Jakarta','1990-01-01',1,'Rumah Sakit Central Jakarta','SK123/2023',NULL,NULL,'inactive',0,0,'b1982ed5-a478-46dd-8496-91648ba7848a',NULL,NULL,'2025-05-13 15:18:45','2025-05-13 15:18:45');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vision_mission`
--

DROP TABLE IF EXISTS `vision_mission`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vision_mission` (
  `id` int NOT NULL AUTO_INCREMENT,
  `type` enum('vision','mission') NOT NULL,
  `content` text NOT NULL,
  `order_number` int NOT NULL DEFAULT '1',
  `is_active` tinyint(1) DEFAULT '1',
  `created_by` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_type_order` (`type`,`order_number`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `vision_mission_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vision_mission`
--

LOCK TABLES `vision_mission` WRITE;
/*!40000 ALTER TABLE `vision_mission` DISABLE KEYS */;
/*!40000 ALTER TABLE `vision_mission` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Final view structure for view `user_total_points`
--

/*!50001 DROP VIEW IF EXISTS `user_total_points`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `user_total_points` AS select `user_points`.`user_id` AS `user_id`,sum(`user_points`.`points`) AS `total_points`,max(`user_points`.`earned_date`) AS `last_earned_date` from `user_points` group by `user_points`.`user_id` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-05-14  0:55:52
