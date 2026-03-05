#!/usr/bin/env python3
"""Generate test PDF advisory documents (5-11) for the Säkra compliance demo.

Each PDF follows the format of a Swedish Rådgivningsdokumentation with
intentional gaps to trigger specific compliance rules.

Usage: backend/.venv/bin/python generate_test_pdfs.py
"""

from __future__ import annotations

import os
from fpdf import FPDF

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "test_pdfs")


class AdvisoryPDF(FPDF):
    """Generates a Swedish advisory documentation PDF."""

    def __init__(self, firm_name: str, firm_org: str):
        super().__init__()
        self.firm_name = firm_name
        self.firm_org = firm_org
        self.alias_nb_pages()
        self.set_auto_page_break(auto=True, margin=25)
        # Add a Unicode-capable font from macOS system fonts
        font_path = "/System/Library/Fonts/Supplemental/Arial.ttf"
        bold_path = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
        if os.path.exists(font_path):
            self.add_font("Arial", "", font_path)
            self.add_font("Arial", "B", bold_path)
            self._uni_font = "Arial"
        else:
            self._uni_font = "Helvetica"

    def header(self):
        self.set_font(self._uni_font, "", 9)
        self.cell(0, 4, self.firm_name, align="R")
        self.ln(4)
        self.set_font(self._uni_font, "", 8)
        self.cell(0, 4, f"Org.nr: {self.firm_org}", align="R")
        self.ln(8)

    def footer(self):
        self.set_y(-15)
        self.set_font(self._uni_font, "", 8)
        self.cell(0, 10, f"Sida {self.page_no()}/{{nb}}", align="C")

    def doc_title(self):
        self.set_font(self._uni_font, "B", 20)
        self.cell(0, 15, "Rådgivningsdokumentation", align="C")
        self.ln(15)

    def section(self, num: str, title: str):
        self.set_font(self._uni_font, "B", 13)
        self.ln(3)
        self.cell(0, 10, f" {num}. {title}")
        self.ln(10)

    def subsection(self, num: str, title: str):
        self.set_font(self._uni_font, "B", 10)
        self.cell(0, 8, f"{num} {title}")
        self.ln(7)

    def kv(self, key: str, value: str):
        self.set_font(self._uni_font, "B", 9)
        self.cell(58, 6, f"{key}:")
        self.set_font(self._uni_font, "", 9)
        self.multi_cell(0, 6, value)
        self.ln(1)

    def para(self, text: str):
        self.set_font(self._uni_font, "", 9)
        self.multi_cell(0, 5, text)
        self.ln(3)

    def table(self, headers: list[str], rows: list[list[str]], col_widths: list[int] | None = None):
        if col_widths is None:
            w = int(170 / len(headers))
            col_widths = [w] * len(headers)
        # Header
        self.set_font(self._uni_font, "B", 9)
        self.set_fill_color(210, 218, 226)
        for i, h in enumerate(headers):
            self.cell(col_widths[i], 7, h, border=1, fill=True, align="C")
        self.ln()
        # Rows
        self.set_font(self._uni_font, "", 9)
        for row in rows:
            for i, val in enumerate(row):
                self.cell(col_widths[i], 6, val, border=1, align="C")
            self.ln()
        self.ln(4)


# ---------------------------------------------------------------------------
# Document definitions
# ---------------------------------------------------------------------------

