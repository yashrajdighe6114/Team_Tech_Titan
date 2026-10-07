import bcrypt from 'bcryptjs';
import { db, initDatabase } from './database.js';
import { drunixLedger } from '../drunix/drunix-adapter.js';

export function seedData() {
  initDatabase();

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as any;
  if (userCount.count > 0) {
    console.log('Database already populated. Skipping seed.');
    return;
  }

  console.log('🌱 Seeding initial AssetTrust demo data...');

  const passwordHash = bcrypt.hashSync('Password123!', 10);
  const now = new Date().toISOString();

  // 1. Seed Demo Accounts
  const users = [
    { id: 'usr-admin', email: 'admin@assettrust.demo', full_name: 'Vikramaditya (Admin)', role: 'ADMIN' },
    { id: 'usr-owner', email: 'owner@assettrust.demo', full_name: 'Rahul Sharma (Asset Owner)', role: 'ASSET_OWNER' },
    { id: 'usr-investor', email: 'investor@assettrust.demo', full_name: 'Priya Deshmukh (Institutional Investor)', role: 'INVESTOR' },
    { id: 'usr-compliance', email: 'compliance@assettrust.demo', full_name: 'Ananya Roy (Compliance Officer)', role: 'COMPLIANCE_OFFICER' },
    { id: 'usr-bank', email: 'bank@assettrust.demo', full_name: 'HDFC Escrow / Settlement Bank', role: 'BANK' }
  ];

  const insertUser = db.prepare(`
    INSERT INTO users (id, email, password_hash, full_name, role, kyc_status, created_at)
    VALUES (?, ?, ?, ?, ?, 'VERIFIED', ?)
  `);

  users.forEach(u => {
    insertUser.run(u.id, u.email, passwordHash, u.full_name, u.role, now);
  });

  // 2. ASSET 1: Sunrise Residency (VERIFIED, APPROVED, TOKENIZED, ACTIVE, Health 91)
  const asset1Id = 'ast-sunrise-001';
  const asset1HealthBreakdown = JSON.stringify({
    ownership_verification: { score: 20, max: 20, name: 'Ownership Verification' },
    document_verification: { score: 19, max: 20, name: 'Document Verification' },
    valuation: { score: 14, max: 15, name: 'Valuation Assessment' },
    kyc: { score: 15, max: 15, name: 'KYC / AML Due Diligence' },
    insurance: { score: 9, max: 10, name: 'Insurance Coverage' },
    encumbrance: { score: 10, max: 10, name: 'Encumbrance / Lien Freedom' },
    legal_review: { score: 8, max: 10, name: 'Legal Title Review' },
    percentageBreakdown: {
      ownership: '100%',
      documents: '95%',
      valuation: '90%',
      kyc: '100%',
      insurance: '90%',
      encumbrance: '100%',
      legal_review: '80%'
    }
  });

  db.prepare(`
    INSERT INTO assets (
      id, name, asset_type, owner_name, owner_id, location, property_identifier,
      declared_value, description, status, health_score, health_breakdown,
      is_encumbered, transfer_restricted, drunix_status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    asset1Id,
    'Sunrise Residency',
    'Residential Property',
    'Rahul Sharma',
    'usr-owner',
    'Pune',
    'PROP-PUN-001',
    10000000,
    'Prime 4BHK luxury penthouse in Kalyani Nagar with unencumbered freehold title and municipal clearances.',
    'TOKENIZED',
    91,
    asset1HealthBreakdown,
    0,
    0,
    'ANCHORED_DEV_LEDGER',
    now,
    now
  );

  // Documents for Asset 1
  const insertDoc = db.prepare(`
    INSERT INTO asset_documents (id, asset_id, name, document_type, text_content, extracted_data, verification_status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertDoc.run(
    'doc-sr-01',
    asset1Id,
    'Registered Sale Deed.pdf',
    'SALE_DEED',
    'Sub-Registrar Haveli Pune. Deed of Sale executed in favour of Rahul Sharma for property PROP-PUN-001. Consideration Value: Rs. 1,00,00,000.',
    JSON.stringify({ owner_name: 'Rahul Sharma', property_id: 'PROP-PUN-001', declared_value: 10000000, property_address: 'Pune' }),
    'VERIFIED',
    now
  );

  insertDoc.run(
    'doc-sr-02',
    asset1Id,
    'Municipal Property Tax Receipt 2026.pdf',
    'TAX_RECEIPT',
    'Pune Municipal Corporation Tax Assessment. Taxpayer: Rahul Sharma. Property ID: PROP-PUN-001. Assessment Year 2026-27. All dues cleared.',
    JSON.stringify({ owner_name: 'Rahul Sharma', property_id: 'PROP-PUN-001', date: '15-05-2026' }),
    'VERIFIED',
    now
  );

  insertDoc.run(
    'doc-sr-03',
    asset1Id,
    'Govt Approved Valuation Report.pdf',
    'VALUATION_REPORT',
    'IBBI Registered Valuer Certificate. Subject Property: Sunrise Residency, PROP-PUN-001. Current Fair Market Value: Rs. 1,00,00,000.',
    JSON.stringify({ declared_value: 10000000, property_id: 'PROP-PUN-001', issuing_authority: 'IBBI Registered Valuer' }),
    'VERIFIED',
    now
  );

  // Verification for Asset 1
  db.prepare(`
    INSERT INTO verifications (id, asset_id, status, confidence, extracted_fields, detected_issues, evidence, verified_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'ver-sr-01',
    asset1Id,
    'PASS',
    0.98,
    JSON.stringify({
      owners_detected: ['Rahul Sharma'],
      property_ids_detected: ['PROP-PUN-001'],
      total_encumbrance_detected: 0,
      document_count: 3
    }),
    JSON.stringify([]),
    JSON.stringify([
      { field: 'owner_name', severity: 'INFO', source: 'Registered Sale Deed.pdf', value: 'Rahul Sharma', message: 'Owner identity confirmed' },
      { field: 'property_id', severity: 'INFO', source: 'Municipal Property Tax Receipt 2026.pdf', value: 'PROP-PUN-001', message: 'Property identifier verified' }
    ]),
    'AI_ENGINE_V1',
    now
  );

  // Token for Asset 1
  const tokenId1 = 'tok-sunrise-001';
  db.prepare(`
    INSERT INTO tokens (id, asset_id, token_name, symbol, total_supply, available_supply, token_price, status, drunix_ledger_ref, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    tokenId1,
    asset1Id,
    'Sunrise Residency Token',
    'SRT',
    100000,
    98500,
    1000,
    'ACTIVE',
    'DEV-LEDGER-SEQ-1',
    now
  );

  // Holdings for Asset 1 (Rahul Sharma owner holds 98,500, Priya investor holds 1,500)
  db.prepare(`
    INSERT INTO token_holdings (id, token_id, asset_id, user_id, user_email, balance, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run('hld-owner-1', tokenId1, asset1Id, 'usr-owner', 'owner@assettrust.demo', 98500, now);

  db.prepare(`
    INSERT INTO token_holdings (id, token_id, asset_id, user_id, user_email, balance, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run('hld-inv-1', tokenId1, asset1Id, 'usr-investor', 'investor@assettrust.demo', 1500, now);

  // 3. ASSET 2: GreenField Commercial Complex (ENCUMBERED, Health 68, Transfer RESTRICTED)
  const asset2Id = 'ast-greenfield-002';
  const asset2HealthBreakdown = JSON.stringify({
    ownership_verification: { score: 20, max: 20, name: 'Ownership Verification' },
    document_verification: { score: 19, max: 20, name: 'Document Verification' },
    valuation: { score: 9, max: 15, name: 'Valuation Assessment' },
    kyc: { score: 15, max: 15, name: 'KYC / AML Due Diligence' },
    insurance: { score: 9, max: 10, name: 'Insurance Coverage' },
    encumbrance: { score: 0, max: 10, name: 'Encumbrance / Lien Freedom' },
    legal_review: { score: 5, max: 10, name: 'Legal Title Review' },
    percentageBreakdown: {
      ownership: '100%',
      documents: '95%',
      valuation: '60%',
      kyc: '100%',
      insurance: '90%',
      encumbrance: '0%',
      legal_review: '50%'
    }
  });

  db.prepare(`
    INSERT INTO assets (
      id, name, asset_type, owner_name, owner_id, location, property_identifier,
      declared_value, description, status, health_score, health_breakdown,
      is_encumbered, transfer_restricted, restriction_reason, drunix_status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    asset2Id,
    'GreenField Commercial Complex',
    'Commercial Property',
    'Rahul Sharma',
    'usr-owner',
    'Pune',
    'PROP-COMM-002',
    10000000,
    'Premium commercial IT park floor in Hinjewadi Phase 1 with existing commercial mortgage encumbrance.',
    'ENCUMBERED',
    68,
    asset2HealthBreakdown,
    1,
    1,
    'Outstanding loan / encumbrance detected. Transfer restricted by smart compliance rule.',
    'ANCHORED_DEV_LEDGER',
    now,
    now
  );

  // Encumbrance for Asset 2
  db.prepare(`
    INSERT INTO encumbrances (id, asset_id, lender_name, amount, encumbrance_type, status, notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'enc-gf-01',
    asset2Id,
    'HDFC Commercial Banking',
    3000000,
    'MORTGAGE_LOAN',
    'ACTIVE',
    'Outstanding term loan of ₹30,00,000 secured against commercial unit PROP-COMM-002.',
    now
  );

  insertDoc.run(
    'doc-gf-01',
    asset2Id,
    'Commercial Conveyance Deed.pdf',
    'SALE_DEED',
    'Conveyance Deed for GreenField Commercial Unit PROP-COMM-002. Owner: Rahul Sharma. Declared Value: Rs. 1,00,00,000.',
    JSON.stringify({ owner_name: 'Rahul Sharma', property_id: 'PROP-COMM-002', declared_value: 10000000 }),
    'VERIFIED',
    now
  );

  insertDoc.run(
    'doc-gf-02',
    asset2Id,
    'Bank Mortgage Charge Certificate.pdf',
    'LOAN_ENCUMBRANCE',
    'Charge Creation Letter. Lender: HDFC Bank. Borrower: Rahul Sharma. Outstanding Loan: Rs. 30,00,000 on Property PROP-COMM-002.',
    JSON.stringify({ owner_name: 'Rahul Sharma', property_id: 'PROP-COMM-002', loan_amount: 3000000 }),
    'VERIFIED',
    now
  );

  // Verification for Asset 2
  db.prepare(`
    INSERT INTO verifications (id, asset_id, status, confidence, extracted_fields, detected_issues, evidence, verified_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'ver-gf-01',
    asset2Id,
    'PASS_WITH_WARNING',
    0.88,
    JSON.stringify({
      owners_detected: ['Rahul Sharma'],
      property_ids_detected: ['PROP-COMM-002'],
      total_encumbrance_detected: 3000000,
      document_count: 2
    }),
    JSON.stringify(['Encumbrance identified in Bank Mortgage Charge Certificate.pdf: Outstanding loan amount ₹30,00,000.00']),
    JSON.stringify([
      { field: 'loan_amount', severity: 'HIGH', source: 'Bank Mortgage Charge Certificate.pdf', value: '₹30,00,000.00', message: 'Active mortgage/encumbrance recorded' }
    ]),
    'AI_ENGINE_V1',
    now
  );

  // 4. ASSET 3: LakeView Property (REVIEW, Ownership Mismatch, Rahul Sharma vs Rohan Sharma)
  const asset3Id = 'ast-lakeview-003';
  const asset3HealthBreakdown = JSON.stringify({
    ownership_verification: { score: 6, max: 20, name: 'Ownership Verification' },
    document_verification: { score: 8, max: 20, name: 'Document Verification' },
    valuation: { score: 12, max: 15, name: 'Valuation Assessment' },
    kyc: { score: 10, max: 15, name: 'KYC / AML Due Diligence' },
    insurance: { score: 7, max: 10, name: 'Insurance Coverage' },
    encumbrance: { score: 10, max: 10, name: 'Encumbrance / Lien Freedom' },
    legal_review: { score: 3, max: 10, name: 'Legal Title Review' },
    percentageBreakdown: {
      ownership: '30%',
      documents: '40%',
      valuation: '80%',
      kyc: '67%',
      insurance: '70%',
      encumbrance: '100%',
      legal_review: '30%'
    }
  });

  db.prepare(`
    INSERT INTO assets (
      id, name, asset_type, owner_name, owner_id, location, property_identifier,
      declared_value, description, status, health_score, health_breakdown,
      is_encumbered, transfer_restricted, restriction_reason, drunix_status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    asset3Id,
    'LakeView Property',
    'Residential Property',
    'Rahul Sharma',
    'usr-owner',
    'Pune',
    'PROP-LAKE-003',
    7500000,
    'Scenic lakeside villa in Pashan, Pune. Submitted documents contain discrepancy in registered legal ownership.',
    'REVIEW',
    52,
    asset3HealthBreakdown,
    0,
    1,
    'Ownership mismatch detected between Title Deed and Municipal Registry.',
    'INTEGRATION_PENDING',
    now,
    now
  );

  insertDoc.run(
    'doc-lv-01',
    asset3Id,
    'Sale Deed Copy.pdf',
    'SALE_DEED',
    'Deed of Absolute Sale. Owner: Rahul Sharma. Property ID: PROP-LAKE-003. Location: Pashan, Pune.',
    JSON.stringify({ owner_name: 'Rahul Sharma', property_id: 'PROP-LAKE-003' }),
    'REVIEW',
    now
  );

  insertDoc.run(
    'doc-lv-02',
    asset3Id,
    'Municipal Property Tax Card.pdf',
    'TAX_RECEIPT',
    'Municipal Corporation Property Record. Registered Owner: Rohan Sharma. Property ID: PROP-LAKE-003.',
    JSON.stringify({ owner_name: 'Rohan Sharma', property_id: 'PROP-LAKE-003' }),
    'FLAGGED_MISMATCH',
    now
  );

  db.prepare(`
    INSERT INTO verifications (id, asset_id, status, confidence, extracted_fields, detected_issues, evidence, verified_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'ver-lv-01',
    asset3Id,
    'REVIEW',
    0.62,
    JSON.stringify({
      owners_detected: ['Rahul Sharma', 'Rohan Sharma'],
      property_ids_detected: ['PROP-LAKE-003'],
      total_encumbrance_detected: 0,
      document_count: 2
    }),
    JSON.stringify([
      "Owner mismatch detected across documents: 'Rahul Sharma' vs 'Rohan Sharma'",
      "Owner mismatch in Municipal Property Tax Card.pdf: Found 'Rohan Sharma' but registered asset owner is 'Rahul Sharma'"
    ]),
    JSON.stringify([
      { field: 'cross_doc_owner', severity: 'CRITICAL', source: 'Cross-Document Comparison', value: "'Rahul Sharma' vs 'Rohan Sharma'", message: 'Conflicting names found in submitted title records' }
    ]),
    'AI_ENGINE_V1',
    now
  );

  // 5. Seed Initial Audit Logs
  const insertAudit = db.prepare(`
    INSERT INTO audit_logs (id, asset_id, user_email, action, status, details, drunix_ref, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertAudit.run('aud-01', asset1Id, 'owner@assettrust.demo', 'Asset Registered', 'SUCCESS', 'Asset Sunrise Residency registered with declared value ₹1,00,00,000', 'DEV-LEDGER-SEQ-1', now);
  insertAudit.run('aud-02', asset1Id, 'system@ai.assettrust', 'AI Document Verification Completed', 'SUCCESS', 'Cross-document verification passed with 98% confidence', 'DEV-LEDGER-SEQ-2', now);
  insertAudit.run('aud-03', asset1Id, 'compliance@assettrust.demo', 'Compliance Approved', 'SUCCESS', 'Compliance Officer approved asset for tokenization', 'DEV-LEDGER-SEQ-3', now);
  insertAudit.run('aud-04', asset1Id, 'admin@assettrust.demo', 'Asset Tokenized', 'SUCCESS', 'Minted 100,000 SRT tokens at ₹1,000/token', 'DEV-LEDGER-SEQ-4', now);
  insertAudit.run('aud-05', asset2Id, 'owner@assettrust.demo', 'Asset Registered', 'SUCCESS', 'Asset GreenField Commercial Complex registered', 'DEV-LEDGER-SEQ-5', now);
  insertAudit.run('aud-06', asset2Id, 'bank@assettrust.demo', 'Encumbrance Added', 'FLAGGED', 'Outstanding mortgage of ₹30,00,000 added. Asset marked ENCUMBERED.', 'DEV-LEDGER-SEQ-6', now);
  insertAudit.run('aud-07', asset2Id, 'system@compliance.assettrust', 'Transfer Restricted', 'RESTRICTED', 'Smart compliance locked secondary transfers due to active lien', 'DEV-LEDGER-SEQ-7', now);
  insertAudit.run('aud-08', asset3Id, 'owner@assettrust.demo', 'Asset Registered', 'SUCCESS', 'Asset LakeView Property registered', 'DEV-LEDGER-SEQ-8', now);
  insertAudit.run('aud-09', asset3Id, 'system@ai.assettrust', 'AI Verification Flagged Mismatch', 'FLAGGED', "Owner mismatch detected: 'Rahul Sharma' vs 'Rohan Sharma'", 'DEV-LEDGER-SEQ-9', now);

  // 6. Record Initial Ledger Blocks in DRUNIX Adapter
  drunixLedger.createAsset({
    assetId: asset1Id,
    name: 'Sunrise Residency',
    assetType: 'Residential Property',
    ownerName: 'Rahul Sharma',
    location: 'Pune',
    propertyIdentifier: 'PROP-PUN-001',
    declaredValue: 10000000
  });

  drunixLedger.verifyAsset({
    assetId: asset1Id,
    verificationStatus: 'PASS',
    confidenceScore: 0.98,
    verifierIdentity: 'AI_VERIFICATION_NODE_1',
    verificationReportHash: 'hash_ver_sr_01',
    timestamp: now
  });

  drunixLedger.tokenizeAsset({
    assetId: asset1Id,
    tokenName: 'Sunrise Residency Token',
    symbol: 'SRT',
    totalSupply: 100000,
    tokenPrice: 1000,
    complianceApprovalHash: 'hash_comp_appr_01'
  });

  drunixLedger.createAsset({
    assetId: asset2Id,
    name: 'GreenField Commercial Complex',
    assetType: 'Commercial Property',
    ownerName: 'Rahul Sharma',
    location: 'Pune',
    propertyIdentifier: 'PROP-COMM-002',
    declaredValue: 10000000
  });

  drunixLedger.addEncumbrance({
    assetId: asset2Id,
    encumbranceId: 'enc-gf-01',
    lenderName: 'HDFC Commercial Banking',
    amount: 3000000,
    encumbranceType: 'MORTGAGE_LOAN',
    registeredDate: now
  });

  drunixLedger.freezeAsset(asset2Id, 'Transfer restricted due to outstanding loan encumbrance');

  console.log('✅ Demo data successfully seeded:');
  console.log('   - 5 Demo Accounts (Admin, Owner, Investor, Compliance, Bank)');
  console.log('   - Asset 1: Sunrise Residency (VERIFIED, APPROVED, TOKENIZED, Health 91/100)');
  console.log('   - Asset 2: GreenField Commercial Complex (ENCUMBERED, Health 68/100, Transfer RESTRICTED)');
  console.log('   - Asset 3: LakeView Property (REVIEW, Ownership mismatch Rahul vs Rohan Sharma)');
}
