const { Pool } = require("pg");
const logger = require("./logger");

let pool;

/**
 * Initialize database connection pool
 * @returns {Pool} PostgreSQL connection pool
 */
const initializePool = () => {
  if (!pool) {
    // Debug: Log environment variables (without password)
    logger.verbose("Database configuration:", {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      node_env: process.env.NODE_ENV,
      has_password: !!process.env.DB_PASSWORD
    });

    // Check for missing environment variables
    // Either DATABASE_URL or individual DB variables are required
    const hasDatabaseUrl = !!process.env.DATABASE_URL;
    const hasIndividualVars = !!(process.env.DB_HOST && process.env.DB_PORT && process.env.DB_NAME && process.env.DB_USER && process.env.DB_PASSWORD);
    
    if (!hasDatabaseUrl && !hasIndividualVars) {
      const missingMessage = "Either DATABASE_URL or all individual DB variables (DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD) are required";
      logger.critical(missingMessage);
      throw new Error(missingMessage);
    }
    
    logger.verbose("Database connection method:", hasDatabaseUrl ? "DATABASE_URL" : "Individual variables");

    // Use DATABASE_URL if available (recommended for Render)
    const config = process.env.DATABASE_URL ? {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
      } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    } : {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT, 10),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
      } : false
    };

    logger.verbose("Creating pool with config:", {
      ...config,
      password: '[REDACTED]'
    });

    pool = new Pool(config);

    pool.on("error", (err) => {
      logger.critical("Unexpected error on idle client", err);
    });

    pool.on("connect", (client) => {
      logger.verbose("New client connected to database");
    });

    pool.on("acquire", (client) => {
      logger.verbose("Client acquired from pool");
    });

    pool.on("remove", (client) => {
      logger.verbose("Client removed from pool");
    });
  }
  return pool;
};

/**
 * Connect to the database and test connection
 */
const connectDB = async () => {
  try {
    logger.verbose("Attempting to connect to database...");
    const dbPool = initializePool();
    const client = await dbPool.connect();
    logger.verbose("Connected to PostgreSQL database");
    
    // Test query to verify connection
    const result = await client.query('SELECT NOW() as current_time, version() as db_version');
    logger.verbose("Database test query successful:", {
      current_time: result.rows[0].current_time,
      db_version: result.rows[0].db_version.split(' ')[0] // Just PostgreSQL version number
    });
    
    client.release();
  } catch (error) {
    logger.critical("Failed to connect to database:", error);
    logger.critical("Database connection error details:", {
      code: error.code,
      errno: error.errno,
      syscall: error.syscall,
      address: error.address,
      port: error.port,
      message: error.message
    });
    throw error;
  }
};

/**
 * Execute a database query
 * @param {string} text - SQL query string
 * @param {Array} params - Query parameters
 * @returns {Promise<Object>} Query result
 */
const query = async (text, params = []) => {
  const dbPool = initializePool();
  const start = Date.now();
  try {
    const result = await dbPool.query(text, params);
    const duration = Date.now() - start;
    logger.verbose("Executed query", {
      text,
      duration,
      rows: result.rowCount,
    });
    return result;
  } catch (error) {
    logger.critical("Database query error:", error);
    throw error;
  }
};

/**
 * Get a database client for transactions
 * @returns {Promise<Object>} Database client
 */
const getClient = async () => {
  const dbPool = initializePool();
  return await dbPool.connect();
};

/**
 * Close the database pool
 */
const closePool = async () => {
  if (pool) {
    await pool.end();
    pool = null;
    logger.verbose("Database pool closed");
  }
};

module.exports = {
  connectDB,
  query,
  getClient,
  closePool,
};
