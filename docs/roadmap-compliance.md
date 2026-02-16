# Roadmap: Compliance Engine — Future Enhancements

Beyond the v1 spec. Ideas to revisit once the core engine is working.

## Evidence & Source Linking

- Extraction model should tag *where* in the document each field was found (page number, section, character offset)
- Compliance findings can then reference the source location
- UI: click a failed rule → PDF viewer scrolls to relevant section / highlights the gap
- Requires changes to `ExtractionResult` and the LLM extraction prompts

## Cost & Remuneration Extraction

- Add fields to extraction model: `remuneration_sek`, `remuneration_percent`, `product_costs`, `total_cost_tka`
- Enable COST_001, COST_002 rules
- Add cost comparison rules for pension transfers (TKA before vs after)
- Add "mervärde" check for high-value remuneration (>100k SEK)

## Cross-Document Rules

- Rules that span multiple documents for the same client
- Example: "Client risk profile changed between documents without explanation"
- Example: "Multiple recommendations to same client with conflicting risk levels"
- Requires a client-level compliance view

## Compliance Dashboard

- Aggregate compliance stats across all documents
- Average score over time (trending up/down?)
- Most common failures (which rules fail most often?)
- Per-advisor breakdown (who needs training?)
- Aligns with business area 3: "Rådgivnings-QA & utbildning"

## Insurance-Specific Rules (Non-Life / Skadeförsäkring)

- Sektion D from business docs: firmatecknare verification, authority checks
- Requires insurance-specific extraction fields
- New document type or sub-type for skadeförsäkring

## Rule Versioning & Audit Trail

- Track which version of a rule was active when a document was checked
- Important for: "this document was compliant at the time of advice"
- Store rule definition snapshot with each compliance run

## ESG Deep Checks (Tier 2)

- Binary question: was sustainability asked? (Tier 1 — already in v1)
- If yes: are PAI / Taxonomy / SFDR specifics documented? (Tier 2)
- Preference adjustment detection: did client change preferences to match product? If so, is original preference + reasoning documented?

## Scoring Refinements

- Category-level sub-scores (Metadata: 95, KYC: 72, Recommendations: 100)
- Weighted categories (KYC matters more than metadata)
- Organization-configurable weights
- Score history per document (track improvement through re-uploads)

## Export & Reporting

- Export compliance report as PDF (for audit purposes)
- CSV export of all document scores
- Scheduled compliance summary emails to managers
