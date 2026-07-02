#!/usr/bin/env python3
"""
FicheSénateur.fr — data pipeline (Sénat open data, licence Ouverte).

Sources (data.senat.fr):
  - ODSEN_GENERAL.csv                      sitting senators (identity, group, circo)
  - dosleg.sql (Dosleg PostgreSQL dump)    scr = public ballots, votsen = per-senator votes

Emits the SAME JSON shape as the deputy pipeline (uid/slug/"depute" keys kept so the
shared frontend needs no structural change — only wording differs, via i18n).
"""
import csv, io, json, os, sys, re, bisect, collections, datetime, unicodedata

HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HERE, "raw-senat")
ODSEN = os.path.join(RAW, "odsen.csv")
SQL = os.path.join(RAW, "dosleg.sql")
OUT = os.path.abspath(os.path.join(HERE, "..", "data"))
os.makedirs(os.path.join(OUT, "depute"), exist_ok=True)

# Sénat political groups → (sigle, libellé, colour)
GROUPS = {
    "Les Républicains":   ("LR",     "Les Républicains",                                   "#0066cc"),
    "SER":                ("SER",    "Socialiste, Écologiste et Républicain",              "#e8557e"),
    "UC":                 ("UC",     "Union Centriste",                                    "#ff9800"),
    "Les Indépendants":   ("LIRT",   "Les Indépendants – République et Territoires",       "#00b3c8"),
    "RDPI":               ("RDPI",   "Rassemblement des démocrates, progressistes et indépendants", "#ffd400"),
    "CRCE-K":             ("CRCE-K", "Communiste Républicain Citoyen et Écologiste – Kanaky", "#c0392b"),
    "GEST":               ("GEST",   "Écologiste – Solidarité et Territoires",             "#4caf50"),
    "RDSE":               ("RDSE",   "Rassemblement Démocratique et Social Européen",      "#f4a300"),
    "NI":                 ("NI",     "Non inscrits",                                       "#8a8f98"),
}
def group_of(label):
    if label in GROUPS:
        return GROUPS[label]
    return (label or "NI", label or "Non inscrit", "#8a8f98")

POS = {"1": "pour", "2": "contre", "3": "abstention", "4": "nonVotant"}

def slugify(prenom, nom):
    s = f"{prenom}-{nom}".lower()
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")

def unescape(v):
    if v == "\\N":
        return None
    return v.replace("\\t", " ").replace("\\n", " ").replace("\\r", " ").replace("\\\\", "\\").strip()

# ---------------------------------------------------------------------------
# 1. Sitting senators (ODSEN, latin-1, %-comment header)
# ---------------------------------------------------------------------------
print("· loading ODSEN …", file=sys.stderr)
rows = [r for r in csv.reader(io.open(ODSEN, encoding="latin1")) if r and not r[0].startswith("%")]
hdr = rows[0]
col = {name: i for i, name in enumerate(hdr)}
senators = {}   # matricule -> record
for r in rows[1:]:
    if r[col["État"]] != "ACTIF":
        continue
    mat = r[col["Matricule"]].strip()
    nais = (r[col["Date naissance"]] or "")[:10] or None
    prof = r[col["Description de la profession"]].strip() or None
    email = r[col["Courrier électronique"]].strip()
    email = email if email and email != "Non public" else None
    g = group_of(r[col["Groupe politique"]].strip())
    prenom, nom = r[col["Prénom usuel"]].strip(), r[col["Nom usuel"]].strip()
    senators[mat] = {
        "uid": mat, "slug": slugify(prenom, nom),
        "prenom": prenom, "nom": nom, "civ": r[col["Qualité"]].strip(),
        "sexe": "F" if r[col["Qualité"]].strip() == "Mme" else "H",
        "dateNaissance": nais, "profession": prof,
        "circo": {"departement": r[col["Circonscription"]].strip() or None,
                  "numDepartement": None, "region": None, "numCirco": None},
        "commission": r[col["Commission permanente"]].strip() or None,
        "fonctionBureau": r[col["Fonction au Bureau du Sénat"]].strip() or None,
        "groupeSigle": g[0], "groupeLibelle": g[1], "groupeColor": g[2],
        "hatvp": None, "twitter": None, "facebook": None, "email": email, "website": None,
        "nPour": 0, "nContre": 0, "nAbstention": 0, "nNonVotant": 0,
        "nPresent": 0, "nEligible": 0, "nLoyal": 0, "nGroupExpr": 0, "votes": [],
    }
print("· %d sénateurs actifs" % len(senators), file=sys.stderr)
ACTIVE = set(senators)

