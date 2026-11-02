# DuoWide

**Des pages web qui occupent tout l’écran externe de l’iPhone Duo dans Safari.**

⭐ Si DuoWide vous plaît, pensez à appuyer sur **Star** en haut de cette page. Cela aide d’autres utilisateurs
d’iPhone Duo à le trouver.
[![GitHub stars](https://img.shields.io/github/stars/hyungchulc/duowide?style=social)](https://github.com/hyungchulc/duowide/stargazers)

[English](README.md) · [한국어](README.ko.md) · [日本語](README.ja.md) · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md) · [Español](README.es.md) · [Português](README.pt-BR.md) · **Français** · [Deutsch](README.de.md)

[Télécharger](https://github.com/hyungchulc/duowide/releases/latest/download/DuoWide.zip) · [Proposer un site](https://github.com/hyungchulc/duowide/issues/new/choose)

<div align="center">
  <img src="media/demo.webp" width="360" alt="DuoWide dans Safari sur l’écran externe de l’iPhone Duo : apple.com, Netflix, Notion, Figma et The Verge affichés jusque sous la bande latérale">
</div>

<details>
<summary>Vidéo complète (19 s, 60 i/s)</summary>

https://github.com/user-attachments/assets/64fab1b0-b13f-4736-ae52-480a993d2d6b

</details>

Sur l’écran externe de l’iPhone Duo, Safari range ses boutons dans une bande de verre le long du bord droit et n’affiche
les pages que jusqu’à cette bande, si bien que les 84 pt situés dessous restent vides. DuoWide est un script utilisateur
(userscript) pour l’extension Safari gratuite [Userscripts](https://apps.apple.com/us/app/userscripts/id1463298887). Il
affiche les pages sur tout l’écran, jusque sous la bande, et veille à ce que rien de ce que vous touchez ne se retrouve
dessous.

> **Bêta.** DuoWide est encore en bêta, et le mode paysage n’est pas pris en charge pour l’instant. Il ne gère pas
> encore tous les sites web : si un site s’affiche mal,
> [ouvrez une issue](https://github.com/hyungchulc/duowide/issues/new/choose) ou écrivez à
> [hyungchulc@gmail.com](mailto:hyungchulc@gmail.com), et je le corrigerai dès que possible.

## Ce que fait DuoWide

- Les pages occupent toute la largeur de l’écran (466 pt au lieu de 382 pt). Les photos, les arrière-plans et la couleur
  des barres passent sous la bande, dont le verre reste transparent.
- Les liens, boutons et champs de texte que la bande recouvrirait se décalent vers l’intérieur, pour que vous puissiez
  toujours les toucher.
- Les paragraphes, commentaires et autres textes courants reviennent à la ligne avant la bande, pour qu’aucune ligne ne
  se termine sous ses boutons. Si vous préférez faire tenir plus de mots sur une ligne, ajoutez l’option facultative
  [texte large](#texte-large-facultatif).
- Les menus, barres d’onglets et autres barres fixes s’arrêtent avant la bande, et leur couleur se prolonge dessous.
- Les carrousels gagnent de l’espace à la fin, pour que vous puissiez faire glisser le dernier élément et le sortir de
  sous la bande.
- Les lecteurs vidéo dont les boutons ne peuvent pas être déplacés (lecteurs intégrés depuis d’autres sites, vidéos avec
  les commandes natives de Safari) passent sous la bande comme des images, jusqu’à ce que vous les touchiez ou les
  lanciez. Ils s’arrêtent alors avant la bande, pour que vous puissiez toujours toucher les boutons plein écran et
  volume.
- La page ne glisse pas sur le côté. Le zoom à deux doigts et les balayages depuis le bord de l’écran pour aller à la
  page précédente ou suivante fonctionnent toujours. DuoWide dessine lui-même la barre de défilement de la page : la
  barre de défilement horizontale d’iOS n’apparaît donc pas en bas de l’écran.
- Dans Split View sur l’écran interne (Safari à côté d’une autre app), les couleurs et arrière-plans de la page se
  prolongent aussi sous la bande de Safari, sur le bord de la fenêtre, tandis que le texte, les images et les boutons
  restent à l’écart de celle-ci. Pour garder la mise en page de Safari dans Split View, réglez `split` sur `false`.
  <br><img src="media/split.webp" width="560" alt="DuoWide dans Split View sur l’écran interne de l’iPhone Duo : Netflix et apple.com côte à côte, les couleurs et arrière-plans de chaque page prolongés sous la bande de sa fenêtre">
- Sur les autres iPhone, sur iPad, sur Mac, ainsi que sur l’écran interne de l’iPhone Duo quand Safari l’occupe en
  entier, DuoWide ne change rien.

## Installation

1. Installez [Userscripts](https://apps.apple.com/us/app/userscripts/id1463298887) depuis l’App Store.
2. Dans Safari sur l’iPhone, téléchargez
   [DuoWide.zip](https://github.com/hyungchulc/duowide/releases/latest/download/DuoWide.zip), puis touchez-le dans l’app
   Fichiers (dossier Téléchargements) pour le décompresser. Le dossier `DuoWide` contient deux scripts. Gardez les
   deux :
   - `DuoWide.user.js` fait le travail.
   - `DuoWide-Frames.user.js` empêche la page de glisser quand un balayage commence dans un cadre qu’elle contient,
     comme une publicité ou une vidéo intégrée, et indique à la page quand vous touchez une vidéo intégrée.

   Déplacez le dossier dans un endroit où il pourra rester, comme iCloud Drive ou Sur mon iPhone.
3. Ouvrez l’app Userscripts, touchez **Change Userscripts Directory** et choisissez le dossier `DuoWide`.
   - Si vous utilisez déjà Userscripts, gardez votre dossier et copiez-y plutôt les deux scripts.
4. Dans **Réglages → Apps → Safari → Extensions → Userscripts**, activez l’extension et réglez **Tous les sites web**
   sur **Autoriser**.
5. Recommandé : dans **Réglages → Apps → Safari**, désactivez **Précharger le meilleur résultat**. Pendant que vous
   tapez une adresse, Safari charge à l’avance le meilleur résultat. Les extensions ne peuvent pas s’exécuter dans une
   page chargée de cette façon : elle s’ouvre donc sans DuoWide jusqu’à ce que vous la rechargiez.
6. Ouvrez ou rechargez une page dans Safari sur l’écran externe.

**Ou installez depuis Safari.** Une fois l’extension activée, ouvrez
[DuoWide.user.js](https://raw.githubusercontent.com/hyungchulc/duowide/main/DuoWide.user.js), ouvrez Userscripts depuis
le menu des extensions de Safari et touchez l’invite d’installation. Faites de même pour
[DuoWide-Frames.user.js](https://raw.githubusercontent.com/hyungchulc/duowide/main/DuoWide-Frames.user.js).

## Texte large (facultatif)

Par défaut, DuoWide renvoie à la ligne les paragraphes, commentaires et autres textes courants avant la bande, pour
qu’aucune ligne ne se termine sous les boutons de Safari. Si vous préférez faire tenir plus de mots sur une ligne, par
exemple quand vous zoomez sur la page, ajoutez le fichier facultatif `DuoWide-WideText.user.js` :

- Les lignes de texte se prolongent sous la bande, jusqu’au bord de l’écran. Elles restent visibles à travers le verre.
  Seules les lettres qui passent juste sous un bouton sont masquées, et le défilement les fait passer au-delà du bouton.
- Un paragraphe dont un lien se retrouverait sous la bande revient quand même à la ligne avant celle-ci, pour que vous
  puissiez toujours toucher le lien. Les liens, boutons, menus, tableaux et vidéos sont gérés comme avant.
- Ce n’est qu’un interrupteur pour `DuoWide.user.js` 1.6.5 ou version ultérieure : seul, il ne fait rien. Mettez donc
  d’abord DuoWide à jour si votre version est plus ancienne. Tout script présent dans le dossier est actif, c’est
  pourquoi celui-ci ne fait pas partie de `DuoWide.zip` : il n’est dans le dossier que si vous l’ajoutez.

**Pour l’ajouter**

1. Une fois l’extension Userscripts activée, ouvrez
   [DuoWide-WideText.user.js](https://raw.githubusercontent.com/hyungchulc/duowide/main/DuoWide-WideText.user.js) dans
   Safari sur l’iPhone.
2. Ouvrez Userscripts depuis le menu des extensions de Safari et touchez l’invite d’installation. Userscripts enregistre
   alors le script dans votre dossier Userscripts, à côté des deux autres.
3. Rechargez la page que vous lisez.

Vous pouvez aussi télécharger `DuoWide-WideText.user.js` depuis la
[dernière version](https://github.com/hyungchulc/duowide/releases/latest) (sous **Assets**) et le déplacer dans le
dossier qui contient les deux autres scripts. Ouvrez ensuite une fois le menu Userscripts dans Safari pour qu’il prenne
en compte le nouveau fichier.

**Pour le désactiver ou le réactiver**

Ouvrez Userscripts depuis le menu des extensions de Safari, touchez **DuoWide-WideText** dans la liste pour le
désactiver (ou le réactiver), puis rechargez la page. Il reste désactivé même après les mises à jour, jusqu’à ce que
vous le réactiviez. Pour le retirer, supprimez le fichier du dossier.

## Mises à jour

Les scripts vérifient sur ce dépôt si de nouvelles versions sont disponibles. Quand il y en a une, elle apparaît dans le
menu Userscripts de Safari : touchez **Update All**. Vous pouvez aussi télécharger le nouveau zip et remplacer les deux
fichiers (ainsi que `DuoWide-WideText.user.js` de la même version, si vous l’utilisez).

## Paramètres

`CONFIG`, en haut de `DuoWide.user.js` :

| Paramètre | Valeur par défaut | Effet |
| --- | --- | --- |
| `skip` | `[]` | Sites à laisser tels quels, comme `["example.com"]` (sous-domaines compris). |
| `landscape` | `false` | Élargit aussi les pages en mode paysage. Pas encore pris en charge. |
| `left` | `false` | Avec `landscape` activé, élargit aussi les pages quand la bande est à gauche. |
| `bar` | `true` | Masque la barre de défilement horizontale d’iOS et dessine la barre verticale à sa place. `false` garde les barres d’iOS. |
| `split` | `true` | Dans Split View sur l’écran interne, prolonge aussi les couleurs de la page sous la bande de Safari. `false` garde la mise en page de Safari dans Split View. |

Ouvrez le fichier dans un éditeur de texte capable de modifier les fichiers sur place. Une mise à jour remplace le
fichier : redéfinissez donc ces paramètres après chaque mise à jour.

## Problèmes connus

- Le mode paysage n’est pas encore pris en charge. En paysage, les pages restent telles que Safari les affiche.
- Une page qui garde un menu à côté de son contenu et s’ouvre déjà défilée au-delà de ce menu, comme chatgpt.com, reste
  à la largeur par défaut de Safari. Si elle était élargie, Safari laisserait ses barres à la traîne chaque fois que le
  menu glisse pour s’ouvrir ou se fermer.
- Sur les pages élargies, toucher deux fois effectue un zoom avant. Safari le permet quand la largeur d’une page est
  définie par un nombre, et le réglage qui le désactive ne peut pas être combiné avec celui qui empêche la page de
  glisser sur le côté.
- Certains sites ne fonctionnent pas encore bien. N’hésitez pas à les signaler.

## Proposer un site ou signaler un problème

[Ouvrez une issue](https://github.com/hyungchulc/duowide/issues/new/choose) avec l’adresse de la page, ce qui s’affiche
mal et, si possible, une capture d’écran, ou écrivez à [hyungchulc@gmail.com](mailto:hyungchulc@gmail.com). Je ferai en
sorte que le site fonctionne dès que possible.

## Licence

[MIT](LICENSE)
