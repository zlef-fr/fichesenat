#!/usr/bin/env python3
"""
Senator legislative-activity enrichment → data/activite.json.

Aggregates the Sénat questions base (data.senat.fr, base "Questions", licence
Ouverte): parses the `tam_questions` COPY block of questions.sql and counts, per
sitting senator (matricule), written questions (QE) and questions to government (QG).

Amendements are not included yet (AMELI links authors by an internal senid, not the
matricule) → hasAmendements stays false and the shared fiche card hides that row.
"""
import json, os, sys, collections

HERE = os.path.dirname(os.path.abspath(__file__))
SQL = os.path.join(HERE, "raw-senat", "questions.sql")
OUT = os.path.abspath(os.path.join(HERE, "..", "data", "activite.json"))

active = {x["uid"] for x in json.load(open(os.path.join(HERE, "..", "data", "deputes.json")))["deputes"]}
acc = collections.defaultdict(lambda: {"qag": 0, "questionsEcrites": 0, "amendements": 0, "amendementsAdoptes": 0})

if not os.path.exists(SQL):
    print("· questions.sql absent — writing empty activite.json", file=sys.stderr)
    json.dump({"hasAmendements": False, "byUid": {}}, open(OUT, "w"), ensure_ascii=False, separators=(",", ":"))
    sys.exit(0)

# tam_questions COPY columns: id, sorquecod, matricule(2), natquecod(3), legislature, …
inblock, n = False, 0
for line in open(SQL, encoding="utf-8", errors="replace"):
    if not inblock:
        if line.startswith("COPY tam_questions "):
            inblock = True
        continue
    if line.startswith("\\."):
        break
    f = line.rstrip("\n").split("\t")
    if len(f) < 5:
        continue
    mat = f[2].strip()
    if mat not in active:
        continue
    typ = f[3]
    if typ == "QE":
        acc[mat]["questionsEcrites"] += 1; n += 1
    elif typ == "QG":
        acc[mat]["qag"] += 1; n += 1

json.dump({"hasAmendements": False, "byUid": {k: v for k, v in acc.items()}},
          open(OUT, "w"), ensure_ascii=False, separators=(",", ":"))
print("✓ %d sénateurs avec activité (%d questions) → %s" % (len(acc), n, OUT), file=sys.stderr)
