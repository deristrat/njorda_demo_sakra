"""Seed the database with test documents for compliance engine demo.


Creates investment_advice documents based on the perfect_advice template,
each with targeted gaps to trigger specific compliance rules.

Usage:
    uv run python -m src.seed_test_documents
"""

from __future__ import annotations

import copy
import uuid
from pathlib import Path

from sqlalchemy import select

from src.compliance.seed import seed_default_rules
from src.database import SessionLocal
from src.models import Client, Document, DocumentExtraction
from src.models.advisor import Advisor
from src.routers.compliance import run_compliance_for_document

# ---------------------------------------------------------------------------
# Base template — derived from 1_perfect_advice.pdf extraction
# ---------------------------------------------------------------------------

PERFECT_EXTRACTION = {
    "source_filename": "",
    "extractor_name": "claude-sonnet",
    "document_type": "investment_advice",
    "document_date": "2026-02-15",
    "page_count": 3,
    "client": {
        "person_number": None,
        "person_name": None,
        "address": None,
        "email": None,
        "phone": None,
    },
    "advisor": {
        "advisor_name": None,
        "firm_name": None,
        "license_number": None,
    },
    "suitability": {
        "risk_profile": "medium",
        "investment_horizon": "15 år",
        "experience_level": "moderate",
        "financial_situation": (
            "Bruttoinkomst 45 000 SEK/månad, nettoinkomst 33 000 SEK/månad. "
            "Totala tillgångar 500 000 SEK, bostadslån 1 600 000 SEK. "
            "Stabil anställning och sparutrymme 5 000 SEK/månad."
        ),
        "investment_objective": "Långsiktigt sparande och tillväxt",
        "loss_tolerance": "Kan hantera tillfälliga nedgångar på upp till 20%",
    },
    "recommendations": [
        {
            "product_name": "Skandia Time Global",
            "isin": None,
            "amount": None,
            "percentage": 40.0,
            "motivation": "Global aktiefond som ger bred exponering, väl lämpad för kundens tillväxtmål och medelhöga riskprofil",
        },
        {
            "product_name": "Skandia Småbolag Sverige",
            "isin": None,
            "amount": None,
            "percentage": 25.0,
            "motivation": "Svensk småbolagsexponering för extra tillväxtpotential inom kundens riskram",
        },
        {
            "product_name": "Skandia Obligation",
            "isin": None,
            "amount": None,
            "percentage": 35.0,
            "motivation": "Obligationsfond för stabilitet och diversifiering som balanserar aktierisken",
        },
    ],
    "pension_provider_from": None,
    "pension_provider_to": None,
    "transfer_amount": None,
    "raw_data": {},
    "confidence_notes": [],
}


# ---------------------------------------------------------------------------
# Test document definitions
# ---------------------------------------------------------------------------

