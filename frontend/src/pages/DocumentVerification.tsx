import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import {
  FileText,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  ShieldCheck,
  Building2,
  FileCheck2,
  RefreshCw
} from 'lucide-react';
import { HealthScoreGauge } from '../components/HealthScoreGauge';

export const DocumentVerification: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [asset, setAsset] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [verification, setVerification] = useState<any>(null);
  const [healthScore, setHealthScore] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  // Upload Form State
  const [docName, setDocName] = useState('');
  const [docType, setDocType] = useState('SALE_DEED');
  const [textContent, setTextContent] = useState('');

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await api.assets.get(id);
      setAsset(res.asset);
      setDocuments(res.documents || []);
      if (res.verifications && res.verifications.length > 0) {
        setVerification(res.verifications[0]);
      }
      setHealthScore(res.asset?.health_breakdown || null);
    } catch (err) {
      console.error('Failed to load asset verification data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunVerification = async () => {
    if (!id) return;
    setVerifying(true);
    setMessage('');
    try {
      const res = await api.verification.run(id);
      setVerification(res.verification);
      setHealthScore(res.healthScore);
      setMessage(`AI Verification completed: ${res.verification.status} (${Math.round(res.verification.confidence * 100)}% Confidence)`);
      // Reload asset
      loadData();
    } catch (err: any) {
      setMessage(`Verification failed: ${err.message}`);
    } finally {
      setVerifying(false);
    }
  };

  const handleLoadPreset = async (presetType: 'pass' | 'mismatch' | 'encumbered') => {
    if (!id) return;
    setLoading(true);
    try {
      await api.verification.loadPreset(id, presetType);
      await loadData();
      // Auto run verification on preset
      await handleRunVerification();
    } catch (err: any) {
      setMessage(`Failed to load preset: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !docName) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('name', docName);
      formData.append('document_type', docType);
      formData.append('text_content', textContent);

      await api.verification.upload(id, formData);
      setDocName('');
      setTextContent('');
      await loadData();
      setMessage('Document uploaded successfully. Run AI Verification to cross-check.');
    } catch (err: any) {
      setMessage(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  if (loading && !asset) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-xs text-slate-400 animate-pulse">Loading AI verification engine...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-slate-500 uppercase">{asset?.property_identifier}</span>
            <span className="text-slate-600">&bull;</span>
            <span className="text-xs text-slate-400">{asset?.location}</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            AI Document Verification & Cross-Validation
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Deterministic document intelligence: Title Deeds, Tax Assessments, IBBI Valuer Reports, and Encumbrance Letters.
          </p>
        </div>

        {/* Demo Preset Bar for Hackathon Judges */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mr-1">
            Judge Demo Presets:
          </div>

          <button
            type="button"
            onClick={() => handleLoadPreset('pass')}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 transition-all flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Preset 1: Title PASS</span>
          </button>

          <button
            type="button"
            onClick={() => handleLoadPreset('mismatch')}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 transition-all flex items-center gap-1.5"
          >
            <XCircle className="w-3.5 h-3.5 text-rose-400" />
            <span>Preset 2: Owner MISMATCH</span>
          </button>

          <button
            type="button"
            onClick={() => handleLoadPreset('encumbered')}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 transition-all flex items-center gap-1.5"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Preset 3: Encumbered Loan</span>
          </button>
        </div>
      </div>

      {message && (
        <div className="p-3 rounded-lg bg-blue-950/40 border border-blue-500/30 text-blue-300 text-xs flex items-center justify-between">
          <span>{message}</span>
          <button onClick={() => setMessage('')} className="text-blue-400 hover:text-white">&times;</button>
        </div>
      )}

      {/* Main Grid: Left Column Documents, Right Column AI Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Uploaded Documents (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" />
                <h2 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                  Submitted Title Documents ({documents.length})
                </h2>
              </div>

              <button
                type="button"
                onClick={handleRunVerification}
                disabled={verifying || documents.length === 0}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm"
              >
                <Sparkles className={`w-3.5 h-3.5 ${verifying ? 'animate-spin' : ''}`} />
                <span>{verifying ? 'Running AI Engine...' : 'Execute Cross-Verification'}</span>
              </button>
            </div>

            {documents.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                No documents uploaded yet. Use the presets above or add a document below.
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map((doc, idx) => {
                  let extracted: any = {};
                  try {
                    extracted = typeof doc.extracted_data === 'string' ? JSON.parse(doc.extracted_data) : (doc.extracted_data || {});
                  } catch (e) {}

                  return (
                    <div
                      key={doc.id || idx}
                      className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/90 text-xs space-y-2 hover:border-slate-700 transition-all"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <FileCheck2 className="w-4 h-4 text-blue-400 shrink-0" />
                          <span className="font-semibold text-slate-200">{doc.name}</span>
                        </div>
                        <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                          {doc.document_type}
                        </span>
                      </div>

                      {/* Extracted Fields Matrix */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80 text-[11px]">
                        <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                          <span className="text-slate-500 block text-[10px]">Extracted Owner:</span>
                          <span className="font-semibold text-slate-200 truncate block">
                            {extracted.owner_name || 'N/A'}
                          </span>
                        </div>

                        <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                          <span className="text-slate-500 block text-[10px]">Property ID:</span>
                          <span className="font-semibold text-slate-200 font-mono truncate block">
                            {extracted.property_id || 'N/A'}
                          </span>
                        </div>

                        <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                          <span className="text-slate-500 block text-[10px]">Valuation:</span>
                          <span className="font-semibold text-slate-200 font-mono truncate block">
                            {extracted.declared_value ? `₹${Number(extracted.declared_value).toLocaleString('en-IN')}` : 'N/A'}
                          </span>
                        </div>

                        <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                          <span className="text-slate-500 block text-[10px]">Loan / Lien:</span>
                          <span className={`font-semibold font-mono truncate block ${extracted.loan_amount > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                            {extracted.loan_amount > 0 ? `₹${Number(extracted.loan_amount).toLocaleString('en-IN')}` : 'Nil'}
                          </span>
                        </div>
                      </div>

                      {doc.text_content && (
                        <div className="text-[11px] text-slate-400 bg-slate-900/40 p-2 rounded border border-slate-900 line-clamp-2">
                          <span className="text-slate-500 font-semibold mr-1">Raw Excerpt:</span>
                          {doc.text_content}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Upload Form */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
              Upload Additional Title Document
            </h3>

            <form onSubmit={handleUploadDocument} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Document Title</label>
                  <input
                    type="text"
                    value={docName}
                    onChange={(e) => setDocName(e.target.value)}
                    placeholder="e.g. Sub-Registrar Khata Extract.pdf"
                    required
                    className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Document Type</label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="SALE_DEED">Sale Deed / Conveyance</option>
                    <option value="TAX_RECEIPT">Municipal Property Tax</option>
                    <option value="VALUATION_REPORT">Valuation Report (IBBI)</option>
                    <option value="LOAN_ENCUMBRANCE">Loan / Encumbrance Letter</option>
                    <option value="INSURANCE">Insurance Policy</option>
                    <option value="LEGAL_OPINION">Legal Title Search Report</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">Document Text / OCR Content</label>
                <textarea
                  rows={2}
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="Paste or type document text (leave blank to auto-synthesize from asset profile)..."
                  className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition-all flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{uploading ? 'Uploading...' : 'Submit Document'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: AI Verification Analysis (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Health Score Gauge */}
          <HealthScoreGauge
            score={healthScore?.totalScore ?? asset?.health_score ?? 50}
            breakdown={healthScore?.breakdown}
            percentageBreakdown={healthScore?.percentageBreakdown}
            isEncumbered={Boolean(healthScore?.isEncumbered ?? asset?.is_encumbered)}
            transferRestricted={Boolean(healthScore?.transferRestricted ?? asset?.transfer_restricted)}
            restrictionReason={healthScore?.restrictionReason ?? asset?.restriction_reason}
          />

          {/* Verification Engine Decision Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                AI Cross-Document Decision
              </h3>
              {verification ? (
                <span
                  className={`px-2 py-0.5 rounded text-xs font-bold border ${
                    verification.status === 'PASS'
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      : verification.status === 'REVIEW'
                      ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                      : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                  }`}
                >
                  {verification.status}
                </span>
              ) : (
                <span className="text-xs text-slate-500">PENDING RUN</span>
              )}
            </div>

            {verification ? (
              <div className="space-y-4 text-xs">
                {/* Confidence Bar */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-slate-400 font-medium">Algorithmic Confidence:</span>
                    <span className="font-bold text-slate-200 font-mono">
                      {Math.round((verification.confidence || 0) * 100)}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        verification.confidence >= 0.85
                          ? 'bg-emerald-500'
                          : verification.confidence >= 0.6
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${Math.round((verification.confidence || 0) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Detected Issues */}
                <div>
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Detected Discrepancies & Issues:
                  </div>
                  {verification.detected_issues && verification.detected_issues.length > 0 ? (
                    <div className="space-y-2">
                      {verification.detected_issues.map((issue: string, i: number) => (
                        <div
                          key={i}
                          className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2"
                        >
                          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                          <span>{issue}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Zero discrepancies detected. Title, survey IDs and valuations harmonize.</span>
                    </div>
                  )}
                </div>

                {/* Evidence List */}
                {verification.evidence && verification.evidence.length > 0 && (
                  <div>
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Cross-Document Evidence:
                    </div>
                    <div className="space-y-1.5">
                      {verification.evidence.map((ev: any, idx: number) => (
                        <div key={idx} className="p-2 rounded bg-slate-950/60 border border-slate-800 text-[11px] flex justify-between items-center">
                          <div>
                            <span className="font-semibold text-slate-300 block">{ev.message || ev.field}</span>
                            <span className="text-slate-500 text-[10px]">{ev.source}: {ev.value}</span>
                          </div>
                          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${ev.severity === 'CRITICAL' ? 'bg-rose-950 text-rose-400' : 'bg-slate-800 text-slate-400'}`}>
                            {ev.severity || 'INFO'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-slate-400 text-center py-4">
                Click "Execute Cross-Verification" to analyze submitted deeds and calculate risk score.
              </div>
            )}

            {/* Next Steps CTA */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <Link to={`/assets/${asset?.id}`} className="text-xs text-slate-400 hover:text-white">
                &larr; Asset Overview
              </Link>

              <Link
                to={`/assets/${asset?.id}/tokenization`}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-all flex items-center gap-1 shadow-sm"
              >
                <span>Proceed to Tokenization</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
