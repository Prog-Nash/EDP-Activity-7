-- Fix stock inconsistency due to initial inserts not triggering stock deduction
-- This script adjusts the stock levels to account for existing orders

UPDATE Products
SET StockQty = StockQty - (
    SELECT COALESCE(SUM(oi.Quantity), 0)
    FROM OrderItems oi
    WHERE oi.ProductID = Products.ProductID
)
WHERE ProductID IN (SELECT DISTINCT ProductID FROM OrderItems);

-- Verify the updates
SELECT p.ProductID, p.ProductName, p.StockQty, COALESCE(SUM(oi.Quantity), 0) as SoldQty
FROM Products p
LEFT JOIN OrderItems oi ON p.ProductID = oi.ProductID
GROUP BY p.ProductID, p.ProductName, p.StockQty;