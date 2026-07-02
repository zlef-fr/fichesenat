// FicheSénateur.fr — FAQ content, single source of truth.
// Consumed by the client (/api/faq → Méthode page accordion) AND by the server
// (lib/seo.js injects a JSON-LD FAQPage on /methode so crawlers & AI lift the
// "présence non publiée nominativement" + vote-par-délégation nuances without JS).
// Answers may contain <b> for the rendered accordion; the JSON-LD builder strips tags.

const fr = [
  {
    q: "Le « taux de présence aux scrutins » veut-il dire que le sénateur était présent au Sénat ?",
    a: "Non. Il indique la part des <b>scrutins publics</b> — les votes enregistrés nominativement — où le sénateur est décompté depuis son entrée en fonction. La présence physique en séance, en commission ou dans les débats <b>n'est pas publiée nominativement</b> par le Sénat : elle est donc impossible à mesurer honnêtement, et nous ne l'inventons pas.",
  },
  {
    q: "Pourquoi les taux du Sénat sont-ils si élevés, souvent proches de 100 % ?",
    a: "Parce qu'au Sénat le <b>vote par délégation</b> est courant et parfaitement légal : un·e sénateur·rice peut confier sa voix à un·e collègue. Le sénateur est alors compté comme ayant voté même s'il n'était pas physiquement présent. Les taux de présence et de participation aux scrutins y sont donc structurellement gonflés — ils reflètent le vote (éventuellement délégué), pas la présence physique dans l'hémicycle.",
  },
  {
    q: "Quelle différence entre « présence aux scrutins » et « participation (vote exprimé) » ?",
    a: "La <b>présence aux scrutins</b> compte tous les scrutins où le sénateur est décompté, y compris comme « non-votant » (présent mais sans prendre part au vote, par exemple lorsqu'il préside la séance). La <b>participation (vote exprimé)</b> ne compte que les scrutins où il a réellement voté pour, contre, ou s'est abstenu. L'écart correspond aux scrutins où il était décompté sans exprimer de vote.",
  },
  {
    q: "Un taux élevé signifie-t-il que le sénateur travaille beaucoup ?",
    a: "Pas nécessairement — d'autant moins au Sénat, où le vote par délégation permet un taux élevé sans présence physique. Ce chiffre ne dit rien du travail en commission, des rapports, des amendements, des questions ou des prises de parole — des activités que nous listons par ailleurs, mais qui ne se résument pas à un pourcentage.",
  },
  {
    q: "D'où viennent les données et à quelle fréquence sont-elles mises à jour ?",
    a: "Exclusivement des jeux <b>open data officiels du Sénat</b> (base Dosleg, licence Ouverte) : la liste des sénateurs en exercice et l'intégralité des scrutins publics. Chaque fiche renvoie au scrutin officiel du Sénat. Les données sont reconstruites régulièrement ; la date de la dernière mise à jour figure en bas de cette page.",
  },
  {
    q: "Le site prend-il parti politiquement ?",
    a: "Non. Aucune interprétation, aucun jugement de valeur : uniquement des chiffres bruts et sourcés, à charge pour chacun de les interpréter.",
  },
];

const en = [
  {
    q: "Does the “ballot attendance” rate mean the senator was present at the Senate?",
    a: "No. It shows the share of <b>public ballots</b> — votes recorded name by name — in which the senator is counted since taking office. Physical presence in the chamber, in committee or in debates <b>is not published per member</b> by the French Senate, so it cannot be measured honestly — and we do not invent it.",
  },
  {
    q: "Why are the Senate's rates so high, often close to 100 %?",
    a: "Because in the Senate <b>vote delegation</b> is common and perfectly legal: a senator may entrust their vote to a colleague. The senator is then counted as having voted even if not physically present. Attendance and participation rates are therefore structurally inflated — they reflect the vote (possibly delegated), not physical presence in the chamber.",
  },
  {
    q: "What is the difference between “ballot attendance” and “participation (votes cast)”?",
    a: "<b>Ballot attendance</b> counts every ballot where the senator is recorded, including as “non-voting” (present but not taking part, e.g. when chairing the session). <b>Participation (votes cast)</b> only counts ballots where they actually voted for, against or abstained. The gap is the ballots where they were counted without casting a vote.",
  },
  {
    q: "Does a high rate mean the senator works a lot?",
    a: "Not necessarily — all the less so in the Senate, where vote delegation allows a high rate without physical presence. This figure says nothing about committee work, reports, amendments, questions or speeches — activities we list elsewhere, but which cannot be reduced to a percentage.",
  },
  {
    q: "Where does the data come from, and how often is it updated?",
    a: "Solely from the French Senate's <b>official open datasets</b> (Dosleg base, Licence Ouverte): the list of sitting senators and every public ballot. Each card links to the official Senate ballot. The data is rebuilt regularly; the last-updated date appears at the bottom of this page.",
  },
  {
    q: "Is the site politically biased?",
    a: "No. No interpretation, no value judgement: only raw, sourced figures, for everyone to interpret as they see fit.",
  },
];

module.exports = { fr, en };
