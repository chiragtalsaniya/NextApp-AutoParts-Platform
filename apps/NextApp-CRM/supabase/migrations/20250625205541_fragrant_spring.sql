-- Item Status Table for Store-wise Part Status Tracking
-- This table tracks the status of each part in each store

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
    FOREIGN KEY (Branch_Code) REFERENCES stores(Branch_Code) ON DELETE CASCADE,
    FOREIGN KEY (Part_No) REFERENCES parts(Part_Number) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_item_status_branch ON item_status(Branch_Code);
CREATE INDEX idx_item_status_part ON item_status(Part_No);
CREATE INDEX idx_item_status_rack ON item_status(Part_Rack);
CREATE INDEX idx_item_status_last_sale ON item_status(LastSale);
CREATE INDEX idx_item_status_last_purchase ON item_status(LastPurchase);

-- Insert sample data for testing
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