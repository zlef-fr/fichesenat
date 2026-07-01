// SEO artifacts generated from live data: a full sitemap (every page + all 577
// fiches) and a robots.txt pointing at it. Served on the canonical .fr apex via
// a priority Traefik override of the shared seo-well-known redirect.
const { store } = require("./data");

const BASE = "https://senat.fichedepute.fr";

// Static routes with a relative priority hint for the sitemap.
const STATIC = [
  { path: "/", priority: "1.0", freq: "daily" },
  { path: "/deputes", priority: "0.9", freq: "daily" },
  { path: "/classements", priority: "0.8", freq: "weekly" },
  { path: "/groupes", priority: "0.7", freq: "weekly" },
  { path: "/jeu", priority: "0.6", freq: "weekly" },
  { path: "/methode", priority: "0.4", freq: "monthly" },
];

function xmlEscape(s) {
  return String(s).replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c]));
}

function sitemap() {
  const lastmod = (store.meta && store.meta.generatedAt) || null;
  const lm = lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : "";
  const urls = [];
  for (const r of STATIC) {
    urls.push(`  <url>\n    <loc>${BASE}${r.path}</loc>${lm}\n    <changefreq>${r.freq}</changefreq>\n    <priority>${r.priority}</priority>\n  </url>`);
  }
  for (const d of store.deputes || []) {
    urls.push(`  <url>\n    <loc>${BASE}/depute/${xmlEscape(d.slug)}</loc>${lm}\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>`);
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
}

function robots() {
  return `User-agent: *\nAllow: /\n\nSitemap: ${BASE}/sitemap.xml\n`;
}

// ── Per-route meta for crawlers (FR = default locale) ─────────────────────
// The SPA sets meta via JS; non-JS/social crawlers need it in the initial HTML.
const OG_DEFAULT = "https://senat.fichedepute.fr/og.png";
const SUB = "Participation, votes et absences de votre sénateur au Sénat — en clair et 100 % sourcé.";

function metaFor(pathname) {
  const p = pathname.replace(/\/+$/, "") || "/";
  const fiche = p.match(/^\/depute\/([^/]+)$/);
  if (fiche) {
    const d = store.bySlug[decodeURIComponent(fiche[1])];
    if (d) {
      const name = `${d.prenom} ${d.nom}`;
      const circo = [d.dep && `${d.dep}·${d.depNom || ""}`, d.circo && `${d.circo}ᵉ circonscription`].filter(Boolean).join(" ");
      return {
        title: `${name} (${d.groupe}) — FicheSénateur.fr`,
        desc: `${name}, sénateur·rice ${circo}. ${d.presence}% de participation aux scrutins publics, votes et loyauté au groupe — 100 % sourcé (Sénat).`,
        canonical: `${BASE}/depute/${d.slug}`,
        og: `${BASE}/og/${d.slug}.svg`,
      };
    }
  }
  const pages = {
    "/deputes": ["Tous les sénateurs — FicheSénateur.fr", "Cherchez et comparez les 348 sénateurs du Sénat : participation, votes, groupe et circonscription."],
    "/classements": ["Classements des sénateurs — FicheSénateur.fr", "Les plus assidus, les plus absents, les plus actifs, les plus loyaux et les plus frondeurs du Sénat."],
    "/groupes": ["Les groupes politiques — FicheSénateur.fr", "Participation moyenne et effectifs de chaque groupe politique du Sénat."],
    "/jeu": ["Devine le sénateur — FicheSénateur.fr", "Le jeu civique : présence + 3 votes POUR et 3 votes CONTRE, à toi de deviner de quelle fiche il s'agit."],
    "/methode": ["Méthode & sources — FicheSénateur.fr", "D'où viennent les chiffres de FicheSénateur.fr : les jeux open data officiels du Sénat (licence Ouverte)."],
  };
  if (pages[p]) return { title: pages[p][0], desc: pages[p][1], canonical: `${BASE}${p}`, og: OG_DEFAULT };
  return { title: "FicheSénateur.fr — La fiche vivante de votre sénateur·rice", desc: SUB, canonical: `${BASE}/`, og: OG_DEFAULT };
}

function attr(s) { return String(s).replace(/[<>&"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" }[c])); }

// Rewrite the <head> meta of the SPA shell for the requested route.
function injectMeta(html, pathname) {
  const m = metaFor(pathname);
  const t = attr(m.title), d = attr(m.desc), c = attr(m.canonical), o = attr(m.og);
  return html
    .replace(/<title>[^<]*<\/title>/, `<title>${t}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(">)/, `$1${d}$2`)
    .replace(/(<link rel="canonical" href=")[^"]*(">)/, `$1${c}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(">)/, `$1${t}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(">)/, `$1${d}$2`)
    .replace(/(<meta property="og:url" content=")[^"]*(">)/, `$1${c}$2`)
    .replace(/(<meta property="og:image" content=")[^"]*(">)/, `$1${o}$2`)
    .replace(/(<meta name="twitter:title" content=")[^"]*(">)/, `$1${t}$2`)
    .replace(/(<meta name="twitter:description" content=")[^"]*(">)/, `$1${d}$2`)
    .replace(/(<meta name="twitter:image" content=")[^"]*(">)/, `$1${o}$2`);
}

module.exports = { sitemap, robots, metaFor, injectMeta, BASE };