# ---------------------------------------------------------------------------
# 2. Parse the two COPY blocks we need from the SQL dump
# ---------------------------------------------------------------------------
def copy_block(table):
    """Yield tab-split rows of a pg_dump COPY block."""
    inblock = False
    with io.open(SQL, encoding="utf-8", errors="replace") as fh:
        for line in fh:
            if not inblock:
                if line.startswith("COPY " + table + " ") or line.startswith("COPY public." + table + " "):
                    inblock = True
                continue
            if line.startswith("\\."):
                return
            yield line.rstrip("\n").split("\t")

print("· parsing scrutins (scr) …", file=sys.stderr)
scr = {}   # (sesann,scrnum) -> {titre,date,pour,contre,sort}
for f in copy_block("scr"):
    if len(f) < 16:
        continue
    key = (f[0], f[1])
    date = (unescape(f[4]) or "")[:10] or None
    pour = int(f[5]) if f[5].isdigit() else 0
    contre = int(f[6]) if f[6].isdigit() else 0
    scr[key] = {"sesann": f[0], "scrnum": f[1], "titre": unescape(f[3]) or "",
                "date": date, "pour": pour, "contre": contre,
                "sort": "adopté" if pour > contre else "rejeté"}
print("· %d scrutins" % len(scr), file=sys.stderr)

print("· parsing per-senator votes (votsen) — this is the big one …", file=sys.stderr)
sen_votes = collections.defaultdict(list)          # matricule -> [(key,pos)]
grp_counts = collections.defaultdict(lambda: collections.Counter())  # (key,sigle)->Counter(pos)
n = 0
for f in copy_block("votsen"):
    if len(f) < 4:
        continue
    mat = f[2].strip()
    if mat not in ACTIVE:
        continue
    key = (f[0], f[1])
    pos = POS.get(f[3])
    if pos is None or key not in scr:
        continue
    sen_votes[mat].append((key, pos))
    if pos in ("pour", "contre", "abstention"):
        grp_counts[(key, senators[mat]["groupeSigle"])][pos] += 1
    n += 1
    if n % 400000 == 0:
        print("  … %d votes" % n, file=sys.stderr)
print("· %d votes attribués aux sénateurs actifs" % n, file=sys.stderr)

# group majority line per (scrutin, group)
majority = {}
for k, c in grp_counts.items():
    majority[k] = c.most_common(1)[0][0] if c else None

# sorted scrutin dates for the eligibility window
all_dates = sorted(v["date"] for v in scr.values() if v["date"])

# ---------------------------------------------------------------------------
# 3. Aggregate per senator → same output shape as the deputy pipeline
# ---------------------------------------------------------------------------
def pct(a, b):
    return round(100.0 * a / b, 1) if b else 0.0

for mat, s in senators.items():
    votes = sen_votes.get(mat, [])
    first_date = None
    for key, pos in votes:
        d = scr[key]["date"]
        if d and (first_date is None or d < first_date):
            first_date = d
        s["n" + {"pour": "Pour", "contre": "Contre", "abstention": "Abstention", "nonVotant": "NonVotant"}[pos]] += 1
        # Every senator is listed in every scrutin (as pour/contre/abstention OR
        # non-votant), so counting non-votant as "present" gives a meaningless
        # ~100% for everyone. In the Sénat "non-votant" = n'a pas pris part au
        # vote = effectively absent (voted neither in person nor by delegation),
        # so — like the EP DID_NOT_VOTE — only expressed votes count as present.
        # This makes presenceRate == participationRate = the real vote-exprimé rate.
        if pos in ("pour", "contre", "abstention"):
            s["nPresent"] += 1
            maj = majority.get((key, s["groupeSigle"]))
            if maj:
                s["nGroupExpr"] += 1
                if pos == maj:
                    s["nLoyal"] += 1
        sc = scr[key]
        s["votes"].append({"numero": sc["scrnum"], "sesann": sc["sesann"], "date": d,
                           "position": pos, "titre": sc["titre"], "sort": sc["sort"]})
    # eligible = scrutins on/after the senator's first recorded vote (fair denominator)
    if first_date:
        s["nEligible"] = max(len(all_dates) - bisect.bisect_left(all_dates, first_date), s["nPresent"])
    else:
        s["nEligible"] = 0
    s["presenceRate"] = pct(s["nPresent"], s["nEligible"])
    expr = s["nPour"] + s["nContre"] + s["nAbstention"]
    s["participationRate"] = pct(expr, s["nEligible"])
    s["nExprimes"] = expr
    s["loyaltyRate"] = pct(s["nLoyal"], s["nGroupExpr"]) if s["nGroupExpr"] >= 20 else None