DOCUMENTS = [
    # 5. Missing date
    {
        "filename": "5_missing_date.pdf",
        "firm": ("Nordisk Finansrådgivning AB", "556789-1234"),
        "advisor": {"name": "Anna Lindgren", "role": "Licensierad förmedlare, InsureSec-certifierad"},
        "date": None,
        "client": {
            "name": "Lena Eriksson", "pnr": "19900412-2245",
            "category": "Privatperson", "civil": "Sambo", "children": "Inga",
        },
        "financials": [
            ["Bruttoinkomst", "48 000", "Per månad"],
            ["Nettoinkomst", "35 000", "Per månad"],
            ["Fasta utgifter", "22 000", "Per månad"],
            ["Sparutrymme", "6 000", "Per månad"],
            ["Totala tillgångar", "420 000", ""],
            ["Befintligt sparande", "180 000", "Aktier"],
            ["Bostadslåneskuld", "1 500 000", ""],
        ],
        "financial_note": (
            "Lena arbetar som civilingenjör på Ericsson med stabil anställning sedan 2019. "
            "Sambo, inga barn. God ekonomisk situation med stabilt sparutrymme."
        ),
        "goals": {"primary": "Långsiktigt sparande / bostadsköp", "secondary": "Pensionssparande", "horizon": "20 år"},
        "risk": {"level": "Medel (4 av 7)", "tolerance": "Kan hantera tillfälliga nedgångar upp till 25% givet den långa tidshorisonten"},
        "risk_note": "Lena har en balanserad syn på risk och förstår att högre avkastning kräver högre risk.",
        "experience": {"funds": "Ja, sedan 2020", "stocks": "Viss erfarenhet", "structured": "Ingen", "level": "Medel"},
        "experience_note": "Lena har grundläggande förståelse för fondsparande och riskspridning.",
        "loss_capacity": (
            "Med hänsyn till Lenas stabila anställning, begränsade skuldsättning och långa "
            "tidshorisont bedöms hon ha god förmåga att bära förluster."
        ),
        "product": {"name": "Fondportfölj via Nordisk Finansrådgivning", "type": "Fondportfölj", "premium": "6 000 SEK per månad", "binding": "Ingen bindningstid"},
        "funds": [
            ["Skandia Time Global", "45%", "4/7", "Artikel 8"],
            ["Skandia Sverige", "25%", "5/7", "Artikel 8"],
            ["Skandia Obligation", "30%", "2/7", "Artikel 8"],
        ],
        "fund_motivations": [
            ("Skandia Time Global (45%)", "Global aktiefond som matchar Lenas tillväxtmål och medelhöga riskprofil. Bred geografisk diversifiering, lämplig för 20-årig tidshorisont."),
            ("Skandia Sverige (25%)", "Svensk aktiefond som ger exponering mot den nordiska marknaden. Kompletterar den globala fonden med lokal exponering."),
            ("Skandia Obligation (30%)", "Obligationsfond som balanserar aktierisken och ger stabilitet. 30% ränteandel speglar Lenas vilja att inte ta alltför hög risk."),
        ],
        "suitability": (
            "Fondportföljen rekommenderas eftersom den matchar Lena Erikssons mål om långsiktigt "
            "sparande med en tidshorisont på 20 år. Portföljens risk (medel) överensstämmer med "
            "hennes riskvilja och förmåga att bära förluster. Fördelningen med 70% aktiefonder "
            "och 30% räntefonder ger balans mellan tillväxt och stabilitet."
        ),
        "costs": [
            ["Plattformsavgift", "1 260", "0,35%"],
            ["Fondavgift (vägt snitt)", "3 240", "0,90%"],
            ["Total årlig kostnad", "4 500", "1,25%"],
        ],
        "broker": [["Engångsersättning", "0", "0%"], ["Löpande årlig ersättning", "1 440", "0,40%"]],
    },
    # 6. Missing motivation on recommendations
    {
        "filename": "6_missing_motivation.pdf",
        "firm": ("Södermalm Förmedling AB", "559012-3456"),
        "advisor": {"name": "Johan Berg", "role": "Licensierad rådgivare, SwedSec-certifierad"},
        "date": "2026-02-12",
        "client": {
            "name": "Magnus Holm", "pnr": "19820918-5567",
            "category": "Privatperson", "civil": "Gift", "children": "2 st (ålder 9 och 12)",
        },
        "financials": [
            ["Bruttoinkomst", "75 000", "Per månad"],
            ["Nettoinkomst", "52 000", "Per månad"],
            ["Fasta utgifter", "35 000", "Per månad"],
            ["Sparutrymme", "12 000", "Per månad"],
            ["Totala tillgångar", "1 200 000", ""],
            ["Befintligt sparande", "600 000", "Fonder"],
            ["Aktieinnehav", "200 000", ""],
            ["Bostadslåneskuld", "2 200 000", ""],
        ],
        "financial_note": (
            "Magnus är egenföretagare inom IT-konsulting med stabil verksamhet sedan 2015. "
            "Gift, 2 barn. Saknar tjänstepension som egenföretagare, vilket gör eget pensionssparande extra viktigt."
        ),
        "goals": {"primary": "Maximera avkastning / pensionsplanering", "secondary": "Kapitaltillväxt", "horizon": "15 år"},
        "risk": {"level": "Medel-hög (5 av 7)", "tolerance": "Hög tolerans \u2014 kan hantera nedgångar upp till 35% utan att ändra strategi"},
        "risk_note": "Magnus har hög risktolerans och förstår att han behöver ta mer risk för att kompensera avsaknaden av tjänstepension.",
        "experience": {"funds": "Ja, sedan 2012", "stocks": "Aktiv sedan 2015", "structured": "Viss erfarenhet", "level": "Omfattande"},
        "experience_note": "Magnus har bred erfarenhet av finansmarknaden genom eget aktiehandlande och fondsparande.",
        "loss_capacity": (
            "Med hänsyn till Magnus höga inkomst, goda sparutrymme och långa tidshorisont "
            "bedöms han ha mycket god förmåga att bära förluster."
        ),
        "product": {"name": "Fondportfölj via Södermalm Förmedling", "type": "Fondportfölj", "premium": "12 000 SEK per månad", "binding": "Ingen bindningstid"},
        "funds": [
            ["Handelsbanken Hållbar Global", "50%", "5/7", "Artikel 9"],
            ["Länsförsäkringar Fastighetsfond", "30%", "4/7", "Artikel 8"],
            ["Spiltan Räntefond Sverige", "20%", "1/7", "Artikel 6"],
        ],
        # NOTE: motivations deliberately missing for first two funds
        "fund_motivations": [
            ("Handelsbanken Hållbar Global (50%)", ""),  # MISSING
            ("Länsförsäkringar Fastighetsfond (30%)", ""),  # MISSING
            ("Spiltan Räntefond Sverige (20%)", "Korträntefond som ger likviditet och stabilitet i portföljen, balanserar de mer volatila aktie- och fastighetsinnehaven."),
        ],
        "suitability": (
            "Fondportföljen rekommenderas för Magnus Holm baserat på hans behov av långsiktigt "
            "pensionssparande och höga risktolerans. Portföljens risk (medel-hög) matchar hans "
            "riskprofil. Fördelningen med 80% tillväxtfonder och 20% räntefond ger offensiv "
            "exponering med viss stabilitet."
        ),
        "costs": [
            ["Plattformsavgift", "2 520", "0,35%"],
            ["Fondavgift (vägt snitt)", "7 200", "1,00%"],
            ["Total årlig kostnad", "9 720", "1,35%"],
        ],
        "broker": [["Engångsersättning", "0", "0%"], ["Löpande årlig ersättning", "2 880", "0,40%"]],
    },
    # 7. No risk profile
    {
        "filename": "7_no_risk_profile.pdf",
        "firm": ("Nordisk Finansrådgivning AB", "556789-1234"),
        "advisor": {"name": "Anna Lindgren", "role": "Licensierad förmedlare, InsureSec-certifierad"},
        "date": "2026-02-18",
        "client": {
            "name": "Sofia Andersson", "pnr": "19951103-3378",
            "category": "Privatperson", "civil": "Ensamstående", "children": "Inga",
        },
        "financials": [
            ["Bruttoinkomst", "38 000", "Per månad"],
            ["Nettoinkomst", "28 500", "Per månad"],
            ["Fasta utgifter", "20 000", "Per månad"],
            ["Sparutrymme", "3 500", "Per månad"],
            ["Totala tillgångar", "200 000", "Banksparande"],
            ["Bostadslåneskuld", "1 200 000", ""],
        ],
        "financial_note": (
            "Sofia arbetar som lärare i Göteborg med fast anställning. Ensamstående, inga barn. "
            "Begränsat sparutrymme men stabil inkomst."
        ),
        "goals": {"primary": "Pensionssparande utöver tjänstepension", "secondary": "Stabil avkastning", "horizon": "10 år"},
        "risk": None,  # MISSING
        "risk_note": None,
        "experience": {"funds": "Begränsad, sedan 2022", "stocks": "Ingen", "structured": "Ingen", "level": "Begränsad"},
        "experience_note": "Sofia har begränsad erfarenhet av finansmarknaden men intresse av att komma igång med sparande.",
        "loss_capacity": (
            "Med hänsyn till Sofias stabila men begränsade inkomst och kortare tidshorisont "
            "bedöms hon ha måttlig förmåga att bära förluster. Sparutrymmet är begränsat "
            "så kapitaltrygghet prioriteras."
        ),
        "product": {"name": "Fondportfölj via Nordisk Finansrådgivning", "type": "Fondportfölj", "premium": "3 500 SEK per månad", "binding": "Ingen bindningstid"},
        "funds": [
            ["LF Global Indexnära", "40%", "4/7", "Artikel 8"],
            ["Skandia Obligation", "35%", "2/7", "Artikel 8"],
            ["Spiltan Räntefond Sverige", "25%", "1/7", "Artikel 6"],
        ],
        "fund_motivations": [
            ("Länsförsäkringar Global Indexnära (40%)", "Lågkostnadsfond med global exponering som passar Sofias begränsade erfarenhet. Indexnära förvaltning minimerar avgifter."),
            ("Skandia Obligation (35%)", "Obligationsfond som ger stabilitet och lägre volatilitet, passar Sofias önskan om trygg avkastning."),
            ("Spiltan Räntefond Sverige (25%)", "Korträntefond som ytterligare sänker portföljens volatilitet och ger god likviditet."),
        ],
        "suitability": (
            "Fondportföljen rekommenderas för Sofia Andersson baserat på hennes mål om "
            "pensionssparande med 10 års horisont. Fördelningen med 40% aktiefonder och "
            "60% ränte-/obligationsfonder ger en försiktig portfölj som prioriterar stabilitet. "
            "Samtliga fonder har låga avgifter vilket är viktigt givet Sofias begränsade sparutrymme."
        ),
        "costs": [
            ["Plattformsavgift", "735", "0,35%"],
            ["Fondavgift (vägt snitt)", "1 470", "0,70%"],
            ["Total årlig kostnad", "2 205", "1,05%"],
        ],
        "broker": [["Engångsersättning", "0", "0%"], ["Löpande årlig ersättning", "840", "0,40%"]],
    },
    # 8. Weak KYC - missing financial situation and loss tolerance
    {
        "filename": "8_weak_kyc.pdf",
        "firm": ("Södermalm Förmedling AB", "559012-3456"),
        "advisor": {"name": "Johan Berg", "role": "Licensierad rådgivare, SwedSec-certifierad"},
        "date": "2026-01-28",
        "client": {
            "name": "Lars Pettersson", "pnr": "19770305-4412",
            "category": "Privatperson", "civil": "Gift", "children": "1 st (ålder 16)",
        },
        "financials": None,  # MISSING
        "financial_note": None,
        "goals": {"primary": "Offensiv kapitaltillväxt", "secondary": "Pensionsplanering", "horizon": "20 år"},
        "risk": {"level": "Medel-hög (5 av 7)", "tolerance": None},  # loss tolerance MISSING
        "risk_note": "Lars uttrycker intresse för offensiv förvaltning och har lång erfarenhet av finansmarknaden.",
        "experience": {"funds": "Ja, sedan 2005", "stocks": "Aktiv handlare sedan 2008", "structured": "Viss erfarenhet", "level": "Omfattande"},
        "experience_note": "Lars har bred och långvarig erfarenhet av olika tillgångsslag.",
        "loss_capacity": None,  # MISSING
        "product": {"name": "Fondportfölj via Södermalm Förmedling", "type": "Fondportfölj", "premium": "10 000 SEK per månad", "binding": "Ingen bindningstid"},
        "funds": [
            ["SEB Global Fond", "50%", "5/7", "Artikel 8"],
            ["Nordea Småbolagsfond Norden", "30%", "6/7", "Artikel 8"],
            ["Skandia Obligation", "20%", "2/7", "Artikel 8"],
        ],
        "fund_motivations": [
            ("SEB Global Fond (50%)", "Global aktiefond som matchar Lars medel-höga riskprofil och önskan om offensiv tillväxt. Lämplig givet 20-årig horisont."),
            ("Nordea Småbolagsfond Norden (30%)", "Nordisk småbolagsfond som ger extra tillväxtpotential. Lars har bred erfarenhet och förstår småbolagsrisker."),
            ("Skandia Obligation (20%)", "Obligationsfond som ger viss stabilitet och balanserar den höga aktieexponeringen."),
        ],
        "suitability": (
            "Fondportföljen rekommenderas för Lars Pettersson baserat på hans mål om offensiv "
            "kapitaltillväxt med 20 års horisont. Portföljens risk (medel-hög) matchar hans "
            "riskprofil och breda erfarenhet. Fördelningen med 80% aktiefonder och 20% "
            "obligationer ger offensiv exponering."
        ),
        "costs": [
            ["Plattformsavgift", "2 100", "0,35%"],
            ["Fondavgift (vägt snitt)", "6 600", "1,10%"],
            ["Total årlig kostnad", "8 700", "1,45%"],
        ],
        "broker": [["Engångsersättning", "0", "0%"], ["Löpande årlig ersättning", "2 400", "0,40%"]],
    },
    # 9. Risk mismatch - low risk client with high risk recommendations
    {
        "filename": "9_risk_mismatch.pdf",
        "firm": ("Pensionsrådgivarna i Stockholm AB", "556234-7890"),
        "advisor": {"name": "Karin Ek", "role": "Licensierad pensionsrådgivare, InsureSec-certifierad"},
        "date": "2026-02-20",
        "client": {
            "name": "Ingrid Wallin", "pnr": "19630721-6690",
            "category": "Privatperson", "civil": "Änka", "children": "2 vuxna barn",
        },
        "financials": [
            ["Allmän pension", "14 000", "Per månad"],
            ["Tjänstepension", "8 000", "Per månad"],
            ["Total inkomst", "22 000", "Per månad"],
            ["Fasta utgifter", "18 000", "Per månad"],
            ["Sparutrymme", "2 000", "Per månad"],
            ["Totala tillgångar", "800 000", ""],
            ["Sparkonto", "400 000", ""],
            ["Skulder", "0", ""],
        ],
        "financial_note": (
            "Ingrid är pensionär sedan 2023. Bor i bostadsrätt utan lån. "
            "Begränsat sparutrymme men inga skulder. Huvudsaklig inkomstkälla är pension."
        ),
        "goals": {"primary": "Kapitalbevarande", "secondary": "Avkastning utöver inflation", "horizon": "3 år"},
        "risk": {"level": "Låg (2 av 7)", "tolerance": "Kan inte hantera större nedgångar \u2014 max 5-10% givet pensionärsinkomst och kort horisont"},
        "risk_note": "Ingrid har låg risktolerans och prioriterar trygghet framför avkastning.",
        "experience": {"funds": "Begränsad, via tjänstepension", "stocks": "Ingen", "structured": "Ingen", "level": "Begränsad"},
        "experience_note": "Ingrid har begränsad erfarenhet utöver det val av fonder hon gjort inom tjänstepensionen.",
        "loss_capacity": (
            "Med hänsyn till Ingrids pensionärsinkomst, begränsade sparutrymme och korta "
            "tidshorisont bedöms hon ha låg förmåga att bära förluster. Kapitalet kan behöva "
            "användas inom 3 år."
        ),
        "product": {"name": "Fondportfölj via Pensionsrådgivarna", "type": "Fondportfölj", "premium": "Engångsinsättning 400 000 SEK", "binding": "Ingen bindningstid"},
        # NOTE: These are way too aggressive for a low-risk pensioner - that's the mismatch
        "funds": [
            ["Swedbank Robur Technology", "50%", "6/7", "Artikel 8"],
            ["Carnegie Småbolagsfond", "30%", "6/7", "Artikel 8"],
            ["AMF Räntefond Kort", "20%", "1/7", "Artikel 6"],
        ],
        "fund_motivations": [
            ("Swedbank Robur Technology (50%)", "Teknikfond med hög tillväxtpotential för att maximera avkastning."),
            ("Carnegie Småbolagsfond (30%)", "Småbolagsfond för extra avkastning genom exponering mot tillväxtbolag."),
            ("AMF Räntefond Kort (20%)", "Korträntefond för viss stabilitet i portföljen."),
        ],
        "suitability": (
            "Fondportföljen rekommenderas för Ingrid Wallin med målet att ge avkastning utöver "
            "inflation. Portföljen innehåller en kombination av tillväxtfonder och räntefonder."
        ),
        "costs": [
            ["Plattformsavgift", "1 400", "0,35%"],
            ["Fondavgift (vägt snitt)", "5 200", "1,30%"],
            ["Total årlig kostnad", "6 600", "1,65%"],
        ],
        "broker": [["Engångsersättning", "2 000", "0,50%"], ["Löpande årlig ersättning", "1 600", "0,40%"]],
    },
    # 10. Multiple gaps - missing advisor name, experience, horizon, objective
    {
        "filename": "10_multiple_gaps.pdf",
        "firm": ("Pensionsrådgivarna i Stockholm AB", "556234-7890"),
        "advisor": {"name": None, "role": None},  # MISSING
        "date": "2026-02-05",
        "client": {
            "name": "Thomas Björk", "pnr": "19880614-7789",
            "category": "Privatperson", "civil": "Gift", "children": "3 st (ålder 3, 6 och 10)",
        },
        "financials": [
            ["Bruttoinkomst", "~50 000", "Per månad (varierande)"],
            ["Fasta utgifter", "32 000", "Per månad"],
            ["Sparutrymme", "4 000\u20138 000", "Per månad"],
            ["Totala tillgångar", "350 000", "Fonder"],
            ["Företagslån", "500 000", ""],
            ["Bostadslåneskuld", "2 800 000", ""],
        ],
        "financial_note": (
            "Thomas driver eget företag inom byggbranschen med varierande inkomst. "
            "Gift, 3 barn. Hög skuldsättning men stabilt företag."
        ),
        "goals": {"primary": None, "secondary": None, "horizon": None},  # horizon MISSING, objective MISSING
        "risk": {"level": "Medel (4 av 7)", "tolerance": "Accepterar måttlig risk \u2014 kan tolerera nedgångar på 15-20%"},
        "risk_note": "Thomas har en balanserad syn på risk.",
        "experience": {"funds": None, "stocks": None, "structured": None, "level": None},  # MISSING
        "experience_note": None,
        "loss_capacity": (
            "Thomas har varierande inkomst vilket påverkar hans förmåga att bära förluster. "
            "Den höga skuldsättningen begränsar möjligheten att absorbera stora kapitalförluster."
        ),
        "product": {"name": "Fondportfölj via Pensionsrådgivarna", "type": "Fondportfölj", "premium": "5 000 SEK per månad", "binding": "Ingen bindningstid"},
        "funds": [
            ["Swedbank Robur Access Global", "40%", "4/7", "Artikel 8"],
            ["HB Sverige Selektiv", "25%", "5/7", "Artikel 8"],
            ["AMF Räntefond Lång", "35%", "2/7", "Artikel 8"],
        ],
        "fund_motivations": [
            ("Swedbank Robur Access Global (40%)", "Bred global aktiefond med medelhög risknivå. Indexnära förvaltning ger låga avgifter."),
            ("Handelsbanken Sverige Selektiv (25%)", "Svensk aktiefond med fokus på kvalitetsbolag."),
            ("AMF Räntefond Lång (35%)", "Räntefond som stabiliserar portföljen. 35% ränteandel speglar Thomas måttliga risktolerans."),
        ],
        "suitability": (
            "Fondportföljen rekommenderas med en fördelning av 65% aktiefonder och "
            "35% räntefonder. Portföljens risknivå (medel) matchar kundens riskprofil."
        ),
        "costs": [
            ["Plattformsavgift", "1 050", "0,35%"],
            ["Fondavgift (vägt snitt)", "2 700", "0,90%"],
            ["Total årlig kostnad", "3 750", "1,25%"],
        ],
        "broker": [["Engångsersättning", "0", "0%"], ["Löpande årlig ersättning", "1 200", "0,40%"]],
    },
    # 11. Incomplete draft - no date, no advisor, no suitability at all
    {
        "filename": "11_incomplete_draft.pdf",
        "firm": (None, None),  # MISSING
        "advisor": {"name": None, "role": None},  # MISSING
        "date": None,  # MISSING
        "client": {
            "name": "Björn Sundström", "pnr": "19810227-1156",
            "category": "Privatperson", "civil": None, "children": None,
        },
        "financials": None,  # MISSING
        "financial_note": None,
        "goals": None,  # ALL MISSING
        "risk": None,  # MISSING
        "risk_note": None,
        "experience": None,  # MISSING
        "experience_note": None,
        "loss_capacity": None,  # MISSING
        "product": {"name": "Fondportfölj", "type": "Fondportfölj", "premium": "Ej specificerat", "binding": "Ej specificerat"},
        "funds": [
            ["Avanza Auto 5", "60%", "5/7", "Artikel 8"],
            ["Avanza Auto 3", "40%", "3/7", "Artikel 8"],
        ],
        "fund_motivations": [
            ("Avanza Auto 5 (60%)", "Enkel fondlösning."),
            ("Avanza Auto 3 (40%)", "Lägre risk."),
        ],
        "suitability": None,  # MISSING
        "costs": None,
        "broker": None,
    },
]


