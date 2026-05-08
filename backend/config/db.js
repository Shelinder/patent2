require("dotenv").config();
const mysql = require("mysql2/promise");

const required = ["DB_NAME", "DB_USER", "DB_PASS"];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`❌ Missing env var: ${key}`);
  }
}

const dbHosts = [
  process.env.DB_HOST,
  process.env.DB_HOST_2,
  process.env.DB_HOST_3,
  process.env.DB_HOST_4,
].filter(Boolean);

if (!dbHosts.length) {
  throw new Error("❌ Missing DB_HOST. Add DB_HOST, DB_HOST_2, DB_HOST_3 in .env");
}

const dbPort = Number(process.env.DB_PORT) || 3307;

let activePool = null;
let currentHostIndex = 0;
let reconnecting = false;

const createMysqlPool = (host) => {
  return mysql.createPool({
    host,
    port: dbPort,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,

    waitForConnections: true,
    connectionLimit: Number(process.env.DB_POOL_MAX) || 10,
    queueLimit: 0,

    connectTimeout: Number(process.env.DB_CONNECT_TIMEOUT_MS) || 5000,

    // Important for JSON columns and date handling
    dateStrings: false,
    namedPlaceholders: true,

    // Helps keep TCP connections alive
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
  });
};

const testPoolConnection = async (pool) => {
  const connection = await pool.getConnection();

  try {
    await connection.ping();
  } finally {
    connection.release();
  }
};

const closeActivePool = async () => {
  if (!activePool) return;

  try {
    await activePool.end();
  } catch (error) {
    console.warn("⚠️ Error while closing old MySQL pool:", error.message);
  }
};

const connectUsingHostAtIndex = async (index) => {
  const host = dbHosts[index];

  console.log(`🔄 Trying MySQL DB_HOST_${index + 1}: ${host}:${dbPort}`);

  const nextPool = createMysqlPool(host);

  try {
    await testPoolConnection(nextPool);
  } catch (error) {
    try {
      await nextPool.end();
    } catch (_) {}

    throw error;
  }

  await closeActivePool();

  activePool = nextPool;
  currentHostIndex = index;

  console.log(`✅ MySQL Connected: ${host}:${dbPort}`);
  console.log(`✅ Database: ${process.env.DB_NAME}`);

  return activePool;
};

const connectDatabase = async () => {
  let lastError = null;

  for (let i = 0; i < dbHosts.length; i++) {
    try {
      return await connectUsingHostAtIndex(i);
    } catch (error) {
      console.error(
        `❌ Failed on MySQL DB_HOST_${i + 1} (${dbHosts[i]}:${dbPort}): ${error.message}`
      );

      lastError = error;
    }
  }

  console.error("❌ MySQL connection failed on all configured hosts");

  if (lastError) {
    console.error(lastError);
  }

  throw lastError || new Error("All MySQL hosts failed");
};

const isConnectionError = (error) => {
  const failoverCodes = [
    "PROTOCOL_CONNECTION_LOST",
    "ECONNRESET",
    "ECONNREFUSED",
    "ETIMEDOUT",
    "EHOSTUNREACH",
    "ENETUNREACH",
    "PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR",
  ];

  return (
    failoverCodes.includes(error?.code) ||
    /timeout|closed|lost|refused|unreachable/i.test(error?.message || "")
  );
};

const reconnectWithFailover = async () => {
  if (reconnecting) return activePool;

  reconnecting = true;

  try {
    let lastError = null;

    for (let step = 1; step <= dbHosts.length; step++) {
      const nextIndex = (currentHostIndex + step) % dbHosts.length;

      try {
        console.log(`🔁 Failover trying MySQL DB_HOST_${nextIndex + 1}: ${dbHosts[nextIndex]}:${dbPort}`);

        const pool = await connectUsingHostAtIndex(nextIndex);

        console.log("✅ MySQL failover reconnect successful");

        return pool;
      } catch (error) {
        console.error(
          `❌ Failover failed on MySQL DB_HOST_${nextIndex + 1} (${dbHosts[nextIndex]}:${dbPort}): ${error.message}`
        );

        lastError = error;
      }
    }

    console.error("❌ All MySQL hosts failed during reconnect");

    if (lastError) {
      throw lastError;
    }

    throw new Error("All MySQL hosts failed during reconnect");
  } finally {
    reconnecting = false;
  }
};

const runWithFailover = async (operation) => {
  if (!activePool) {
    await connectDatabase();
  }

  try {
    return await operation(activePool);
  } catch (error) {
    if (!isConnectionError(error)) {
      throw error;
    }

    console.error("⚠️ MySQL connection error detected:", error.message);
    console.log("🔁 Trying MySQL failover...");

    await reconnectWithFailover();

    return operation(activePool);
  }
};

// Stable proxy so existing imports like `const { pool } = require("./db")` keep working
const pool = new Proxy(
  {},
  {
    get(_target, prop) {
      if (prop === "query") {
        return (...args) => runWithFailover((currentPool) => currentPool.query(...args));
      }

      if (prop === "execute") {
        return (...args) => runWithFailover((currentPool) => currentPool.execute(...args));
      }

      if (prop === "getConnection") {
        return async (...args) => {
          if (!activePool) {
            await connectDatabase();
          }

          return activePool.getConnection(...args);
        };
      }

      if (prop === "end") {
        return closeActivePool;
      }

      if (prop === "getCurrentHost") {
        return () => dbHosts[currentHostIndex];
      }

      if (!activePool) {
        if (prop === "then") return undefined;

        throw new Error("❌ MySQL pool is not initialized. Call testConnection() before using pool.");
      }

      const value = activePool[prop];

      return typeof value === "function" ? value.bind(activePool) : value;
    },
  }
);

async function testConnection() {
  if (!activePool) {
    return connectDatabase();
  }

  try {
    await testPoolConnection(activePool);
    console.log(`✅ MySQL active connection healthy: ${dbHosts[currentHostIndex]}:${dbPort}`);
    return activePool;
  } catch (error) {
    console.error("⚠️ Current MySQL host unhealthy:", error.message);
    return reconnectWithFailover();
  }
}

module.exports = {
  pool,
  testConnection,
  connectDatabase,
  reconnectWithFailover,
  getCurrentDbHost: () => dbHosts[currentHostIndex],
};