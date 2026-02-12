kpis = [
    {"id": "clients", "label": "Antal klienter", "value": "247", "trend": 3.2, "icon": "Users"},
    {"id": "meetings", "label": "Möten senaste veckan", "value": "18", "trend": 12.5, "icon": "Calendar"},
    {"id": "aum", "label": "AUM", "value": "1,42 mdr kr", "trend": 5.8, "icon": "TrendingUp"},
    {"id": "net-new", "label": "Netto nya tillgångar", "value": "+32,5 mkr", "trend": 8.1, "icon": "ArrowUpRight"},
    {"id": "satisfaction", "label": "Kundnöjdhet", "value": "4,7 / 5", "trend": 1.2, "icon": "Star"},
    {"id": "actions", "label": "Väntande åtgärder", "value": "12", "trend": -15.3, "icon": "AlertCircle"},
]

clients = [
    {"id": "1", "name": "Erik Lindqvist", "email": "erik.lindqvist@mail.se", "city": "Stockholm", "aum": 45_200_000, "aumFormatted": "45,2 mkr", "lastContact": "2025-01-28", "status": "Aktiv", "attention": False, "riskProfile": "Medel", "custodian": "SEB"},
    {"id": "2", "name": "Anna Bergström", "email": "anna.bergstrom@mail.se", "city": "Göteborg", "aum": 128_500_000, "aumFormatted": "128,5 mkr", "lastContact": "2025-01-15", "status": "Aktiv", "attention": True, "attentionReason": "Portföljen avviker från riskprofil", "riskProfile": "Låg", "custodian": "Handelsbanken"},
    {"id": "3", "name": "Magnus Johansson", "email": "magnus.johansson@mail.se", "city": "Malmö", "aum": 22_800_000, "aumFormatted": "22,8 mkr", "lastContact": "2025-02-01", "status": "Ny", "attention": False, "riskProfile": "Hög", "custodian": "Avanza"},
    {"id": "4", "name": "Sofia Andersson", "email": "sofia.andersson@mail.se", "city": "Uppsala", "aum": 67_300_000, "aumFormatted": "67,3 mkr", "lastContact": "2024-12-20", "status": "Aktiv", "attention": True, "attentionReason": "Ej kontaktad på 45+ dagar", "riskProfile": "Medel", "custodian": "Nordea"},
    {"id": "5", "name": "Lars Pettersson", "email": "lars.pettersson@mail.se", "city": "Linköping", "aum": 15_600_000, "aumFormatted": "15,6 mkr", "lastContact": "2025-01-30", "status": "Aktiv", "attention": False, "riskProfile": "Låg", "custodian": "Swedbank"},
    {"id": "6", "name": "Karin Nilsson", "email": "karin.nilsson@mail.se", "city": "Västerås", "aum": 89_100_000, "aumFormatted": "89,1 mkr", "lastContact": "2025-01-22", "status": "Aktiv", "attention": False, "riskProfile": "Hög", "custodian": "SEB"},
    {"id": "7", "name": "Henrik Larsson", "email": "henrik.larsson@mail.se", "city": "Örebro", "aum": 34_700_000, "aumFormatted": "34,7 mkr", "lastContact": "2025-01-10", "status": "Inaktiv", "attention": True, "attentionReason": "Kunden har begärt ombalansering", "riskProfile": "Medel", "custodian": "Handelsbanken"},
    {"id": "8", "name": "Maria Eriksson", "email": "maria.eriksson@mail.se", "city": "Stockholm", "aum": 210_000_000, "aumFormatted": "210,0 mkr", "lastContact": "2025-02-03", "status": "Aktiv", "attention": False, "riskProfile": "Medel", "custodian": "Carnegie"},
    {"id": "9", "name": "Oskar Svensson", "email": "oskar.svensson@mail.se", "city": "Lund", "aum": 8_900_000, "aumFormatted": "8,9 mkr", "lastContact": "2025-01-18", "status": "Ny", "attention": False, "riskProfile": "Hög", "custodian": "Avanza"},
    {"id": "10", "name": "Elin Olsson", "email": "elin.olsson@mail.se", "city": "Umeå", "aum": 52_400_000, "aumFormatted": "52,4 mkr", "lastContact": "2024-11-30", "status": "Inaktiv", "attention": True, "attentionReason": "Ej kontaktad på 60+ dagar", "riskProfile": "Låg", "custodian": "Nordea"},
    {"id": "11", "name": "Gustav Wallin", "email": "gustav.wallin@mail.se", "city": "Helsingborg", "aum": 41_200_000, "aumFormatted": "41,2 mkr", "lastContact": "2025-01-25", "status": "Aktiv", "attention": False, "riskProfile": "Medel", "custodian": "Swedbank"},
    {"id": "12", "name": "Ida Nyström", "email": "ida.nystrom@mail.se", "city": "Jönköping", "aum": 19_800_000, "aumFormatted": "19,8 mkr", "lastContact": "2025-01-29", "status": "Aktiv", "attention": False, "riskProfile": "Låg", "custodian": "SEB"},
    {"id": "13", "name": "Fredrik Björk", "email": "fredrik.bjork@mail.se", "city": "Sundsvall", "aum": 76_500_000, "aumFormatted": "76,5 mkr", "lastContact": "2025-01-05", "status": "Aktiv", "attention": True, "attentionReason": "Hög koncentration i enskild sektor", "riskProfile": "Hög", "custodian": "Carnegie"},
    {"id": "14", "name": "Lena Gustafsson", "email": "lena.gustafsson@mail.se", "city": "Karlstad", "aum": 31_600_000, "aumFormatted": "31,6 mkr", "lastContact": "2025-02-02", "status": "Ny", "attention": False, "riskProfile": "Medel", "custodian": "Handelsbanken"},
    {"id": "15", "name": "Anders Holm", "email": "anders.holm@mail.se", "city": "Gävle", "aum": 63_800_000, "aumFormatted": "63,8 mkr", "lastContact": "2025-01-20", "status": "Aktiv", "attention": False, "riskProfile": "Medel", "custodian": "Nordea"},
]

