# 🎓 Commandes pour la Démonstration des Tests

## ✅ Vérification Rapide (2 commandes)

### 1. Tests Backend
```bash
cd backend
npm test
```

**Résultat attendu**:
```
Test Suites: 10 passed, 10 total
Tests:       68 passed, 68 total
```

### 2. Tests Frontend
```bash
cd frontend
npm test
```

**Résultat attendu**:
```
Test Files  6 passed (6)
Tests  53 passed (53)
```

---

## 📊 Total: 121 Tests ✅

- **Backend**: 68 tests (Jest)
- **Frontend**: 53 tests (Vitest)

---

## 🔍 Tests par Service

### Backend - Tests Individuels

```bash
cd backend

# ActivitiesService (15 tests)
npm test -- activities.service.spec.ts

# ChatService (17 tests)
npm test -- chat.service.spec.ts

# ManagerService (27 tests)
npm test -- manager.service.spec.ts
```

### Frontend - Tests Individuels

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

## 📈 Couverture de Code

### Backend
```bash
cd backend
npm run test:cov
```

Génère un rapport de couverture dans `backend/coverage/`

### Frontend
```bash
cd frontend
npm run test:ci
```

Génère un rapport de couverture dans `frontend/coverage/`

---

## 🚀 Mode CI/CD (Jenkins)

### Backend
```bash
cd backend
npm run test:ci
```

### Frontend
```bash
cd frontend
npm run test:ci
```

Ces commandes génèrent des rapports JUnit pour l'intégration CI/CD.

---

## 🎯 Commande Unique pour Tout Tester

```bash
cd backend && npm test && cd ../frontend && npm test && cd ..
```

---

## 📝 Notes pour la Démo

1. **Temps d'exécution**: ~10-15 secondes total
2. **Aucune dépendance externe**: Pas besoin de MongoDB, Rasa, ou APIs
3. **Tests isolés**: Chaque test est indépendant
4. **Mocks complets**: Toutes les dépendances sont mockées

---

## ✅ Checklist de Vérification

- [ ] Backend: 68 tests passent
- [ ] Frontend: 53 tests passent
- [ ] Aucune erreur dans la console
- [ ] Temps d'exécution < 20 secondes
- [ ] Couverture de code générée

---

## 🆘 En Cas de Problème

### Si les tests backend échouent
```bash
cd backend
npm install
npm test
```

### Si les tests frontend échouent
```bash
cd frontend
npm install
npm test
```

### Nettoyer et réinstaller
```bash
# Backend
cd backend
rm -rf node_modules package-lock.json
npm install
npm test

# Frontend
cd frontend
rm -rf node_modules package-lock.json
npm install
npm test
```

---

**Prêt pour la démonstration !** 🎉