def generate_pdf(doc: dict) -> str:
    """Generate a single advisory PDF and return the output path."""
    firm_name = doc["firm"][0] or "UTKAST"
    firm_org = doc["firm"][1] or ""
    pdf = AdvisoryPDF(firm_name, firm_org)
    pdf.add_page()
    pdf.doc_title()

    # --- Section 1: Company & Advisor ---
    pdf.section("1", "Företagsinformation och rådgivare")
    if doc["firm"][0]:
        pdf.kv("Företagsnamn", doc["firm"][0])
        pdf.kv("Organisationsnummer", doc["firm"][1])
    else:
        pdf.para("[Företagsinformation saknas]")

    advisor = doc.get("advisor", {})
    if advisor.get("name"):
        pdf.kv("Rådgivare", advisor["name"])
    if advisor.get("role"):
        pdf.kv("Roll", advisor["role"])
    if not advisor.get("name") and not advisor.get("role"):
        pdf.para("[Rådgivaruppgifter saknas]")

    if doc.get("date"):
        pdf.kv("Datum för rådgivning", doc["date"])
    pdf.ln(3)

    # --- Section 2: Client & Financials ---
    pdf.section("2", "Kunduppgifter och ekonomisk situation")
    client = doc.get("client", {})
    pdf.subsection("2.1", "Identitet")
    if client.get("name"):
        pdf.kv("Kundnamn", client["name"])
    if client.get("pnr"):
        pdf.kv("Personnummer", client["pnr"])
    if client.get("category"):
        pdf.kv("Kundkategori", client["category"])
    if client.get("civil"):
        pdf.kv("Civilstånd", client["civil"])
    if client.get("children"):
        pdf.kv("Barn", client["children"])
    pdf.ln(2)

    if doc.get("financials"):
        pdf.subsection("2.2", "Ekonomisk situation")
        pdf.table(
            ["Post", "Belopp (SEK)", "Period"],
            doc["financials"],
            [60, 50, 60],
        )
        if doc.get("financial_note"):
            pdf.para(doc["financial_note"])
    elif doc.get("financial_note"):
        pdf.subsection("2.2", "Ekonomisk situation")
        pdf.para(doc["financial_note"])

    # --- Section 3: Needs Analysis ---
    has_section3 = any([doc.get("goals"), doc.get("risk"), doc.get("experience"), doc.get("loss_capacity")])
    if has_section3:
        pdf.section("3", "Behovsanalys och mål")

        goals = doc.get("goals")
        if goals:
            pdf.subsection("3.1", "Investeringsmål")
            if goals.get("primary"):
                pdf.kv("Primärt mål", goals["primary"])
            if goals.get("secondary"):
                pdf.kv("Sekundärt mål", goals["secondary"])
            if goals.get("horizon"):
                pdf.kv("Tidshorisont", goals["horizon"])
            pdf.ln(2)

        risk = doc.get("risk")
        if risk:
            pdf.subsection("3.2", "Riskprofil")
            if risk.get("level"):
                pdf.kv("Riskvilja", risk["level"])
            if risk.get("tolerance"):
                pdf.kv("Risktolerans", risk["tolerance"])
            if doc.get("risk_note"):
                pdf.para(doc["risk_note"])
        elif doc.get("risk_note"):
            pdf.subsection("3.2", "Riskprofil")
            pdf.para(doc["risk_note"])

        exp = doc.get("experience")
        if exp and any(exp.get(k) for k in ["funds", "stocks", "structured", "level"]):
            pdf.subsection("3.3", "Kunskap och erfarenhet")
            if exp.get("funds"):
                pdf.kv("Erfarenhet av fondsparande", exp["funds"])
            if exp.get("stocks"):
                pdf.kv("Erfarenhet av aktier", exp["stocks"])
            if exp.get("structured"):
                pdf.kv("Erfarenhet av strukturerade produkter", exp["structured"])
            if exp.get("level"):
                pdf.kv("Kunskapsnivå", exp["level"])
            if doc.get("experience_note"):
                pdf.para(doc["experience_note"])

        if doc.get("loss_capacity"):
            pdf.subsection("3.4", "Förmåga att bära förluster")
            pdf.para(doc["loss_capacity"])

    # --- Section 4: Sustainability (standard for all except 11) ---
    if doc.get("financials") is not None or doc.get("goals") is not None:
        pdf.section("4", "Hållbarhetspreferenser")
        pdf.kv("Tillfrågad om hållbarhet", "Ja")
        pdf.kv("Har preferenser", "Nej, inga specifika hållbarhetspreferenser")
        pdf.ln(2)

    # --- Section 5: Recommendation ---
    pdf.section("5", "Rekommendation")
    product = doc.get("product", {})
    pdf.subsection("5.1", "Rekommenderad produkt")
    if product.get("name"):
        pdf.kv("Produktnamn", product["name"])
    if product.get("type"):
        pdf.kv("Produkttyp", product["type"])
    if product.get("premium"):
        pdf.kv("Premie/insättning", product["premium"])
    if product.get("binding"):
        pdf.kv("Bindningstid", product["binding"])
    pdf.ln(2)

    if doc.get("funds"):
        pdf.subsection("5.2", "Fondval")
        pdf.table(
            ["Fond", "Andel", "Risk", "SFDR"],
            doc["funds"],
            [60, 25, 25, 40],
        )

    if doc.get("fund_motivations"):
        has_any_motivation = any(m[1] for m in doc["fund_motivations"])
        if has_any_motivation:
            pdf.subsection("5.3", "Motivering per fond")
            for name, motivation in doc["fund_motivations"]:
                if motivation:
                    pdf.set_font(pdf._uni_font, "B", 9)
                    pdf.cell(0, 6, name)
                    pdf.ln(5)
                    pdf.para(motivation)

    # --- Section 6: Suitability ---
    if doc.get("suitability"):
        pdf.section("6", "Lämplighetsförklaring")
        pdf.para(doc["suitability"])

    # --- Section 7: Costs ---
    if doc.get("costs"):
        pdf.section("7", "Kostnader och ersättningar")
        pdf.subsection("7.1", "Produktkostnader")
        pdf.table(
            ["Kostnadstyp", "Belopp (SEK/år)", "Procent"],
            doc["costs"],
            [60, 50, 50],
        )

        if doc.get("broker"):
            pdf.subsection("7.2", "Ersättning till förmedlaren")
            pdf.para("Förmedlaren erhåller följande ersättning för denna rådgivning:")
            pdf.table(
                ["Ersättningstyp", "Belopp (SEK)", "Procent"],
                doc["broker"],
                [60, 50, 50],
            )

    # --- Signatures ---
    pdf.ln(10)
    pdf.para(
        "Jag har tagit del av ovanstående dokumentation och bekräftar att informationen "
        "är korrekt återgiven. Jag har förstått rekommendationen och dess risker."
    )
    pdf.ln(15)
    pdf.set_font(pdf._uni_font, "", 9)
    client_name = client.get("name", "")
    advisor_name = advisor.get("name", "")
    pdf.cell(80, 5, "_________________________")
    pdf.cell(80, 5, "_________________________")
    pdf.ln(5)
    pdf.cell(80, 5, f"{client_name} (Kund)" if client_name else "(Kund)")
    pdf.cell(80, 5, f"{advisor_name} (Rådgivare)" if advisor_name else "(Rådgivare)")
    pdf.ln()

    # Save
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    path = os.path.join(OUTPUT_DIR, doc["filename"])
    pdf.output(path)
    return path


def main():
    print("Generating test PDFs...\n")
    for doc in DOCUMENTS:
        path = generate_pdf(doc)
        print(f"  {doc['filename']}")
    print(f"\nGenerated {len(DOCUMENTS)} PDFs in {OUTPUT_DIR}/")


if __name__ == "__main__":
    main()
