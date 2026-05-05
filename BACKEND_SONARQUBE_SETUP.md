# Configuration SonarQube pour le Backend

## Modifications Effectuées

### 1. Jenkinsfile.simple (Backend)

Le pipeline Jenkins a été mis à jour avec les étapes suivantes :

#### Stage Test (Amélioré)
- Exécution des tests avec gestion des erreurs (continue même si tests échouent)
- Vérification automatique de la génération du fichier `coverage/lcov.info`
- Affichage des premières lignes du fichier de couverture pour diagnostic

#### Stage SonarQube Analysis (Nouveau)
- Vérification pré-analyse du répertoire de couverture
- Exécution du scanner SonarQube avec configuration complète :
  - `sonar.projectKey=backend-hr-system`
  - `sonar.sources=src`
  - `sonar.typescript.lcov.reportPaths=coverage/lcov.info`
  - Mode verbose activé pour diagnostic détaillé

#### Stage Quality Gate (Nouveau)
- Vérification du Quality Gate SonarQube (timeout 5 minutes)
- Gestion des échecs avec messages informatifs
- Lien vers le dashboard SonarQube en cas d'échec

### 2. package.json (Backend)

Configuration Jest mise à jour pour garantir la génération du rapport lcov :

```json
"coverageReporters": [
  "text",
  "lcov",
  "json"
]
```

### 3. sonar-project.properties (Backend)

Configuration existante vérifiée et confirmée :
- Chemin de couverture : `coverage/lcov.info`
- Exclusions : tests, node_modules, dist
- Encodage : UTF-8

## Structure des Fichiers de Couverture

```
backend/
├── coverage/
│   ├── lcov.info          ← Utilisé par SonarQube
│   ├── coverage-final.json
│   └── lcov-report/
├── sonar-project.properties
├── package.json
└── Jenkinsfile.simple
```

## Flux de Travail

1. **Stage Test** : 
   - `npm run test:ci` génère les fichiers de couverture
   - Vérification que `coverage/lcov.info` existe
   - Affichage des informations de diagnostic

2. **Stage SonarQube Analysis** :
   - Vérification du répertoire de travail
   - Exécution du scanner avec chemin de couverture
   - Upload des métriques vers SonarQube

3. **Stage Quality Gate** :
   - Attente de l'évaluation SonarQube
   - Vérification des seuils de qualité
   - Échec du build si Quality Gate échoue

## Configuration Jenkins Requise

### Outils Nécessaires
- **Node20** : Outil NodeJS configuré dans Jenkins
- **SonarScanner** : Scanner SonarQube installé et configuré

### Serveur SonarQube
- **Nom** : `SonarQube`
- **URL** : `http://172.17.0.3:9000`
- Configuration dans Jenkins : Manage Jenkins → Configure System → SonarQube servers

## Commandes de Test Local

### Générer la couverture localement
```bash
cd backend
npm run test:ci
```

### Vérifier le fichier de couverture
```bash
ls -lh backend/coverage/lcov.info
head -20 backend/coverage/lcov.info
```

### Exécuter SonarQube Scanner localement (optionnel)
```bash
cd backend
sonar-scanner \
  -Dsonar.projectKey=backend-hr-system \
  -Dsonar.sources=src \
  -Dsonar.typescript.lcov.reportPaths=coverage/lcov.info \
  -Dsonar.host.url=http://172.17.0.3:9000 \
  -Dsonar.login=<votre-token>
```

## Dépannage

### Problème : Fichier de couverture non trouvé
**Solution** :
1. Vérifier que `npm run test:ci` s'exécute sans erreur
2. Vérifier la configuration Jest dans `package.json`
3. Vérifier que `coverageReporters` inclut `"lcov"`

### Problème : SonarQube affiche 0% de couverture
**Solution** :
1. Vérifier que le fichier `coverage/lcov.info` existe
2. Vérifier le chemin dans `sonar-project.properties`
3. Activer le mode verbose : `-Dsonar.verbose=true`
4. Consulter les logs Jenkins pour les erreurs

### Problème : Quality Gate échoue
**Solution** :
1. Consulter le dashboard SonarQube pour les détails
2. Vérifier les seuils configurés dans SonarQube
3. Améliorer la couverture de tests si nécessaire

## Prochaines Étapes

1. **Lancer le build Jenkins** :
   - Aller dans Jenkins
   - Sélectionner le job backend
   - Cliquer sur "Build Now"

2. **Vérifier les résultats** :
   - Consulter les logs Jenkins pour chaque stage
   - Vérifier le dashboard SonarQube : http://172.17.0.3:9000
   - Confirmer que la couverture s'affiche correctement

3. **Ajuster les Quality Gates** (si nécessaire) :
   - Configurer les seuils de couverture dans SonarQube
   - Définir les règles de qualité pour le projet

## Comparaison Frontend vs Backend

| Aspect | Frontend | Backend |
|--------|----------|---------|
| Framework de test | Vitest | Jest |
| Fichier de config | vite.config.ts | package.json (jest) |
| Répertoire coverage | frontend/coverage/ | backend/coverage/ |
| Project Key | frontend-hr-system | backend-hr-system |
| Format coverage | lcov (v8) | lcov (jest) |

Les deux pipelines suivent maintenant la même structure et génèrent des rapports de couverture pour SonarQube.
