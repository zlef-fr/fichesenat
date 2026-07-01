#!/usr/bin/env python3
"""
Senator legislative-activity enrichment → data/activite.json.

Aggregates the Sénat questions base (data.senat.fr, base "Questions", licence
Ouverte): parses the `tam_questions` COPY block of questions.sql and counts, per
sitting senator (matricule), written questions (QE) and questions to government (QG).

Amendements come from the AMELI base (ameli.sql): amdsen (rng=0 = primary author) →
sen_ameli.entid → matricule, adoption via amd.sorid. Included when ameli.sql is present.
"""
import json, os, sys, collections

HERE = os.path.dirname(os.path.abspath(__file__))
SQL = os.path.join(HERE, "raw-senat", "questions.sql")
AMELI = os.path.join(HERE, "raw-senat", "ameli.sql")
OUT = os.path.abspath(os.path.join(HERE, "..", "data", "activite.json"))

active = {x["uid"] for x in json.load(open(os.path.join(HERE, "..", "data", "deputes.json")))["deputes"]}
acc = collections.defaultdict(lambda: {"qag": 0, "questionsEcrites": 0, "amendements": 0, "amendementsAdoptes": 0})

def copy_block(path, table, encoding):
    inb = False
    for line in open(path, encoding=encoding, errors="replace"):
        if not inb:
            if line.startswith("COPY " + table + " "):
                inb = True
            continue
        if line.startswith("\\."):
            return
        yield line.rstrip("\n").split("\t")

def scan_amendements():
    if not os.path.exists(AMELI):
        return False
    ADOPTED = {"A", "B", "1", "2"}   # sor codes meaning "adopté" (séance + commission)
    amd_sort = {f[0]: f[6] for f in copy_block(AMELI, "amd", "latin1") if len(f) > 7}
    sid2mat = {f[0]: f[4].strip() for f in copy_block(AMELI, "sen_ameli", "latin1") if len(f) > 4}
    n = 0
    for f in copy_block(AMELI, "amdsen", "latin1"):
        if len(f) < 3 or f[2] != "0":   # rng=0 → primary author only
            continue
        mat = sid2mat.get(f[1])
        if mat not in active:
            continue
        acc[mat]["amendements"] += 1
        if amd_sort.get(f[0]) in ADOPTED:
            acc[mat]["amendementsAdoptes"] += 1
        n += 1
    print("· amendements: %d authored by active senators" % n, file=sys.stderr)
    return True

# tam_questions COPY columns: id, sorquecod, matricule(2), natquecod(3), legislature, …
n = 0
if os.path.exists(SQL):
    for f in copy_block(SQL, "tam_questions", "utf-8"):
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
    print("· questions: %d attributed" % n, file=sys.stderr)
else:
    print("· questions.sql absent — skipped", file=sys.stderr)

has_amdt = scan_amendements()

json.dump({"hasAmendements": has_amdt, "byUid": {k: v for k, v in acc.items()}},
          open(OUT, "w"), ensure_ascii=False, separators=(",", ":"))
print("✓ %d sénateurs avec activité (%d questions, amendements=%s) → %s" %
      (len(acc), n, has_amdt, OUT), file=sys.stderr)