total_scrutins = len(scr)
light, game_pool = [], []
for s in senators.values():
    g = {"sigle": s["groupeSigle"], "libelle": s["groupeLibelle"], "color": s["groupeColor"]}
    s["votes"].sort(key=lambda v: (v["date"] or "", v["numero"] or ""), reverse=True)
    full = dict(s)
    full["groupe"] = g
    full["votesRecents"] = s["votes"][:25]
    for k in ("votes", "groupeSigle", "groupeLibelle", "groupeColor"):
        full.pop(k, None)
    json.dump(full, open(os.path.join(OUT, "depute", s["uid"] + ".json"), "w"),
              ensure_ascii=False, separators=(",", ":"))
    light.append({
        "uid": s["uid"], "slug": s["slug"], "prenom": s["prenom"], "nom": s["nom"],
        "civ": s["civ"], "sexe": s["sexe"], "groupe": g["sigle"], "groupeColor": g["color"],
        "groupeLibelle": g["libelle"], "dep": None, "depNom": s["circo"]["departement"],
        "region": None, "circo": None, "presence": s["presenceRate"],
        "participation": s["participationRate"], "nPresent": s["nPresent"],
        "nEligible": s["nEligible"], "loyalty": s["loyaltyRate"],
    })
    pour3 = [{"titre": v["titre"], "date": v["date"]} for v in s["votes"] if v["position"] == "pour"][:3]
    contre3 = [{"titre": v["titre"], "date": v["date"]} for v in s["votes"] if v["position"] == "contre"][:3]
    if len(pour3) == 3 and len(contre3) == 3 and s["nPresent"] >= 20:
        game_pool.append({"uid": s["uid"], "slug": s["slug"], "prenom": s["prenom"], "nom": s["nom"],
                          "groupe": g["sigle"], "groupeColor": g["color"], "groupeLibelle": g["libelle"],
                          "dep": None, "depNom": s["circo"]["departement"],
                          "presence": s["presenceRate"], "pour": pour3, "contre": contre3})

light.sort(key=lambda x: (x["nom"] or "", x["prenom"] or ""))
json.dump({"generatedAt": datetime.date.today().isoformat(), "legislature": "Sénat",
           "totalScrutins": total_scrutins, "deputes": light},
          open(os.path.join(OUT, "deputes.json"), "w"), ensure_ascii=False, separators=(",", ":"))

# groups
gstats = {}
for x in light:
    a = gstats.setdefault(x["groupe"], {"sigle": x["groupe"], "libelle": x["groupeLibelle"],
                                        "color": x["groupeColor"], "n": 0, "sp": 0.0, "pp": 0.0})
    a["n"] += 1; a["sp"] += x["presence"]; a["pp"] += x["participation"]
groupes = []
for a in gstats.values():
    a["presenceMoyenne"] = round(a["sp"] / a["n"], 1); a["participationMoyenne"] = round(a["pp"] / a["n"], 1)
    del a["sp"]; del a["pp"]; groupes.append(a)
groupes.sort(key=lambda a: -a["n"])
json.dump({"groupes": groupes}, open(os.path.join(OUT, "groupes.json"), "w"), ensure_ascii=False, separators=(",", ":"))

# leaderboards + stats
def top(key, rev, n=20):
    return sorted(light, key=lambda x: x[key], reverse=rev)[:n]
wl = [x for x in light if x["loyalty"] is not None]
stats = {
    "totalDeputes": len(light), "totalScrutins": total_scrutins,
    "presenceMoyenne": round(sum(x["presence"] for x in light) / len(light), 1),
    "plusAssidus": top("presence", True), "plusAbsents": top("presence", False),
    "plusActifs": top("participation", True),
    "plusLoyaux": sorted(wl, key=lambda x: -x["loyalty"])[:20],
    "plusFrondeurs": sorted(wl, key=lambda x: x["loyalty"])[:20],
    "groupesAbsents": sorted(groupes, key=lambda a: a["presenceMoyenne"]),
}
json.dump(stats, open(os.path.join(OUT, "stats.json"), "w"), ensure_ascii=False, separators=(",", ":"))

recent = sorted(scr.values(), key=lambda v: (v["date"] or "", v["scrnum"]))[-40:]
json.dump({"scrutins": [{"numero": v["scrnum"], "date": v["date"], "sort": v["sort"],
                         "titre": v["titre"], "pour": v["pour"], "contre": v["contre"],
                         "abstention": None} for v in reversed(recent)]},
          open(os.path.join(OUT, "scrutins.json"), "w"), ensure_ascii=False, separators=(",", ":"))
json.dump({"deputes": game_pool}, open(os.path.join(OUT, "game.json"), "w"), ensure_ascii=False, separators=(",", ":"))

print("✓ %d sénateurs, %d scrutins, %d groupes, %d jouables → %s" %
      (len(light), total_scrutins, len(groupes), len(game_pool), OUT), file=sys.stderr)
