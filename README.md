# BZAAR — App React Native (Expo)

## Prérequis
- Node.js + npm (déjà installé ✓)
- Compte gratuit sur https://expo.dev

---

## Étape 1 — Installer Expo + EAS

```bash
npm install -g expo-cli eas-cli
```

---

## Étape 2 — Installer les dépendances du projet

```bash
cd bzaar-native
npm install
```

---

## Étape 3 — Créer un compte Expo (si pas encore fait)

Va sur https://expo.dev → "Sign Up" → crée ton compte gratuitement.

Ensuite connecte-toi dans le terminal :

```bash
eas login
```

---

## Étape 4 — Configurer EAS Build

```bash
eas build:configure
```

> Réponds "All" quand il demande les plateformes.

---

## Étape 5 — Builder l'APK (Android)

```bash
eas build -p android --profile preview
```

> - "preview" = génère un fichier .apk installable directement
> - "production" = génère un .aab pour le Play Store
> - Le build se fait dans le cloud (gratuit, prend ~5-10 min)
> - À la fin tu reçois un lien de téléchargement direct

---

## Étape 6 — Tester sur téléphone

1. Télécharge le .apk depuis le lien EAS
2. Envoie-le sur ton téléphone (WhatsApp, Drive, cable USB...)
3. Installe-le (active "Sources inconnues" si demandé)
4. C'est bon — BZAAR est installé ! 🎉

---

## Tester localement avant le build (optionnel)

```bash
npx expo start
```

→ Installe l'app **Expo Go** sur ton téléphone  
→ Scanne le QR code affiché dans le terminal  
→ Tu vois l'app en direct sur ton téléphone

---

## Fonctionnalités incluses

- ✅ Inscription / Connexion (données sauvegardées sur le téléphone)
- ✅ Publier annonces + services (présentiel / digital)
- ✅ Feed avec recherche et filtres par catégorie
- ✅ Détail avec achat digital (contenu débloqué après achat)
- ✅ Wallet vendeur (90% après commission 10% BZAAR)
- ✅ Messages / Chat en temps réel entre acheteur et vendeur
- ✅ Favoris
- ✅ Profil : Mes Annonces, Mes Achats, Mes Ventes
- ✅ Design orange + bleu nuit BZAAR

---

## Stack technique

| Composant | Outil |
|---|---|
| Framework | Expo SDK 51 (React Native) |
| Stockage | AsyncStorage (local téléphone) |
| Icônes | @expo/vector-icons (Ionicons) |
| Gradients | expo-linear-gradient |
| Build APK | EAS Build (cloud) |
| Backend | **Prochain milestone** → Node.js + MongoDB Atlas |
