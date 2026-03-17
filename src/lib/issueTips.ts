/**
 * Human-friendly explanations for technical SEO issues.
 * Each entry: [pattern to match in message, plain-language tip].
 * First match wins — order matters (more specific patterns first).
 */
const tips: [RegExp | string, string][] = [
  // --- Images ---
  ['Image sans attribut alt', 'Les moteurs de recherche ne peuvent pas "voir" vos images. Le texte alternatif (alt) décrit l\'image pour Google et les personnes malvoyantes.'],
  ['Image avec alt vide', 'Cette image est marquée comme décorative. Si elle a un contenu important, ajoutez une description.'],
  ['Alt text très long', 'La description de cette image est trop longue. Visez 1-2 phrases courtes qui décrivent l\'essentiel.'],
  ['Image above-the-fold avec lazy loading', 'Cette image est visible dès l\'ouverture de la page mais se charge en différé, ce qui ralentit l\'affichage. Retirez le lazy loading pour les images visibles immédiatement.'],
  ['image(s) sans dimensions explicites', 'Sans largeur/hauteur définies, la page "saute" pendant le chargement des images, ce qui gêne la lecture.'],
  ['image(s) below-the-fold sans lazy loading', 'Les images en bas de page devraient se charger uniquement quand l\'utilisateur scrolle, pour accélérer l\'affichage initial.'],
  ['Aucune image en format moderne', 'Les formats WebP et AVIF sont jusqu\'à 50% plus légers que JPEG/PNG. Votre site se chargera plus vite avec ces formats.'],
  ['srcset', 'Les images responsives s\'adaptent à la taille de l\'écran. Sans ça, un téléphone charge la même image qu\'un écran 4K.'],

  // --- Headings ---
  ['La balise <title> est manquante', 'Le titre de la page est ce qui s\'affiche dans l\'onglet du navigateur et dans les résultats Google. Sans titre, Google en inventera un.'],
  ['Le titre est trop court', 'Un titre trop court ne décrit pas assez votre page. Google affiche environ 60 caractères dans ses résultats — profitez de cet espace.'],
  ['Le titre est trop long', 'Google coupe les titres trop longs dans ses résultats. L\'information importante risque de ne pas apparaître.'],
  ['La méta description est manquante', 'La méta description est le petit texte sous le titre dans Google. Sans elle, Google prend un extrait au hasard de votre page.'],
  ['La méta description est trop courte', 'Votre description est trop courte pour convaincre les internautes de cliquer. Profitez de l\'espace disponible (150-160 caractères).'],
  ['La méta description est trop longue', 'Google coupe les descriptions trop longues. Mettez l\'essentiel dans les 160 premiers caractères.'],
  ['méta description pourrait être optimisée', 'Votre description fonctionne mais pourrait être plus percutante en utilisant les 150-160 caractères recommandés.'],
  ['Aucune balise H1', 'Le H1 est le titre principal de votre page. C\'est l\'un des premiers éléments que Google analyse pour comprendre le sujet de votre contenu.'],
  ['balises H1 trouvées', 'Votre page a plusieurs titres principaux (H1). Google ne sait pas lequel est le vrai sujet. Gardez un seul H1.'],
  ['Aucune balise H2 mais des H3', 'Vos sous-titres ne suivent pas un ordre logique. C\'est comme un livre dont les chapitres sont numérotés 1, 3, 5 sans le 2 et 4.'],
  ['heading vide', 'Des titres vides perturbent la structure de la page. Google les ignore mais ça indique un problème technique.'],
  ['Niveau de heading sauté', 'Les sous-titres doivent se suivre dans l\'ordre (H1 → H2 → H3). Sauter un niveau désoriente Google et les lecteurs d\'écran.'],

  // --- Links ---
  ['javascript: href', 'Ce lien utilise du JavaScript au lieu d\'une vraie URL. Google ne peut pas le suivre et les utilisateurs ne peuvent pas l\'ouvrir dans un nouvel onglet.'],
  ['Aucun lien interne trouvé', 'Les liens internes aident Google à découvrir toutes vos pages et à comprendre la structure de votre site. Ajoutez des liens vers vos autres pages.'],
  ['Trop de liens externes par rapport aux liens internes', 'Votre page envoie beaucoup de visiteurs vers d\'autres sites mais peu vers vos propres pages. Rééquilibrez en ajoutant des liens internes.'],
  ['sans texte d\'ancrage ni image', 'Certains liens sont vides — ni texte, ni image. Les visiteurs et Google ne savent pas où ils mènent.'],
  ['texte d\'ancrage générique', 'Des liens comme "cliquez ici" n\'aident pas Google à comprendre la page de destination. Utilisez un texte descriptif (ex: "voir nos tarifs").'],
  ['liens nofollow sur', 'Beaucoup de vos liens demandent à Google de ne pas les suivre. Si ces liens sont utiles à vos visiteurs, retirez le nofollow.'],
  ['Aucun lien trouvé sur la page', 'Une page sans aucun lien est un cul-de-sac pour Google et vos visiteurs. Ajoutez des liens pertinents.'],
  ['Lien cassé (404)', 'Ce lien mène vers une page qui n\'existe plus. Vos visiteurs tombent sur une erreur. Corrigez ou supprimez ce lien.'],
  ['Lien en erreur serveur', 'Le site vers lequel pointe ce lien rencontre un problème technique. Vérifiez s\'il est toujours en ligne.'],
  ['Lien inaccessible', 'Ce lien ne répond pas. Le site est peut-être hors ligne ou bloque les vérifications automatiques.'],
  ['Lien interne cassé (404)', 'Un lien vers votre propre site mène vers une page inexistante. C\'est mauvais pour l\'expérience utilisateur et le SEO.'],
  ['Lien interne en erreur serveur', 'Une de vos propres pages rencontre une erreur serveur. Vérifiez que votre site fonctionne correctement.'],
  ['Lien interne inaccessible', 'Une de vos propres pages ne répond pas. Vérifiez qu\'elle est bien en ligne.'],

  // --- Technical ---
  ['robots.txt introuvable', 'Le fichier robots.txt guide Google sur les pages à explorer. Son absence n\'est pas bloquante mais il aide à contrôler le référencement.'],
  ['Sitemap non référencé dans robots.txt', 'Votre sitemap existe mais Google ne sait pas où le trouver. Ajoutez la ligne "Sitemap: https://votresite.com/sitemap.xml" dans robots.txt.'],
  ['sitemap.xml introuvable', 'Le sitemap liste toutes vos pages importantes. Sans lui, Google peut manquer certaines pages, surtout sur les grands sites.'],
  ['llms.txt introuvable', 'Le fichier llms.txt aide les IA (ChatGPT, Perplexity) à comprendre votre site. C\'est un avantage compétitif émergent.'],
  ['canonical manquante', 'La balise canonical indique à Google quelle est la "vraie" version de la page. Sans elle, Google peut considérer des pages similaires comme du contenu dupliqué.'],
  ['lang manquant', 'Google ne sait pas dans quelle langue est votre page. Ajoutez l\'attribut lang (ex: lang="fr") pour améliorer le référencement local.'],
  ['Meta viewport manquante', 'Votre site ne s\'adapte pas aux mobiles. Google pénalise fortement les sites non responsives depuis 2018.'],
  ['Charset non spécifié', 'Sans charset, les accents et caractères spéciaux peuvent s\'afficher mal (é → Ã©). Ajoutez charset="UTF-8".'],
  ['Taille HTML excessive', 'Votre page est très lourde. Google peut ne pas l\'indexer entièrement et vos visiteurs attendront longtemps.'],
  ['Taille HTML élevée', 'Votre page est assez lourde. Envisagez de la simplifier pour un chargement plus rapide.'],
  ['scripts bloquants détectés', 'Ces scripts empêchent la page de s\'afficher tant qu\'ils ne sont pas chargés. Ajoutez "async" ou "defer" pour les charger en arrière-plan.'],
  ['script(s) bloquant(s) détecté', 'Un script bloque l\'affichage de la page. Ajoutez "async" ou "defer" pour le charger en arrière-plan.'],
  ['styles inline détectés', 'Beaucoup de styles sont écrits directement dans le HTML au lieu d\'être dans un fichier CSS. Ça alourdit la page et complique la maintenance.'],
  ['n\'utilise pas HTTPS', 'Votre site n\'est pas sécurisé. Les navigateurs affichent un avertissement "Non sécurisé" et Google pénalise votre classement.'],
  ['contenu mixte', 'Certaines ressources (images, scripts) se chargent en HTTP non sécurisé sur votre page HTTPS. Les navigateurs peuvent les bloquer.'],
  ['<main> absente', 'La balise <main> aide Google et les lecteurs d\'écran à identifier le contenu principal de la page.'],
  ['<nav> absente', 'La balise <nav> aide Google à identifier votre menu de navigation et à comprendre la structure du site.'],
  ['formulaire sans label', 'Des champs de formulaire ne sont pas étiquetés. Les personnes utilisant un lecteur d\'écran ne savent pas quoi remplir.'],
  ['bouton(s) sans texte', 'Des boutons n\'ont pas de texte visible ni de description. Les visiteurs et les lecteurs d\'écran ne savent pas à quoi ils servent.'],
  ['skip navigation', 'Les personnes qui naviguent au clavier doivent tabuler à travers tout le menu avant d\'atteindre le contenu. Un lien "skip" résout ce problème.'],
  ['URL trop longue', 'Les URL courtes sont plus faciles à partager et à mémoriser. Google préfère aussi les URL concises.'],
  ['URL contient des underscores', 'Google traite les underscores (_) différemment des tirets (-). "mot_clé" est vu comme un seul mot, "mot-clé" comme deux.'],
  ['URL contient des majuscules', 'Les URL avec majuscules peuvent créer des doublons (Page ≠ page). Utilisez uniquement des minuscules.'],
  ['URL profonde', 'Plus une page est "profonde" dans la structure du site, moins Google lui accorde d\'importance. Rapprochez-la de la page d\'accueil.'],
  ['resource hint', 'Les resource hints indiquent au navigateur de préparer certaines connexions à l\'avance, ce qui accélère le chargement.'],
  ['X-Robots-Tag contient noindex', 'Un header HTTP demande à Google de ne PAS indexer cette page. Si c\'est involontaire, corrigez-le immédiatement.'],
  ['Cache-Control absent', 'Sans mise en cache, le navigateur retélécharge tout à chaque visite. Un bon cache accélère les visites suivantes.'],
  ['HSTS', 'Ce header force les navigateurs à utiliser HTTPS. Sans lui, un attaquant pourrait intercepter la première connexion HTTP.'],
  ['manifest.json absent', 'Le manifest permet d\'installer votre site comme une application mobile. C\'est optionnel mais améliore l\'engagement.'],

  // --- CWV (from applyCwvToTechnical) ---
  ['Score performance mobile faible', 'Votre site est lent sur mobile. C\'est un facteur de classement Google et beaucoup de visiteurs partent si le chargement dépasse 3 secondes.'],
  ['Score performance mobile moyen', 'La vitesse de votre site sur mobile peut être améliorée. Un site plus rapide = meilleur classement Google + moins d\'abandons.'],
  ['LCP trop lent', 'L\'élément principal de votre page (grande image, titre) met trop de temps à s\'afficher. Les visiteurs voient un écran vide trop longtemps.'],
  ['LCP à améliorer', 'L\'élément principal de votre page pourrait s\'afficher plus vite. Optimisez les images et le chargement des polices.'],
  ['CLS trop élevé', 'Votre page "saute" pendant le chargement — les éléments bougent de place. C\'est frustrant pour les utilisateurs qui essaient de cliquer.'],
  ['CLS à améliorer', 'Votre page bouge légèrement pendant le chargement. Définissez des dimensions fixes pour les images et publicités.'],
  ['FCP lent', 'Le premier contenu visible met trop de temps à apparaître. Le visiteur voit un écran blanc pendant plusieurs secondes.'],
  ['TBT trop élevé', 'La page se fige pendant le chargement — les clics et scrolls ne répondent pas. Réduisez le JavaScript exécuté au chargement.'],
  ['TBT à améliorer', 'La page est légèrement lente à réagir pendant le chargement. Optimisez vos scripts JavaScript.'],
  ['Speed Index très lent', 'Le contenu visible se charge progressivement mais trop lentement. L\'utilisateur attend longtemps avant de voir quelque chose d\'utile.'],
  ['Speed Index lent', 'Le contenu visible pourrait se charger plus vite. Priorisez le chargement des éléments visibles en premier.'],

  // --- Metadata ---
  ['og:title manquant', 'Quand quelqu\'un partage votre page sur Facebook ou LinkedIn, aucun titre n\'apparaît. Ajoutez og:title pour contrôler l\'aperçu.'],
  ['og:description manquant', 'L\'aperçu de votre page sur les réseaux sociaux n\'a pas de description. Ajoutez og:description pour donner envie de cliquer.'],
  ['og:image manquant', 'Quand votre page est partagée sur les réseaux sociaux, aucune image n\'apparaît. Un lien avec image reçoit beaucoup plus de clics.'],
  ['og:url manquant', 'L\'URL canonique pour le partage social n\'est pas définie. Ajoutez og:url pour éviter les doublons sur les réseaux sociaux.'],
  ['og:type manquant', 'Le type de contenu (article, site web) n\'est pas défini pour les réseaux sociaux. Ajoutez og:type pour un meilleur affichage.'],
  ['twitter:card manquant', 'Votre page n\'a pas d\'aperçu riche sur X (Twitter). Ajoutez twitter:card pour un affichage attrayant.'],
  ['Favicon non détecté', 'Le favicon est la petite icône dans l\'onglet du navigateur. Sans elle, votre site paraît moins professionnel et est plus dur à retrouver dans les onglets.'],
  ['donnée structurée', 'Les données structurées permettent à Google d\'afficher des résultats enrichis (étoiles, prix, FAQ...) qui attirent plus de clics.'],
  ['noindex', 'Votre page demande à Google de ne pas l\'afficher dans les résultats de recherche. Vérifiez que c\'est bien voulu.'],
  ['og:title trop long', 'Le titre social est trop long et sera coupé sur Facebook/LinkedIn. Gardez-le sous 90 caractères.'],
  ['og:description trop long', 'La description sociale est trop longue et sera coupée. Gardez-la sous 200 caractères.'],
  ['<title> dupliquée', 'Votre page a plusieurs balises <title>. Google ne sait pas laquelle choisir. Gardez-en une seule.'],
  ['Meta description dupliquée', 'Votre page a plusieurs méta descriptions. Gardez-en une seule pour que Google affiche la bonne.'],
  ['title et og:title sont différents', 'Le titre de la page et le titre affiché sur les réseaux sociaux sont différents. Harmonisez-les pour la cohérence.'],
  ['Politique de confidentialité absente', 'La loi sur la protection des données (LPD en Suisse, RGPD en Europe) impose une politique de confidentialité. Son absence peut entraîner des sanctions et réduit la confiance des visiteurs.'],
  ['Auteur non identifié', 'Google valorise les contenus dont l\'auteur est identifiable (critères E-E-A-T). Indiquez qui a écrit le contenu.'],
  ['Dates de publication', 'Indiquer quand le contenu a été publié et mis à jour aide Google à évaluer sa fraîcheur et sa pertinence.'],
  ['contact absent', 'Un moyen de contact visible renforce la confiance des visiteurs et des moteurs de recherche dans votre site.'],
  ['Mentions légales absentes', 'Les mentions légales sont recommandées pour tout site professionnel. Elles renforcent la crédibilité et la confiance des visiteurs.'],

  // --- Readability ---
  ['Contenu court', 'Les pages avec peu de contenu ont moins de chances d\'apparaître dans Google. Visez au moins 300 mots pour couvrir le sujet.'],
  ['Phrases longues en moyenne', 'Vos phrases sont longues, ce qui rend le texte difficile à lire. Découpez-les pour faciliter la lecture.'],
  ['Phrases un peu longues', 'Vos phrases pourraient être un peu plus courtes. Des phrases de 15-20 mots sont idéales pour le web.'],
  ['Lisibilité très difficile', 'Votre texte est très complexe. La plupart des internautes décrochent rapidement face à un contenu difficile à lire.'],
  ['Lisibilité difficile', 'Votre texte pourrait être simplifié. Utilisez des mots courants et des phrases plus courtes.'],
  ['phrases très longues', 'Certaines phrases dépassent 31 mots. Coupez-les en deux pour améliorer la lisibilité.'],

  // --- Keywords ---
  ['absent du titre', 'Votre mot-clé principal n\'apparaît pas dans le titre de la page. C\'est l\'un des endroits les plus importants pour le SEO.'],
  ['absent du H1', 'Votre mot-clé principal n\'apparaît pas dans le titre principal de la page. Google y accorde beaucoup d\'importance.'],
  ['absent de la méta description', 'Votre mot-clé n\'apparaît pas dans la description Google. Il apparaîtra en gras dans les résultats si vous l\'incluez.'],
  ['absent des 100 premiers mots', 'Mentionnez votre mot-clé dès le début du contenu. Google accorde plus d\'importance aux mots en haut de page.'],
  ['suroptimisation', 'Votre mot-clé apparaît trop souvent. Google peut considérer ça comme du spam. Écrivez naturellement.'],
  ['envisagez de l\'utiliser davantage', 'Votre mot-clé n\'apparaît pas assez dans le texte. Mentionnez-le quelques fois de plus, naturellement.'],
];

/**
 * Returns a plain-language explanation for a technical SEO issue message.
 * Returns undefined if no matching tip is found.
 */
export function getIssueTip(message: string): string | undefined {
  for (const [pattern, tip] of tips) {
    if (typeof pattern === 'string') {
      if (message.includes(pattern)) return tip;
    } else {
      if (pattern.test(message)) return tip;
    }
  }
  return undefined;
}
