-- Create and use the database
CREATE DATABASE InventorySalesDB;
USE InventorySalesDB;

-- TABLE 1: Categories
-- Stores product categories
CREATE TABLE Categories (
    CategoryID   INT AUTO_INCREMENT PRIMARY KEY,
    CategoryName VARCHAR(100) NOT NULL,
    Description  VARCHAR(255)
);
INSERT INTO Categories (CategoryName, Description) VALUES
('Electronics',     'Gadgets and electronic devices'),
('Office Supplies', 'Pens, papers, and office tools'),
('Furniture',       'Chairs, tables, and cabinets'),
('Clothing',        'Shirts, pants, and accessories'),
('Food & Beverage', 'Packaged food and drinks'),
('Sports',          'Sports equipment and gear'),
('Toys',            'Childrens toys and games'),
('Books',           'Educational and fiction books'),
('Cleaning',        'Cleaning products and tools'),
('Health',          'Medicine and health products');

-- TABLE 2: Suppliers
-- Stores supplier information
CREATE TABLE Suppliers (
    SupplierID   INT AUTO_INCREMENT PRIMARY KEY,
    SupplierName VARCHAR(100) NOT NULL,
    ContactName  VARCHAR(100),
    Phone        VARCHAR(20),
    Email        VARCHAR(100),
    Address      VARCHAR(255)
);

INSERT INTO Suppliers (SupplierName, ContactName, Phone, Email, Address) VALUES
('TechSource PH',      'Josh Mojica', '09171234567', 'josh@techsource.ph', 'Budiao, Daraga'),
('OfficeWorld Inc.',   'Chris Brown', '09181234567', 'chris@officeworld.ph',  'Anislag, Daraga'),
('FurniturePro Corp.', 'Taylor Swift', '09191234567', 'taylor@furniturepro.ph', 'Malobago, Daraga'),
('FashionHub PH',      'Jessica Soho', '09201234567', 'soho@fashionhub.ph', 'Tagas, Daraga'),
('FoodFirst Supply',   'Regine Velazquez', '09211234567', 'regine@foodfirst.ph', 'Maopi, Daraga'),
('SportZone PH',       'Elon Musk', '09221234567', 'elon@sportzone.ph',  'Namantao, Daraga'),
('ToyLand Supply',     'Justin Bieber', '09231234567', 'bieber@toyland.ph', 'Sipi, Daraga'),
('BookNest PH',        'Bruno Mars', '09241234567', 'mars@booknest.ph', 'Bascaran, Daraga'),
('CleanPro Supply',    'Ivana Alawi',     '09251234567', 'ivana@cleanpro.ph', 'Tabon-tabon, Daraga'),
('HealthPlus PH',      'Robin Padilla',     '09261234567', 'robin@healthplus.ph', 'Sagpon, Daraga');

-- TABLE 3: Products
-- Stores product details / references Categories and Suppliers
CREATE TABLE Products (
    ProductID   INT AUTO_INCREMENT PRIMARY KEY,
    ProductName VARCHAR(150) NOT NULL,
    CategoryID  INT NOT NULL,
    SupplierID  INT NOT NULL,
    UnitPrice   DECIMAL(10,2) NOT NULL,
    StockQty    INT NOT NULL DEFAULT 0,
    ReorderLevel INT NOT NULL DEFAULT 10,
    CONSTRAINT fk_product_category FOREIGN KEY (CategoryID) REFERENCES Categories(CategoryID),
    CONSTRAINT fk_product_supplier FOREIGN KEY (SupplierID) REFERENCES Suppliers(SupplierID)
);
SELECT * FROM vw_productsalesreport;

