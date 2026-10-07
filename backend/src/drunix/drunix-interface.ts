/**
 * Official DRUNIX Permissioned DLT / Hyperledger Fabric Contract Interface
 * Based on NPCI Drunix Chaincode Architecture (Fabric v2.5.x compatibility)
 */

export interface DrunixAssetPayload {
  assetId: string;
  name: string;
  assetType: string;
  ownerName: string;
  ownerId?: string;
  location: string;
  propertyIdentifier: string;
  declaredValue: number;
  metadata?: Record<string, any>;
}

export interface DrunixVerificationPayload {
  assetId: string;
  verificationStatus: 'PASS' | 'REVIEW' | 'FAIL';
  confidenceScore: number;
  verifierIdentity: string;
  verificationReportHash: string;
  timestamp: string;
}

export interface DrunixTokenizePayload {
  assetId: string;
  tokenName: string;
  symbol: string;
  totalSupply: number;
  tokenPrice: number;
  complianceApprovalHash: string;
}

export interface DrunixTransferPayload {
  assetId: string;
  fromAccount: string;
  toAccount: string;
  amount: number;
  purpose?: string;
}

export interface DrunixEncumbrancePayload {
  assetId: string;
  encumbranceId: string;
  lenderName: string;
  amount: number;
  encumbranceType: string;
  registeredDate: string;
}

export interface DrunixSettlementPayload {
  settlementId: string;
  assetId: string;
  buyerAccount: string;
  sellerAccount: string;
  tokenAmount: number;
  totalInr: number;
  paymentReference?: string;
}

export interface DrunixTxResult {
  success: boolean;
  action: string;
  assetId: string;
  sequenceNumber: number;
  adapterMode: 'REAL_DRUNIX_NETWORK' | 'DEVELOPMENT_ADAPTER';
  statusLabel: string;
  blockHash?: string;
  channelId: string;
  chaincodeName: string;
  timestamp: string;
  details?: any;
}

export interface DrunixAssetHistoryEntry {
  sequenceNumber: number;
  action: string;
  timestamp: string;
  statusLabel: string;
  payload: any;
}

/**
 * Interface representing the official DRUNIX Smart Contract API methods.
 */
export interface IDrunixLedger {
  createAsset(payload: DrunixAssetPayload): Promise<DrunixTxResult>;
  readAsset(assetId: string): Promise<any>;
  verifyAsset(payload: DrunixVerificationPayload): Promise<DrunixTxResult>;
  tokenizeAsset(payload: DrunixTokenizePayload): Promise<DrunixTxResult>;
  getTokenBalance(assetId: string, accountId: string): Promise<number>;
  transferToken(payload: DrunixTransferPayload): Promise<DrunixTxResult>;
  freezeAsset(assetId: string, reason: string): Promise<DrunixTxResult>;
  addEncumbrance(payload: DrunixEncumbrancePayload): Promise<DrunixTxResult>;
  createSettlement(payload: DrunixSettlementPayload): Promise<DrunixTxResult>;
  getAssetHistory(assetId: string): Promise<DrunixAssetHistoryEntry[]>;
}