portfolio_allocation = [
    {"name": "Aktier", "value": 45, "color": "#03A48D"},
    {"name": "Räntor", "value": 25, "color": "#1B3740"},
    {"name": "Alternativa", "value": 15, "color": "#F985A0"},
    {"name": "Fastigheter", "value": 10, "color": "#688F9A"},
    {"name": "Likviditet", "value": 5, "color": "#D4A574"},
]

aum_trend = [
    {"month": "Jan", "total": 1280, "equity": 576, "fixedIncome": 320},
    {"month": "Feb", "total": 1295, "equity": 583, "fixedIncome": 324},
    {"month": "Mar", "total": 1310, "equity": 590, "fixedIncome": 328},
    {"month": "Apr", "total": 1285, "equity": 578, "fixedIncome": 321},
    {"month": "Maj", "total": 1330, "equity": 599, "fixedIncome": 333},
    {"month": "Jun", "total": 1355, "equity": 610, "fixedIncome": 339},
    {"month": "Jul", "total": 1340, "equity": 603, "fixedIncome": 335},
    {"month": "Aug", "total": 1370, "equity": 617, "fixedIncome": 343},
    {"month": "Sep", "total": 1390, "equity": 626, "fixedIncome": 348},
    {"month": "Okt", "total": 1405, "equity": 632, "fixedIncome": 351},
    {"month": "Nov", "total": 1395, "equity": 628, "fixedIncome": 349},
    {"month": "Dec", "total": 1420, "equity": 639, "fixedIncome": 355},
]

meetings_per_week = [
    {"week": "V.1", "meetings": 14, "target": 15},
    {"week": "V.2", "meetings": 18, "target": 15},
    {"week": "V.3", "meetings": 12, "target": 15},
    {"week": "V.4", "meetings": 20, "target": 15},
    {"week": "V.5", "meetings": 16, "target": 15},
    {"week": "V.6", "meetings": 22, "target": 15},
    {"week": "V.7", "meetings": 15, "target": 15},
    {"week": "V.8", "meetings": 18, "target": 15},
]