TEST_DOCUMENTS = [
    # ── Original PDFs (1-4) ─────────────────────────────────────────────
    # 1. GREEN — complete, well-documented advice (score ~100)
    {
        "filename": "1_perfect_advice.pdf",
        "client_name": "Erik Johansson",
        "client_pnr": "19850315-4521",
        "advisor_name": "Anna Lindgren",
        "advisor_firm": "Nordisk Finansrådgivning AB",
        "document_date": "2026-01-15",
        "patches": {
            "document_date": "2026-01-15",
            "suitability": {
                "risk_profile": "medium",
                "investment_horizon": "20 år",
                "experience_level": "moderate",
                "financial_situation": (
                    "Bruttoinkomst 52 000 SEK/månad, nettoinkomst 38 500 SEK/månad. "
                    "Fasta utgifter 25 000 SEK/månad. Gift, 2 barn. "
                    "Totala tillgångar 750 000 SEK, befintligt sparande 350 000 SEK, "
                    "bostadslåneskuld 1 800 000 SEK, billån 45 000 SEK. "
                    "Fast anställning som projektledare på Volvo AB sedan 2018. "
                    "Partner arbetar deltid med inkomst ca 28 000 SEK/månad."
                ),
                "investment_objective": (
                    "Långsiktigt pensionssparande som komplement till tjänstepensionen. "
                    "Sekundärt mål: buffert för oförutsedda utgifter"
                ),
                "loss_tolerance": "Kan hantera tillfälliga nedgångar på upp till 25%",
            },
            "recommendations": [
                {
                    "product_name": "Skandia Time Global",
                    "isin": None,
                    "amount": None,
                    "percentage": 40.0,
                    "motivation": (
                        "Global aktiefond med riskklassificering 4/7 som ger bred "
                        "geografisk exponering. Matchar kundens medelhöga riskprofil "
                        "och långsiktiga tillväxtmål. Artikel 8 SFDR."
                    ),
                },
                {
                    "product_name": "Skandia Småbolag Sverige",
                    "isin": None,
                    "amount": None,
                    "percentage": 20.0,
                    "motivation": (
                        "Svensk småbolagsfond (risk 5/7) för extra tillväxtpotential. "
                        "Artikel 8 SFDR, möter kundens hållbarhetspreferenser."
                    ),
                },
                {
                    "product_name": "Skandia Obligation",
                    "isin": None,
                    "amount": None,
                    "percentage": 25.0,
                    "motivation": (
                        "Obligationsfond (risk 2/7) som ger stabilitet och balanserar "
                        "aktierisken i portföljen. Artikel 8 SFDR."
                    ),
                },
                {
                    "product_name": "Skandia Räntefond",
                    "isin": None,
                    "amount": None,
                    "percentage": 15.0,
                    "motivation": (
                        "Korträntefond (risk 1/7) för ytterligare stabilitet "
                        "och likviditet i portföljen."
                    ),
                },
            ],
        },
        "expected_rule": "NONE (perfect)",
    },
    # 2. YELLOW — missing fund-level recs, no loss tolerance stated
    {
        "filename": "2_missing_fields.pdf",
        "client_name": "Maria Larsson",
        "client_pnr": "19780622-8834",
        "advisor_name": "Johan Berg",
        "advisor_firm": "Södermalm Förmedling AB",
        "document_date": "2026-01-20",
        "patches": {
            "document_date": "2026-01-20",
            "suitability": {
                "risk_profile": "medium",
                "investment_horizon": "15 år",
                "experience_level": "limited",
                "financial_situation": (
                    "Bruttoinkomst 42 000 SEK/månad som sjuksköterska. "
                    "Tillgångar ca 400 000 SEK i fonder. "
                    "Bostadslån 1 500 000 SEK. Stabil inkomst."
                ),
                "investment_objective": "Pensionssparande",
                "loss_tolerance": None,
            },
            "recommendations": [
                {
                    "product_name": "Folksam Fondförsäkring",
                    "isin": None,
                    "amount": None,
                    "percentage": 100.0,
                    "motivation": None,
                },
            ],
        },
        "expected_rule": "KYC_005 + REC_002",
    },
    # 3. GREEN — pension transfer, well-documented
    {
        "filename": "3_pension_transfer.pdf",
        "client_name": "Anders Nilsson",
        "client_pnr": "19720814-3345",
        "advisor_name": "Karin Ek",
        "advisor_firm": "Pensionsrådgivarna i Stockholm AB",
        "document_date": "2026-02-01",
        "patches": {
            "document_type": "pension_transfer",
            "document_date": "2026-02-01",
            "suitability": {
                "risk_profile": "medium_high",
                "investment_horizon": "18 år",
                "experience_level": "extensive",
                "financial_situation": (
                    "Bruttoinkomst 65 000 SEK/månad, nettoinkomst 47 000 SEK/månad. "
                    "Fasta utgifter 32 000 SEK/månad, sparutrymme 10 000 SEK/månad. "
                    "Totala tillgångar 1 200 000 SEK. Bostadslån 2 100 000 SEK. "
                    "Anställd på Ericsson AB."
                ),
                "investment_objective": "Optimera befintlig tjänstepension för maximal tillväxt",
                "loss_tolerance": "Kan acceptera 30% nedgång kortsiktigt",
            },
            "pension_provider_from": "Alecta",
            "pension_provider_to": "Avanza Pension",
            "transfer_amount": 850000,
            "recommendations": [
                {
                    "product_name": "Avanza Global",
                    "isin": None,
                    "amount": None,
                    "percentage": 50.0,
                    "motivation": (
                        "Global aktiefond (risk 5/7) för bred tillväxtexponering. "
                        "Låg avgift 0,30% matchar kundens fokus på kostnadseffektivitet"
                    ),
                },
                {
                    "product_name": "Avanza Sverige",
                    "isin": None,
                    "amount": None,
                    "percentage": 25.0,
                    "motivation": (
                        "Svensk aktiefond (risk 5/7) för nordisk exponering. "
                        "Avgift 0,40%"
                    ),
                },
                {
                    "product_name": "Avanza Ränta",
                    "isin": None,
                    "amount": None,
                    "percentage": 25.0,
                    "motivation": (
                        "Räntefond (risk 2/7) för stabilitet i portföljen. "
                        "Låg avgift 0,15%"
                    ),
                },
            ],
        },
        "expected_rule": "NONE (complete pension transfer)",
    },
    # 4. RED — minimal bad doc, missing almost everything
    {
        "filename": "4_minimal_bad.pdf",
        "client_name": "Per Svensson",
        "client_pnr": None,
        "advisor_name": None,
        "advisor_firm": None,
        "document_date": "2026-01-25",
        "patches": {
            "document_date": "2026-01-25",
            "advisor": {
                "advisor_name": None,
                "firm_name": None,
                "license_number": None,
            },
            "suitability": None,
            "recommendations": [
                {
                    "product_name": "Avanza Auto 6",
                    "isin": None,
                    "amount": None,
                    "percentage": 100.0,
                    "motivation": "Bra produkt med låga avgifter",
                },
            ],
        },
        "expected_rule": "KYC_000 + META_001 + META_002 (RED)",
    },
    # ── Synthetic test documents (5-11) ─────────────────────────────────
    # 5. GREEN — missing only document date (META_003, -3 → score 97)
    {
        "filename": "5_missing_date.pdf",
        "client_name": "Lena Eriksson",
        "client_pnr": "19900412-2245",
        "advisor_name": "Anna Lindgren",
        "advisor_firm": "Nordisk Finansrådgivning AB",
        "document_date": "2026-02-10",
        "patches": {
            "document_date": None,
            "suitability": {
                "risk_profile": "medium",
                "investment_horizon": "20 år",
                "experience_level": "moderate",
                "financial_situation": (
                    "Lena Eriksson arbetar som civilingenjör på Ericsson med bruttoinkomst "
                    "48 000 SEK/månad, nettoinkomst 35 000 SEK/månad. Sambo, inga barn. "
                    "Totala tillgångar 420 000 SEK (varav 180 000 i aktier), "
                    "bostadslån 1 500 000 SEK. Sparutrymme 6 000 SEK/månad efter fasta utgifter."
                ),
                "investment_objective": (
                    "Lena vill bygga långsiktigt sparande inför framtida bostadsköp "
                    "och pensionsändamål med fokus på tillväxt"
                ),
                "loss_tolerance": "Kan hantera tillfälliga nedgångar upp till 25% givet den långa tidshorisonten",
            },
            "recommendations": [
                {
                    "product_name": "Skandia Time Global",
                    "isin": None,
                    "amount": None,
                    "percentage": 45.0,
                    "motivation": (
                        "Global aktiefond som matchar Lenas tillväxtmål och medelhöga riskprofil. "
                        "Bred geografisk diversifiering som minskar enskild marknadsrisk, "
                        "lämplig för hennes 20-åriga tidshorisont"
                    ),
                },
                {
                    "product_name": "Skandia Sverige",
                    "isin": None,
                    "amount": None,
                    "percentage": 25.0,
                    "motivation": (
                        "Svensk aktiefond som ger exponering mot den nordiska marknaden "
                        "som Lena har erfarenhet av genom sitt befintliga aktieinnehav. "
                        "Kompletterar den globala fonden med lokal exponering"
                    ),
                },
                {
                    "product_name": "Skandia Obligation",
                    "isin": None,
                    "amount": None,
                    "percentage": 30.0,
                    "motivation": (
                        "Obligationsfond som balanserar aktierisken i portföljen och "
                        "ger stabilitet. 30% ränteandel speglar Lenas vilja att inte ta "
                        "alltför hög risk trots lång horisont"
                    ),
                },
            ],
        },
        "expected_rule": "META_003",
    },
    # 2. GREEN — recommendations missing motivation (REC_002, -4 → score 96)
    {
        "filename": "6_missing_motivation.pdf",
        "client_name": "Magnus Holm",
        "client_pnr": "19820918-5567",
        "advisor_name": "Johan Berg",
        "advisor_firm": "Södermalm Förmedling AB",
        "document_date": "2026-02-12",
        "patches": {
            "suitability": {
                "risk_profile": "medium_high",
                "investment_horizon": "15 år",
                "experience_level": "extensive",
                "financial_situation": (
                    "Magnus Holm är egenföretagare inom IT-konsulting med bruttoinkomst "
                    "75 000 SEK/månad. Gift, 2 barn. Totala tillgångar 1 200 000 SEK "
                    "(varav 600 000 i fonder och 200 000 i aktier), bostadslån 2 200 000 SEK. "
                    "Sparutrymme 12 000 SEK/månad."
                ),
                "investment_objective": (
                    "Magnus vill maximera avkastning på sitt överskott med fokus på "
                    "tillväxt och pensionsplanering, medveten om att han saknar "
                    "tjänstepension som egenföretagare"
                ),
                "loss_tolerance": "Hög tolerans — kan hantera nedgångar upp till 35% utan att ändra strategi",
            },
            "recommendations": [
                {
                    "product_name": "Handelsbanken Hållbar Global",
                    "isin": None,
                    "amount": None,
                    "percentage": 50.0,
                    "motivation": None,
                },
                {
                    "product_name": "Länsförsäkringar Fastighetsfond",
                    "isin": None,
                    "amount": None,
                    "percentage": 30.0,
                    "motivation": None,
                },
                {
                    "product_name": "Spiltan Räntefond Sverige",
                    "isin": None,
                    "amount": None,
                    "percentage": 20.0,
                    "motivation": (
                        "Korträntefond som ger likviditet och stabilitet i portföljen, "
                        "balanserar de mer volatila aktie- och fastighetsinnehaven"
                    ),
                },
            ],
        },
        "expected_rule": "REC_002",
    },
    # 3. GREEN — missing risk profile (KYC_002, -10 → score 90)
    {
        "filename": "7_no_risk_profile.pdf",
        "client_name": "Sofia Andersson",
        "client_pnr": "19951103-3378",
        "advisor_name": "Anna Lindgren",
        "advisor_firm": "Nordisk Finansrådgivning AB",
        "document_date": "2026-02-18",
        "patches": {
            "suitability": {
                "risk_profile": None,
                "investment_horizon": "10 år",
                "experience_level": "limited",
                "financial_situation": (
                    "Sofia Andersson arbetar som lärare i Göteborg med bruttoinkomst "
                    "38 000 SEK/månad, nettoinkomst 28 500 SEK/månad. Ensamstående, "
                    "inga barn. Tillgångar 200 000 SEK i banksparande, "
                    "bostadslån 1 200 000 SEK. Sparutrymme 3 500 SEK/månad."
                ),
                "investment_objective": (
                    "Sofia vill påbörja ett pensionssparande utöver tjänstepensionen "
                    "med fokus på stabil avkastning snarare än maximal tillväxt"
                ),
                "loss_tolerance": "Kan acceptera tillfälliga nedgångar upp till 15% givet 10 års sparhorisont",
            },
            "recommendations": [
                {
                    "product_name": "Länsförsäkringar Global Indexnära",
                    "isin": None,
                    "amount": None,
                    "percentage": 40.0,
                    "motivation": (
                        "Lågkostnadsfond med global exponering som passar Sofias "
                        "begränsade erfarenhet och önskan om stabil avkastning. "
                        "Indexnära förvaltning minimerar avgifter"
                    ),
                },
                {
                    "product_name": "Skandia Obligation",
                    "isin": None,
                    "amount": None,
                    "percentage": 35.0,
                    "motivation": (
                        "Obligationsfond som ger stabilitet och lägre volatilitet, "
                        "passar Sofias önskan om trygg avkastning och hennes "
                        "begränsade förlusttolerans på 15%"
                    ),
                },
                {
                    "product_name": "Spiltan Räntefond Sverige",
                    "isin": None,
                    "amount": None,
                    "percentage": 25.0,
                    "motivation": (
                        "Korträntefond som ytterligare sänker portföljens volatilitet "
                        "och ger god likviditet. Sofias sparutrymme är begränsat "
                        "så kapitaltrygghet prioriteras"
                    ),
                },
            ],
        },
        "expected_rule": "KYC_002",
    },
    # 4. YELLOW — missing financial situation + loss tolerance
    #    (KYC_001 -10, KYC_005 -8 → score 82)
    {
        "filename": "8_weak_kyc.pdf",
        "client_name": "Lars Pettersson",
        "client_pnr": "19770305-4412",
        "advisor_name": "Johan Berg",
        "advisor_firm": "Södermalm Förmedling AB",
        "document_date": "2026-01-28",
        "patches": {
            "suitability": {
                "risk_profile": "medium_high",
                "investment_horizon": "20 år",
                "experience_level": "extensive",
                "financial_situation": None,
                "investment_objective": (
                    "Lars vill bygga en offensiv portfölj med fokus på "
                    "långsiktig kapitaltillväxt inför pensionen"
                ),
                "loss_tolerance": None,
            },
            "recommendations": [
                {
                    "product_name": "SEB Global Fond",
                    "isin": None,
                    "amount": None,
                    "percentage": 50.0,
                    "motivation": (
                        "Global aktiefond som matchar Lars medel-höga riskprofil "
                        "och hans önskan om offensiv tillväxt. Lämplig givet "
                        "hans 20-åriga horisont och breda erfarenhet av finansmarknaden"
                    ),
                },
                {
                    "product_name": "Nordea Småbolagsfond Norden",
                    "isin": None,
                    "amount": None,
                    "percentage": 30.0,
                    "motivation": (
                        "Nordisk småbolagsfond som ger extra tillväxtpotential. "
                        "Lars har bred erfarenhet och förstår de risker som "
                        "följer med småbolagsinvesteringar"
                    ),
                },
                {
                    "product_name": "Skandia Obligation",
                    "isin": None,
                    "amount": None,
                    "percentage": 20.0,
                    "motivation": (
                        "Obligationsfond som ger viss stabilitet i portföljen "
                        "och balanserar den höga aktieexponeringen"
                    ),
                },
            ],
        },
        "expected_rule": "KYC_001 + KYC_005",
    },
    # 5. AI-triggered — low-risk client with high-risk recs (REC_003, -12)
    {
        "filename": "9_risk_mismatch.pdf",
        "client_name": "Ingrid Wallin",
        "client_pnr": "19630721-6690",
        "advisor_name": "Karin Ek",
        "advisor_firm": "Pensionsrådgivarna i Stockholm AB",
        "document_date": "2026-02-20",
        "patches": {
            "suitability": {
                "risk_profile": "low",
                "investment_horizon": "3 år",
                "experience_level": "limited",
                "financial_situation": (
                    "Ingrid Wallin är pensionär sedan 2023 med allmän pension 14 000 SEK/månad "
                    "och tjänstepension 8 000 SEK/månad, totalt 22 000 SEK/månad. "
                    "Tillgångar 800 000 SEK varav 400 000 på sparkonto. "
                    "Inga skulder. Begränsat sparutrymme ca 2 000 SEK/månad."
                ),
                "investment_objective": "Kapitalbevarande med viss avkastning utöver inflation",
                "loss_tolerance": "Kan inte hantera större nedgångar — max 5-10% givet pensionärsinkomst och kort horisont",
            },
            "recommendations": [
                {
                    "product_name": "Swedbank Robur Technology",
                    "isin": None,
                    "amount": None,
                    "percentage": 50.0,
                    "motivation": "Teknikfond med hög tillväxtpotential för att maximera avkastning",
                },
                {
                    "product_name": "Carnegie Småbolagsfond",
                    "isin": None,
                    "amount": None,
                    "percentage": 30.0,
                    "motivation": "Småbolagsfond för extra avkastning genom exponering mot tillväxtbolag",
                },
                {
                    "product_name": "AMF Räntefond Kort",
                    "isin": None,
                    "amount": None,
                    "percentage": 20.0,
                    "motivation": "Korträntefond för viss stabilitet i portföljen",
                },
            ],
        },
        "expected_rule": "REC_003 (AI)",
    },
    # 6. YELLOW — multiple gaps: advisor name + experience + horizon + objective
    #    (META_001 -12, KYC_004 -8, KYC_003 -4, KYC_006 -4 → score 72)
    {
        "filename": "10_multiple_gaps.pdf",
        "client_name": "Thomas Björk",
        "client_pnr": "19880614-7789",
        "advisor_name": "Karin Ek",
        "advisor_firm": "Pensionsrådgivarna i Stockholm AB",
        "document_date": "2026-02-05",
        "patches": {
            "advisor": {
                "advisor_name": None,
                "firm_name": "Pensionsrådgivarna i Stockholm AB",
                "license_number": None,
            },
            "suitability": {
                "risk_profile": "medium",
                "investment_horizon": None,
                "experience_level": None,
                "financial_situation": (
                    "Thomas Björk driver eget företag inom byggbranschen med "
                    "varierande inkomst ca 50 000 SEK/månad brutto. Gift, 3 barn. "
                    "Tillgångar 350 000 SEK i fonder, företagslån 500 000 SEK, "
                    "bostadslån 2 800 000 SEK. Sparutrymme 4 000-8 000 SEK/månad."
                ),
                "investment_objective": None,
                "loss_tolerance": "Accepterar måttlig risk — kan tolerera nedgångar på 15-20%",
            },
            "recommendations": [
                {
                    "product_name": "Swedbank Robur Access Global",
                    "isin": None,
                    "amount": None,
                    "percentage": 40.0,
                    "motivation": (
                        "Bred global aktiefond med medelhög risknivå som matchar "
                        "Thomas riskprofil. Indexnära förvaltning ger låga avgifter"
                    ),
                },
                {
                    "product_name": "Handelsbanken Sverige Selektiv",
                    "isin": None,
                    "amount": None,
                    "percentage": 25.0,
                    "motivation": (
                        "Svensk aktiefond med fokus på kvalitetsbolag. "
                        "Ger exponering mot den svenska marknaden som Thomas "
                        "har viss förståelse för genom sitt egna företagande"
                    ),
                },
                {
                    "product_name": "AMF Räntefond Lång",
                    "isin": None,
                    "amount": None,
                    "percentage": 35.0,
                    "motivation": (
                        "Räntefond som stabiliserar portföljen och ger skydd vid "
                        "marknadsoro. 35% ränteandel speglar Thomas måttliga risktolerans "
                        "och behovet av trygghet med varierande företagsinkomst"
                    ),
                },
            ],
        },
        "expected_rule": "META_001 + KYC_003 + KYC_004 + KYC_006",
    },
    # 7. RED — incomplete document: no suitability at all + no advisor details + no date
    #    KYC_000 -15, META_001 -12, META_002 -10, META_003 -3 → score 60 before AI
    #    Children of KYC_000 skipped, REC_003 may fire → likely red
    {
        "filename": "11_incomplete_draft.pdf",
        "client_name": "Björn Sundström",
        "client_pnr": "19810227-1156",
        "advisor_name": "Johan Berg",
        "advisor_firm": "Södermalm Förmedling AB",
        "document_date": "2026-01-15",
        "patches": {
            "document_date": None,
            "advisor": {
                "advisor_name": None,
                "firm_name": None,
                "license_number": None,
            },
            "suitability": None,
            "recommendations": [
                {
                    "product_name": "Avanza Auto 5",
                    "isin": None,
                    "amount": None,
                    "percentage": 60.0,
                    "motivation": "Enkel fondlösning",
                },
                {
                    "product_name": "Avanza Auto 3",
                    "isin": None,
                    "amount": None,
                    "percentage": 40.0,
                    "motivation": "Lägre risk",
                },
            ],
        },
        "expected_rule": "KYC_000 + META_001 + META_002 + META_003 (RED)",
    },
]


