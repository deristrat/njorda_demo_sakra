"""LLM prompt templates and tool schema for document extraction."""

SYSTEM_PROMPT = """\
You are a specialist in extracting structured data from Swedish financial advisory documents.

Your task: given a PDF document, extract all relevant information into the structured format defined by the tool schema.

Guidelines:
- The documents are in Swedish. Extract values as-is (Swedish text) unless the schema field implies a specific format (e.g. dates, enums).
- For personnummer, preserve the format found in the document (typically YYYYMMDD-XXXX).
- For dates, return ISO format (YYYY-MM-DD).
- For monetary amounts, return numbers without currency symbols or thousand separators.
- For risk_profile, map Swedish terms: "låg"→low, "medel"→medium, "medelhög"/"medel-hög"→medium_high, "hög"→high, "mycket hög"→very_high, "mycket låg"→very_low.
- For experience_level, map: "ingen"→none, "begränsad"→limited, "viss"/"måttlig"→moderate, "stor"/"omfattande"→extensive.
- For document_type, classify as: investment_advice (investeringsrådgivning, placeringsförslag), pension_transfer (pensionsflytt, överföring av pension), insurance_advice (försäkringsrådgivning), suitability_assessment (lämplighetsbedömning), or unknown.
- If a field cannot be found in the document, omit it (null).
- Use confidence_notes to flag: missing expected fields, low-quality/illegible sections, ambiguous values, or anything noteworthy about extraction quality.
- Use raw_data for any structured information found that doesn't fit the defined fields.

Always call the extract_document_data tool with your findings.
"""

# Gemini uses JSON response mode instead of tool use. Same guidelines,
# but with the expected JSON structure described in the user message.
GEMINI_SYSTEM_PROMPT = """\
You are a specialist in extracting structured data from Swedish financial advisory documents.

Guidelines:
- The documents are in Swedish. Extract values as-is (Swedish text) unless the schema field implies a specific format (e.g. dates, enums).
- For personnummer, preserve the format found in the document (typically YYYYMMDD-XXXX).
- For dates, return ISO format (YYYY-MM-DD).
- For monetary amounts, return numbers without currency symbols or thousand separators.
- For risk_profile, map Swedish terms: "låg"→low, "medel"→medium, "medelhög"/"medel-hög"→medium_high, "hög"→high, "mycket hög"→very_high, "mycket låg"→very_low.
- For experience_level, map: "ingen"→none, "begränsad"→limited, "viss"/"måttlig"→moderate, "stor"/"omfattande"→extensive.
- For document_type, classify as: investment_advice (investeringsrådgivning, placeringsförslag), pension_transfer (pensionsflytt, överföring av pension), insurance_advice (försäkringsrådgivning), suitability_assessment (lämplighetsbedömning), or unknown.
- If a field cannot be found in the document, set it to null.
- Use confidence_notes to flag: missing expected fields, low-quality/illegible sections, ambiguous values, or anything noteworthy about extraction quality.
- Use raw_data for any structured information found that doesn't fit the defined fields.
"""

GEMINI_USER_PROMPT = """\
Extract all structured data from this financial advisory document. Return a JSON object with these fields:

{
  "document_type": "investment_advice" | "pension_transfer" | "insurance_advice" | "suitability_assessment" | "unknown",
  "document_date": "YYYY-MM-DD" or null,
  "client": {
    "person_number": "YYYYMMDD-XXXX" or null,
    "person_name": string or null,
    "address": string or null,
    "email": string or null,
    "phone": string or null
  } or null,
  "advisor": {
    "advisor_name": string or null,
    "firm_name": string or null,
    "license_number": string or null
  } or null,
  "suitability": {
    "risk_profile": "very_low" | "low" | "medium" | "medium_high" | "high" | "very_high" | null,
    "investment_horizon": string or null,
    "experience_level": "none" | "limited" | "moderate" | "extensive" | null,
    "financial_situation": string or null,
    "investment_objective": string or null,
    "loss_tolerance": string or null
  } or null,
  "recommendations": [
    {
      "product_name": string or null,
      "isin": string or null,
      "amount": number or null,
      "percentage": number or null,
      "motivation": string or null
    }
  ] or null,
  "pension_provider_from": string or null,
  "pension_provider_to": string or null,
  "transfer_amount": number or null,
  "raw_data": { ... },
  "confidence_notes": ["..."]
}
"""