INSERT INTO Products (ProductName, CategoryID, SupplierID, UnitPrice, StockQty, ReorderLevel) VALUES
('Laptop 14"',          1,  1,  35000.00, 50,  5),
('Ballpen Box (12pcs)', 2,  2,    120.00, 200, 20),
('Office Chair',        3,  3,   4500.00, 30,  5),
('Plain White T-Shirt', 4,  4,    250.00, 150, 15),
('Mineral Water 1L',    5,  5,     18.00, 500, 50),
('Basketball',          6,  6,    850.00, 60,  10),
('Building Blocks Set', 7,  7,    599.00, 80,  10),
('Python Programming',  8,  8,    750.00, 40,  5),
('Floor Mop',           9,  9,    320.00, 100, 15),
('Vitamin C 500mg',     10, 10,   199.00, 120, 20);

-- TABLE 4: Customers
-- Stores customer information
CREATE TABLE Customers (
    CustomerID   INT AUTO_INCREMENT PRIMARY KEY,
    FirstName    VARCHAR(50) NOT NULL,
    LastName     VARCHAR(50) NOT NULL,
    Email        VARCHAR(100),
    Phone        VARCHAR(20),
    Address      VARCHAR(255)
);

INSERT INTO Customers (FirstName, LastName, Email, Phone, Address) VALUES
('Mark',	'Saba',	'mark@email.com', '09301234567', 'Tabaco'),
('Sean',	'Armenta',	'sean@email.com', '09311234567', 'Tabaco'),
('Jeffrey',	'Cruel',	'jeffrey@email.com', '09321234567', 'Tabaco'),
('Josh',	'Rosales',	'josh@email.com', '09331234567', 'Sto. Domingo'),
('Charlz',	'Baroma', 	'charlz@email.com', '09341234567', 'Bacacay'),
('Riggs', 	'Nuyda',  	'riggs@email.com', '09351234567', 'Daraga'),
('Keiron',	'Mirandilla',	'keiron@email.com', '09361234567', 'Daraga'),
('Allen',	'Capitullo',	'allen@email.com', '09371234567', 'Albay'),
('Benedict','Candelaria',	'benidict@email.com',  '09381234567', 'Polangui'),
('Rajvir',	'Singh',	'rajvir@email.com', '09391234567', 'Tabaco');

-- TABLE 5: Orders + OrderItems
-- Orders stores the sale header
-- OrderItems stores each line item per order
-- This follows normalization: one order, many items
CREATE TABLE Orders (
    OrderID    INT AUTO_INCREMENT PRIMARY KEY,
    CustomerID INT NOT NULL,
    OrderDate  DATE NOT NULL,
    Status     ENUM('Pending','Completed','Cancelled') DEFAULT 'Pending',
    CONSTRAINT fk_order_customer FOREIGN KEY (CustomerID) REFERENCES Customers(CustomerID)
);

INSERT INTO Orders (CustomerID, OrderDate, Status) VALUES
(1,  '2026-01-05', 'Completed'),
(2,  '2026-01-10', 'Completed'),
(3,  '2026-01-15', 'Completed'),
(4,  '2026-02-01', 'Completed'),
(5,  '2026-02-14', 'Completed'),
(6,  '2026-03-01', 'Completed'),
(7,  '2026-03-10', 'Pending'),
(8,  '2026-03-20', 'Completed'),
(9,  '2026-04-01', 'Cancelled'),
(10, '2026-04-15', 'Completed');

CREATE TABLE OrderItems (
    OrderItemID INT AUTO_INCREMENT PRIMARY KEY,
    OrderID     INT NOT NULL,
    ProductID   INT NOT NULL,
    Quantity    INT NOT NULL,
    UnitPrice   DECIMAL(10,2) NOT NULL,
    CONSTRAINT fk_item_order   FOREIGN KEY (OrderID)   REFERENCES Orders(OrderID),
    CONSTRAINT fk_item_product FOREIGN KEY (ProductID) REFERENCES Products(ProductID)
);

