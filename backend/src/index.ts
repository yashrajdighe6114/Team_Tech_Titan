import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { initDatabase } from './db/database.js';
import { seedData } from './db/seed.js';

import { authRouter } from './routes/auth.js';
import { assetsRouter } from './routes/assets.js';
import { verificationRouter } from './routes/verification.js';
import { complianceRouter } from './routes/compliance.js';
import { tokenizationRouter } from './routes/tokenization.js';
import { transfersRouter } from './routes/transfers.js';
import { holdingsRouter } from './routes/holdings.js';
import { encumbrancesRouter } from './routes/encumbrances.js';
import { settlementsRouter } from './routes/settlements.js';
import { auditRouter } from './routes/audit.js';
import { statsRouter } from './routes/stats.js';
import { drunixRouter } from './routes/drunix.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON parser
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded documents
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    app: 'AssetTrust RWA Tokenization API',
    ledger: 'NPCI DRUNIX Fabric-Compatible Spec (Dev Adapter Mode)',
    timestamp: new Date().toISOString()
  });
});

// Mount Routes
app.use('/api/auth', authRouter);
app.use('/api/assets', assetsRouter);
app.use('/api/verification', verificationRouter);
app.use('/api/compliance', complianceRouter);
app.use('/api/tokenization', tokenizationRouter);
app.use('/api/transfers', transfersRouter);
app.use('/api/holdings', holdingsRouter);
app.use('/api/encumbrances', encumbrancesRouter);
app.use('/api/settlements', settlementsRouter);
app.use('/api/audit', auditRouter);
app.use('/api/stats', statsRouter);
app.use('/api/drunix', drunixRouter);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Error]', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    code: err.code || 'INTERNAL_ERROR'
  });
});

// Initialize DB and Start
initDatabase();
seedData();

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 AssetTrust API Server listening on port ${PORT}`);
  console.log(`🔒 DRUNIX Mode: Development Ledger Adapter (DRUNIX network not connected)`);
  console.log(`📊 Health Endpoint: http://localhost:${PORT}/api/health`);
  console.log(`=======================================================`);
});
