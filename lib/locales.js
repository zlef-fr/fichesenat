// Locale model shared by the server (URL routing) and the SEO layer. The DEFAULT
// locale owns the bare path; every other locale lives under "/<lang>" so each
// language has its own indexable URL. FR is default (FicheSénateur.fr), EN alt.
const BASE = "https://senat.fichedepute.fr";
const DEFAULT = "fr";
const LOCALES = ["fr", "en"];
const OG_LOCALE = { fr: "fr_FR", en: "en_GB" };

function parsePath(pathname) {
  const m = (pathname || "/").match(/^\/([a-z]{2})(\/.*)?$/);
  if (m && LOCALES.includes(m[1])) return { lang: m[1], path: m[2] || "/" };
  return { lang: DEFAULT, path: pathname || "/" };
}

function localized(path, lang) {
  const clean = !path || path === "/" ? "" : path.replace(/\/+$/, "");
  if (lang === DEFAULT) return clean || "/";
  return `/${lang}${clean}`;
}

module.exports = { BASE, DEFAULT, LOCALES, OG_LOCALE, parsePath, localized };