def _build_extraction(doc_def: dict) -> dict:
    """Build extraction data from base template + patches."""
    data = copy.deepcopy(PERFECT_EXTRACTION)
    data["source_filename"] = f"{uuid.uuid4().hex}.pdf"

    # Set client info
    data["client"]["person_name"] = doc_def["client_name"]
    data["client"]["person_number"] = doc_def["client_pnr"]

    # Set advisor info
    data["advisor"]["advisor_name"] = doc_def["advisor_name"]
    data["advisor"]["firm_name"] = doc_def["advisor_firm"]

    # Set document date
    data["document_date"] = doc_def["document_date"]

    # Apply patches (overrides)
    for key, value in doc_def.get("patches", {}).items():
        data[key] = value

    return data


def _get_or_create_client(db, person_name: str, person_number: str) -> Client:
    """Find existing client or create new one."""
    client = db.execute(
        select(Client).where(Client.person_number == person_number)
    ).scalar_one_or_none()
    if client:
        return client

    client = Client(person_name=person_name, person_number=person_number)
    db.add(client)
    db.flush()
    return client


def _get_advisor(db, advisor_name: str) -> Advisor | None:
    """Find advisor by name."""
    return db.execute(
        select(Advisor).where(Advisor.advisor_name == advisor_name)
    ).scalar_one_or_none()


