# 📋 Guide des Tests Unitaires - Projet HR Recommendation

Ce document présente tous les tests unitaires créés pour le projet, avec les commandes pour les exécuter.

---

## 🎯 Vue d'Ensemble

### Statistiques Globales

| Partie | Framework | Tests Créés | Status |
|--------|-----------|-------------|--------|
| **Backend** | Jest (NestJS) | 68 tests | ✅ 68/68 |
| **Frontend** | Vitest + React Testing Library | 53 tests | ✅ 53/53 |
| **TOTAL** | - | **121 tests** | ✅ **121/121** |

---

## 🔧 Backend - Tests NestJS (Jest)

### Services Testés

#### 1. ActivitiesService (15 tests)
**Fichier**: `backend/src/activities/activities.service.spec.ts`

**Couverture**:
- ✅ Création d'activités
- ✅ Récupération de toutes les activités
- ✅ Récupération d'une activité par ID
- ✅ Mise à jour d'activités
- ✅ Suppression d'activités
- ✅ Gestion des erreurs (BadRequestException, NotFoundException)

**Commande**:
```bash
cd backend
npm test -- activities.service.spec.ts
```

---

#### 2. ChatService (17 tests)
**Fichier**: `backend/src/chat/chat.service.spec.ts`

**Couverture**:
- ✅ Envoi de messages au chatbot Rasa
- ✅ Réécriture de prompts avec OpenRouter
- ✅ Génération de guides utilisateur
- ✅ Gestion des erreurs réseau (ECONNREFUSED)
- ✅ Gestion des erreurs HTTP (500, 404)
- ✅ Modes de fallback

**Commande**:
```bash
cd backend
npm test -- chat.service.spec.ts
```

---

#### 3. ManagerService (27 tests)
**Fichier**: `backend/src/manager/manager.service.spec.ts`

**Couverture**:
- ✅ Création de demandes d'activités
- ✅ Récupération des activités du département
- ✅ Gestion des employés
- ✅ Confirmation des participants
- ✅ Ajout manuel d'employés
- ✅ Évaluation des compétences
- ✅ Dashboard manager
- ✅ Validation des IDs MongoDB

**Commande**:
```bash
cd backend
npm test -- manager.service.spec.ts
```

---

### Commandes Backend

#### Lancer TOUS les tests backend
```bash
cd backend
npm test
```

#### Lancer les tests avec couverture de code
```bash
cd backend
npm run test:cov
```

#### Lancer les tests en mode watch
```bash
cd backend
npm test -- --watch
```

#### Lancer les tests en mode CI (pour Jenkins)
```bash
cd backend
npm run test:ci
```

---

## ⚛️ Frontend - Tests React (Vitest)

### Services Testés

#### 1. ChatService (7 tests)
**Fichier**: `frontend/src/services/chatService.test.ts`

**Couverture**:
- ✅ Envoi de messages réussi
- ✅ Gestion erreur 400 (Bad Request)
- ✅ Gestion erreur 404 (Not Found)
- ✅ Gestion erreur 503 (Service Unavailable)
- ✅ Gestion erreur 500 (Server Error)
- ✅ Gestion erreur réseau
- ✅ Gestion réponse vide

**Commande**:
```bash
cd frontend
npm test -- chatService.test.ts
```

---

#### 2. RecommendationService (13 tests)
**Fichier**: `frontend/src/services/recommendationService.test.ts`

**Couverture**:
- ✅ Réponse ACCEPTED avec succès
- ✅ Réponse REJECTED avec succès
- ✅ Gestion erreur réseau
- ✅ Gestion erreur 404 (recommandation non trouvée)
- ✅ Gestion erreur 500 (serveur)
- ✅ Gestion erreur 401 (token expiré)
- ✅ Refresh automatique du token JWT
- ✅ Redirection vers login si refresh échoue
- ✅ Mise à jour du token
- ✅ Gestion erreurs personnalisées

**Commande**:
```bash
cd frontend
npm test -- recommendationService.test.ts
```

---

#### 3. GoogleCalendarService (10 tests)
**Fichier**: `frontend/src/services/googleCalendarService.test.ts`

**Couverture**:
- ✅ Vérification connexion Google (token valide/expiré)
- ✅ Déconnexion Google
- ✅ Révocation du token
- ✅ Nettoyage localStorage
- ✅ Statut de connexion avec email
- ✅ Validation du type ActivityEvent

