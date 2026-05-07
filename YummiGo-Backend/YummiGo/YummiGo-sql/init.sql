-- MySQL dump 10.13  Distrib 8.2.0, for macos14.0 (arm64)
--
-- Host: localhost    Database: yummigo
-- ------------------------------------------------------
-- Server version	8.2.0

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
-- Current Database: `yummigo`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `yummigo` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `yummigo`;

--
-- Table structure for table `address_book`
--

DROP TABLE IF EXISTS `address_book`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `address_book` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键',
  `user_id` bigint NOT NULL COMMENT 'ユーザーID',
  `consignee` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin DEFAULT NULL COMMENT '受取人',
  `sex` varchar(2) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin DEFAULT NULL COMMENT '性別',
  `phone` varchar(11) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin NOT NULL COMMENT '電話番号',
  `province_code` varchar(12) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '都道府県コード',
  `province_name` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '都道府県名',
  `city_code` varchar(12) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '市区町村コード',
  `city_name` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '市区町村名',
  `district_code` varchar(12) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '区域コード',
  `district_name` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '区域名',
  `detail` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '詳細住所',
  `label` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT 'ラベル',
  `is_default` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'デフォルト 0:いいえ 1:はい',
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0' COMMENT '削除フラグ 0:未削除 1:削除済み',
  `version` int NOT NULL DEFAULT '1' COMMENT 'バージョン（楽観ロック）',
  `create_time` datetime DEFAULT NULL COMMENT '作成時間',
  `update_time` datetime DEFAULT NULL COMMENT '更新時間',
  `full_address` varchar(200) COLLATE utf8mb3_bin DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_bin COMMENT='住所録';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `address_book`
--

