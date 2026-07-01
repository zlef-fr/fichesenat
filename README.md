# FicheSénateur.fr

La **fiche vivante** de chaque sénateur·rice — participation aux scrutins, votes,
loyauté au groupe — en clair et 100 % sourcé. Site jumeau de
[FicheDéputé.fr](https://fichedepute.fr) pour la chambre haute.

Live : https://senat.fichedepute.fr

## Données
Construit à partir de l'**open data officiel du Sénat** (licence Ouverte) :
- `ODSEN_GENERAL.csv` — sénateurs en exercice (identité, groupe, circonscription)
- base **Dosleg** (`dosleg.sql`) — `scr` (scrutins publics) + `votsen` (vote nominatif
  par sénateur), soit ~4 750 scrutins et ~1,65 M de votes.

⚠️ Au Sénat, le **vote par délégation** est courant, d'où des taux de participation aux
scrutins naturellement très élevés (souvent proches de 100 %). Détail sur `/methode`.

## Architecture
Réutilise le code de FicheDéputé (serveur Node zéro-dépendance, PWA vanilla, SEO) ;
seule la source de données change :
- `pipeline/build_senat.py` — parse ODSEN + les blocs `COPY` du dump Dosleg → JSON prêts
  à servir (même schéma que FicheDéputé, le front est partagé).
- `scripts/refresh-data.sh` — retélécharge ODSEN + Dosleg et reconstruit.

## Dev
```bash
bash scripts/refresh-data.sh   # fetch officiel + build
node server.js                 # http://localhost:10097
```

Données : Sénat (licence Ouverte). Projet indépendant, réalisé avec patriotisme par zlef.fr.