EXTRACTION_TOOL = {
    "name": "extract_document_data",
    "description": "Extract structured data from a Swedish financial advisory document.",
    "input_schema": {
        "type": "object",
        "required": ["document_type"],
        "properties": {
            "document_type": {
                "type": "string",
                "enum": [
                    "investment_advice",
                    "pension_transfer",
                    "insurance_advice",
                    "suitability_assessment",
                    "unknown",
                ],
                "description": "The type of financial advisory document.",
            },
            "document_date": {
                "type": ["string", "null"],
                "description": "Document date in ISO format (YYYY-MM-DD).",
            },
            "client": {
                "type": ["object", "null"],
                "properties": {
                    "person_number": {
                        "type": ["string", "null"],
                        "description": "Swedish personnummer (YYYYMMDD-XXXX).",
                    },
                    "person_name": {"type": ["string", "null"]},
                    "address": {"type": ["string", "null"]},
                    "email": {"type": ["string", "null"]},
                    "phone": {"type": ["string", "null"]},
                },
            },
            "advisor": {
                "type": ["object", "null"],
                "properties": {
                    "advisor_name": {"type": ["string", "null"]},
                    "firm_name": {"type": ["string", "null"]},
                    "license_number": {"type": ["string", "null"]},
                },
            },
            "suitability": {
                "type": ["object", "null"],
                "properties": {
                    "risk_profile": {
                        "type": ["string", "null"],
                        "enum": [
                            "very_low",
                            "low",
                            "medium",
                            "medium_high",
                            "high",
                            "very_high",
                            None,
                        ],
                    },
                    "investment_horizon": {
                        "type": ["string", "null"],
                        "description": "e.g. '5-10 years', 'long-term'.",
                    },
                    "experience_level": {
                        "type": ["string", "null"],
                        "enum": ["none", "limited", "moderate", "extensive", None],
                    },
                    "financial_situation": {
                        "type": ["string", "null"],
                        "description": "Summary of the client's financial situation.",
                    },
                    "investment_objective": {
                        "type": ["string", "null"],
                        "description": "e.g. 'growth', 'income', 'preservation'.",
                    },
                    "loss_tolerance": {
                        "type": ["string", "null"],
                        "description": "How much loss the client can tolerate.",
                    },
                },
            },
            "recommendations": {
                "type": ["array", "null"],
                "items": {
                    "type": "object",
                    "properties": {
                        "product_name": {"type": ["string", "null"]},
                        "isin": {
                            "type": ["string", "null"],
                            "description": "ISIN code if available.",
                        },
                        "amount": {
                            "type": ["number", "null"],
                            "description": "Amount in SEK.",
                        },
                        "percentage": {
                            "type": ["number", "null"],
                            "description": "Portfolio allocation percentage.",
                        },
                        "motivation": {
                            "type": ["string", "null"],
                            "description": "Why this product was recommended.",
                        },
                    },
                },
            },
            "pension_provider_from": {
                "type": ["string", "null"],
                "description": "Source pension provider (for pension transfers).",
            },
            "pension_provider_to": {
                "type": ["string", "null"],
                "description": "Target pension provider (for pension transfers).",
            },
            "transfer_amount": {
                "type": ["number", "null"],
                "description": "Pension transfer amount in SEK.",
            },
            "raw_data": {
                "type": "object",
                "description": "Any other structured data found that doesn't fit the defined fields.",
            },
            "confidence_notes": {
                "type": "array",
                "items": {"type": "string"},
                "description": "Notes about extraction quality, missing fields, ambiguities.",
            },
        },
    },
}