INSERT INTO OrderItems (OrderID, ProductID, Quantity, UnitPrice) VALUES
(1,  1,  1, 35000.00),
(2,  2,  3,   120.00),
(3,  3,  2,  4500.00),
(4,  4,  5,   250.00),
(5,  5, 10,    18.00),
(6,  6,  2,   850.00),
(7,  7,  1,   599.00),
(8,  8,  4,   750.00),
(9,  9,  2,   320.00),
(10, 10, 3,   199.00);

-- VIEW 1: vw_SalesSummary
-- Report: Total sales per order with customer name
CREATE VIEW vw_SalesSummary AS
SELECT
    o.OrderID,
    CONCAT(c.FirstName, ' ', c.LastName) AS CustomerName,
    o.OrderDate,
    o.Status,
    SUM(oi.Quantity * oi.UnitPrice) AS TotalAmount
FROM Orders o
JOIN Customers c  ON o.CustomerID = c.CustomerID
JOIN OrderItems oi ON o.OrderID   = oi.OrderID
GROUP BY o.OrderID, CustomerName, o.OrderDate, o.Status;

SELECT * FROM vw_SalesSummary;

-- VIEW 2: vw_LowStockProducts
-- Report: Products that are at or below reorder level
CREATE VIEW vw_LowStockProducts AS
SELECT
    p.ProductID,
    p.ProductName,
    c.CategoryName,
    s.SupplierName,
    p.StockQty,
    p.ReorderLevel
FROM Products p
JOIN Categories c ON p.CategoryID = c.CategoryID
JOIN Suppliers  s ON p.SupplierID = s.SupplierID
WHERE p.StockQty <= p.ReorderLevel;

SELECT * FROM vw_LowStockProducts;

-- VIEW 3: vw_ProductSalesReport
-- Report: Total quantity sold and revenue per product
CREATE VIEW vw_ProductSalesReport AS
SELECT
    p.ProductID,
    p.ProductName,
    c.CategoryName,
    SUM(oi.Quantity)               AS TotalQtySold,
    SUM(oi.Quantity * oi.UnitPrice) AS TotalRevenue
FROM OrderItems oi
JOIN Products   p ON oi.ProductID  = p.ProductID
JOIN Categories c ON p.CategoryID  = c.CategoryID
GROUP BY p.ProductID, p.ProductName, c.CategoryName;

SELECT * FROM vw_ProductSalesReport;

-- STORED PROCEDURE: sp_PlaceOrder
-- Places a new order for a customer.
-- Inserts into Orders and OrderItems,
-- then deducts stock from Products.
DELIMITER $$

CREATE PROCEDURE sp_PlaceOrder(
    IN p_CustomerID INT,
    IN p_ProductID  INT,
    IN p_Quantity   INT
)
BEGIN
    DECLARE v_Stock    INT;
    DECLARE v_Price    DECIMAL(10,2);
    DECLARE v_OrderID  INT;

    -- Get current stock and price
    SELECT StockQty, UnitPrice
    INTO v_Stock, v_Price
    FROM Products
    WHERE ProductID = p_ProductID;

    -- Check if stock is enough
    IF v_Stock < p_Quantity THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Insufficient stock for this product.';
    ELSE
        -- Create the order header
        INSERT INTO Orders (CustomerID, OrderDate, Status)
        VALUES (p_CustomerID, CURDATE(), 'Completed');

        SET v_OrderID = LAST_INSERT_ID();

        -- Insert the order line item
        INSERT INTO OrderItems (OrderID, ProductID, Quantity, UnitPrice)
        VALUES (v_OrderID, p_ProductID, p_Quantity, v_Price);

        -- Deduct stock
        UPDATE Products
        SET StockQty = StockQty - p_Quantity
        WHERE ProductID = p_ProductID;

        SELECT v_OrderID AS NewOrderID, 'Order placed successfully.' AS Message;
    END IF;
END $$

DELIMITER ;
-- STORED FUNCTION: fn_GetTotalOrderAmount
-- Returns the total amount of a specific order.

DELIMITER $$

