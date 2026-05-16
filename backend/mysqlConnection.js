const mysql = require('mysql2/promise');
require('dotenv').config({ quiet: true });

class MySQLConnection {
  constructor() {
    this.primaryConfig = {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'InventorySalesDB',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    };
    this.pool = null;
    this.activeConfig = null;
  }

  getPool() {
    return this.pool;
  }

  buildCandidateConfigs() {
    const candidates = [
      this.primaryConfig,
      { ...this.primaryConfig, password: '' },
      { ...this.primaryConfig, user: 'root', password: '' },
      { ...this.primaryConfig, user: 'root', password: 'root' },
    ];

    const seen = new Set();
    return candidates.filter((candidate) => {
      const key = JSON.stringify(candidate);
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  async ensurePool() {
    if (this.pool) {
      return this.pool;
    }

    let lastError = null;
    for (const candidate of this.buildCandidateConfigs()) {
      const pool = mysql.createPool(candidate);

      try {
        await pool.query('SELECT 1');
        this.pool = pool;
        this.activeConfig = candidate;
        if (candidate.password !== this.primaryConfig.password || candidate.user !== this.primaryConfig.user) {
          console.warn(`MySQL connection fallback succeeded using user "${candidate.user}".`);
        }
        return this.pool;
      } catch (error) {
        lastError = error;
        await pool.end().catch(() => {});
      }
    }

    throw lastError;
  }

  async query(sql, params = []) {
    const pool = await this.ensurePool();
    return pool.query(sql, params);
  }

  async execute(sql, params = []) {
    const pool = await this.ensurePool();
    return pool.execute(sql, params);
  }
}

module.exports = { MySQLConnection };
