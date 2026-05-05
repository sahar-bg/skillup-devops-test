# Configuration Jenkins - Solution Immédiate

## 🚨 Problème actuel
L'erreur "No tool named SonarScanner found" indique que Jenkins n'a pas le serveur SonarQube configuré.

## ✅ Solution immédiate (sans SonarQube)

### Étape 1: Utiliser les Jenkinsfiles fonctionnels
1. **Backend-Test job** :
   - Allez dans votre job Backend-Test
   - Cliquez sur **Configure**
   - Dans **Pipeline** → **Script Path**, changez vers : `backend/Jenkinsfile.working`
   - Cliquez **Save**

2. **Frontend-Tests job** :
   - Allez dans votre job Frontend-Tests
   - Cliquez sur **Configure**
   - Dans **Pipeline** → **Script Path**, changez vers : `frontend/Jenkinsfile.working`
   - Cliquez **Save**

### Étape 2: Tester immédiatement
1. Lancez **Build Now** sur Backend-Test
2. Lancez **Build Now** sur Frontend-Tests
3. Les pipelines devraient maintenant fonctionner !

## 🔧 Configuration SonarQube (optionnel - pour plus tard)

### Étape 1: Installer SonarQube
```bash
# Si SonarQube n'est pas installé
docker run -d --name sonarqube -p 9000:9000 sonarqube:latest
```

### Étape 2: Configurer Jenkins
1. **Manage Jenkins** → **Configure System**
2. Section **SonarQube servers** :
   - Cliquez **Add SonarQube**
   - **Name** : `SonarQubeServer`
   - **Server URL** : `http://localhost:9000`
   - Laissez le token vide pour l'instant
   - Cliquez **Save**

### Étape 3: Configurer les outils
1. **Manage Jenkins** → **Global Tool Configuration**
2. Section **SonarQube Scanner** :
   - Cliquez **Add SonarQube Scanner**
   - **Name** : `SonarScanner`
   - **Install automatically** : ✓
   - **Version** : SonarQube Scanner 6.3.0.6189
   - Cliquez **Save**

### Étape 4: Activer SonarQube
Une fois SonarQube configuré, changez les Script Path vers :
- Backend : `backend/Jenkinsfile`
- Frontend : `frontend/Jenkinsfile`

## 🎯 Résumé des fichiers

| Fichier | Usage |
|---------|-------|
| `backend/Jenkinsfile.working` | **UTILISER MAINTENANT** - Sans SonarQube |
| `frontend/Jenkinsfile.working` | **UTILISER MAINTENANT** - Sans SonarQube |
| `backend/Jenkinsfile` | Pour plus tard - Avec SonarQube |
| `frontend/Jenkinsfile` | Pour plus tard - Avec SonarQube |
| `backend/Jenkinsfile.simple` | Backup |
| `frontend/Jenkinsfile.simple` | Backup |

## ✅ Actions immédiates
1. Changez les Script Path vers `.working`
2. Testez vos pipelines
3. Configurez SonarQube plus tard si nécessaire