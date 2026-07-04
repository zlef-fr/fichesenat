// Server-side render of the primary content for crawlers (and no-JS users).
// The SPA overwrites #app on boot, so this HTML is a faithful, indexable
// snapshot of the fiche / home. Localized; deliberately lean.
const { store } = require("./data");

function esc(s) {
  return s == null ? "" : String(s).replace(/[<>&"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" }[c]));
}

// Senators represent a department (no constituency) — the label is the dept.
function circoLabel(d, lang) {
  return [d.depNom, d.dep && `(${d.dep})`].filter(Boolean).join(" ");
}

const T = {
  fr: {
    role: "Sénateur·rice", group: "Groupe", presence: "Présence aux scrutins",
    participation: "Participation (vote exprimé)", loyalty: "Loyauté au groupe",
    source: "Données : Sénat (licence Ouverte)",
    homeH1: "Votre sénateur·rice, en chiffres",
    homeLead: "Chaque chiffre vient des données officielles du Sénat. Aucun avis, que des faits.",
  },
  en: {
    role: "Senator", group: "Group", presence: "Ballot attendance",
    participation: "Participation (votes cast)", loyalty: "Group loyalty",
    source: "Data: French Senate (Licence Ouverte)",
    homeH1: "Your senator, in figures",
    homeLead: "Every figure comes from the French Senate's official open data. No opinions, only facts.",
  },
};

function fiche(d, lang) {
  const t = T[lang] || T.fr;
  const name = esc(`${d.prenom} ${d.nom}`);
  const rows = [
    [t.presence, d.presence != null ? `${d.presence}%` : "—"],
    [t.participation, d.participation != null ? `${d.participation}%` : "—"],
    [t.loyalty, d.loyalty != null ? `${d.loyalty}%` : "—"],
  ];
  return `<article class="wrap ssr-fiche">
  <h1>${name}</h1>
  <p class="ssr-sub">${t.role} — ${esc(circoLabel(d, lang))} · ${t.group} : ${esc(d.groupeLibelle || d.groupe)} (${esc(d.groupe)})</p>
  <dl class="ssr-stats">
    ${rows.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("\n    ")}
  </dl>
  <p class="ssr-src">${esc(t.source)}</p>
</article>`;
}

function home(lang) {
  const t = T[lang] || T.fr;
  const n = (store.deputes || []).length;
  return `<section class="wrap ssr-home">
  <h1>${esc(t.homeH1)}</h1>
  <p>${esc(t.homeLead)}</p>
  <p>${n} ${lang === "en" ? "senators tracked" : "sénateurs suivis"}.</p>
</section>`;
}

function render(path, lang) {
  const p = (path || "/").replace(/\/+$/, "") || "/";
  if (p === "/") return home(lang);
  const m = p.match(/^\/depute\/([^/]+)$/);
  if (m) {
    const d = store.bySlug[decodeURIComponent(m[1])];
    if (d) return fiche(d, lang);
  }
  return "";
}

module.exports = { render, circoLabel };