**Commande**:
```bash
cd frontend
npm test -- googleCalendarService.test.ts
```

---

#### 4. Tests Existants (23 tests)
Le projet contient déjà des tests pour:
- `gestureDetector.test.ts` - Détection de gestes
- `mediapipe-setup.test.ts` - Configuration MediaPipe
- Tests WCAG (wcag-analyzer)

---

### Commandes Frontend

#### Lancer TOUS les tests frontend
```bash
cd frontend
npm test
```

#### Lancer les tests avec couverture de code
```bash
cd frontend
npm run test:ci
```

#### Lancer les tests en mode watch
```bash
cd frontend
npm run test:watch
```

#### Lancer les tests avec UI interactive
```bash
cd frontend
npm run test:ui
```

---

## 🚀 Commandes Rapides pour Démo

### Démonstration Complète

```bash
# Backend
cd backend
npm test
npm run test:cov

# Frontend
cd frontend
npm test
npm run test:ci
```

### Démonstration par Service

**Backend**:
```bash
cd backend

# ActivitiesService (15 tests)
npm test -- activities.service.spec.ts

# ChatService (17 tests)
npm test -- chat.service.spec.ts

# ManagerService (27 tests)
npm test -- manager.service.spec.ts
```

**Frontend**:
```bash
cd frontend

# ChatService (7 tests)
npm test -- chatService.test.ts

# RecommendationService (13 tests)
npm test -- recommendationService.test.ts

# GoogleCalendarService (10 tests)
npm test -- googleCalendarService.test.ts
```

---

## 📊 Détails des Tests

### Backend (Jest)

**Configuration**: `backend/package.json`
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:ci": "jest --ci --coverage --maxWorkers=2"
  }
}
```

**Caractéristiques**:
- ✅ Mocks complets (Mongoose, HTTP, Services)
- ✅ Pas d'accès réel à la base de données
- ✅ Pas d'appels API externes
- ✅ Tests isolés et indépendants
- ✅ Temps d'exécution: ~2-3s par fichier

---

### Frontend (Vitest)

**Configuration**: `frontend/vite.config.ts`
```typescript
{
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'json'],
    }
  }
}
```

**Caractéristiques**:
- ✅ Mocks de fetch et axios
- ✅ Mocks de localStorage
- ✅ Mocks de window.location
- ✅ Tests isolés et indépendants
- ✅ Temps d'exécution: ~7-8s total

---

## 🎓 Pour le Professeur

### Commandes à Exécuter en Démo

**1. Tests Backend Complets**:
```bash
cd backend
npm test
```
**Résultat attendu**: 68 tests passent (15 + 17 + 27 + 9 autres tests existants)

**2. Tests Frontend Complets**:
```bash
cd frontend
npm test
```
**Résultat attendu**: 53 tests passent

**3. Couverture de Code Backend**:
```bash
cd backend
npm run test:cov
```

**4. Couverture de Code Frontend**:
```bash
cd frontend
npm run test:ci
```

---

## 📝 Notes Importantes

### Backend
- ⚠️ Les warnings Mongoose sur les index dupliqués sont normaux et n'affectent pas les tests
- ✅ Tous les services utilisent des mocks complets
- ✅ Aucune base de données requise pour les tests

### Frontend
- ✅ Tests compatibles avec Vitest 4.x
- ✅ Environnement jsdom pour simuler le navigateur
- ✅ Mocks de toutes les APIs externes (Google, Backend)

---

## 🔍 Vérification Rapide

Pour vérifier que tout fonctionne:

```bash
# Backend
cd backend && npm test && cd ..

# Frontend
cd frontend && npm test && cd ..
```

Si tous les tests passent, vous verrez:
- ✅ Backend: **68 tests passed** (dont 59 nouveaux tests créés)
- ✅ Frontend: **53 tests passed**
- ✅ **Total: 121 tests passed**

---

## 📚 Ressources

- **Jest Documentation**: https://jestjs.io/
- **Vitest Documentation**: https://vitest.dev/
- **NestJS Testing**: https://docs.nestjs.com/fundamentals/testing
- **React Testing Library**: https://testing-library.com/react

---

**Date de création**: Décembre 2024  
**Auteur**: Équipe DevOps  
**Version**: 1.0
