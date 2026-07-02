// FicheSénateur.fr — FAQ content, single source of truth.
// Consumed by the client (/api/faq → Méthode page accordion) AND by the server
// (lib/seo.js injects a JSON-LD FAQPage on /methode so crawlers & AI lift the
// vote-par-délégation + "présence non nominative" nuances without running JS).
// Answers may contain <b> for the rendered accordion; the JSON-LD builder strips tags.

const fr = [
  {
    q: "Le « taux de participation aux scrutins » veut-il dire que le sénateur était présent au Sénat ?",
    a: "Non. Il indique la part des <b>scrutins publics</b> — depuis son entrée en fonction — où le sénateur a <b>pris part au vote</b> (pour, contre ou abstention), éventuellement par délégation. La présence physique en séance, en commission ou dans les débats <b>n'est pas publiée nominativement</b> par le Sénat : elle est donc impossible à mesurer honnêtement, et nous ne l'inventons pas.",
  },
  {
    q: "Pourquoi les taux du Sénat sont-ils si élevés, souvent proches de 100 % ?",
    a: "Parce qu'au Sénat le <b>vote par délégation</b> est courant et parfaitement légal : un·e sénateur·rice peut confier sa voix à un·e collègue, et les groupes votent le plus souvent en bloc. Le sénateur est alors compté comme ayant pris part au vote même s'il n'était pas physiquement présent. Le taux reflète donc le vote (éventuellement délégué), pas la présence physique dans l'hémicycle.",
  },
  {
    q: "Un sénateur à 12 % de participation, cela veut-il dire qu'il ne vote presque jamais ?",
    a: "Cela veut dire qu'il n'a <b>pris part au vote</b> que dans ~12 % des scrutins publics ; dans les autres, il est « non-votant » — il n'a ni voté en personne ni délégué sa voix, ce qui est compté comme une absence au scrutin. C'est fréquent pour les <b>non-inscrits</b>, qui n'appartiennent à aucun groupe et ne bénéficient donc pas du vote de groupe par délégation qui gonfle les taux des autres.",
  },
  {
    q: "Que signifie « non-votant » ?",
    a: "Au Sénat, « non-votant » signifie <b>n'a pas pris part au vote</b> : le sénateur n'a voté ni pour, ni contre, ne s'est pas abstenu, et n'a pas délégué sa voix pour ce scrutin. Nous le comptons comme une absence au scrutin (et non comme une présence), à la différence des présidents de séance à l'Assemblée nationale, où « non-votant » désigne un rôle particulier.",
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
    q: "Does the “ballot participation” rate mean the senator was present at the Senate?",
    a: "No. It shows the share of <b>public ballots</b> — since taking office — in which the senator <b>took part in the vote</b> (for, against or abstention), possibly by delegation. Physical presence in the chamber, in committee or in debates <b>is not published per member</b> by the French Senate, so it cannot be measured honestly — and we do not invent it.",
  },
  {
    q: "Why are the Senate's rates so high, often close to 100 %?",
    a: "Because in the Senate <b>vote delegation</b> is common and perfectly legal: a senator may entrust their vote to a colleague, and groups usually vote as a block. The senator is then counted as having taken part even if not physically present. The rate therefore reflects the vote (possibly delegated), not physical presence in the chamber.",
  },
  {
    q: "A senator at 12 % participation — does it mean they almost never vote?",
    a: "It means they <b>took part in the vote</b> in only ~12 % of public ballots; in the rest they are “non-voting” — they neither voted in person nor delegated their vote, which counts as an absence from the ballot. This is common for <b>non-attached members</b>, who belong to no group and so do not benefit from the block/delegated voting that inflates other senators' rates.",
  },
  {
    q: "What does “non-voting” mean?",
    a: "In the Senate, “non-voting” means <b>did not take part in the vote</b>: the senator did not vote for, against, abstain, or delegate their vote for that ballot. We count it as an absence from the ballot (not as presence) — unlike the presiding officers at the French National Assembly, where “non-voting” denotes a specific role.",
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
