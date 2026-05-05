# Configuration SonarQube avec Jenkins

## Étape 1: Configuration du serveur SonarQube dans Jenkins

### 1.1 Accéder à la configuration SonarQube
1. Allez dans **Jenkins Dashboard** → **Manage Jenkins** → **Configure System**
2. Trouvez la section **SonarQube servers**
3. Cliquez sur **Add SonarQube**

### 1.2 Configurer le serveur SonarQube
Remplissez les champs suivants :

- **Name**: `SonarQubeServer` (exactement ce nom - utilisé dans les Jenkinsfiles)
- **Server URL**: `http://localhost:9000` (ou l'URL de votre serveur SonarQube)
- **Server authentication token**: 
  - Laissez vide pour l'instant si l'accès anonyme est activé
  - Ou créez un token dans SonarQube (voir étape 2)

### 1.3 Sauvegarder la configuration
Cliquez sur **Save** pour enregistrer la configuration.

## Étape 2: Créer un token d'authentification SonarQube (optionnel)

### 2.1 Accéder à SonarQube
1. Ouvrez votre navigateur et allez sur `http://localhost:9000`
2. Connectez-vous avec vos identifiants SonarQube

### 2.2 Créer un token
1. Cliquez sur votre avatar en haut à droite
2. Allez dans **My Account** → **Security**
3. Dans la section **Tokens**, entrez un nom pour le token (ex: `jenkins-token`)
4. Cliquez sur **Generate**
5. **IMPORTANT**: Copiez le token généré immédiatement (il ne sera plus affiché)

### 2.3 Ajouter le token dans Jenkins
1. Retournez dans Jenkins → **Manage Jenkins** → **Configure System**
2. Dans la section **SonarQube servers**, éditez votre configuration
3. Dans **Server authentication token**, cliquez sur **Add** → **Jenkins**
4. Sélectionnez **Secret text**
5. Collez votre token SonarQube dans le champ **Secret**
6. Donnez un ID (ex: `sonarqube-token`)
7. Cliquez sur **Add**
8. Sélectionnez le token créé dans la liste déroulante
9. Cliquez sur **Save**

## Étape 3: Vérifier la configuration des outils

### 3.1 Vérifier SonarQube Scanner
1. Allez dans **Manage Jenkins** → **Global Tool Configuration**
2. Trouvez la section **SonarQube Scanner**
3. Vérifiez qu'il y a une installation nommée **SonarScanner**
4. Si elle n'existe pas, ajoutez-la :
   - **Name**: `SonarScanner`
   - **Install automatically**: coché
   - **Version**: SonarQube Scanner 6.3.0.6189

### 3.2 Vérifier NodeJS
1. Dans la même page, trouvez la section **NodeJS**
2. Vérifiez qu'il y a une installation nommée **Node20**
3. Si elle n'existe pas, ajoutez-la :
   - **Name**: `Node20`
   - **Install automatically**: coché
   - **Version**: NodeJS 20.x

## Étape 4: Tester la configuration

### 4.1 Créer les projets dans SonarQube
1. Ouvrez SonarQube (`http://localhost:9000`)
2. Cliquez sur **Create Project** → **Manually**
3. Créez deux projets :
   - **Project key**: `backend-hr-system`
   - **Display name**: `Backend HR System`
   
   - **Project key**: `frontend-hr-system`
   - **Display name**: `Frontend HR System`

### 4.2 Mettre à jour vos jobs Jenkins
1. Allez dans vos jobs Jenkins (Backend-Test et Frontend-Tests)
2. Cliquez sur **Configure**
3. Dans **Pipeline**, changez le **Script Path** :
   - Pour Backend-Test : `backend/Jenkinsfile`
   - Pour Frontend-Tests : `frontend/Jenkinsfile`
4. Sauvegardez

### 4.3 Lancer les pipelines
1. Cliquez sur **Build Now** pour chaque job
2. Surveillez les logs pour vérifier que l'analyse SonarQube fonctionne
3. Vérifiez que les résultats apparaissent dans SonarQube

## Étape 5: Pousser les modifications vers Git

```bash
git add .
git commit -m "feat: Add SonarQube integration to Jenkins pipelines"
git push origin main
```

## Résolution des problèmes courants

### Erreur "No tool named SonarScanner found"
- Vérifiez que l'outil est bien nommé **SonarScanner** (sensible à la casse)
- Redémarrez Jenkins après avoir ajouté l'outil

### Erreur de connexion SonarQube
- Vérifiez que SonarQube est démarré sur `http://localhost:9000`
- Vérifiez l'URL du serveur dans la configuration Jenkins
- Testez la connexion depuis Jenkins

### Erreur de token d'authentification
- Vérifiez que le token est valide
- Recréez un nouveau token si nécessaire
- Vérifiez que le token est bien configuré dans Jenkins

## Structure des fichiers après configuration

```
├── backend/
│   ├── Jenkinsfile              # Pipeline avec SonarQube
│   ├── Jenkinsfile.simple       # Pipeline sans SonarQube (backup)
│   └── sonar-project.properties # Configuration SonarQube
├── frontend/
│   ├── Jenkinsfile              # Pipeline avec SonarQube
│   ├── Jenkinsfile.simple       # Pipeline sans SonarQube (backup)
│   └── sonar-project.properties # Configuration SonarQube
└── SONARQUBE_JENKINS_SETUP.md   # Ce guide
```