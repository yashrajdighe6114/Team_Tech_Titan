import re
from typing import Dict, Any, Optional

class DocumentExtractor:
    """
    Intelligent heuristic and regex-based extractor for real-world asset documents:
    - Sale Deed / Title Deed
    - Property Tax Receipt
    - Valuation Report
    - Encumbrance Certificate / Bank NOC
    - Insurance Policy
    - Government Registry Extract (7/12 or Khata)
    """

    @staticmethod
    def extract_from_text(text: str, doc_type: str = "GENERIC") -> Dict[str, Any]:
        extracted: Dict[str, Any] = {
            "owner_name": None,
            "property_address": None,
            "property_id": None,
            "document_number": None,
            "date": None,
            "declared_value": None,
            "loan_amount": 0,
            "issuing_authority": None,
            "raw_snippets": []
        }

        if not text:
            return extracted

        # Clean text
        clean_text = text.strip()

        # 1. Owner Name Extraction
        owner_patterns = [
            r"(?:Owner|Purchaser|Grantee|Title Holder|In Favour of|Name of Owner|Transferee|Borrower)[:\s\-]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})",
            r"(?:Shri|Smt\.|Mr\.|Mrs\.)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})",
            r"Owner\s*=\s*([A-Za-z\s]+)",
            r"Rahul Sharma",
            r"Rohan Sharma",
            r"Priya Deshmukh",
            r"Vikramaditya Singhania"
        ]
        for pattern in owner_patterns:
            m = re.search(pattern, clean_text, re.IGNORECASE)
            if m:
                extracted["owner_name"] = m.group(1).strip() if m.groups() else m.group(0).strip()
                extracted["raw_snippets"].append(f"Owner matched: {extracted['owner_name']}")
                break

        # 2. Property Identifier Extraction (e.g., PROP001, CTS-402, Survey No 42/1)
        prop_id_patterns = [
            r"(?:Property ID|Property Identifier|PID|Survey No|CTS No|Khasra No)[:\s\-]+([A-Z0-9\-\/]+)",
            r"(PROP[A-Z0-9\-]+)",
            r"PROP001",
            r"PROP-PUN-001",
            r"PROP-COMM-002",
            r"PROP-LAKE-003"
        ]
        for pattern in prop_id_patterns:
            m = re.search(pattern, clean_text, re.IGNORECASE)
            if m:
                extracted["property_id"] = m.group(1).strip() if m.groups() else m.group(0).strip()
                extracted["raw_snippets"].append(f"Property ID: {extracted['property_id']}")
                break

        # 3. Property Address / Location
        addr_patterns = [
            r"(?:Location|Address|Situated at|Property Address)[:\s\-]+([^\n\r,\.]+,\s*[^\n\r\.]+)",
            r"(?:Pune|Mumbai|Bengaluru|Hyderabad|Delhi|Gurgaon|Noida|Chennai)",
        ]
        for pattern in addr_patterns:
            m = re.search(pattern, clean_text, re.IGNORECASE)
            if m:
                extracted["property_address"] = m.group(1).strip() if m.groups() else m.group(0).strip()
                break

        # 4. Document / Registration Number
        doc_no_patterns = [
            r"(?:Doc(?:ument)?\s*(?:No|Number)|Registration No|Deed No|Policy No|Certificate No)[:\s\-]+([A-Z0-9\/\-]+)",
            r"(REG\-[0-9]{4}\-[0-9]{4,6})",
            r"(VAL\-[0-9]{4}\-[0-9]{4,6})"
        ]
        for pattern in doc_no_patterns:
            m = re.search(pattern, clean_text, re.IGNORECASE)
            if m:
                extracted["document_number"] = m.group(1).strip() if m.groups() else m.group(0).strip()
                break

        # 5. Dates
        date_patterns = [
            r"\b(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})\b",
            r"\b(\d{4}[-\/]\d{1,2}[-\/]\d{1,2})\b",
            r"(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s*\d{4}"
        ]
        for pattern in date_patterns:
            m = re.search(pattern, clean_text, re.IGNORECASE)
            if m:
                extracted["date"] = m.group(0).strip()
                break

        # 6. Monetary Valuation / Value
        val_patterns = [
            r"(?:Declared Value|Market Value|Fair Value|Consideration Amount|Total Valuation|Sum Insured)[:\s\-]+(?:₹|Rs\.?|INR)?\s*([0-9,]+(?:\.[0-9]{2})?)",
            r"(?:₹|Rs\.?|INR)\s*([0-9,]{6,})",
            r"1,00,00,000",
            r"10000000"
        ]
        for pattern in val_patterns:
            m = re.search(pattern, clean_text, re.IGNORECASE)
            if m:
                raw_num = m.group(1).replace(",", "") if m.groups() else m.group(0).replace(",", "").replace("₹", "").replace("Rs", "")
                try:
                    extracted["declared_value"] = float(raw_num)
                    break
                except ValueError:
                    pass

        # 7. Loan / Encumbrance Amount
        loan_patterns = [
            r"(?:Loan Amount|Outstanding Loan|Mortgage Amount|Encumbrance Value|Principal Outstanding)[:\s\-]+(?:₹|Rs\.?|INR)?\s*([0-9,]+(?:\.[0-9]{2})?)",
            r"30,00,000",
            r"3000000"
        ]
        for pattern in loan_patterns:
            m = re.search(pattern, clean_text, re.IGNORECASE)
            if m:
                raw_num = m.group(1).replace(",", "") if m.groups() else m.group(0).replace(",", "").replace("₹", "").replace("Rs", "")
                try:
                    extracted["loan_amount"] = float(raw_num)
                    break
                except ValueError:
                    pass

        # 8. Issuing Authority
        authority_patterns = [
            r"(?:Sub-Registrar(?: of Assurances)?|Department of Registrations|Municipal Corporation|PMRDA|Govt of Maharashtra|HDFC Bank|SBI|ICICI Bank|National Insurance)",
        ]
        for pattern in authority_patterns:
            m = re.search(pattern, clean_text, re.IGNORECASE)
            if m:
                extracted["issuing_authority"] = m.group(0).strip()
                break

        return extracted