LOCK TABLES `address_book` WRITE;
/*!40000 ALTER TABLE `address_book` DISABLE KEYS */;
INSERT INTO `address_book` VALUES (3,1,'T^T','f','18544596662','14','神奈川県','1403','相模原市','140302','中央区','门牌号785889脱离生气啦噜','home',0,0,4,'2025-08-24 23:41:00','2026-04-28 19:01:13','神奈川県相模原市中央区门牌号785889脱离生气啦噜'),(4,1,'童','f','87564948765','12','千叶县','1201','千叶市','120103','稻毛区','葡萄酒5546491','company',0,0,2,'2025-08-24 23:42:00','2026-04-28 18:35:21','千叶县千叶市稻毛区葡萄酒5546491'),(5,1,'要','f','8754664845','12','千葉県','1204','松户市','120401','松户市','门牌号87876','school',0,1,1,'2025-08-25 00:07:51','2025-08-25 00:10:00','千葉県松户市松户市门牌号87876'),(8,1,'jdbdっb','1','84845649','','東京都','','板橋区','','高島平','hsっbdbdb','自宅',0,0,1,'2026-04-28 18:50:35','2026-04-28 18:50:35','東京都板橋区高島平hsっbdbdb'),(9,1,'ここみ','1','098455856','','東京都','','板橋区','','高島平','涂开普通鳄鱼提咯魔女','自宅',1,0,1,'2026-04-28 19:01:10','2026-05-02 15:47:17','東京都板橋区高島平涂开普通鳄鱼提咯魔女');
/*!40000 ALTER TABLE `address_book` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `category`
--

DROP TABLE IF EXISTS `category`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `category` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键',
  `type` int DEFAULT NULL COMMENT 'タイプ 1:料理分類 2:セット分類',
  `name` varchar(32) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin NOT NULL COMMENT '分類名',
  `sort` int NOT NULL DEFAULT '0' COMMENT '順序',
  `status` int DEFAULT NULL COMMENT '分類状態 0:無効 1:有効',
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0' COMMENT '削除フラグ 0:未削除 1:削除済み',
  `version` int NOT NULL DEFAULT '1' COMMENT 'バージョン（楽観ロック）',
  `create_time` datetime DEFAULT NULL COMMENT '作成時間',
  `update_time` datetime DEFAULT NULL COMMENT '更新時間',
  `create_user` bigint DEFAULT NULL COMMENT '作成者',
  `update_user` bigint DEFAULT NULL COMMENT '更新者',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_category_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_bin COMMENT='料理・セット分類';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `category`
--

LOCK TABLES `category` WRITE;
/*!40000 ALTER TABLE `category` DISABLE KEYS */;
INSERT INTO `category` VALUES (11,1,'飲み物',10,1,0,1,'2025-06-09 22:09:18','2025-08-08 01:14:19',1,1),(12,1,'おにぎり・弁当',9,1,0,1,'2025-06-09 22:09:32','2025-06-09 22:18:53',1,1),(13,2,'人気あるセット',12,1,0,1,'2025-06-09 22:11:38','2025-08-08 01:15:30',1,1),(15,2,'お得セット',13,1,0,1,'2025-06-09 22:14:10','2025-06-10 11:04:48',1,1),(16,1,'たこ焼き',4,1,0,1,'2025-06-09 22:15:37','2025-08-31 14:27:25',1,1),(17,1,'お好み焼き',5,1,0,1,'2025-06-09 22:16:14','2025-08-31 14:39:44',1,1),(18,1,'串カツ',6,1,0,1,'2025-06-09 22:17:42','2025-06-09 22:17:42',1,1),(19,1,'和菓子',7,1,0,1,'2025-06-09 22:18:12','2025-06-09 22:18:28',1,1),(20,1,'ラーメン',8,1,0,1,'2025-06-09 22:22:29','2025-06-09 22:23:45',1,1),(21,1,'汁物',11,1,0,12,'2025-06-10 10:51:47','2025-06-10 10:51:47',1,1);
/*!40000 ALTER TABLE `category` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `dish`
--

DROP TABLE IF EXISTS `dish`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dish` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键',
  `name` varchar(32) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin NOT NULL COMMENT '料理名',
  `category_id` bigint NOT NULL COMMENT '料理分類ID',
  `price` decimal(10,2) DEFAULT NULL COMMENT '料理価格',
  `image` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin DEFAULT NULL COMMENT '画像',
  `description` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin DEFAULT NULL COMMENT '説明',
  `status` int DEFAULT '1' COMMENT '0:販売停止 1:販売中',
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0' COMMENT '削除フラグ 0:未削除 1:削除済み',
  `version` int NOT NULL DEFAULT '1' COMMENT 'バージョン（楽観ロック）',
  `create_time` datetime DEFAULT NULL COMMENT '作成時間',
  `update_time` datetime DEFAULT NULL COMMENT '更新時間',
  `create_user` bigint DEFAULT NULL COMMENT '作成者',
  `update_user` bigint DEFAULT NULL COMMENT '更新者',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_dish_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=70 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_bin COMMENT='料理';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dish`
--

LOCK TABLES `dish` WRITE;
/*!40000 ALTER TABLE `dish` DISABLE KEYS */;
INSERT INTO `dish` VALUES (46,'緑茶',11,200.00,'https://t3.ftcdn.net/jpg/04/36/57/24/240_F_436572402_Ws3ww5pErR36X90WM6ZEKwp5ZpQHIUBf.jpg','静岡産の上質な緑茶',0,0,4,'2025-06-09 22:40:47','2025-08-08 22:54:46',1,1),(47,'ラムネ',11,180.00,'https://www.morinaga.co.jp/ramune/assets/img/lineup_regular01@2x.png','懐かしい味のラムネ',1,0,1,'2025-06-10 09:18:49','2025-06-10 09:18:49',1,1),(48,'アサヒビール',11,350.00,'https://www.asahibeer.co.jp/web-service/common/image_quality.psp.html?CMD=onAspect&DF=0&H=340&PATH=/web-service/common/products/asahibeer/original/beer/20230107_1E083_DB2_001.jpg','キリッと冷えたビール',1,0,1,'2025-06-10 09:22:54','2025-06-10 09:22:54',1,1),(49,'おにぎり（鮭）',12,150.00,'https://www.justonecookbook.com/wp-content/uploads/2017/09/Onigiri-Rice-Balls-3082.jpg','新潟産コシヒカリ使用',1,0,1,'2025-06-10 09:30:17','2025-06-10 09:30:17',1,1),(50,'メロンパン',12,120.00,'https://d3d7exujemgi7m.cloudfront.net/upload/recipe/2024/02/65d40e35b6355.jpg','ふわふわの焼きたてパン',1,0,1,'2025-06-10 09:34:28','2025-06-10 09:34:28',1,1),(51,'とんこつラーメン',20,680.00,'https://zenb.jp/cdn/shop/articles/912a_a62b555f-61a5-4d29-9244-802a87f0dacf_1200x.jpg?v=1738041399','濃厚とんこつスープ',1,0,1,'2025-06-10 09:40:51','2025-06-10 09:40:51',1,1),(52,'味噌ラーメン',20,720.00,'https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/%E3%82%89%E3%83%BC%E3%82%81%E3%82%93%E5%91%B3%E5%99%8C%EF%BC%88%E5%A4%A7%E5%B3%B6%EF%BC%89.jpg/960px-%E3%82%89%E3%83%BC%E3%82%81%E3%82%93%E5%91%B3%E5%99%8C%EF%BC%88%E5%A4%A7%E5%B3%B6%EF%BC%89.jpg','北海道味噌使用',1,0,1,'2025-06-10 09:46:02','2025-06-10 09:46:02',1,1),(53,'醤油ラーメン',20,650.00,'https://www.marutomo.co.jp/wp/wp-content/uploads/2024/04/ramen.jpg','あっさり醤油味',1,0,1,'2025-06-10 09:48:37','2025-06-10 09:48:37',1,1),(54,'どら焼き',19,180.00,'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQNmQMN-L0F567Q_AxyAX9U8YM9ORoY5CsPVg&s','北海道あんこ使用',1,0,1,'2025-06-10 09:51:46','2025-06-10 09:51:46',1,1),(55,'大福',19,150.00,'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSzZbjJ421AMvyLkt7YqxWymfFskUq09WYCFA&s','つぶあん入り',1,0,1,'2025-06-10 09:53:37','2025-06-10 09:53:37',1,1),(56,'カステラ',19,250.00,'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRHIwiKakLGAY6hUoZaIS9VMEt1Cl0ylXyD3w&s','長崎伝統の味',1,0,1,'2025-06-10 09:55:44','2025-06-10 09:55:44',1,1),(57,'みたらし団子',19,200.00,'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSqaw4qAPcTqWsgKdMFBVq2iNe1JYdpnKrZDg&s','甘辛いたれが絶品',1,0,1,'2025-06-10 09:58:35','2025-06-10 09:58:35',1,1),(58,'エビ串カツ',18,280.00,'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR3dO4OXoXs_Pelmlu6R732j9hf_F4rgmhJ-w&s','プリプリのエビ串',1,0,1,'2025-06-10 10:12:28','2025-06-10 10:12:28',1,1),(59,'豚串カツ',18,220.00,'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTKhx0IxfM5CQhEwy1ze1IuUiI4jWrnDuwBOw&s','ジューシーな豚肉',1,0,1,'2025-06-10 10:24:03','2025-06-10 10:24:03',1,1),(60,'チーズ串カツ',18,250.00,'https://tshop.r10s.jp/tanosimi-shoku/cabinet/images/kushi/cheesekushi.jpg?fitin=720%3A720','とろ〜りチーズ',1,0,1,'2025-06-10 10:26:03','2025-06-10 10:26:03',1,1),(61,'野菜串カツ',18,180.00,'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT371kBgPMniOIfaCITiMIA_wFRx35-tsprJQ&s','季節の野菜',1,0,1,'2025-06-10 10:28:54','2025-06-10 10:28:54',1,1),(62,'豚玉お好み焼き',17,580.00,'https://www.lettuceclub.net/i/R1/img/dish/1/S20110210036001A_000.png','関西風お好み焼き',1,0,1,'2025-06-10 10:33:05','2025-06-10 10:33:05',1,1),(63,'海鮮お好み焼き',17,680.00,'https://www.yamaki.co.jp/recipe/wp-content/uploads/kn0301.jpg','エビ・イカ・ホタテ入り',1,0,1,'2025-06-10 10:35:40','2025-06-10 10:35:40',1,1),(64,'モダン焼き',17,650.00,'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTOopbcbjr7ThH5UfXEgsDb30A2yVeNlAol6Q&s','そば入りお好み焼き',1,0,1,'2025-06-10 10:37:52','2025-06-10 10:37:52',1,1),(65,'たこ焼き（8個）',16,450.00,'https://www.nisshin-seifun-welna.com/index/recipe/detail/recipe_file/file/n-269_l.jpg?_size=3','大阪名物たこ焼き',1,0,1,'2025-06-10 10:41:08','2025-06-10 10:41:08',1,1),(66,'明石焼き（10個）',16,520.00,'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ16mQuskb3XVDv7BL0Tm6GvlYoBFI1NCjTLg&s','ふわふわ明石焼き',1,0,1,'2025-06-10 10:43:56','2025-06-10 10:43:56',1,1),(67,'味噌汁',21,120.00,'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRc3xwXKi7eoxJOdWZcKc_PbokcVtDDrh5mkQ&s','わかめ・豆腐入り',1,0,1,'2025-06-10 10:54:25','2025-06-10 10:54:25',1,1),(68,'うどん',21,380.00,'https://www.kubara.jp/files/recipes/20240221160552_uz4rmuVy.jpg?1754002835','コシのあるうどん',1,0,3,'2025-06-10 10:55:02','2025-06-10 10:55:02',1,1);
/*!40000 ALTER TABLE `dish` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `dish_flavor`
--

DROP TABLE IF EXISTS `dish_flavor`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dish_flavor` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键',
  `dish_id` bigint NOT NULL COMMENT '料理ID',
  `name` varchar(32) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin DEFAULT NULL COMMENT '味名称',
  `value` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin DEFAULT NULL COMMENT '味データリスト',
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0' COMMENT '削除フラグ 0:未削除 1:削除済み',
  `version` int NOT NULL DEFAULT '1' COMMENT 'バージョン（楽観ロック）',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=104 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_bin COMMENT='料理味関係表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dish_flavor`
--

LOCK TABLES `dish_flavor` WRITE;
/*!40000 ALTER TABLE `dish_flavor` DISABLE KEYS */;
INSERT INTO `dish_flavor` VALUES (40,46,'甘さ','[\"無糖\",\"薄甘\",\"普通\",\"甘め\",\"激甘\"]',1,1),(41,51,'辛さ','[\"辛くない\",\"少し辛い\",\"普通\",\"辛い\",\"激辛\"]',0,1),(42,51,'温度','[\"熱め\",\"普通\",\"ぬるめ\"]',0,1),(45,62,'ソース','[\"ソース多め\",\"ソース普通\",\"ソース少なめ\",\"マヨネーズ追加\"]',0,1),(46,62,'辛さ','[\"辛くない\",\"少し辛い\",\"普通\",\"辛い\"]',0,1),(47,65,'ソース','[\"ソース\",\"醤油\",\"塩\",\"マヨネーズ\"]',0,1),(48,65,'トッピング','[\"青のり\",\"かつお節\",\"マヨネーズ\",\"チーズ\"]',0,1),(86,52,'辛さ','[\"辛くない\",\"少し辛い\",\"普通\",\"辛い\"]',0,1),(87,52,'麺の硬さ','[\"やわらかめ\",\"普通\",\"硬め\"]',0,1),(88,51,'麺の硬さ','[\"やわらかめ\",\"普通\",\"硬め\"]',0,1),(89,51,'チャーシュー','[\"普通\",\"大盛り\",\"特盛り\"]',0,1),(92,53,'麺の硬さ','[\"やわらかめ\",\"普通\",\"硬め\"]',0,1),(93,53,'辛さ','[\"辛くない\",\"少し辛い\",\"普通\",\"辛い\"]',0,1),(94,54,'甘さ','[\"甘さ控えめ\",\"普通\",\"甘め\"]',0,1),(95,56,'甘さ','[\"甘さ控えめ\",\"普通\",\"甘め\"]',0,1),(96,57,'たれ','[\"甘辛\",\"甘め\",\"辛め\"]',0,1),(97,60,'チーズ','[\"普通\",\"チーズ多め\",\"チーズ少なめ\"]',0,1),(101,66,'ソース','[\"ソース\",\"醤油\",\"塩\",\"ポン酢\"]',0,1),(102,67,'だし','[\"昆布だし\",\"かつおだし\",\"あごだし\"]',0,1),(103,65,'辛さ','[\"辛くない\",\"少し辛い\",\"普通\",\"辛い\"]',0,1);
/*!40000 ALTER TABLE `dish_flavor` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `employee`
--

DROP TABLE IF EXISTS `employee`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employee` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键',
  `name` varchar(32) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin NOT NULL COMMENT '氏名',
  `username` varchar(32) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin NOT NULL COMMENT 'ユーザー名',
  `password` varchar(64) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin NOT NULL COMMENT 'パスワード',
  `phone` varchar(15) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin NOT NULL COMMENT '電話番号',
  `sex` char(1) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin NOT NULL COMMENT '性別:M/F',
  `status` int NOT NULL DEFAULT '1' COMMENT '状態 0:無効 1:有効',
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0' COMMENT '削除フラグ 0:未削除 1:削除済み',
  `version` int NOT NULL DEFAULT '1' COMMENT 'バージョン（楽観ロック）',
  `create_time` datetime DEFAULT NULL COMMENT '作成時間',
  `update_time` datetime DEFAULT NULL COMMENT '更新時間',
  `create_user` bigint DEFAULT NULL COMMENT '作成者',
  `update_user` bigint DEFAULT NULL COMMENT '更新者',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_bin COMMENT='従業員情報';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employee`
--

LOCK TABLES `employee` WRITE;
/*!40000 ALTER TABLE `employee` DISABLE KEYS */;
INSERT INTO `employee` VALUES (1,'kokomi','admin','e10adc3949ba59abbe56e057f20f883e','03-1234-5678','F',1,0,1,'2025-06-15 15:51:20','2025-06-17 09:16:20',10,1),(2,'猫','kokokokomi','e10adc3949ba59abbe56e057f20f883e','18723678902','F',1,0,1,'2025-08-07 18:07:00','2025-08-07 18:07:00',10,10),(3,'楽々','kokokomi','e10adc3949ba59abbe56e057f20f883e','13423623102','F',1,0,1,'2025-08-07 18:17:46','2025-08-07 18:17:46',10,10),(4,'miao','testedit','e10adc3949ba59abbe56e057f20f883e','345381467398','F',1,0,3,'2025-08-07 18:45:03','2025-08-08 17:01:59',1,1),(5,'bnmsdgk','hfaucdk','e10adc3949ba59abbe56e057f20f883e','4573198234','F',1,0,1,'2025-08-08 16:56:24','2025-08-08 16:56:24',1,1);
/*!40000 ALTER TABLE `employee` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_detail`
--

DROP TABLE IF EXISTS `order_detail`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_detail` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主キー',
  `name` varchar(32) COLLATE utf8mb3_bin DEFAULT NULL COMMENT '商品名（快照）',
  `image` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL COMMENT '画像（快照）',
  `order_id` bigint NOT NULL COMMENT '注文ID',
  `dish_id` bigint DEFAULT NULL COMMENT '料理ID',
  `setmeal_id` bigint DEFAULT NULL COMMENT 'セットID',
  `dish_flavor` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin DEFAULT NULL COMMENT '味',
  `number` int NOT NULL DEFAULT '1' COMMENT '数量',
  `amount` decimal(10,2) NOT NULL COMMENT '単価',
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0' COMMENT '削除フラグ 0:未削除 1:削除済み',
  `version` int NOT NULL DEFAULT '1' COMMENT 'バージョン（楽観ロック）',
  PRIMARY KEY (`id`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_dish_id` (`dish_id`),
  KEY `idx_setmeal_id` (`setmeal_id`)
) ENGINE=InnoDB AUTO_INCREMENT=113 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_bin COMMENT='注文明細表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_detail`
--

LOCK TABLES `order_detail` WRITE;
/*!40000 ALTER TABLE `order_detail` DISABLE KEYS */;
INSERT INTO `order_detail` VALUES (1,'チーズ串カツ','https://tshop.r10s.jp/tanosimi-shoku/cabinet/images/kushi/cheesekushi.jpg?fitin=720%3A720',1960052652348698626,60,NULL,'チーズ少なめ',2,500.00,0,1),(3,'たこ焼き（8個）','https://www.nisshin-seifun-welna.com/index/recipe/detail/recipe_file/file/n-269_l.jpg?_size=3',1960052652348698626,65,NULL,'マヨネーズ,マヨネーズ,普通',1,450.00,0,1),(4,'豚串カツ','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTKhx0IxfM5CQhEwy1ze1IuUiI4jWrnDuwBOw&s',1960052652348698626,59,NULL,NULL,1,220.00,0,1),(35,'どら焼き','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQNmQMN-L0F567Q_AxyAX9U8YM9ORoY5CsPVg&s',1960052652348698626,54,NULL,'甘め',1,180.00,0,1),(44,'豚玉お好み焼き','https://www.lettuceclub.net/i/R1/img/dish/1/S20110210036001A_000.png',1966043603965816833,62,NULL,'マヨネーズ追加,普通',1,580.00,0,1),(46,'アサヒビール','https://www.asahibeer.co.jp/web-service/common/image_quality.psp.html?CMD=onAspect&DF=0&H=340&PATH=/web-service/common/products/asahibeer/original/beer/20230107_1E083_DB2_001.jpg',1966050077664325633,48,NULL,'',1,350.00,0,1),(47,'海鮮お好み焼き','https://www.yamaki.co.jp/recipe/wp-content/uploads/kn0301.jpg',1966050077664325633,63,NULL,'',1,680.00,0,1),(48,'味噌ラーメン','https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/%E3%82%89%E3%83%BC%E3%82%81%E3%82%93%E5%91%B3%E5%99%8C%EF%BC%88%E5%A4%A7%E5%B3%B6%EF%BC%89.jpg/960px-%E3%82%89%E3%83%BC%E3%82%81%E3%82%93%E5%91%B3%E5%99%8C%EF%BC%88%E5%A4%A7%E5%B3%B6%EF%BC%89.jpg',1966050077664325633,52,NULL,'普通,硬め',1,720.00,0,1),(49,'メロンパン','https://d3d7exujemgi7m.cloudfront.net/upload/recipe/2024/02/65d40e35b6355.jpg',1966063962429566977,50,NULL,'',1,120.00,0,1),(50,'関西風満喫セット','https://www.nisshin-seifun-welna.com/index/recipe/detail/recipe_file/file/n-269_l.jpg?_size=3',1966092864682176513,NULL,1,'',1,1580.00,0,1),(51,'たこ焼き（8個）','https://www.nisshin-seifun-welna.com/index/recipe/detail/recipe_file/file/n-269_l.jpg?_size=3',1966092864682176513,65,NULL,'かつお節,塩,普通',1,450.00,0,1),(52,'味噌ラーメン','https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/%E3%82%89%E3%83%BC%E3%82%81%E3%82%93%E5%91%B3%E5%99%8C%EF%BC%88%E5%A4%A7%E5%B3%B6%EF%BC%89.jpg/960px-%E3%82%89%E3%83%BC%E3%82%81%E3%82%93%E5%91%B3%E5%99%8C%EF%BC%88%E5%A4%A7%E5%B3%B6%EF%BC%89.jpg',1966092864682176513,52,NULL,'普通,普通',1,720.00,0,1),(54,'ラムネ','https://www.morinaga.co.jp/ramune/assets/img/lineup_regular01@2x.png',1966808522902351873,47,NULL,'',1,180.00,0,1),(55,'エビ串カツ','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR3dO4OXoXs_Pelmlu6R732j9hf_F4rgmhJ-w&s',1966808522902351873,58,NULL,'',1,280.00,0,1),(58,'とんこつラーメン','https://zenb.jp/cdn/shop/articles/912a_a62b555f-61a5-4d29-9244-802a87f0dacf_1200x.jpg?v=1738041399',1966808522902351873,51,NULL,'少し辛い,普通,普通,特盛り',1,680.00,0,1),(60,'アサヒビール','https://www.asahibeer.co.jp/web-service/common/image_quality.psp.html?CMD=onAspect&DF=0&H=340&PATH=/web-service/common/products/asahibeer/original/beer/20230107_1E083_DB2_001.jpg',1966808522902351873,48,NULL,'',1,350.00,0,1),(61,'アサヒビール','https://www.asahibeer.co.jp/web-service/common/image_quality.psp.html?CMD=onAspect&DF=0&H=340&PATH=/web-service/common/products/asahibeer/original/beer/20230107_1E083_DB2_001.jpg',1967145528530448386,48,NULL,'',1,350.00,0,1),(62,'アサヒビール','https://www.asahibeer.co.jp/web-service/common/image_quality.psp.html?CMD=onAspect&DF=0&H=340&PATH=/web-service/common/products/asahibeer/original/beer/20230107_1E083_DB2_001.jpg',1967145981246844929,48,NULL,'',1,350.00,0,1),(63,'おにぎり（鮭）','https://www.justonecookbook.com/wp-content/uploads/2017/09/Onigiri-Rice-Balls-3082.jpg',1967145981246844929,49,NULL,'',1,150.00,0,1),(64,'明石焼き（10個）','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ16mQuskb3XVDv7BL0Tm6GvlYoBFI1NCjTLg&s',1967145981246844929,66,NULL,'塩',1,520.00,0,1),(65,'ラムネ','https://www.morinaga.co.jp/ramune/assets/img/lineup_regular01@2x.png',1967467415852691457,47,NULL,'',1,180.00,0,1),(66,'おにぎり（鮭）','https://www.justonecookbook.com/wp-content/uploads/2017/09/Onigiri-Rice-Balls-3082.jpg',1967467415852691457,49,NULL,'',1,150.00,0,1),(67,'モダン焼き','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTOopbcbjr7ThH5UfXEgsDb30A2yVeNlAol6Q&s',1967467415852691457,64,NULL,'',1,650.00,0,1),(68,'おにぎり（鮭）','https://www.justonecookbook.com/wp-content/uploads/2017/09/Onigiri-Rice-Balls-3082.jpg',1967487451988373506,49,NULL,'',1,150.00,0,1),(69,'ラムネ','https://www.morinaga.co.jp/ramune/assets/img/lineup_regular01@2x.png',1967517003804454913,47,NULL,'',1,180.00,0,1),(70,'たこ焼き（8個）','https://www.nisshin-seifun-welna.com/index/recipe/detail/recipe_file/file/n-269_l.jpg?_size=3',1967517003804454913,65,NULL,'塩,かつお節,普通',1,450.00,0,1),(71,'アサヒビール','https://www.asahibeer.co.jp/web-service/common/image_quality.psp.html?CMD=onAspect&DF=0&H=340&PATH=/web-service/common/products/asahibeer/original/beer/20230107_1E083_DB2_001.jpg',1968249929827495937,48,NULL,'',1,350.00,0,1),(72,'メロンパン','https://d3d7exujemgi7m.cloudfront.net/upload/recipe/2024/02/65d40e35b6355.jpg',1968249929827495937,50,NULL,'',1,120.00,0,1),(73,'ラムネ','https://www.morinaga.co.jp/ramune/assets/img/lineup_regular01@2x.png',1969328420568313857,47,NULL,'',1,180.00,0,1),(74,'おにぎり（鮭）','https://www.justonecookbook.com/wp-content/uploads/2017/09/Onigiri-Rice-Balls-3082.jpg',1969328420568313857,49,NULL,'',1,150.00,0,1),(75,'豚玉お好み焼き','https://www.lettuceclub.net/i/R1/img/dish/1/S20110210036001A_000.png',1969328420568313857,62,NULL,'ソース普通,普通',1,580.00,0,1),(76,'アサヒビール','https://www.asahibeer.co.jp/web-service/common/image_quality.psp.html?CMD=onAspect&DF=0&H=340&PATH=/web-service/common/products/asahibeer/original/beer/20230107_1E083_DB2_001.jpg',1969332011219693569,48,NULL,'',1,350.00,0,1),(77,'豚玉お好み焼き','https://www.lettuceclub.net/i/R1/img/dish/1/S20110210036001A_000.png',1969332011219693569,62,NULL,'ソース普通,普通',1,580.00,0,1),(78,'大福','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSzZbjJ421AMvyLkt7YqxWymfFskUq09WYCFA&s',1969332011219693569,55,NULL,'',1,150.00,0,1),(79,'大福','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSzZbjJ421AMvyLkt7YqxWymfFskUq09WYCFA&s',1969332463457939457,55,NULL,'',1,150.00,0,1),(80,'ラムネ','https://www.morinaga.co.jp/ramune/assets/img/lineup_regular01@2x.png',2048703288124035074,47,NULL,'',1,180.00,0,1),(81,'豚玉お好み焼き','https://www.lettuceclub.net/i/R1/img/dish/1/S20110210036001A_000.png',2048703288124035074,62,NULL,'ソース普通,普通',1,580.00,0,1),(83,'味噌汁','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRc3xwXKi7eoxJOdWZcKc_PbokcVtDDrh5mkQ&s',2048703288124035074,67,NULL,NULL,1,120.00,0,1),(84,'エビ串カツ','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR3dO4OXoXs_Pelmlu6R732j9hf_F4rgmhJ-w&s',2048703288124035074,58,NULL,NULL,1,280.00,0,1),(85,'豚玉お好み焼き','https://www.lettuceclub.net/i/R1/img/dish/1/S20110210036001A_000.png',2048703288124035074,62,NULL,NULL,1,580.00,0,1),(95,'おにぎり（鮭）','https://www.justonecookbook.com/wp-content/uploads/2017/09/Onigiri-Rice-Balls-3082.jpg',2048763792934715393,49,NULL,NULL,1,150.00,0,1),(96,'たこ焼き（8個）','https://www.nisshin-seifun-welna.com/index/recipe/detail/recipe_file/file/n-269_l.jpg?_size=3',2048763792934715393,65,NULL,'ソース:塩,トッピング:かつお節,辛さ:普通',1,450.00,0,1),(97,'豚玉お好み焼き','https://www.lettuceclub.net/i/R1/img/dish/1/S20110210036001A_000.png',2048763792934715393,62,NULL,'ソース:ソース普通,辛さ:普通',1,580.00,0,1),(101,'メロンパン','https://d3d7exujemgi7m.cloudfront.net/upload/recipe/2024/02/65d40e35b6355.jpg',2049059218560794625,50,NULL,NULL,2,240.00,0,1),(104,'ラムネ','https://www.morinaga.co.jp/ramune/assets/img/lineup_regular01@2x.png',2049059218560794625,47,NULL,NULL,2,360.00,0,1),(105,'ラムネ','https://www.morinaga.co.jp/ramune/assets/img/lineup_regular01@2x.png',2050466703427379201,47,NULL,NULL,3,540.00,0,1),(106,'アサヒビール','https://www.asahibeer.co.jp/web-service/common/image_quality.psp.html?CMD=onAspect&DF=0&H=340&PATH=/web-service/common/products/asahibeer/original/beer/20230107_1E083_DB2_001.jpg',2050466703427379201,48,NULL,NULL,1,350.00,0,1),(107,'たこ焼き（8個）','https://www.nisshin-seifun-welna.com/index/recipe/detail/recipe_file/file/n-269_l.jpg?_size=3',2050466703427379201,65,NULL,'ソース:塩,トッピング:かつお節,辛さ:普通',1,450.00,0,1),(108,'明石焼き（10個）','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ16mQuskb3XVDv7BL0Tm6GvlYoBFI1NCjTLg&s',2050466703427379201,66,NULL,'ソース:ポン酢',1,520.00,0,1),(109,'ラムネ','https://www.morinaga.co.jp/ramune/assets/img/lineup_regular01@2x.png',2050467153937571841,47,NULL,NULL,1,180.00,0,1),(110,'おにぎり（鮭）','https://www.justonecookbook.com/wp-content/uploads/2017/09/Onigiri-Rice-Balls-3082.jpg',2050467153937571841,49,NULL,NULL,4,600.00,0,1),(111,'メロンパン','https://d3d7exujemgi7m.cloudfront.net/upload/recipe/2024/02/65d40e35b6355.jpg',2050467153937571841,50,NULL,NULL,1,120.00,0,1),(112,'メロンパン','https://d3d7exujemgi7m.cloudfront.net/upload/recipe/2024/02/65d40e35b6355.jpg',2050474068788781058,50,NULL,NULL,5,600.00,0,1);
/*!40000 ALTER TABLE `order_detail` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主キー',
  `number` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin NOT NULL COMMENT '注文番号',
  `status` int NOT NULL DEFAULT '1' COMMENT '注文状態 1:支払い待ち 2:受付待ち 3:受付済み 4:配送中 5:完了 6:キャンセル 7:返金',
  `user_id` bigint NOT NULL COMMENT '注文ユーザー',
  `address_book_id` bigint NOT NULL COMMENT '住所ID',
  `order_time` datetime NOT NULL COMMENT '注文時間',
  `checkout_time` datetime DEFAULT NULL COMMENT '会計時間',
  `pay_method` int NOT NULL DEFAULT '2' COMMENT '支払い方法 1:電子マネー 2:クレジットカード（Stripe）',
  `stripe_payment_intent_id` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin DEFAULT NULL COMMENT 'Stripe PaymentIntent ID',
  `stripe_session_id` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin DEFAULT NULL COMMENT 'Stripe Checkout Session ID',
  `pay_status` tinyint NOT NULL DEFAULT '0' COMMENT '支払い状態 0:未払い 1:支払い済み 2:返金',
  `amount` decimal(10,2) NOT NULL COMMENT '実収金額',
  `snapshot_phone` varchar(11) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin DEFAULT NULL COMMENT '電話番号（快照）',
  `snapshot_address` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin DEFAULT NULL COMMENT '住所（快照）',
  `snapshot_user_name` varchar(32) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin DEFAULT NULL COMMENT 'ユーザー名（快照）',
  `snapshot_consignee` varchar(32) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin DEFAULT NULL COMMENT '受取人（快照）',
  `cancel_reason` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin DEFAULT NULL COMMENT '注文キャンセル理由',
  `rejection_reason` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin DEFAULT NULL COMMENT '注文拒否理由',
  `cancel_time` datetime DEFAULT NULL COMMENT '注文キャンセル時間',
  `estimated_delivery_time` datetime DEFAULT NULL COMMENT '配送予定時間',
  `delivery_status` tinyint(1) NOT NULL DEFAULT '1' COMMENT '配送状態 1:即時配送 0:時間指定',
  `delivery_time` datetime DEFAULT NULL COMMENT '配送時間',
  `pack_amount` int DEFAULT NULL COMMENT '包装料',
  `tableware_number` int DEFAULT NULL COMMENT '食器数量',
  `tableware_status` tinyint(1) NOT NULL DEFAULT '1' COMMENT '食器数量状態 1:食事量に応じて提供 0:具体的数量選択',
  `total_items` int DEFAULT NULL COMMENT '商品総数（快照）',
  `summary` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin DEFAULT NULL COMMENT '商品概要（快照）',
  `first_item_name` varchar(32) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin DEFAULT NULL COMMENT '最初の商品名（快照）',
  `first_item_image` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin DEFAULT NULL COMMENT '最初の商品画像（快照）',
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0' COMMENT '削除フラグ 0:未削除 1:削除済み',
  `version` int NOT NULL DEFAULT '1' COMMENT 'バージョン（楽観ロック）',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `remark` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_stripe_payment_intent` (`stripe_payment_intent_id`),
  UNIQUE KEY `uk_stripe_session` (`stripe_session_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_address_book_id` (`address_book_id`),
  KEY `idx_status` (`status`),
  KEY `idx_pay_status` (`pay_status`),
  KEY `idx_order_time` (`order_time`)
) ENGINE=InnoDB AUTO_INCREMENT=2050474068788781059 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_bin COMMENT='注文表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
INSERT INTO `orders` VALUES (1960052652348698626,'1756147942990',6,1,3,'2025-08-26 02:52:23',NULL,1,NULL,NULL,0,1355.00,'18544596662','门牌号785889脱离生气啦噜',NULL,'T^T','時間切れによる注文の自動キャンセル',NULL,'2026-05-01 19:50:01',NULL,1,NULL,5,3,0,NULL,NULL,NULL,NULL,0,2,'2025-08-26 02:52:23','2025-08-26 02:52:23',NULL),(1966043603965816833,'1757576297162',6,1,3,'2025-09-11 15:38:17',NULL,1,NULL,NULL,0,585.00,'18544596662','门牌号785889脱离生气啦噜',NULL,'T^T','時間切れによる注文の自動キャンセル',NULL,'2026-05-01 19:50:01',NULL,1,NULL,5,1,1,NULL,NULL,NULL,NULL,0,2,'2025-09-11 15:38:17','2025-09-11 15:38:17',NULL),(1966050077664325633,'1757577840615',6,1,3,'2025-09-11 16:04:01',NULL,1,NULL,NULL,0,1755.00,'18544596662','门牌号785889脱离生气啦噜',NULL,'T^T','時間切れによる注文の自動キャンセル',NULL,'2026-05-01 19:50:01',NULL,1,NULL,5,3,1,NULL,NULL,NULL,NULL,0,2,'2025-09-11 16:04:01','2025-09-11 16:04:01',NULL),(1966808522902351873,'1757758668047',6,1,3,'2025-09-13 18:17:48',NULL,1,NULL,NULL,0,1495.00,'18544596662','门牌号785889脱离生气啦噜',NULL,'T^T','時間切れによる注文の自動キャンセル',NULL,'2026-05-01 19:50:01',NULL,1,NULL,5,2,0,NULL,NULL,NULL,NULL,0,2,'2025-09-13 18:17:48','2025-09-13 18:17:48',NULL),(1969332463457939457,'1758360422374',6,1,4,'2025-09-20 17:27:02',NULL,1,NULL,NULL,0,155.00,'87564948765','葡萄酒5546491',NULL,'童','订单量较多，暂时无法接单',NULL,'2026-04-27 16:19:18',NULL,1,NULL,5,1,1,NULL,NULL,NULL,NULL,0,2,'2025-09-20 17:27:02','2025-09-20 17:27:02',NULL),(2048703288124035074,'1777283901607',6,1,3,'2026-04-27 18:58:22',NULL,2,NULL,'cs_test_a1Xb2PPmELt0nTUpTf3WlkNDmn4x4Qr09QO4ZzZlWRHkuyxIgfjGGuv4pM',0,1740.00,'18544596662','门牌号785889脱离生气啦噜',NULL,'T^T','時間切れによる注文の自動キャンセル',NULL,'2026-05-01 19:50:01',NULL,1,NULL,0,0,1,NULL,NULL,NULL,NULL,0,3,'2026-04-27 18:58:22','2026-04-27 18:58:22',NULL),(2048763792934715393,'1777298327063',6,1,4,'2026-04-27 22:58:47',NULL,2,NULL,'cs_test_a1tIz8SZopujrDtsC1UqeSeHmhg2GzkhA4f47Fu9Pq5PEp1jaCkkOfvKNl',0,1180.00,'87564948765','葡萄酒5546491',NULL,'童','時間切れによる注文の自動キャンセル',NULL,'2026-05-01 19:50:01',NULL,1,NULL,0,0,0,NULL,NULL,NULL,NULL,0,3,'2026-04-27 22:58:47','2026-04-27 22:58:47',NULL),(2049059218560794625,'1777368762035',5,1,4,'2026-04-28 18:32:42','2026-04-28 18:58:23',2,'pi_3TR8PNHwUMwWt3yt0XABDmBp','cs_test_a19yLXamW1D5uc2zDeHrXEwVZFfQSsef5zAKsDzivTUQjr6y6VPBor0IvG',1,1200.00,'87564948765','葡萄酒5546491',NULL,'童',NULL,NULL,NULL,'2026-04-28 19:29:07',1,'2026-04-28 18:59:32',0,0,0,NULL,NULL,NULL,NULL,0,7,'2026-04-28 18:32:42','2026-04-28 18:32:42',NULL),(2050466703427379201,'1777704332580',5,1,3,'2026-05-02 15:45:33','2026-05-02 15:46:22',2,'pi_3TSXJUHwUMwWt3yt0avPnFJi','cs_test_a16TatXaJPJ8nfFxLSLJvOsa60UqkE04q77OM8YI61Z3Q6CdchZFuiNkZp',1,2940.00,'18544596662','门牌号785889脱离生气啦噜',NULL,'T^T',NULL,NULL,NULL,'2026-05-02 16:16:42',1,NULL,0,0,0,NULL,NULL,NULL,NULL,0,6,'2026-05-02 15:45:33','2026-05-02 15:45:33','女vs卡在我们拖'),(2050467153937571841,'1777704439993',6,1,9,'2026-05-02 15:47:20',NULL,2,NULL,'cs_test_a1GCl573mCav3UkiW89EQfffmCJjwQtznDBv3JethCcDN6BZvf1C2q1gQM',0,2700.00,'098455856','涂开普通鳄鱼提咯魔女',NULL,'ここみ','時間切れによる注文の自動キャンセル',NULL,'2026-05-02 16:03:00',NULL,1,NULL,0,0,0,NULL,NULL,NULL,NULL,0,3,'2026-05-02 15:47:20','2026-05-02 15:47:20',NULL),(2050474068788781058,'1777706088621',5,1,9,'2026-05-02 16:14:49','2026-05-02 16:15:26',2,'pi_3TSXlbHwUMwWt3yt1zsJn9fl','cs_test_a18VVjmIZEyztc6NmGR6COyTE1KqXPN8dK31ek4zGi0gqYFNB0fLsxOyMW',1,3000.00,'098455856','涂开普通鳄鱼提咯魔女',NULL,'ここみ',NULL,NULL,NULL,'2026-05-04 01:07:51',1,'2026-05-04 00:37:57',0,0,0,NULL,NULL,NULL,NULL,0,6,'2026-05-02 16:14:49','2026-05-02 16:14:49',NULL);
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `setmeal`
--

DROP TABLE IF EXISTS `setmeal`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `setmeal` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键',
  `category_id` bigint NOT NULL COMMENT '料理分類ID',
  `name` varchar(32) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin NOT NULL COMMENT 'セット名',
  `price` decimal(10,2) NOT NULL COMMENT 'セット価格',
  `status` int DEFAULT '1' COMMENT '販売状態 0:販売停止 1:販売中',
  `description` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin DEFAULT NULL COMMENT '説明',
  `image` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin DEFAULT NULL COMMENT '画像',
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0' COMMENT '削除フラグ 0:未削除 1:削除済み',
  `version` int NOT NULL DEFAULT '1' COMMENT 'バージョン（楽観ロック）',
  `create_time` datetime DEFAULT NULL COMMENT '作成時間',
  `update_time` datetime DEFAULT NULL COMMENT '更新時間',
  `create_user` bigint DEFAULT NULL COMMENT '作成者',
  `update_user` bigint DEFAULT NULL COMMENT '更新者',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_setmeal_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_bin COMMENT='セット';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `setmeal`
--

LOCK TABLES `setmeal` WRITE;
/*!40000 ALTER TABLE `setmeal` DISABLE KEYS */;
INSERT INTO `setmeal` VALUES (1,13,'関西風満喫セット',1560.00,0,'関西名物を一度に楽しめるセット','https://www.nisshin-seifun-welna.com/index/recipe/detail/recipe_file/file/n-269_l.jpg?_size=3',0,6,'2025-08-09 01:51:09','2025-08-09 01:51:09',1,1),(2,15,'串カツ盛り合わせ',999.99,1,'4種の串カツをお得に','https://tshop.r10s.jp/tanosimi-shoku/cabinet/images/kushi/cheesekushi.jpg?fitin=720%3A720',0,2,'2025-08-09 01:55:35','2025-08-09 13:08:21',1,1),(3,15,'甘味セット',580.00,1,'和菓子3種を楽しめるセット','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQNmQMN-L0F567Q_AxyAX9U8YM9ORoY5CsPVg&s',0,1,'2025-08-09 01:58:39','2025-08-09 01:58:39',1,1);
/*!40000 ALTER TABLE `setmeal` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `setmeal_dish`
--

DROP TABLE IF EXISTS `setmeal_dish`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `setmeal_dish` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键',
  `setmeal_id` bigint DEFAULT NULL COMMENT 'セットID',
  `dish_id` bigint DEFAULT NULL COMMENT '料理ID',
  `name` varchar(32) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin DEFAULT NULL COMMENT '料理名（冗長フィールド）',
  `price` decimal(10,2) DEFAULT NULL COMMENT '料理単価（冗長フィールド）',
  `copies` int DEFAULT NULL COMMENT '料理数量',
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0' COMMENT '削除フラグ 0:未削除 1:削除済み',
  `version` int NOT NULL DEFAULT '1' COMMENT 'バージョン（楽観ロック）',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_bin COMMENT='セット料理関係';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `setmeal_dish`
--

LOCK TABLES `setmeal_dish` WRITE;
/*!40000 ALTER TABLE `setmeal_dish` DISABLE KEYS */;
INSERT INTO `setmeal_dish` VALUES (1,1,65,'たこ焼き（8個）',450.00,1,1,1),(2,1,62,'豚玉お好み焼き',580.00,1,1,1),(3,1,46,'緑茶',200.00,1,1,1),(4,2,58,'エビ串カツ',280.00,1,1,1),(5,2,59,'豚串カツ',220.00,1,1,1),(6,2,60,'チーズ串カツ',250.00,1,1,1),(7,2,61,'野菜串カツ',180.00,1,1,1),(8,3,54,'どら焼き',180.00,1,0,1),(9,3,55,'大福',150.00,1,0,1),(10,3,57,'みたらし団子',200.00,1,0,1),(11,1,65,'たこ焼き（8個）',450.00,1,0,1),(12,1,62,'豚玉お好み焼き',580.00,1,0,1),(13,1,46,'緑茶',200.00,1,0,1);
/*!40000 ALTER TABLE `setmeal_dish` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `shopping_cart`
--

DROP TABLE IF EXISTS `shopping_cart`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `shopping_cart` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键',
  `name` varchar(32) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin DEFAULT NULL COMMENT '商品名',
  `image` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin DEFAULT NULL COMMENT '画像',
  `user_id` bigint NOT NULL COMMENT 'ユーザーID',
  `dish_id` bigint DEFAULT NULL COMMENT '料理ID',
  `setmeal_id` bigint DEFAULT NULL COMMENT 'セットID',
  `dish_flavor` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin DEFAULT NULL COMMENT '味',
  `number` int NOT NULL DEFAULT '1' COMMENT '数量',
  `amount` decimal(10,2) NOT NULL COMMENT '金額',
  `create_time` datetime DEFAULT NULL COMMENT '作成時間',
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0' COMMENT '削除フラグ 0:未削除 1:削除済み',
  `version` int NOT NULL DEFAULT '1' COMMENT 'バージョン（楽観ロック）',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=113 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_bin COMMENT='ショッピングカート';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shopping_cart`
--

LOCK TABLES `shopping_cart` WRITE;
/*!40000 ALTER TABLE `shopping_cart` DISABLE KEYS */;
INSERT INTO `shopping_cart` VALUES (1,'チーズ串カツ','https://tshop.r10s.jp/tanosimi-shoku/cabinet/images/kushi/cheesekushi.jpg?fitin=720%3A720',1,60,NULL,'チーズ少なめ',2,500.00,'2025-08-24 03:06:00',1,1),(2,'アサヒビール','https://www.asahibeer.co.jp/web-service/common/image_quality.psp.html?CMD=onAspect&DF=0&H=340&PATH=/web-service/common/products/asahibeer/original/beer/20230107_1E083_DB2_001.jpg',1,48,NULL,NULL,15,5250.00,'2025-08-25 15:32:44',1,1),(3,'たこ焼き（8個）','https://www.nisshin-seifun-welna.com/index/recipe/detail/recipe_file/file/n-269_l.jpg?_size=3',1,65,NULL,'マヨネーズ,マヨネーズ,普通',2,900.00,'2025-08-25 15:32:55',1,1),(4,'豚串カツ','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTKhx0IxfM5CQhEwy1ze1IuUiI4jWrnDuwBOw&s',1,59,NULL,NULL,1,220.00,'2025-08-25 15:32:59',1,1),(34,'ラムネ','https://www.morinaga.co.jp/ramune/assets/img/lineup_regular01@2x.png',1,47,NULL,NULL,4,720.00,'2025-08-25 15:34:32',1,1),(35,'どら焼き','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQNmQMN-L0F567Q_AxyAX9U8YM9ORoY5CsPVg&s',1,54,NULL,'甘め',2,360.00,'2025-08-26 02:22:30',1,1),(40,'豚玉お好み焼き','https://www.lettuceclub.net/i/R1/img/dish/1/S20110210036001A_000.png',1,62,NULL,'ソース普通,少し辛い',3,1740.00,'2025-08-26 03:14:21',1,1),(41,'大福','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSzZbjJ421AMvyLkt7YqxWymfFskUq09WYCFA&s',1,55,NULL,NULL,1,150.00,'2025-08-26 03:22:04',1,1),(42,'みたらし団子','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSqaw4qAPcTqWsgKdMFBVq2iNe1JYdpnKrZDg&s',1,57,NULL,'辛め',1,200.00,'2025-08-26 03:22:11',1,1),(43,'おにぎり（鮭）','https://www.justonecookbook.com/wp-content/uploads/2017/09/Onigiri-Rice-Balls-3082.jpg',1,49,NULL,'',8,1200.00,'2025-08-26 22:11:25',1,1),(44,'豚玉お好み焼き','https://www.lettuceclub.net/i/R1/img/dish/1/S20110210036001A_000.png',1,62,NULL,'マヨネーズ追加,普通',1,580.00,'2025-08-26 22:11:46',1,1),(45,'モダン焼き','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTOopbcbjr7ThH5UfXEgsDb30A2yVeNlAol6Q&s',1,64,NULL,'',4,2600.00,'2025-08-26 22:13:13',1,1),(46,'アサヒビール','https://www.asahibeer.co.jp/web-service/common/image_quality.psp.html?CMD=onAspect&DF=0&H=340&PATH=/web-service/common/products/asahibeer/original/beer/20230107_1E083_DB2_001.jpg',1,48,NULL,'',8,2800.00,'2025-09-11 16:03:44',1,1),(47,'海鮮お好み焼き','https://www.yamaki.co.jp/recipe/wp-content/uploads/kn0301.jpg',1,63,NULL,'',3,2040.00,'2025-09-11 16:03:46',1,1),(48,'味噌ラーメン','https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/%E3%82%89%E3%83%BC%E3%82%81%E3%82%93%E5%91%B3%E5%99%8C%EF%BC%88%E5%A4%A7%E5%B3%B6%EF%BC%89.jpg/960px-%E3%82%89%E3%83%BC%E3%82%81%E3%82%93%E5%91%B3%E5%99%8C%EF%BC%88%E5%A4%A7%E5%B3%B6%EF%BC%89.jpg',1,52,NULL,'普通,硬め',1,720.00,'2025-09-11 16:03:57',1,1),(49,'メロンパン','https://d3d7exujemgi7m.cloudfront.net/upload/recipe/2024/02/65d40e35b6355.jpg',1,50,NULL,'',5,600.00,'2025-09-11 16:46:19',1,1),(50,'関西風満喫セット','https://www.nisshin-seifun-welna.com/index/recipe/detail/recipe_file/file/n-269_l.jpg?_size=3',1,NULL,1,'',1,1580.00,'2025-09-11 17:01:33',1,1),(51,'たこ焼き（8個）','https://www.nisshin-seifun-welna.com/index/recipe/detail/recipe_file/file/n-269_l.jpg?_size=3',1,65,NULL,'かつお節,塩,普通',1,450.00,'2025-09-11 17:02:24',1,1),(52,'味噌ラーメン','https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/%E3%82%89%E3%83%BC%E3%82%81%E3%82%93%E5%91%B3%E5%99%8C%EF%BC%88%E5%A4%A7%E5%B3%B6%EF%BC%89.jpg/960px-%E3%82%89%E3%83%BC%E3%82%81%E3%82%93%E5%91%B3%E5%99%8C%EF%BC%88%E5%A4%A7%E5%B3%B6%EF%BC%89.jpg',1,52,NULL,'普通,普通',1,720.00,'2025-09-11 17:03:04',1,1),(53,'豚玉お好み焼き','https://www.lettuceclub.net/i/R1/img/dish/1/S20110210036001A_000.png',1,62,NULL,'ソース少なめ,普通',1,580.00,'2025-09-11 19:40:04',1,1),(54,'ラムネ','https://www.morinaga.co.jp/ramune/assets/img/lineup_regular01@2x.png',1,47,NULL,'',1,180.00,'2025-09-11 19:47:49',1,1),(55,'エビ串カツ','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR3dO4OXoXs_Pelmlu6R732j9hf_F4rgmhJ-w&s',1,58,NULL,'',1,280.00,'2025-09-11 19:49:41',1,1),(56,'豚玉お好み焼き','https://www.lettuceclub.net/i/R1/img/dish/1/S20110210036001A_000.png',1,62,NULL,'ソース普通,普通',1,580.00,'2025-09-11 19:58:28',1,1),(57,'たこ焼き（8個）','https://www.nisshin-seifun-welna.com/index/recipe/detail/recipe_file/file/n-269_l.jpg?_size=3',1,65,NULL,'マヨネーズ,かつお節,普通',1,450.00,'2025-09-13 14:58:15',1,1),(58,'とんこつラーメン','https://zenb.jp/cdn/shop/articles/912a_a62b555f-61a5-4d29-9244-802a87f0dacf_1200x.jpg?v=1738041399',1,51,NULL,'少し辛い,普通,普通,特盛り',1,680.00,'2025-09-13 15:03:59',1,1),(59,'アサヒビール','https://www.asahibeer.co.jp/web-service/common/image_quality.psp.html?CMD=onAspect&DF=0&H=340&PATH=/web-service/common/products/asahibeer/original/beer/20230107_1E083_DB2_001.jpg',1,48,NULL,'',1,350.00,'2025-09-13 15:26:26',1,1),(60,'アサヒビール','https://www.asahibeer.co.jp/web-service/common/image_quality.psp.html?CMD=onAspect&DF=0&H=340&PATH=/web-service/common/products/asahibeer/original/beer/20230107_1E083_DB2_001.jpg',1,48,NULL,'',1,350.00,'2025-09-13 15:29:57',1,1),(61,'アサヒビール','https://www.asahibeer.co.jp/web-service/common/image_quality.psp.html?CMD=onAspect&DF=0&H=340&PATH=/web-service/common/products/asahibeer/original/beer/20230107_1E083_DB2_001.jpg',1,48,NULL,'',1,350.00,'2025-09-14 15:46:40',1,1),(62,'アサヒビール','https://www.asahibeer.co.jp/web-service/common/image_quality.psp.html?CMD=onAspect&DF=0&H=340&PATH=/web-service/common/products/asahibeer/original/beer/20230107_1E083_DB2_001.jpg',1,48,NULL,'',1,350.00,'2025-09-14 16:38:26',1,1),(63,'おにぎり（鮭）','https://www.justonecookbook.com/wp-content/uploads/2017/09/Onigiri-Rice-Balls-3082.jpg',1,49,NULL,'',1,150.00,'2025-09-14 16:38:28',1,1),(64,'明石焼き（10個）','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ16mQuskb3XVDv7BL0Tm6GvlYoBFI1NCjTLg&s',1,66,NULL,'塩',1,520.00,'2025-09-14 16:38:32',1,1),(65,'ラムネ','https://www.morinaga.co.jp/ramune/assets/img/lineup_regular01@2x.png',1,47,NULL,'',1,180.00,'2025-09-15 13:55:32',1,1),(66,'おにぎり（鮭）','https://www.justonecookbook.com/wp-content/uploads/2017/09/Onigiri-Rice-Balls-3082.jpg',1,49,NULL,'',1,150.00,'2025-09-15 13:55:37',1,1),(67,'モダン焼き','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTOopbcbjr7ThH5UfXEgsDb30A2yVeNlAol6Q&s',1,64,NULL,'',1,650.00,'2025-09-15 13:55:39',1,1),(68,'おにぎり（鮭）','https://www.justonecookbook.com/wp-content/uploads/2017/09/Onigiri-Rice-Balls-3082.jpg',1,49,NULL,'',1,150.00,'2025-09-15 15:00:40',1,1),(69,'ラムネ','https://www.morinaga.co.jp/ramune/assets/img/lineup_regular01@2x.png',1,47,NULL,'',1,180.00,'2025-09-15 17:12:29',1,1),(70,'たこ焼き（8個）','https://www.nisshin-seifun-welna.com/index/recipe/detail/recipe_file/file/n-269_l.jpg?_size=3',1,65,NULL,'塩,かつお節,普通',1,450.00,'2025-09-15 17:12:33',1,1),(71,'アサヒビール','https://www.asahibeer.co.jp/web-service/common/image_quality.psp.html?CMD=onAspect&DF=0&H=340&PATH=/web-service/common/products/asahibeer/original/beer/20230107_1E083_DB2_001.jpg',1,48,NULL,'',1,350.00,'2025-09-17 17:45:17',1,1),(72,'メロンパン','https://d3d7exujemgi7m.cloudfront.net/upload/recipe/2024/02/65d40e35b6355.jpg',1,50,NULL,'',1,120.00,'2025-09-17 17:45:18',1,1),(73,'ラムネ','https://www.morinaga.co.jp/ramune/assets/img/lineup_regular01@2x.png',1,47,NULL,'',1,180.00,'2025-09-20 17:10:30',1,1),(74,'おにぎり（鮭）','https://www.justonecookbook.com/wp-content/uploads/2017/09/Onigiri-Rice-Balls-3082.jpg',1,49,NULL,'',1,150.00,'2025-09-20 17:10:32',1,1),(75,'豚玉お好み焼き','https://www.lettuceclub.net/i/R1/img/dish/1/S20110210036001A_000.png',1,62,NULL,'ソース普通,普通',1,580.00,'2025-09-20 17:10:35',1,1),(76,'アサヒビール','https://www.asahibeer.co.jp/web-service/common/image_quality.psp.html?CMD=onAspect&DF=0&H=340&PATH=/web-service/common/products/asahibeer/original/beer/20230107_1E083_DB2_001.jpg',1,48,NULL,'',1,350.00,'2025-09-20 17:24:54',1,1),(77,'豚玉お好み焼き','https://www.lettuceclub.net/i/R1/img/dish/1/S20110210036001A_000.png',1,62,NULL,'ソース普通,普通',1,580.00,'2025-09-20 17:24:58',1,1),(78,'大福','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSzZbjJ421AMvyLkt7YqxWymfFskUq09WYCFA&s',1,55,NULL,'',1,150.00,'2025-09-20 17:25:01',1,1),(79,'大福','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSzZbjJ421AMvyLkt7YqxWymfFskUq09WYCFA&s',1,55,NULL,'',1,150.00,'2025-09-20 17:26:53',1,1),(80,'ラムネ','https://www.morinaga.co.jp/ramune/assets/img/lineup_regular01@2x.png',1,47,NULL,'',1,180.00,'2025-12-16 21:18:23',1,1),(81,'豚玉お好み焼き','https://www.lettuceclub.net/i/R1/img/dish/1/S20110210036001A_000.png',1,62,NULL,'ソース普通,普通',1,580.00,'2025-12-16 21:18:29',1,1),(82,'味噌ラーメン','https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/%E3%82%89%E3%83%BC%E3%82%81%E3%82%93%E5%91%B3%E5%99%8C%EF%BC%88%E5%A4%A7%E5%B3%B6%EF%BC%89.jpg/960px-%E3%82%89%E3%83%BC%E3%82%81%E3%82%93%E5%91%B3%E5%99%8C%EF%BC%88%E5%A4%A7%E5%B3%B6%EF%BC%89.jpg',1,52,NULL,NULL,1,720.00,'2026-04-27 18:56:46',1,1),(83,'味噌汁','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRc3xwXKi7eoxJOdWZcKc_PbokcVtDDrh5mkQ&s',1,67,NULL,NULL,1,120.00,'2026-04-27 18:56:50',1,1),(84,'エビ串カツ','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR3dO4OXoXs_Pelmlu6R732j9hf_F4rgmhJ-w&s',1,58,NULL,NULL,1,280.00,'2026-04-27 18:56:53',1,1),(85,'豚玉お好み焼き','https://www.lettuceclub.net/i/R1/img/dish/1/S20110210036001A_000.png',1,62,NULL,NULL,1,580.00,'2026-04-27 18:56:56',1,1),(86,'たこ焼き（8個）','https://www.nisshin-seifun-welna.com/index/recipe/detail/recipe_file/file/n-269_l.jpg?_size=3',1,65,NULL,'ソース:マヨネーズ,トッピング:かつお節,辛さ:普通',1,450.00,'2026-04-27 19:02:12',1,1),(87,'豚玉お好み焼き','https://www.lettuceclub.net/i/R1/img/dish/1/S20110210036001A_000.png',1,62,NULL,'ソース:ソース少なめ,辛さ:普通',1,580.00,'2026-04-27 19:02:56',1,1),(88,'ラムネ','https://www.morinaga.co.jp/ramune/assets/img/lineup_regular01@2x.png',1,47,NULL,NULL,1,180.00,'2026-04-27 19:03:14',1,1),(89,'たこ焼き（8個）','https://www.nisshin-seifun-welna.com/index/recipe/detail/recipe_file/file/n-269_l.jpg?_size=3',1,65,NULL,'ソース:塩,トッピング:かつお節,辛さ:辛い',1,450.00,'2026-04-27 22:11:06',1,1),(90,'たこ焼き（8個）','https://www.nisshin-seifun-welna.com/index/recipe/detail/recipe_file/file/n-269_l.jpg?_size=3',1,65,NULL,'ソース:マヨネーズ,トッピング:マヨネーズ,辛さ:少し辛い',1,450.00,'2026-04-27 22:11:23',1,1),(91,'明石焼き（10個）','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ16mQuskb3XVDv7BL0Tm6GvlYoBFI1NCjTLg&s',1,66,NULL,'ソース:塩',1,520.00,'2026-04-27 22:11:33',1,1),(92,'おにぎり（鮭）','https://www.justonecookbook.com/wp-content/uploads/2017/09/Onigiri-Rice-Balls-3082.jpg',1,49,NULL,NULL,1,150.00,'2026-04-27 22:31:41',1,1),(93,'メロンパン','https://d3d7exujemgi7m.cloudfront.net/upload/recipe/2024/02/65d40e35b6355.jpg',1,50,NULL,NULL,1,120.00,'2026-04-27 22:31:50',1,1),(94,'ラムネ','https://www.morinaga.co.jp/ramune/assets/img/lineup_regular01@2x.png',1,47,NULL,NULL,1,180.00,'2026-04-27 22:56:49',1,1),(95,'おにぎり（鮭）','https://www.justonecookbook.com/wp-content/uploads/2017/09/Onigiri-Rice-Balls-3082.jpg',1,49,NULL,NULL,1,150.00,'2026-04-27 22:57:28',1,1),(96,'たこ焼き（8個）','https://www.nisshin-seifun-welna.com/index/recipe/detail/recipe_file/file/n-269_l.jpg?_size=3',1,65,NULL,'ソース:塩,トッピング:かつお節,辛さ:普通',1,450.00,'2026-04-27 22:57:36',1,1),(97,'豚玉お好み焼き','https://www.lettuceclub.net/i/R1/img/dish/1/S20110210036001A_000.png',1,62,NULL,'ソース:ソース普通,辛さ:普通',1,580.00,'2026-04-27 22:58:34',1,1),(98,'ラムネ','https://www.morinaga.co.jp/ramune/assets/img/lineup_regular01@2x.png',1,47,NULL,NULL,1,180.00,'2026-04-27 23:01:24',1,1),(99,'アサヒビール','https://www.asahibeer.co.jp/web-service/common/image_quality.psp.html?CMD=onAspect&DF=0&H=340&PATH=/web-service/common/products/asahibeer/original/beer/20230107_1E083_DB2_001.jpg',1,48,NULL,NULL,1,350.00,'2026-04-27 23:01:26',1,1),(100,'おにぎり（鮭）','https://www.justonecookbook.com/wp-content/uploads/2017/09/Onigiri-Rice-Balls-3082.jpg',1,49,NULL,NULL,1,150.00,'2026-04-27 23:01:28',1,1),(101,'メロンパン','https://d3d7exujemgi7m.cloudfront.net/upload/recipe/2024/02/65d40e35b6355.jpg',1,50,NULL,NULL,2,240.00,'2026-04-27 23:01:29',1,1),(102,'カステラ','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRHIwiKakLGAY6hUoZaIS9VMEt1Cl0ylXyD3w&s',1,56,NULL,'甘さ:甘め',1,250.00,'2026-04-28 00:20:11',1,1),(103,'たこ焼き（8個）','https://www.nisshin-seifun-welna.com/index/recipe/detail/recipe_file/file/n-269_l.jpg?_size=3',1,65,NULL,'ソース:マヨネーズ,トッピング:かつお節,辛さ:辛い',1,450.00,'2026-04-28 00:20:15',1,1),(104,'ラムネ','https://www.morinaga.co.jp/ramune/assets/img/lineup_regular01@2x.png',1,47,NULL,NULL,2,360.00,'2026-04-28 17:45:31',1,1),(105,'ラムネ','https://www.morinaga.co.jp/ramune/assets/img/lineup_regular01@2x.png',1,47,NULL,NULL,3,540.00,'2026-04-28 18:34:45',1,1),(106,'アサヒビール','https://www.asahibeer.co.jp/web-service/common/image_quality.psp.html?CMD=onAspect&DF=0&H=340&PATH=/web-service/common/products/asahibeer/original/beer/20230107_1E083_DB2_001.jpg',1,48,NULL,NULL,1,350.00,'2026-04-28 18:34:47',1,1),(107,'たこ焼き（8個）','https://www.nisshin-seifun-welna.com/index/recipe/detail/recipe_file/file/n-269_l.jpg?_size=3',1,65,NULL,'ソース:塩,トッピング:かつお節,辛さ:普通',1,450.00,'2026-05-02 15:45:17',1,1),(108,'明石焼き（10個）','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ16mQuskb3XVDv7BL0Tm6GvlYoBFI1NCjTLg&s',1,66,NULL,'ソース:ポン酢',1,520.00,'2026-05-02 15:45:21',1,1),(109,'ラムネ','https://www.morinaga.co.jp/ramune/assets/img/lineup_regular01@2x.png',1,47,NULL,NULL,1,180.00,'2026-05-02 15:47:09',1,1),(110,'おにぎり（鮭）','https://www.justonecookbook.com/wp-content/uploads/2017/09/Onigiri-Rice-Balls-3082.jpg',1,49,NULL,NULL,4,600.00,'2026-05-02 15:47:11',1,1),(111,'メロンパン','https://d3d7exujemgi7m.cloudfront.net/upload/recipe/2024/02/65d40e35b6355.jpg',1,50,NULL,NULL,1,120.00,'2026-05-02 15:47:13',1,1),(112,'メロンパン','https://d3d7exujemgi7m.cloudfront.net/upload/recipe/2024/02/65d40e35b6355.jpg',1,50,NULL,NULL,5,600.00,'2026-05-02 16:14:45',1,1);
/*!40000 ALTER TABLE `shopping_cart` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主キー',
  `email` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin NOT NULL COMMENT 'メールアドレス（ログイン用）',
  `password` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin NOT NULL COMMENT 'パスワードハッシュ',
  `name` varchar(32) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin DEFAULT NULL COMMENT '氏名',
  `avatar` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'プロフィール画像',
  `email_verified` tinyint(1) DEFAULT '0' COMMENT 'メール確認済み 0:未確認 1:確認済み',
  `last_login_time` datetime DEFAULT NULL COMMENT '最終ログイン日時',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '作成日時',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新日時',
  `version` int NOT NULL DEFAULT '1' COMMENT 'バージョン（楽観ロック）',
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0' COMMENT '削除フラグ 0:未削除 1:削除済み',
  `oauth_provider` varchar(50) COLLATE utf8mb3_bin DEFAULT NULL COMMENT 'サードパーティログイン元',
  `oauth_id` varchar(255) COLLATE utf8mb3_bin DEFAULT NULL COMMENT 'サードパーティユーザーID',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_email` (`email`),
  KEY `idx_is_deleted` (`is_deleted`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_bin COMMENT='ユーザー情報';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user`
--

LOCK TABLES `user` WRITE;
/*!40000 ALTER TABLE `user` DISABLE KEYS */;
INSERT INTO `user` VALUES (1,'2858273620@qq.com','e10adc3949ba59abbe56e057f20f883e','kokomi','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ7QcyZszZfQTHsEx2RXC81-g_vHIGlgRSh3Q&s',0,NULL,'2025-08-16 16:15:28','2025-08-22 23:02:19',1,0,NULL,NULL);
/*!40000 ALTER TABLE `user` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-05 15:10:09
