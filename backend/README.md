# Patent Backend

Minimal patent API backend using Express and Sequelize.

Quickstart (Windows):

1. Copy `.env.example` to `.env` and adjust if needed.
2. Install dependencies:

```bash
npm install
```

3. Seed example data (creates admin user and API key):

```bash
npm run seed
```

4. Start server:

```bash
npm start
```

Server will run on `http://localhost:5000` by default. Use the generated API key (printed by the seed script) when calling routes under `/api/v1/patents` with header `x-api-key`.