TEST_PDF_DIR = Path(__file__).resolve().parent.parent.parent / "test_pdfs"


def seed_test_documents() -> None:
    db = SessionLocal()
    try:
        # Ensure compliance rules exist
        seed_default_rules(db)

        # Get admin user for document ownership
        from src.models import User
        admin_user = db.execute(
            select(User).where(User.role == "njorda_admin")
        ).scalar_one()

        created = 0
        for doc_def in TEST_DOCUMENTS:
            # Skip if document already exists
            existing = db.execute(
                select(Document).where(
                    Document.original_filename == doc_def["filename"]
                )
            ).scalars().first()
            if existing:
                print(f"  Skipping {doc_def['filename']} (already exists)")
                continue

            # Build extraction data
            extraction_data = _build_extraction(doc_def)

            # Get or create client (skip if no personnummer)
            client = None
            if doc_def.get("client_pnr"):
                client = _get_or_create_client(
                    db, doc_def["client_name"], doc_def["client_pnr"]
                )

            # Find advisor
            advisor = None
            if doc_def.get("advisor_name"):
                advisor = _get_advisor(db, doc_def["advisor_name"])

            # Load PDF file data from test_pdfs/ if available
            pdf_path = TEST_PDF_DIR / doc_def["filename"]
            file_data = pdf_path.read_bytes() if pdf_path.exists() else None
            file_size = len(file_data) if file_data else 50000

            # Create document
            doc = Document(
                original_filename=doc_def["filename"],
                stored_filename=extraction_data["source_filename"],
                file_hash=uuid.uuid4().hex,
                file_size=file_size,
                file_data=file_data,
                mime_type="application/pdf",
                status="completed",
                user_id=admin_user.id,
                client_id=client.id if client else None,
                advisor_id=advisor.id if advisor else None,
            )
            db.add(doc)
            db.flush()

            # Create extraction
            ext = DocumentExtraction(
                document_id=doc.id,
                extractor_name="claude-sonnet",
                status="completed",
                extraction_data=extraction_data,
                document_type=extraction_data["document_type"],
                document_date=extraction_data.get("document_date"),
                page_count=extraction_data.get("page_count"),
                client_name=doc_def["client_name"],
                advisor_name=doc_def["advisor_name"],
            )
            db.add(ext)
            db.commit()

            # Run compliance checks
            report = run_compliance_for_document(doc, db)
            print(
                f"  {doc_def['filename']}: score={report.score}, "
                f"status={report.status}, "
                f"failed={[o.rule_id for o in report.outcomes if o.status == 'failed']}, "
                f"expected={doc_def['expected_rule']}"
            )
            created += 1

        print(f"\nSeeded {created} test documents.")
    finally:
        db.close()


if __name__ == "__main__":
    print("Seeding test documents...\n")
    seed_test_documents()
