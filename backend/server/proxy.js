import express from 'express';
import cors from 'cors';
import https from 'https';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const PORT = Number(process.env.PORT ?? process.env.PROXY_PORT ?? 4000);

const requireEnv = (key) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const DASHBOARD_CLIENT_ID = requireEnv('DASHBOARD_CLIENT_ID');
const DASHBOARD_CLIENT_SECRET = requireEnv('DASHBOARD_CLIENT_SECRET');
const DASHBOARD_STATS_URL = requireEnv('DASHBOARD_STATS_URL');

const app = express();
app.use(cors());
app.use(express.json());

const generateHMACAuth = () => {
  const ts = Math.floor(Date.now() / 1000);
  const hmacSource = `${DASHBOARD_CLIENT_SECRET}${DASHBOARD_CLIENT_ID}${ts}`;
  const hmac = crypto.createHash('sha256').update(hmacSource).digest('hex');
  return {
    client_id: DASHBOARD_CLIENT_ID,
    hmac,
    ts,
  };
};

const callDashboardStats = () =>
  new Promise((resolve, reject) => {
    const auth = generateHMACAuth();
    const payload = JSON.stringify({
      auth_set: {
        client_id: auth.client_id,
        hmac: auth.hmac,
        ts: String(auth.ts),
      },
    });

    const targetUrl = new URL(DASHBOARD_STATS_URL);
    const options = {
      hostname: targetUrl.hostname,
      path: `${targetUrl.pathname}${targetUrl.search}`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        Accept: 'application/json',
      },
      timeout: 10_000,
    };

    const req = https.request(options, (res) => {
      let rawData = '';

      res.on('data', (chunk) => {
        rawData += chunk;
      });

      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(rawData));
          } catch (error) {
            reject(error);
          }
        } else {
          reject(
            new Error(
              `Dashboard stats error: ${res.statusCode} ${
                res.statusMessage ?? ''
              } - ${rawData}`,
            ),
          );
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(payload);
    req.end();
  });

app.get('/api/health', (_, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/dashboard-stats', async (_, res) => {
  try {
    const data = await callDashboardStats();
    res.setHeader('Cache-Control', 'no-store');
    res.json({
      ...data,
      fetched_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(502).json({
      status: 'error',
      message: 'Failed to fetch dashboard stats',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.listen(PORT, () => {
  console.log(`Dashboard proxy server running on http://localhost:${PORT}`);
});

