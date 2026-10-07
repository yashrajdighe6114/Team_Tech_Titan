import { computeAssetHealthScore } from './healthScore.js';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8001';

export class AIServiceClient {
  public static async verifyDocuments(asset: any, documents: any[]) {
    try {
      const response = await fetch(`${AI_SERVICE_URL}/api/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asset: {
            id: asset.id,
            name: asset.name,
            owner_name: asset.owner_name,
            location: asset.location,
            property_identifier: asset.property_identifier,
            declared_value: Number(asset.declared_value) || 0,
            description: asset.description || ''
          },
          documents: documents.map(d => ({
            name: d.name,
            document_type: d.document_type,
            file_path: d.file_path,
            text_content: d.text_content || '',
            extracted_data: typeof d.extracted_data === 'string' ? JSON.parse(d.extracted_data) : (d.extracted_data || null)
          }))
        }),
        signal: AbortSignal.timeout(4000)
      });

      if (response.ok) {
        const data = (await response.json()) as any;
        const hs = data.health_score || {};
        return {
          source: 'PYTHON_FASTAPI_AI_ENGINE',
          verification: data.verification,
          healthScore: {
            ...hs,
            totalScore: hs.totalScore ?? hs.total_score ?? 85,
            maxScore: hs.maxScore ?? hs.max_score ?? 100,
            riskTier: hs.riskTier ?? hs.risk_tier ?? 'LOW',
            badgeColor: hs.badgeColor ?? hs.badge_color ?? 'emerald',
            isEncumbered: Boolean(hs.isEncumbered ?? hs.is_encumbered),
            transferRestricted: Boolean(hs.transferRestricted ?? hs.transfer_restricted),
            restrictionReason: hs.restrictionReason ?? hs.restriction_reason,
            percentageBreakdown: hs.percentageBreakdown ?? hs.percentage_breakdown
          }
        };
      }
    } catch (err) {
      console.warn(`[AI Service] FastAPI service at ${AI_SERVICE_URL} unreachable or timed out. Using deterministic fallback engine.`);
    }

    // Fallback deterministic verification engine
    return this.fallbackVerify(asset, documents);
  }

  private static fallbackVerify(asset: any, documents: any[]) {
    const issues: string[] = [];
    const evidence: any[] = [];
    const expectedOwner = (asset.owner_name || '').trim().toLowerCase();
    const expectedPropId = (asset.property_identifier || '').trim().toLowerCase();

    let ownersFound: string[] = [];
    let totalEncumbrance = 0;

    documents.forEach(doc => {
      const data = typeof doc.extracted_data === 'string' ? JSON.parse(doc.extracted_data || '{}') : (doc.extracted_data || {});
      const owner = (data.owner_name || '').trim();
      const propId = (data.property_id || '').trim();
      const loan = Number(data.loan_amount || 0);

      if (owner) {
        ownersFound.push(owner);
        if (expectedOwner && owner.toLowerCase() !== expectedOwner) {
          issues.push(`Owner mismatch in ${doc.name}: Found '${owner}', registered asset owner is '${asset.owner_name}'`);
          evidence.push({
            field: 'owner_name',
            severity: 'CRITICAL',
            source: doc.name,
            value: owner,
            expected: asset.owner_name,
            message: 'Ownership title mismatch detected'
          });
        }
      }

      if (propId && expectedPropId && propId.toLowerCase() !== expectedPropId) {
        issues.push(`Property ID mismatch in ${doc.name}: Found '${propId}', expected '${asset.property_identifier}'`);
        evidence.push({
          field: 'property_id',
          severity: 'HIGH',
          source: doc.name,
          value: propId,
          expected: asset.property_identifier
        });
      }

      if (loan > 0) {
        totalEncumbrance += loan;
        issues.push(`Encumbrance identified in ${doc.name}: Outstanding loan ₹${loan.toLocaleString('en-IN')}`);
      }
    });

    const uniqueOwners = [...new Set(ownersFound)];
    if (uniqueOwners.length > 1) {
      issues.push(`Owner mismatch detected across documents: ${uniqueOwners.join(' vs ')}`);
    }

    let status = 'PASS';
    let confidence = 0.98;

    if (uniqueOwners.length > 1 || issues.some(i => i.toLowerCase().includes('mismatch'))) {
      status = 'REVIEW';
      confidence = 0.62;
    } else if (totalEncumbrance > 0) {
      status = 'PASS_WITH_WARNING';
      confidence = 0.88;
    } else if (documents.length === 0) {
      status = 'PENDING';
      confidence = 0.0;
    }

    const health = computeAssetHealthScore({
      verificationStatus: status,
      detectedIssues: issues,
      encumbrances: totalEncumbrance > 0 ? [{ status: 'ACTIVE', amount: totalEncumbrance }] : [],
      complianceApproved: false
    });

    return {
      source: 'DETERMINISTIC_FALLBACK_ENGINE',
      verification: {
        status,
        confidence,
        detected_issues: issues,
        evidence,
        extracted_fields: {
          owners_detected: uniqueOwners,
          total_encumbrance_detected: totalEncumbrance,
          document_count: documents.length
        }
      },
      healthScore: health
    };
  }
}
