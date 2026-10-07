import React, { useState } from 'react';
import { api } from '../api/client';
import { useNavigate } from 'react-router-dom';
import { Building2, Sparkles, ArrowRight, ShieldCheck, Upload, AlertCircle } from 'lucide-react';

export const AssetCreate: React.FC = () => {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [assetType, setAssetType] = useState('Residential Property');
  const [ownerName, setOwnerName] = useState('Rahul Sharma');
  const [location, setLocation] = useState('Pune');
  const [propertyIdentifier, setPropertyIdentifier] = useState('');
  const [declaredValue, setDeclaredValue] = useState('10000000');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fillSunriseExample = () => {
    setName('Sunrise Residency Phase 2');
    setAssetType('Residential Property');
    setOwnerName('Rahul Sharma');
    setLocation('Pune');
    setPropertyIdentifier(`PROP-PUN-00${Math.floor(Math.random() * 90 + 10)}`);
    setDeclaredValue('10000000');
    setDescription('Luxury 4BHK Penthouse in Kalyani Nagar, Pune with unencumbered freehold title and municipal clearances.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name || !propertyIdentifier || !declaredValue) {
      setError('Please provide Asset Name, Property Identifier, and Declared Value.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.assets.create({
        name,
        asset_type: assetType,
        owner_name: ownerName,
        location,
        property_identifier: propertyIdentifier,
        declared_value: Number(declaredValue),
        description
      });

      // Auto-redirect to the document verification step for this new asset
      navigate(`/assets/${res.asset.id}/verification`);
    } catch (err: any) {
      setError(err.message || 'Failed to register asset. Check duplicate property ID.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            Register Real-World Asset
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Step 1 of Tokenization: Register asset details to initiate cryptographic DLT anchoring.
          </p>
        </div>

        <button
          type="button"
          onClick={fillSunriseExample}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-lg text-xs font-semibold transition-all"
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          <span>Auto-fill Demo Asset</span>
        </button>
      </div>

      {/* Main Registration Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        {error && (
          <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Asset Name */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Asset Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sunrise Residency"
                required
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Asset Type */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Asset Type *
              </label>
              <select
                value={assetType}
                onChange={(e) => setAssetType(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-blue-500"
              >
                <option value="Residential Property">Residential Property</option>
                <option value="Commercial Property">Commercial Property</option>
                <option value="Industrial Land">Industrial Land</option>
                <option value="Agricultural Real Estate">Agricultural Real Estate</option>
                <option value="Infrastructure Project">Infrastructure Project</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Owner Name */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Registered Owner Name *
              </label>
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="Rahul Sharma"
                required
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Location (City / State) *
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Pune, Maharashtra"
                required
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Property Identifier */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Property Identifier (PID/Survey) *
              </label>
              <input
                type="text"
                value={propertyIdentifier}
                onChange={(e) => setPropertyIdentifier(e.target.value)}
                placeholder="e.g. PROP-PUN-001"
                required
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>

          {/* Declared Valuation */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Declared Fair Market Value (₹ INR) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs text-slate-500 font-bold">₹</span>
              <input
                type="number"
                value={declaredValue}
                onChange={(e) => setDeclaredValue(e.target.value)}
                placeholder="10000000"
                required
                className="w-full pl-8 pr-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Example: ₹1,00,00,000 (1 Crore INR)
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Asset Description & Title Particulars
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide legal title notes, encumbrance history, or layout details..."
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Submit */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <div className="text-xs text-slate-400">
              Next step: AI document extraction and cross-verification
            </div>

            <button
              type="submit"
              disabled={loading}
              className="py-2.5 px-5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-all shadow-md flex items-center gap-2"
            >
              <span>{loading ? 'Registering on Ledger...' : 'Proceed to Document Verification'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
