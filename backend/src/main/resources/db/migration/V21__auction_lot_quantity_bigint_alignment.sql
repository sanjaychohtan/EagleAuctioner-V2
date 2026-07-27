-- Align auction_lots.quantity from NUMERIC(18,4) to BIGINT (scaled x10000)

ALTER TABLE auction_lots
ALTER COLUMN quantity
TYPE BIGINT
USING ROUND(quantity * 10000);

ALTER TABLE auction_lots_aud
ALTER COLUMN quantity
TYPE BIGINT
USING ROUND(quantity * 10000);-- Align auction_lots.quantity from NUMERIC(18,4) to BIGINT (scaled x10000)

ALTER TABLE auction_lots
ALTER COLUMN quantity
TYPE BIGINT
USING ROUND(quantity * 10000);

ALTER TABLE auction_lots_aud
ALTER COLUMN quantity
TYPE BIGINT
USING ROUND(quantity * 10000);
