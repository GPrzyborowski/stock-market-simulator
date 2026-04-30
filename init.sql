CREATE TABLE IF NOT EXISTS wallet (
    wallet_id TEXT PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS stock (
    stock_id SERIAL PRIMARY KEY,
    stock_name TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS ownership (
    wallet_id TEXT,
    stock_id INT,
    quantity INT NOT NULL CHECK (quantity >= 0),
    PRIMARY KEY (wallet_id, stock_id)
);

CREATE TABLE IF NOT EXISTS bank (
    stock_id INT PRIMARY KEY,
    quantity INT NOT NULL CHECK (quantity >= 0)
);

CREATE TABLE IF NOT EXISTS audit_log (
    log_id SERIAL PRIMARY KEY,
    wallet_id TEXT,
    stock_id INT,
    type TEXT CHECK (type IN ('buy', 'sell')),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- seed
INSERT INTO stock (stock_name) VALUES
('AAPL'),
('GOOG'),
('MSFT')
ON CONFLICT DO NOTHING;

INSERT INTO bank (stock_id, quantity)
SELECT s.stock_id, 100
FROM stock s
LEFT JOIN bank b ON b.stock_id = s.stock_id
WHERE b.stock_id IS NULL;