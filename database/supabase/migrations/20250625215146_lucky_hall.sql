-- NextApp CRM Database Setup Script
-- Run this script on your MySQL server for first-time database setup
-- 
-- Prerequisites:
-- 1. MySQL 8.0 or higher
-- 2. A MySQL user with CREATE, INSERT, UPDATE, DELETE, INDEX privileges
-- 
-- Usage:
-- mysql -u your_username -p < database-setup.sql
-- 
-- Or connect to MySQL and run:
-- source database-setup.sql

-- Create database
CREATE DATABASE IF NOT EXISTS nextapp_crm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE nextapp_crm;

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    logo_url TEXT,
    created_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_companies_name (name),
    INDEX idx_companies_created_by (created_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Stores/Branches table
CREATE TABLE IF NOT EXISTS stores (
    Branch_Code VARCHAR(15) PRIMARY KEY,
    Branch_Name VARCHAR(255),
    Company_Name VARCHAR(255),
    Branch_Address TEXT,
    Branch_Phone VARCHAR(50),
    Branch_Email VARCHAR(255),
    Branch_Manager VARCHAR(255),
    Branch_URL VARCHAR(255),
    Branch_Manager_Mobile VARCHAR(50),
    store_image TEXT,
    company_id VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_stores_company (company_id),
    INDEX idx_stores_manager (Branch_Manager),
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('super_admin', 'admin', 'manager', 'storeman', 'salesman', 'retailer') NOT NULL,
    company_id VARCHAR(50),
    store_id VARCHAR(15),
    region_id VARCHAR(50),
    retailer_id INT,
    profile_image TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_email (email),
    INDEX idx_users_role (role),
    INDEX idx_users_company (company_id),
    INDEX idx_users_store (store_id),
    INDEX idx_users_active (is_active),
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL,
    FOREIGN KEY (store_id) REFERENCES stores(Branch_Code) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Retailers table
CREATE TABLE IF NOT EXISTS retailers (
    Retailer_Id INT AUTO_INCREMENT PRIMARY KEY,
    RetailerCRMId VARCHAR(25),
    Retailer_Name VARCHAR(255),
    RetailerImage TEXT,
    Retailer_Address TEXT,
    Retailer_Mobile VARCHAR(50),
    Retailer_TFAT_Id VARCHAR(50),
    Retailer_Status TINYINT DEFAULT 1,
    Area_Name VARCHAR(255),
    Contact_Person VARCHAR(255),
    Pincode VARCHAR(20),
    Mobile_Order VARCHAR(50),
    Mobile_Account VARCHAR(50),
    Owner_Mobile VARCHAR(50),
    Area_Id INT,
    GST_No VARCHAR(50),
    Credit_Limit DECIMAL(15,2) DEFAULT 0,
    Type_Id INT,
    Confirm TINYINT DEFAULT 0,
    Retailer_Tour_Id INT,
    Retailer_Email VARCHAR(255),
    latitude DOUBLE,
    logitude DOUBLE,
    Last_Sync BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_retailers_status (Retailer_Status),
    INDEX idx_retailers_area (Area_Id),
    INDEX idx_retailers_email (Retailer_Email),
    INDEX idx_retailers_confirm (Confirm),
    INDEX idx_retailers_crm_id (RetailerCRMId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Parts table
CREATE TABLE IF NOT EXISTS parts (
    Part_Number VARCHAR(100) PRIMARY KEY,
    Part_Name VARCHAR(255),
    Part_Price INT DEFAULT 0 COMMENT 'Price in cents',
    Part_Discount VARCHAR(20),
    Part_Image TEXT,
    Part_MinQty INT DEFAULT 0,
    Part_BasicDisc INT DEFAULT 0,
    Part_SchemeDisc INT DEFAULT 0,
    Part_AdditionalDisc INT DEFAULT 0,
    Part_Application TEXT,
    GuruPoint INT DEFAULT 0,
    ChampionPoint INT DEFAULT 0,
    Alternate_PartNumber TEXT,
    T1 INT DEFAULT 0,
    T2 INT DEFAULT 0,
    T3 INT DEFAULT 0,
    T4 INT DEFAULT 0,
    T5 INT DEFAULT 0,
    Is_Order_Pad TINYINT DEFAULT 1,
    Item_Status VARCHAR(50) DEFAULT 'Active',
    Order_Pad_Category INT DEFAULT 1,
    Previous_PartNumber VARCHAR(100),
    Focus_Group VARCHAR(100),
    Part_Catagory VARCHAR(100),
    Last_Sync BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_parts_status (Item_Status),
    INDEX idx_parts_category (Part_Catagory),
    INDEX idx_parts_focus_group (Focus_Group),
    INDEX idx_parts_name (Part_Name),
    INDEX idx_parts_order_pad (Is_Order_Pad)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Order Master table
CREATE TABLE IF NOT EXISTS order_master (
    Order_Id INT AUTO_INCREMENT PRIMARY KEY,
    CRMOrderId VARCHAR(25),
    Retailer_Id INT,
    Transport_Id INT,
    TransportBy VARCHAR(50),
    Place_By VARCHAR(50),
    Place_Date BIGINT,
    Confirm_By VARCHAR(50),
    Confirm_Date BIGINT,
    Pick_By VARCHAR(50),
    Pick_Date BIGINT,
    Pack_By VARCHAR(50),
    Checked_By VARCHAR(50),
    Pack_Date BIGINT,
    Delivered_By VARCHAR(50),
    Delivered_Date BIGINT,
    Order_Status VARCHAR(50) DEFAULT 'New',
    Branch VARCHAR(15),
    DispatchId INT,
    Remark TEXT,
    PO_Number VARCHAR(50),
    PO_Date BIGINT,
    Urgent_Status BOOLEAN DEFAULT FALSE,
    Longitude DOUBLE,
    IsSync BOOLEAN DEFAULT FALSE,
    Latitude DOUBLE,
    Last_Sync BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_orders_status (Order_Status),
    INDEX idx_orders_retailer (Retailer_Id),
    INDEX idx_orders_branch (Branch),
    INDEX idx_orders_date (Place_Date),
    INDEX idx_orders_crm_id (CRMOrderId),
    INDEX idx_orders_urgent (Urgent_Status),
    FOREIGN KEY (Retailer_Id) REFERENCES retailers(Retailer_Id) ON DELETE SET NULL,
    FOREIGN KEY (Branch) REFERENCES stores(Branch_Code) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Order Items table
CREATE TABLE IF NOT EXISTS order_items (
    Order_Item_Id INT AUTO_INCREMENT PRIMARY KEY,
    Order_Id INT,
    Order_Srl INT,
    Part_Admin VARCHAR(100),
    Part_Salesman VARCHAR(100),
    Order_Qty INT DEFAULT 0,
    Dispatch_Qty INT DEFAULT 0,
    Pick_Date BIGINT,
    Pick_By VARCHAR(100),
    OrderItemStatus VARCHAR(25),
    PlaceDate BIGINT,
    RetailerId INT,
    ItemAmount INT DEFAULT 0 COMMENT 'Amount in cents',
    SchemeDisc INT DEFAULT 0,
    AdditionalDisc INT DEFAULT 0,
    Discount INT DEFAULT 0,
    MRP INT DEFAULT 0 COMMENT 'MRP in cents',
    FirstOrderDate BIGINT,
    Urgent_Status BOOLEAN DEFAULT FALSE,
    Last_Sync BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_order_items_order (Order_Id),
    INDEX idx_order_items_part (Part_Admin),
    INDEX idx_order_items_retailer (RetailerId),
    INDEX idx_order_items_status (OrderItemStatus),
    FOREIGN KEY (Order_Id) REFERENCES order_master(Order_Id) ON DELETE CASCADE,
    FOREIGN KEY (Part_Admin) REFERENCES parts(Part_Number) ON DELETE SET NULL,
    FOREIGN KEY (RetailerId) REFERENCES retailers(Retailer_Id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Item Status Table for Store-wise Part Status Tracking
CREATE TABLE IF NOT EXISTS item_status (
    Branch_Code VARCHAR(10) NOT NULL,
    Part_No VARCHAR(50) NOT NULL,
    Part_Branch VARCHAR(50) NOT NULL PRIMARY KEY,
    Part_A VARCHAR(10),
    Part_B VARCHAR(10),
    Part_C VARCHAR(10),
    Part_Max VARCHAR(10),
    Part_Rack VARCHAR(20),
    LastSale DECIMAL(20,0),
    LastPurchase DECIMAL(20,0),
    Narr VARCHAR(50),
    Last_Sync DECIMAL(20,0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_item_status_branch (Branch_Code),
    INDEX idx_item_status_part (Part_No),
    INDEX idx_item_status_rack (Part_Rack),
    INDEX idx_item_status_last_sale (LastSale),
    INDEX idx_item_status_last_purchase (LastPurchase),
    FOREIGN KEY (Branch_Code) REFERENCES stores(Branch_Code) ON DELETE CASCADE,
    FOREIGN KEY (Part_No) REFERENCES parts(Part_Number) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- SUPPORTING TABLES
-- ============================================================================

-- Regions table
CREATE TABLE IF NOT EXISTS regions (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    store_id VARCHAR(15),
    created_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_regions_store (store_id),
    INDEX idx_regions_created_by (created_by),
    FOREIGN KEY (store_id) REFERENCES stores(Branch_Code) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Transport table
CREATE TABLE IF NOT EXISTS transport (
    id INT AUTO_INCREMENT PRIMARY KEY,
    store_id VARCHAR(15),
    type VARCHAR(100),
    provider VARCHAR(255),
    contact_number VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_transport_store (store_id),
    INDEX idx_transport_type (type),
    FOREIGN KEY (store_id) REFERENCES stores(Branch_Code) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- API Keys table for mobile app authentication
CREATE TABLE IF NOT EXISTS api_keys (
    id INT AUTO_INCREMENT PRIMARY KEY,
    key_name VARCHAR(255) NOT NULL,
    api_key VARCHAR(255) UNIQUE NOT NULL,
    user_id VARCHAR(50),
    permissions JSON,
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_api_keys_user (user_id),
    INDEX idx_api_keys_active (is_active),
    INDEX idx_api_keys_key (api_key),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Audit log table
CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50),
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100),
    record_id VARCHAR(100),
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_audit_logs_user (user_id),
    INDEX idx_audit_logs_action (action),
    INDEX idx_audit_logs_date (created_at),
    INDEX idx_audit_logs_table (table_name),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- SAMPLE DATA INSERTION
-- ============================================================================

-- Insert sample companies
INSERT IGNORE INTO companies (id, name, address, contact_email, contact_phone, created_by) VALUES 
('1', 'AutoParts Plus', '123 Main St, New York, NY 10001', 'info@autopartsplus.com', '+1 (555) 123-4567', '1'),
('2', 'Premier Auto Supply', '456 Oak Ave, Los Angeles, CA 90210', 'contact@premierautosupply.com', '+1 (555) 987-6543', '1'),
('3', 'Metro Parts Distribution', '789 Elm St, Chicago, IL 60601', 'sales@metroparts.com', '+1 (555) 456-7890', '1');

-- Insert sample stores
INSERT IGNORE INTO stores (Branch_Code, Branch_Name, Company_Name, Branch_Address, company_id) VALUES 
('NYC001', 'Manhattan Central Store', 'AutoParts Plus', '123 Broadway, New York, NY 10001', '1'),
('NYC002', 'Brooklyn East Store', 'AutoParts Plus', '456 Atlantic Ave, Brooklyn, NY 11217', '1'),
('LA001', 'Hollywood Store', 'Premier Auto Supply', '789 Sunset Blvd, Los Angeles, CA 90028', '2'),
('CHI001', 'Downtown Chicago Store', 'Metro Parts Distribution', '321 Michigan Ave, Chicago, IL 60601', '3');

-- Insert sample retailers
INSERT IGNORE INTO retailers (Retailer_Id, Retailer_Name, Contact_Person, Retailer_Email, Credit_Limit, Retailer_Status, Confirm) VALUES 
(1, 'Downtown Auto Parts', 'Michael Johnson', 'michael@downtownauto.com', 50000.00, 1, 1),
(2, 'Quick Fix Auto', 'Sarah Williams', 'sarah@quickfixauto.com', 75000.00, 1, 1),
(3, 'Sunset Auto Supply', 'David Chen', 'david@sunsetauto.com', 100000.00, 1, 1),
(4, 'Brooklyn Parts Hub', 'Lisa Rodriguez', 'lisa@brooklynparts.com', 25000.00, 1, 0);

-- Insert default users (password for all: 'password')
-- Password hash: $2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi
INSERT IGNORE INTO users (id, name, email, password_hash, role, company_id, store_id, retailer_id) VALUES 
('1', 'System Administrator', 'super@nextapp.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'super_admin', NULL, NULL, NULL),
('2', 'Jane Admin', 'admin@company1.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', '1', NULL, NULL),
('3', 'Bob Manager', 'manager@store1.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'manager', '1', 'NYC001', NULL),
('4', 'Alice Storeman', 'alice@store1.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'storeman', '1', 'NYC001', NULL),
('5', 'Charlie Sales', 'charlie@company1.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'salesman', '1', 'NYC001', NULL),
('6', 'Michael Johnson', 'retailer@downtownauto.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'retailer', NULL, NULL, 1);

-- Insert sample parts
INSERT IGNORE INTO parts (Part_Number, Part_Name, Part_Price, Part_MinQty, Part_BasicDisc, Part_SchemeDisc, Part_AdditionalDisc, Part_Application, Focus_Group, Part_Catagory, Item_Status) VALUES 
('SP-001-NGK', 'NGK Spark Plug - Standard', 1299, 10, 5, 3, 2, 'Honda Civic, Toyota Corolla, Nissan Sentra', 'Engine Components', 'Ignition System', 'Active'),
('BP-002-BREMBO', 'Brembo Brake Pads - Front Set', 4599, 5, 8, 5, 3, 'BMW 3 Series, Mercedes C-Class, Audi A4', 'Brake System', 'Brake Pads', 'Active'),
('OF-003-MANN', 'Mann Oil Filter - Premium', 899, 20, 3, 2, 1, 'Universal - Most European Cars', 'Engine Components', 'Filters', 'Active'),
('AF-004-K&N', 'K&N Air Filter - Performance', 2499, 8, 6, 4, 2, 'Ford F-150, Chevrolet Silverado, Ram 1500', 'Engine Components', 'Filters', 'Active'),
('BP-005-WAGNER', 'Wagner Brake Pads - Ceramic', 3299, 6, 7, 4, 3, 'Toyota Camry, Honda Accord, Nissan Altima', 'Brake System', 'Brake Pads', 'Active');

-- Insert sample item status
INSERT IGNORE INTO item_status (Branch_Code, Part_No, Part_Branch, Part_A, Part_B, Part_C, Part_Max, Part_Rack, LastSale, LastPurchase, Narr, Last_Sync) VALUES 
('NYC001', 'SP-001-NGK', 'NYC001-SP-001-NGK', '50', '30', '20', '100', 'A-01-001', 1704067200000, 1703980800000, 'Fast moving item', 1704067200000),
('NYC001', 'BP-002-BREMBO', 'NYC001-BP-002-BREMBO', '25', '15', '10', '50', 'B-02-003', 1704153600000, 1704067200000, 'Premium brake pads', 1704153600000),
('NYC001', 'OF-003-MANN', 'NYC001-OF-003-MANN', '100', '80', '60', '200', 'C-01-005', 1704240000000, 1704153600000, 'Regular stock', 1704240000000),
('NYC002', 'SP-001-NGK', 'NYC002-SP-001-NGK', '30', '20', '15', '80', 'A-01-002', 1704326400000, 1704240000000, 'Medium moving', 1704326400000),
('NYC002', 'BP-002-BREMBO', 'NYC002-BP-002-BREMBO', '20', '12', '8', '40', 'B-01-001', 1704412800000, 1704326400000, 'Low stock alert', 1704412800000),
('LA001', 'SP-001-NGK', 'LA001-SP-001-NGK', '40', '25', '18', '90', 'A-02-001', 1704499200000, 1704412800000, 'Good stock', 1704499200000),
('LA001', 'OF-003-MANN', 'LA001-OF-003-MANN', '80', '60', '45', '150', 'C-02-003', 1704585600000, 1704499200000, 'Adequate stock', 1704585600000),
('CHI001', 'SP-001-NGK', 'CHI001-SP-001-NGK', '35', '22', '16', '75', 'A-03-001', 1704672000000, 1704585600000, 'Regular item', 1704672000000),
('CHI001', 'BP-002-BREMBO', 'CHI001-BP-002-BREMBO', '18', '10', '6', '35', 'B-03-002', 1704758400000, 1704672000000, 'Needs reorder', 1704758400000);

-- Insert sample regions
INSERT IGNORE INTO regions (id, name, store_id, created_by) VALUES 
('NYC-REGION-1', 'Manhattan Region', 'NYC001', '2'),
('NYC-REGION-2', 'Brooklyn Region', 'NYC002', '2'),
('LA-REGION-1', 'Hollywood Region', 'LA001', '2'),
('CHI-REGION-1', 'Downtown Chicago Region', 'CHI001', '2');

-- Insert sample transport providers
INSERT IGNORE INTO transport (store_id, type, provider, contact_number) VALUES 
('NYC001', 'Local Delivery', 'NYC Express Delivery', '+1 (555) 111-2222'),
('NYC001', 'Long Distance', 'FedEx', '+1 (800) 463-3339'),
('NYC002', 'Local Delivery', 'Brooklyn Fast Transport', '+1 (555) 333-4444'),
('LA001', 'Local Delivery', 'LA Quick Delivery', '+1 (555) 555-6666'),
('CHI001', 'Local Delivery', 'Chicago Express', '+1 (555) 777-8888');

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Display setup summary
SELECT 'Database Setup Complete!' as Status;

SELECT 
    'Companies' as Table_Name, 
    COUNT(*) as Record_Count 
FROM companies
UNION ALL
SELECT 'Stores', COUNT(*) FROM stores
UNION ALL
SELECT 'Users', COUNT(*) FROM users
UNION ALL
SELECT 'Retailers', COUNT(*) FROM retailers
UNION ALL
SELECT 'Parts', COUNT(*) FROM parts
UNION ALL
SELECT 'Item Status', COUNT(*) FROM item_status
UNION ALL
SELECT 'Regions', COUNT(*) FROM regions
UNION ALL
SELECT 'Transport', COUNT(*) FROM transport;

-- Display default login credentials
SELECT 
    'Default Login Credentials' as Info,
    '' as Email,
    '' as Password,
    '' as Role
UNION ALL
SELECT '', 'super@nextapp.com', 'password', 'Super Admin'
UNION ALL
SELECT '', 'admin@company1.com', 'password', 'Admin'
UNION ALL
SELECT '', 'manager@store1.com', 'password', 'Manager'
UNION ALL
SELECT '', 'alice@store1.com', 'password', 'Storeman'
UNION ALL
SELECT '', 'charlie@company1.com', 'password', 'Salesman'
UNION ALL
SELECT '', 'retailer@downtownauto.com', 'password', 'Retailer';

-- ============================================================================
-- NOTES
-- ============================================================================

/*
SETUP COMPLETE!

Your NextApp CRM database has been successfully created with:

✅ All required tables with proper relationships
✅ Optimized indexes for performance
✅ Sample data for testing
✅ Default user accounts with different roles

DEFAULT LOGIN CREDENTIALS:
- Super Admin: super@nextapp.com / password
- Admin: admin@company1.com / password  
- Manager: manager@store1.com / password
- Storeman: alice@store1.com / password
- Salesman: charlie@company1.com / password
- Retailer: retailer@downtownauto.com / password

NEXT STEPS:
1. Update your .env file with the correct database credentials
2. Start your backend server: npm run server
3. Start your frontend: npm run dev
4. Login with any of the default credentials above
5. Change default passwords in production!

SECURITY NOTES:
- All default passwords are 'password' - CHANGE THESE IN PRODUCTION!
- The database includes proper foreign key constraints
- Row-level security should be implemented at the application level
- Regular backups are recommended

For support: Check the README.md file for detailed documentation
*/