CREATE FUNCTION fn_GetTotalOrderAmount(p_OrderID INT)
RETURNS DECIMAL(10,2)
DETERMINISTIC
BEGIN
    DECLARE v_Total DECIMAL(10,2);

    SELECT SUM(Quantity * UnitPrice)
    INTO v_Total
    FROM OrderItems
    WHERE OrderID = p_OrderID;

    RETURN IFNULL(v_Total, 0.00);
END $$

DELIMITER ;

SELECT fn_GetTotalOrderAmount(1) AS OrderTotal;
SELECT OrderID, fn_GetTotalOrderAmount(OrderID) AS Total FROM Orders;

###################

#ACTIVITY 3. TRIGGERS
DROP PROCEDURE IF EXISTS sp_PlaceOrder;

DELIMITER $$

CREATE PROCEDURE sp_PlaceOrder(
    IN p_CustomerID INT,
    IN p_ProductID  INT,
    IN p_Quantity   INT
)
BEGIN
    DECLARE v_Stock    INT;
    DECLARE v_Price    DECIMAL(10,2);
    DECLARE v_OrderID  INT;

    SELECT StockQty, UnitPrice
    INTO v_Stock, v_Price
    FROM Products
    WHERE ProductID = p_ProductID;

    IF v_Stock < p_Quantity THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Insufficient stock for this product.';
    ELSE
        INSERT INTO Orders (CustomerID, OrderDate, Status)
        VALUES (p_CustomerID, CURDATE(), 'Completed');

        SET v_OrderID = LAST_INSERT_ID();

        INSERT INTO OrderItems (OrderID, ProductID, Quantity, UnitPrice)
        VALUES (v_OrderID, p_ProductID, p_Quantity, v_Price);

        SELECT v_OrderID AS NewOrderID, 'Order placed successfully.' AS Message;
    END IF;
END $$

DELIMITER ;

-- AUDIT LOG TABLE
-- This table records every INSERT, UPDATE,
-- and DELETE action that happens on the
-- OrderItems table. Each trigger writes a
-- row here so you have a full history of
-- changes made to orders.
CREATE TABLE AuditLog (
    LogID       INT AUTO_INCREMENT PRIMARY KEY,
    Action      VARCHAR(10) NOT NULL,
    TableName   VARCHAR(50) NOT NULL,
    RecordID    INT NOT NULL,
    ChangedBy   VARCHAR(100) DEFAULT (USER()),
    ChangeDate  DATETIME DEFAULT CURRENT_TIMESTAMP,
    Notes       VARCHAR(255)
);

-- TRIGGER 1: trg_AfterInsertOrderItem
-- Event:  INSERT on OrderItems
-- Timing: AFTER
--
-- PURPOSE:
-- Every time a new order item is inserted,
-- this trigger automatically deducts the
-- ordered quantity from the Products stock.
-- It also writes a record to AuditLog so
-- I know exactly when a product's stock
-- was reduced and by how much.
--
-- This removes the need to manually update
-- stock every time a sale is recorded.
-- ============================================
DELIMITER $$

CREATE TRIGGER trg_AfterInsertOrderItem
AFTER INSERT ON OrderItems
FOR EACH ROW
BEGIN
    -- Deduct stock from Products
    UPDATE Products
    SET StockQty = StockQty - NEW.Quantity
    WHERE ProductID = NEW.ProductID;

    -- Log the insert action
    INSERT INTO AuditLog (Action, TableName, RecordID, Notes)
    VALUES (
        'INSERT',
        'OrderItems',
        NEW.OrderItemID,
        CONCAT('ProductID ', NEW.ProductID, ' stock reduced by ', NEW.Quantity, ' units.')
    );
END $$

DELIMITER ;

