# PneuMali Frontend

> Application web Angular pour la gestion et la vente de pneus au Mali

[![Angular](https://img.shields.io/badge/Angular-19.2.0-red.svg)](https://angular.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.2-blue.svg)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4.18-38bdf8.svg)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

## 📋 Table des matières

- [À propos](#-à-propos)
- [Fonctionnalités](#-fonctionnalités)
- [Prérequis](#-prérequis)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Démarrage](#-démarrage)
- [Structure du projet](#-structure-du-projet)
- [Technologies utilisées](#-technologies-utilisées)
- [Scripts disponibles](#-scripts-disponibles)
- [Architecture](#-architecture)
- [Sécurité](#-sécurité)
- [Déploiement](#-déploiement)
- [Dépannage](#-dépannage)
- [Contribution](#-contribution)

## 🎯 À propos

PneuMali Frontend est l'interface utilisateur d'une application complète de gestion et de vente de pneus. L'application propose deux espaces distincts :

- **Frontoffice** : Interface publique pour les clients (boutique, devis, panier, profil)
- **Backoffice** : Interface d'administration pour la gestion (produits, commandes, livreurs, influenceurs)

## ✨ Fonctionnalités

### Frontoffice

- 🛒 **Boutique en ligne** avec recherche et filtres avancés
- 📝 **Système de devis** personnalisés
- 🛍️ **Panier d'achat** avec gestion des quantités
- 👤 **Gestion de profil** utilisateur
- 📋 **Suivi des commandes** et historique
- ⭐ **Liste de favoris** pour les produits
- 📧 **Contact** et support client
- 📰 **Blog** et actualités

### Backoffice

- 📊 **Tableau de bord** avec statistiques
- 📦 **Gestion des produits** (CRUD complet)
- 🏷️ **Gestion des catégories, marques et types de véhicules**
- 🚚 **Gestion des livreurs** avec tableau de bord dédié
- 👥 **Gestion des influenceurs** et archivage
- 🎁 **Gestion des promotions**
- 📄 **Gestion des devis** avec workflow complet
- 🔍 **Conditions de pneus** et paramètres

### Authentification

- 🔐 Connexion sécurisée avec JWT
- 📝 Inscription utilisateur
- 🔑 Réinitialisation de mot de passe
- ✉️ Vérification d'email
- 🔒 Protection des routes par guards

## 📦 Prérequis

Avant de commencer, assurez-vous d'avoir installé :

- **Node.js** (version 18 ou supérieure) - [Télécharger](https://nodejs.org/)
- **npm** (généralement inclus avec Node.js)
- **Backend Spring Boot** démarré sur le port 9999

### Vérification des prérequis

```bash
node --version  # Doit afficher v18.x.x ou supérieur
npm --version   # Doit afficher 9.x.x ou supérieur
```

## 🚀 Installation

1. **Cloner le dépôt** (si ce n'est pas déjà fait)

```bash
git clone <repository-url>
cd pneuMaliApp/pneufront
```

2. **Installer les dépendances**

```bash
npm install
```

> ⚠️ **Note** : Si vous rencontrez des erreurs de dépendances peer, utilisez :
>
> ```bash
> npm install --legacy-peer-deps
> ```

## ⚙️ Configuration

### Variables d'environnement

Le fichier `src/app/environment.ts` contient la configuration de l'API :

```typescript
export const environment = {
  production: false,
  apiUrl: "http://localhost:9999/api",
};
```

Pour la production, créez `src/app/environment.prod.ts` :

```typescript
export const environment = {
  production: true,
  apiUrl: "https://api.votre-domaine.com/api",
};
```

### Configuration de l'API

Assurez-vous que l'URL de l'API correspond à celle de votre backend Spring Boot. Par défaut, le backend doit être accessible sur `http://localhost:9999/api`.

## 🏃 Démarrage

### Développement

1. **Démarrer le backend Spring Boot** (dans le dossier `pneumback`) :

```bash
cd ../pneumback
./mvnw spring-boot:run
```

2. **Démarrer le serveur de développement Angular** :

```bash
cd ../pneufront
npm start
```

3. **Accéder à l'application** :

- Frontend : http://localhost:4200
- Backend API : http://localhost:9999/api

Le serveur de développement se rechargera automatiquement lors des modifications.

### Production

```bash
npm run build
```

Les fichiers de production seront générés dans le dossier `dist/pneumalifront/browser`.

## 📁 Structure du projet

```
pneufront/
├── src/
│   ├── app/
│   │   ├── auth/              # Modules d'authentification
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   ├── forgot-password/
│   │   │   └── verify/
│   │   ├── frontoffice/       # Interface publique
│   │   │   ├── home/
│   │   │   ├── shop/
│   │   │   ├── cart/
│   │   │   ├── profil/
│   │   │   └── ...
│   │   ├── backoffice/        # Interface d'administration
│   │   │   ├── dashboard/
│   │   │   ├── products/
│   │   │   ├── categories/
│   │   │   ├── livreurs/
│   │   │   └── ...
│   │   ├── guard/             # Guards de sécurité
│   │   ├── interceptor/       # Intercepteurs HTTP
│   │   ├── services/          # Services Angular
│   │   └── shared/            # Composants et utilitaires partagés
│   ├── assets/
│   │   └── i18n/              # Fichiers de traduction
│   ├── index.html
│   └── main.ts
├── angular.json               # Configuration Angular CLI
├── package.json               # Dépendances npm
├── tailwind.config.js         # Configuration TailwindCSS
├── tsconfig.json              # Configuration TypeScript
└── vercel.json                # Configuration Vercel (déploiement)
```

## 🛠️ Technologies utilisées

### Core

- **[Angular 19.2](https://angular.io/)** - Framework principal
- **[TypeScript 5.7](https://www.typescriptlang.org/)** - Langage de programmation
- **[RxJS 7.8](https://rxjs.dev/)** - Programmation réactive

### UI & Styling

- **[TailwindCSS 3.4](https://tailwindcss.com/)** - Framework CSS utilitaire
- **[DaisyUI 5.3](https://daisyui.com/)** - Composants UI pour TailwindCSS

### Features

- **[ngx-translate 17](https://github.com/ngx-translate/core)** - Internationalisation (i18n)
- **[Chart.js 4.5](https://www.chartjs.org/)** - Graphiques et visualisations
- **[ngx-extended-pdf-viewer 22.3](https://pdfviewer.net/)** - Visualisation de PDF
- **[Angular Service Worker](https://angular.io/guide/service-worker-intro)** - PWA et mise en cache

### Outils de développement

- **Angular CLI 19.2** - Outils de ligne de commande
- **Karma & Jasmine** - Tests unitaires
- **ESLint** - Linting du code

## 📜 Scripts disponibles

| Commande        | Description                                                   |
| --------------- | ------------------------------------------------------------- |
| `npm start`     | Démarre le serveur de développement sur http://localhost:4200 |
| `npm run build` | Compile l'application pour la production dans `dist/`         |
| `npm test`      | Lance les tests unitaires avec Karma                          |
| `npm run watch` | Compile en mode watch pour le développement                   |

## 🏗️ Architecture

### Guards de sécurité

L'application utilise plusieurs guards pour protéger les routes :

- **`AuthGuard`** : Protège les routes nécessitant une authentification
- **`LoginGuard`** : Redirige les utilisateurs connectés depuis les pages d'auth
- **`AdminGuard`** : Restreint l'accès aux administrateurs et développeurs
- **`LivreurGuard`** : Restreint l'accès aux livreurs

### Intercepteurs HTTP

- **`AuthInterceptor`** : Ajoute automatiquement le token JWT aux requêtes HTTP

### Services principaux

- **`AuthService`** : Gestion de l'authentification et des tokens
- **`CartService`** : Gestion du panier d'achat
- **`QuoteService`** : Gestion des devis
- **`AdminQuoteService`** : Gestion administrative des devis
- **`LivreurService`** : Services spécifiques aux livreurs

### Internationalisation

L'application supporte le français et l'anglais via `ngx-translate`. Les fichiers de traduction se trouvent dans `src/assets/i18n/`.

## 🔒 Sécurité

- **JWT Authentication** : Authentification basée sur les tokens
- **Route Guards** : Protection des routes sensibles
- **HTTP Interceptors** : Injection automatique des tokens
- **XSS Protection** : Headers de sécurité configurés (Vercel)
- **CORS** : Configuration côté backend

## 🚀 Déploiement

### Vercel (Recommandé)

L'application est configurée pour être déployée sur Vercel :

1. Connectez votre dépôt à Vercel
2. Configurez les variables d'environnement si nécessaire
3. Le fichier `vercel.json` contient déjà la configuration nécessaire

### Autres plateformes

Pour déployer sur d'autres plateformes :

```bash
npm run build
```

Puis servez le contenu du dossier `dist/pneumalifront/browser` avec votre serveur web préféré.

### Service Worker (PWA)

L'application est configurée comme Progressive Web App (PWA) avec un service worker. En production, le service worker est automatiquement activé pour :

- Mise en cache des ressources
- Mode hors ligne
- Mises à jour automatiques

## 🔧 Dépannage

### Erreur de connexion au backend

**Symptôme** : L'application ne peut pas se connecter au backend

**Solutions** :

1. Vérifiez que le backend Spring Boot est démarré :

   ```bash
   # Dans le dossier pneumback
   ./mvnw spring-boot:run
   ```

2. Vérifiez l'URL de l'API dans `src/app/environment.ts`

3. Vérifiez que le backend écoute sur le port 9999 :
   - Backend : http://localhost:9999/api/auth/login (doit retourner une erreur 405 - normal)

### Erreurs de dépendances

**Symptôme** : `npm install` échoue avec des erreurs de peer dependencies

**Solution** :

```bash
npm install --legacy-peer-deps
```

### Port déjà utilisé

**Symptôme** : `Error: Port 4200 is already in use`

**Solution** :

```bash
# Utiliser un autre port
ng serve --port 4201
```

### Problèmes de compilation TypeScript

**Symptôme** : Erreurs de compilation TypeScript

**Solutions** :

1. Supprimez `node_modules` et réinstallez :

   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. Vérifiez la version de Node.js (doit être 18+)

### Service Worker en développement

Le service worker est désactivé en mode développement. Pour le tester localement, utilisez :

```bash
npm run build
npx http-server dist/pneumalifront/browser
```

## 🤝 Contribution

Les contributions sont les bienvenues ! Pour contribuer :

1. Forkez le projet
2. Créez une branche pour votre fonctionnalité (`git checkout -b feature/AmazingFeature`)
3. Committez vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Pushez vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

### Standards de code

- Suivez les conventions Angular
- Utilisez TypeScript strict mode
- Écrivez des tests pour les nouvelles fonctionnalités
- Documentez votre code

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 📞 Support

Pour toute question ou problème :

- Ouvrez une [issue](https://github.com/votre-repo/issues)
- Contactez l'équipe de développement

---

**Développé avec ❤️ pour PneuMali**
