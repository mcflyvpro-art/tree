# Arbre des trois monothéismes

Application web installable (PWA) pour explorer l'arbre généalogique et doctrinal du **judaïsme**, du **christianisme** et de l'**islam** : 455 personnes, courants et événements, d'Adam aux mouvements d'aujourd'hui, avec pour chacun ce que racontent les traditions et ce que confirme l'histoire.

**Adresse de l'application : https://mcflyvpro-art.github.io/tree/**

## Ce que propose l'application

- **L'arbre** : navigation fluide (glisser, pincer, molette, clavier), branches à déplier, filtres par tradition et par degré d'historicité, plan d'ensemble, liens transversaux expliqués (confrontations et alliances), aperçu au survol.
- **Des fiches claires** : rôle et récit, ce que dit l'histoire, confrontations, preuves archéologiques, lignée depuis Adam, frères et sœurs, descendants, partage.
- **Rien d'obscur** :
  - 262 mots du lexique (fitna, Michna, consubstantiel, ostracon, AM…) soulignés en pointillé et expliqués d'une touche ;
  - les références (« Gn 4,8 », « Coran 2,127 », « Shabbat 31a ») décodées, avec lien vers le texte ;
  - les personnages cités dans les textes deviennent des liens vers leur fiche.
- **Apprendre** : 11 parcours guidés racontés étape par étape, un quiz généré à partir de l'arbre, des anecdotes, le suivi de progression (fiches lues, parcours terminés, record au quiz).
- **Preuves** et **Confrontations** présentées en frises chronologiques filtrables, **Lexique** complet de A à Z.
- **PWA** : installable sur téléphone, tablette et ordinateur, fonctionne hors connexion, thème clair ou sombre, adresses partageables pour chaque fiche (`#/arbre/abraham`), bouton retour du téléphone pris en charge.

## Installer l'application

- **Android / Chrome / Edge** : bouton « Installer » dans la barre du haut (ou menu du navigateur → « Installer l'application »).
- **iPhone / iPad** : dans Safari, bouton Partager → « Sur l'écran d'accueil ».
- **Ordinateur** : icône d'installation dans la barre d'adresse de Chrome ou Edge.

## Publication sur GitHub Pages

Le workflow `.github/workflows/pages.yml` vérifie les données puis publie le site à chaque mise à jour de la branche `main`.

Une seule fois, dans le dépôt : **Settings → Pages → Build and deployment → Source : GitHub Actions**. Le déploiement peut aussi être relancé à la main depuis l'onglet **Actions** (« Publier sur GitHub Pages » → « Run workflow »).

## Modifier le contenu

| Fichier | Contenu |
| --- | --- |
| `js/data.js` | Les entrées de l'arbre (`NODES`), les liens transversaux (`XLINKS`), les preuves (`EVID`) et les confrontations (`CONF`). |
| `js/content.js` | Le lexique (`GLOSSARY`), les abréviations bibliques, les noms des sourates, les parcours guidés (`TOURS`) et les réglages des liens automatiques. |
| `js/rich.js` | La lecture enrichie des textes (références, mots du lexique, noms cités). |
| `js/app.js`, `css/app.css`, `index.html` | L'application et son apparence. |
| `sw.js`, `manifest.webmanifest`, `icons/` | Le fonctionnement hors connexion et l'installation. |

Champs d'une entrée de l'arbre : `i` identifiant, `p` parent, `n` nom, `a` autres noms, `d` dates, `t` tradition (`c` tronc commun, `j` judaïsme, `x` christianisme, `m` islam, `o` autres peuples, `n` religions issues), `h` historicité (`A` attesté, `H` historique, `D` débattu, `T` tradition seule), `k` nature (`p` personne, `m` courant, `e` événement), `l` trait (`f` filiation, `g` générations omises, `s` transmission, `r` rupture, `a` filiation légale), `x` récit, `e` histoire, `f` confrontations. Tradition et historicité s'héritent du parent quand elles sont absentes.

Avant de publier, vérifiez la cohérence :

```sh
node tools/check.mjs
```

Pour tester en local : `npx http-server -c-1 .` puis ouvrir http://localhost:8080.

## Crédits

Police [Gentium Book Plus](https://software.sil.org/gentium/) (SIL International), sous licence SIL Open Font License 1.1 (`fonts/OFL.txt`), incluse pour le fonctionnement hors connexion.