-- ============================================
-- TRIGGER 2: trg_AfterUpdateOrderItem
-- Event:  UPDATE on OrderItems
-- Timing: AFTER
--
-- PURPOSE:
-- When an order item's quantity is edited,
-- the stock level needs to reflect the change.
-- This trigger calculates the difference
-- between the old quantity and the new quantity,
-- then adjusts the stock accordingly.
--
-- Example: If I change an order from 2 units
-- to 5 units, the trigger deducts 3 more units
-- from stock. If you reduce from 5 to 2, it
-- adds 3 units back to stock.
--
-- It also logs the update so you have a record
-- of what changed, who changed it, and when.
-- ============================================
DELIMITER $$

CREATE TRIGGER trg_AfterUpdateOrderItem
AFTER UPDATE ON OrderItems
FOR EACH ROW
BEGIN
    -- Adjust stock based on the difference
    UPDATE Products
    SET StockQty = StockQty - (NEW.Quantity - OLD.Quantity)
    WHERE ProductID = NEW.ProductID;

    -- Log the update action
    INSERT INTO AuditLog (Action, TableName, RecordID, Notes)
    VALUES (
        'UPDATE',
        'OrderItems',
        NEW.OrderItemID,
        CONCAT(
            'ProductID ', NEW.ProductID,
            ' quantity changed from ', OLD.Quantity,
            ' to ', NEW.Quantity, '.'
        )
    );
END $$

DELIMITER ;

- ============================================
-- TRIGGER 3: trg_AfterDeleteOrderItem
-- Event:  DELETE on OrderItems
-- Timing: AFTER
--
-- PURPOSE:
-- When an order item is deleted, the stock
-- that was previously deducted must be returned
-- to the Products table. Without this trigger,
-- deleting an order item would leave the stock
-- permanently reduced even though the sale
-- no longer exists.
--
-- This trigger restores the stock and writes
-- a log entry so you have a record of the
-- cancellation or deletion.
-- ============================================
DELIMITER $$

CREATE TRIGGER trg_AfterDeleteOrderItem
AFTER DELETE ON OrderItems
FOR EACH ROW
BEGIN
    -- Restore stock back to Products
    UPDATE Products
    SET StockQty = StockQty + OLD.Quantity
    WHERE ProductID = OLD.ProductID;

    -- Log the delete action
    INSERT INTO AuditLog (Action, TableName, RecordID, Notes)
    VALUES (
        'DELETE',
        'OrderItems',
        OLD.OrderItemID,
        CONCAT(
            'ProductID ', OLD.ProductID,
            ' stock restored by ', OLD.Quantity, ' units.'
        )
    );
END $$

DELIMITER ;auditlogcategoriescustomers

## DEMONSTRATION 

SELECT * FROM OrderItems ORDER BY OrderItemID DESC LIMIT 1;

DELETE FROM OrderItems WHERE OrderItemID = 13;
DELETE FROM Orders WHERE OrderID = 13;
DELETE FROM AuditLog;
UPDATE Products SET StockQty = 50 WHERE ProductID = 1;
######################
SELECT ProductID, ProductName, StockQty FROM Products WHERE ProductID = 1; #

SELECT * FROM AuditLog; #

INSERT INTO Orders (CustomerID, OrderDate, Status) 
VALUES (1, CURDATE(), 'Completed');

INSERT INTO OrderItems (OrderID, ProductID, Quantity, UnitPrice)
VALUES (LAST_INSERT_ID(), 1, 3, 35000.00); #

SELECT ProductID, ProductName, StockQty FROM Products WHERE ProductID = 1; #

SELECT * FROM AuditLog; #

SELECT * FROM OrderItems ORDER BY OrderItemID DESC LIMIT 1; #

#########################
UPDATE OrderItems SET Quantity = 5 WHERE OrderItemID = 15; #

SELECT ProductID, ProductName, StockQty FROM Products WHERE ProductID = 1; #

SELECT * FROM AuditLog; #

###########################
DELETE FROM OrderItems WHERE OrderItemID = 15; #

SELECT ProductID, ProductName, StockQty FROM Products WHERE ProductID = 1; #

SELECT * FROM AuditLog; #




