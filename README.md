# PneuMali Frontend

## 🚀 Démarrage du projet

### Prérequis

- Node.js (version 18+)
- Backend Spring Boot démarré sur le port 9999

### Instructions de démarrage

1. **Installer les dépendances** :

   ```bash
   npm install
   ```

2. **Démarrer le backend Spring Boot** (dans le dossier `pneumaliback`) :

   ```bash
   ./mvnw spring-boot:run
   ```

3. **Démarrer le frontend** (dans le dossier `pneumalifront`) :

   ```bash
   npm start
   ```

4. **Accéder à l'application** :
   - Frontend : http://localhost:4200
   - Backend API : http://localhost:9999/api

### 🔧 Configuration

Le frontend communique directement avec le backend via l'URL configurée dans `src/app/environement.ts` :

```typescript
export const environment = {
  production: false,
  apiUrl: "http://localhost:9999/api",
};
```

### 📋 Scripts disponibles

- `npm start` : Démarre le serveur de développement
- `npm run build` : Compile l'application pour la production
- `npm test` : Lance les tests unitaires

### 🔐 Guards de sécurité

L'application utilise des guards pour protéger les routes :

- **AuthGuard** : Protège les routes nécessitant une authentification
- **LoginGuard** : Redirige les utilisateurs connectés depuis les pages d'auth
- **AdminGuard** : Restreint l'accès aux administrateurs

### 🚨 Résolution des problèmes

#### Erreur de connexion

**Cause** : Le backend Spring Boot n'est pas démarré

**Solution** :

1. Dans le dossier `pneumaliback`, exécutez : `./mvnw spring-boot:run`
2. Attendez que le message "Started PneumalibackApplication" apparaisse
3. Redémarrez le frontend avec `npm start`

### 🔍 Vérification

Pour vérifier que tout fonctionne :

1. Backend : http://localhost:9999/api/auth/login (doit retourner une erreur 405 - normal)
2. Frontend : http://localhost:4200 (doit afficher la page de connexion)
