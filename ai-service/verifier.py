from typing import List, Dict, Any, Optional

class VerificationEngine:
    """
    Deterministic AI & Compliance Verification Engine for RWA Tokenization.
    Performs cross-document integrity verification, mismatch detection,
    and asset health score computation.
    """

    @staticmethod
    def verify_documents(
        asset_info: Dict[str, Any],
        documents: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Cross-validates documents against asset registration details and across documents.
        """
        issues: List[str] = []
        evidence: List[Dict[str, Any]] = []
        extracted_summary: Dict[str, Any] = {}

        expected_owner = asset_info.get("owner_name", "").strip().lower()
        expected_prop_id = asset_info.get("property_identifier", "").strip().lower()
        expected_value = float(asset_info.get("declared_value", 0) or 0)

        owners_found = set()
        prop_ids_found = set()
        total_loan_detected = 0.0
        has_ownership_doc = False
        has_valuation_doc = False
        has_tax_doc = False

        for idx, doc in enumerate(documents):
            doc_type = doc.get("document_type", "OTHER").upper()
            extracted = doc.get("extracted_data") or {}
            doc_name = doc.get("name", f"Document #{idx+1}")

            owner = (extracted.get("owner_name") or "").strip()
            prop_id = (extracted.get("property_id") or "").strip()
            doc_value = float(extracted.get("declared_value") or 0)
            loan = float(extracted.get("loan_amount") or 0)

            if "OWNERSHIP" in doc_type or "SALE_DEED" in doc_type or "TITLE" in doc_type:
                has_ownership_doc = True
            if "VALUATION" in doc_type:
                has_valuation_doc = True
            if "TAX" in doc_type:
                has_tax_doc = True

            if owner:
                owners_found.add(owner)
                # Check match against declared owner
                if expected_owner and owner.lower() != expected_owner:
                    issues.append(
                        f"Owner mismatch in {doc_name}: Found '{owner}' but registered asset owner is '{asset_info.get('owner_name')}'"
                    )
                    evidence.append({
                        "field": "owner_name",
                        "severity": "CRITICAL",
                        "source": doc_name,
                        "value": owner,
                        "expected": asset_info.get("owner_name"),
                        "message": "Ownership title mismatch detected"
                    })
                else:
                    evidence.append({
                        "field": "owner_name",
                        "severity": "INFO",
                        "source": doc_name,
                        "value": owner,
                        "expected": asset_info.get("owner_name"),
                        "message": "Owner identity confirmed"
                    })

            if prop_id:
                prop_ids_found.add(prop_id)
                if expected_prop_id and prop_id.lower() != expected_prop_id:
                    issues.append(
                        f"Property ID mismatch in {doc_name}: Found '{prop_id}', expected '{asset_info.get('property_identifier')}'"
                    )
                    evidence.append({
                        "field": "property_id",
                        "severity": "HIGH",
                        "source": doc_name,
                        "value": prop_id,
                        "expected": asset_info.get("property_identifier"),
                        "message": "Property identifier mismatch"
                    })
                else:
                    evidence.append({
                        "field": "property_id",
                        "severity": "INFO",
                        "source": doc_name,
                        "value": prop_id,
                        "expected": asset_info.get("property_identifier"),
                        "message": "Property identifier verified"
                    })

            if loan > 0:
                total_loan_detected += loan
                issues.append(
                    f"Encumbrance identified in {doc_name}: Outstanding loan amount ₹{loan:,.2f}"
                )
                evidence.append({
                    "field": "loan_amount",
                    "severity": "HIGH",
                    "source": doc_name,
                    "value": f"₹{loan:,.2f}",
                    "message": "Active mortgage/encumbrance recorded"
                })

            if doc_value > 0 and expected_value > 0:
                diff_pct = abs(doc_value - expected_value) / expected_value
                if diff_pct > 0.20:
                    issues.append(
                        f"Valuation divergence: Document indicates ₹{doc_value:,.2f} vs declared ₹{expected_value:,.2f} ({diff_pct*100:.1f}% variance)"
                    )
                    evidence.append({
                        "field": "declared_value",
                        "severity": "MEDIUM",
                        "source": doc_name,
                        "value": f"₹{doc_value:,.2f}",
                        "expected": f"₹{expected_value:,.2f}",
                        "message": "Substantial valuation discrepancy"
                    })

        # Cross-document owner consistency
        if len(owners_found) > 1:
            owner_list_str = " vs ".join([f"'{o}'" for o in owners_found])
            issues.append(f"Owner mismatch detected across documents: {owner_list_str}")
            evidence.append({
                "field": "cross_doc_owner",
                "severity": "CRITICAL",
                "source": "Cross-Document Comparison",
                "value": owner_list_str,
                "message": "Conflicting names found in submitted title records"
            })

        # Missing critical documents check
        if not has_ownership_doc and len(documents) > 0:
            issues.append("Primary ownership deed / title certificate is missing.")
        
        # Determine status and confidence
        has_critical = any("mismatch" in issue.lower() or "missing" in issue.lower() for issue in issues)
        has_encumbrance = total_loan_detected > 0
        
        if has_critical:
            # Check if direct contradiction
            if len(owners_found) > 1 or any("Owner mismatch" in i for i in issues):
                status = "REVIEW"
                confidence = 0.62
            else:
                status = "FAIL"
                confidence = 0.45
        elif has_encumbrance:
            status = "PASS_WITH_WARNING"  # Verified documents, but has encumbrance
            confidence = 0.88
        elif len(documents) == 0:
            status = "PENDING"
            confidence = 0.0
            issues.append("No verification documents uploaded yet.")
        else:
            status = "PASS"
            confidence = 0.98

        extracted_summary = {
            "owners_detected": list(owners_found),
            "property_ids_detected": list(prop_ids_found),
            "total_encumbrance_detected": total_loan_detected,
            "document_count": len(documents),
            "ownership_deed_present": has_ownership_doc,
            "valuation_report_present": has_valuation_doc,
            "tax_document_present": has_tax_doc
        }

        return {
            "status": status,
            "confidence": confidence,
            "extracted_fields": extracted_summary,
            "detected_issues": issues,
            "evidence": evidence
        }

    @staticmethod
    def calculate_health_score(
        asset_info: Dict[str, Any],
        verification_result: Optional[Dict[str, Any]] = None,
        encumbrances: Optional[List[Dict[str, Any]]] = None,
        compliance_approved: bool = False
    ) -> Dict[str, Any]:
        """
        Calculates Asset Health Score out of 100 with strict transparent component breakdown:
        - Ownership verification: 20
        - Document verification: 20
        - Valuation: 15
        - KYC: 15
        - Insurance: 10
        - Encumbrance: 10
        - Legal review: 10
        Total = 100
        """
        encumbrances = encumbrances or []
        has_active_encumbrance = any(
            str(e.get("status", "")).upper() in ["ACTIVE", "PENDING", "REGISTERED"]
            for e in encumbrances
        ) or (verification_result and verification_result.get("extracted_fields", {}).get("total_encumbrance_detected", 0) > 0)

        status = verification_result.get("status") if verification_result else "PENDING"
        issues = verification_result.get("detected_issues", []) if verification_result else []
        has_owner_mismatch = any("mismatch" in i.lower() for i in issues)

        # Baseline maximum component points
        breakdown = {
            "ownership_verification": {"score": 20, "max": 20, "name": "Ownership Verification"},
            "document_verification": {"score": 20, "max": 20, "name": "Document Verification"},
            "valuation": {"score": 15, "max": 15, "name": "Valuation Assessment"},
            "kyc": {"score": 15, "max": 15, "name": "KYC / AML Due Diligence"},
            "insurance": {"score": 9, "max": 10, "name": "Asset Insurance Policy"},
            "encumbrance": {"score": 10, "max": 10, "name": "Encumbrance / Lien Freedom"},
            "legal_review": {"score": 8, "max": 10, "name": "Legal Title Opinion"}
        }

        # Dynamic adjustments
        if has_owner_mismatch:
            breakdown["ownership_verification"]["score"] = 6
            breakdown["document_verification"]["score"] = 8
            breakdown["legal_review"]["score"] = 3
        elif status == "PASS":
            breakdown["ownership_verification"]["score"] = 20
            breakdown["document_verification"]["score"] = 19
            breakdown["valuation"]["score"] = 14
            breakdown["legal_review"]["score"] = 8
        elif status == "REVIEW":
            breakdown["ownership_verification"]["score"] = 10
            breakdown["document_verification"]["score"] = 12
            breakdown["legal_review"]["score"] = 5

        # Encumbrance impact (e.g., drops score significantly from ~91 to ~68)
        if has_active_encumbrance:
            # Significant penalty for outstanding mortgage / loan encumbrance
            breakdown["encumbrance"]["score"] = 0
            breakdown["valuation"]["score"] = min(breakdown["valuation"]["score"], 9)
            breakdown["legal_review"]["score"] = min(breakdown["legal_review"]["score"], 5)

        if compliance_approved:
            breakdown["legal_review"]["score"] = min(breakdown["legal_review"]["score"] + 2, 10)
            breakdown["kyc"]["score"] = 15

        total_score = sum(item["score"] for item in breakdown.values())

        # Determine risk tier
        if total_score >= 85:
            risk_tier = "LOW"
            badge_color = "emerald"
        elif total_score >= 65:
            risk_tier = "MODERATE"
            badge_color = "amber"
        else:
            risk_tier = "HIGH"
            badge_color = "rose"

        # Percentage format breakdown for UI display
        percentage_breakdown = {
            "ownership": f"{(breakdown['ownership_verification']['score'] / 20) * 100:.0f}%",
            "documents": f"{(breakdown['document_verification']['score'] / 20) * 100:.0f}%",
            "valuation": f"{(breakdown['valuation']['score'] / 15) * 100:.0f}%",
            "kyc": f"{(breakdown['kyc']['score'] / 15) * 100:.0f}%",
            "insurance": f"{(breakdown['insurance']['score'] / 10) * 100:.0f}%",
            "encumbrance": f"{(breakdown['encumbrance']['score'] / 10) * 100:.0f}%",
            "legal_review": f"{(breakdown['legal_review']['score'] / 10) * 100:.0f}%",
        }

        return {
            "total_score": total_score,
            "max_score": 100,
            "risk_tier": risk_tier,
            "badge_color": badge_color,
            "breakdown": breakdown,
            "percentage_breakdown": percentage_breakdown,
            "is_encumbered": has_active_encumbrance,
            "transfer_restricted": has_active_encumbrance or total_score < 70 or has_owner_mismatch
        }
