# Stock Market Simulation

A simplified stock market simulation REST API built with Node.js, TypeScript, Express, and PostgreSQL.

## Architecture

- **2 app instances** (app1, app2) running behind an nginx load balancer
- **PostgreSQL** as the database
- **Docker Compose** orchestrating all services

If one app instance is killed (for example via `POST /chaos`), nginx automatically routes traffic to the remaining instance - no downtime.

## Requirements

- Docker
- Docker Compose

## Running

**Linux / macOS (x64 & arm64):**
```bash
APP_PORT=8080 docker compose up --build
```

**Windows (PowerShell):**
```powershell
$env:APP_PORT=8080; docker compose up --build
```

**Windows (CMD):**
```cmd
set APP_PORT=8080 && docker compose up --build
```

The application will be available at `http://localhost:8080`.

## Endpoints

### `POST /wallets/{wallet_id}/stocks/{stock_name}`
Buy or sell a single stock. Creates wallet if it doesn't exist.

**Body:**
```json
{ "type": "buy" }
```
or
```json
{ "type": "sell" }
```

**Responses:**
- `200` - operation successful
- `400` - no stock in bank (buy) or no stock in wallet (sell)
- `404` - stock does not exist

---

### `GET /wallets/{wallet_id}`
Returns current state of a wallet.

**Response:**
```json
{
  "id": "my-wallet",
  "stocks": [
    { "name": "AAPL", "quantity": 3 },
    { "name": "GOOG", "quantity": 1 }
  ]
}
```

---

### `GET /wallets/{wallet_id}/stocks/{stock_name}`
Returns quantity of a specific stock in a wallet.

**Response:**
```json
3
```

---

### `GET /stocks`
Returns current state of the bank.

**Response:**
```json
{
  "stocks": [
    { "name": "AAPL", "quantity": 97 },
    { "name": "GOOG", "quantity": 100 }
  ]
}
```

---

### `POST /stocks`
Sets the state of the bank.

**Body:**
```json
{
  "stocks": [
    { "name": "AAPL", "quantity": 100 },
    { "name": "GOOG", "quantity": 50 }
  ]
}
```

**Response:** `200`

---

### `GET /log`
Returns full audit log of all wallet operations in order of occurrence.

**Response:**
```json
{
  "log": [
    { "type": "buy", "wallet_id": "my-wallet", "stock_name": "AAPL" },
    { "type": "sell", "wallet_id": "my-wallet", "stock_name": "AAPL" }
  ]
}
```

---

### `POST /chaos`
Kills the instance that serves this request. Thanks to load balancing, the application remains available.

---

## Assumptions

- Stock price is always 1 (no price fluctuation)
- Wallet balance is not tracked
- The bank is the sole liquidity provider
- Initially there are no wallets and the bank is empty
- Available stocks: `AAPL`, `GOOG`, `RELY`

## Stopping

```bash
docker compose down
```

To also remove the database volume:
```bash
docker compose down -v
```