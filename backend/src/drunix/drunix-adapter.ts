import crypto from 'node:crypto';
import { db } from '../db/database.js';
import {
  IDrunixLedger,
  DrunixAssetPayload,
  DrunixVerificationPayload,
  DrunixTokenizePayload,
  DrunixTransferPayload,
  DrunixEncumbrancePayload,
  DrunixSettlementPayload,
  DrunixTxResult,
  DrunixAssetHistoryEntry
} from './drunix-interface.js';

export class DrunixLedgerAdapter implements IDrunixLedger {
  private channelId: string = 'drunix-rwa-channel';
  private chaincodeName: string = 'rwa-token-cc';
  private isLiveNetworkConnected: boolean = false;
  private readonly adapterStatusLabel = 'DRUNIX integration pending / development adapter (DRUNIX network not connected)';

  constructor() {
    // Check if live DRUNIX peer endpoint is configured
    const peerEndpoint = process.env.DRUNIX_PEER_ENDPOINT;
    if (peerEndpoint) {
      console.log(`[DRUNIX] Configured peer endpoint: ${peerEndpoint}`);
      // In live mode with active docker/peer network, gRPC client connects here
      this.isLiveNetworkConnected = false; // Dev environment currently has no live Fabric peer
    } else {
      console.log(`[DRUNIX] Running in DEVELOPMENT_ADAPTER mode. Real DRUNIX peer not connected.`);
    }
  }

  public getNetworkStatus() {
    return {
      connected: this.isLiveNetworkConnected,
      mode: this.isLiveNetworkConnected ? 'REAL_DRUNIX_NETWORK' : 'DEVELOPMENT_ADAPTER',
      statusLabel: this.isLiveNetworkConnected ? 'Connected to DRUNIX Peer Network' : this.adapterStatusLabel,
      channel: this.channelId,
      chaincode: this.chaincodeName,
      architecture: 'NPCI Drunix Permissioned DLT (Fabric v2.5.x compatible)',
      storageBackend: 'SQLite Local Persistence (SQL On-chain schema ready for YugabyteDB/PostgreSQL)'
    };
  }

  private appendBlock(action: string, assetId: string, payload: any): DrunixTxResult {
    const timestamp = new Date().toISOString();

    // Query last block
    const lastBlock = db.prepare('SELECT * FROM drunix_ledger_blocks ORDER BY sequence_number DESC LIMIT 1').get() as any;
    const seq = lastBlock ? lastBlock.sequence_number + 1 : 1;
    const prevHash = lastBlock ? lastBlock.block_hash : '0000000000000000000000000000000000000000000000000000000000000000';

    const payloadStr = JSON.stringify(payload);
    // Cryptographic hash chaining for local audit integrity
    const blockHash = crypto.createHash('sha256').update(`${seq}:${prevHash}:${action}:${payloadStr}:${timestamp}`).digest('hex');

    db.prepare(`
      INSERT INTO drunix_ledger_blocks (
        sequence_number, action, asset_id, payload, previous_hash, block_hash, adapter_mode, status_label, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      seq,
      action,
      assetId,
      payloadStr,
      prevHash,
      blockHash,
      'DEVELOPMENT_ADAPTER',
      this.adapterStatusLabel,
      timestamp
    );

    return {
      success: true,
      action,
      assetId,
      sequenceNumber: seq,
      adapterMode: 'DEVELOPMENT_ADAPTER',
      statusLabel: this.adapterStatusLabel,
      blockHash: `DEV-BLOCK-#${seq}`,
      channelId: this.channelId,
      chaincodeName: this.chaincodeName,
      timestamp,
      details: payload
    };
  }

  // 1. CreateAsset
  async createAsset(payload: DrunixAssetPayload): Promise<DrunixTxResult> {
    return this.appendBlock('CreateAsset', payload.assetId, payload);
  }

  // 2. ReadAsset
  async readAsset(assetId: string): Promise<any> {
    const asset = db.prepare('SELECT * FROM assets WHERE id = ?').get(assetId) as any;
    if (!asset) return null;
    const token = db.prepare('SELECT * FROM tokens WHERE asset_id = ?').get(assetId);
    const encumbrances = db.prepare('SELECT * FROM encumbrances WHERE asset_id = ?').all(assetId);
    return {
      ...asset,
      token,
      encumbrances,
      _drunixStatus: this.adapterStatusLabel
    };
  }

  // 3. VerifyAsset
  async verifyAsset(payload: DrunixVerificationPayload): Promise<DrunixTxResult> {
    return this.appendBlock('VerifyAsset', payload.assetId, payload);
  }

  // 4. TokenizeAsset
  async tokenizeAsset(payload: DrunixTokenizePayload): Promise<DrunixTxResult> {
    return this.appendBlock('TokenizeAsset', payload.assetId, payload);
  }

  // 5. GetTokenBalance
  async getTokenBalance(assetId: string, accountId: string): Promise<number> {
    const holding = db.prepare(
      'SELECT balance FROM token_holdings WHERE asset_id = ? AND (user_id = ? OR user_email = ?)'
    ).get(assetId, accountId, accountId) as any;
    return holding ? holding.balance : 0;
  }

  // 6. TransferToken
  async transferToken(payload: DrunixTransferPayload): Promise<DrunixTxResult> {
    return this.appendBlock('TransferToken', payload.assetId, payload);
  }

  // 7. FreezeAsset
  async freezeAsset(assetId: string, reason: string): Promise<DrunixTxResult> {
    return this.appendBlock('FreezeAsset', assetId, { reason });
  }

  // 8. AddEncumbrance
  async addEncumbrance(payload: DrunixEncumbrancePayload): Promise<DrunixTxResult> {
    return this.appendBlock('AddEncumbrance', payload.assetId, payload);
  }

  // 9. CreateSettlement
  async createSettlement(payload: DrunixSettlementPayload): Promise<DrunixTxResult> {
    return this.appendBlock('CreateSettlement', payload.assetId, payload);
  }

  // 10. GetAssetHistory
  async getAssetHistory(assetId: string): Promise<DrunixAssetHistoryEntry[]> {
    const rows = db.prepare(
      'SELECT * FROM drunix_ledger_blocks WHERE asset_id = ? ORDER BY sequence_number ASC'
    ).all(assetId) as any[];

    return rows.map(r => ({
      sequenceNumber: r.sequence_number,
      action: r.action,
      timestamp: r.timestamp,
      statusLabel: r.status_label,
      payload: JSON.parse(r.payload)
    }));
  }
}

export const drunixLedger = new DrunixLedgerAdapter();
