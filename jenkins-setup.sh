#!/bin/bash

# Script de configuration automatique Jenkins + SonarQube
# À exécuter sur le serveur Jenkins

echo "🚀 Configuration automatique Jenkins + SonarQube"
echo "================================================"

# Vérifier si Jenkins est en cours d'exécution
if ! pgrep -f jenkins > /dev/null; then
    echo "❌ Jenkins n'est pas en cours d'exécution"
    echo "Démarrez Jenkins avant d'exécuter ce script"
    exit 1
fi

# Vérifier si SonarQube est en cours d'exécution
if ! curl -s http://localhost:9000/api/system/status > /dev/null; then
    echo "❌ SonarQube n'est pas accessible sur http://localhost:9000"
    echo "Démarrez SonarQube avant d'exécuter ce script"
    exit 1
fi

echo "✅ Jenkins et SonarQube sont en cours d'exécution"

# Créer les projets SonarQube via API
echo "📝 Création des projets SonarQube..."

# Projet Backend
curl -X POST "http://localhost:9000/api/projects/create" \
  -d "project=backend-hr-system" \
  -d "name=Backend HR System" \
  -u admin:admin

# Projet Frontend  
curl -X POST "http://localhost:9000/api/projects/create" \
  -d "project=frontend-hr-system" \
  -d "name=Frontend HR System" \
  -u admin:admin

echo "✅ Projets SonarQube créés"

# Instructions pour la configuration manuelle Jenkins
echo ""
echo "🔧 Configuration manuelle requise dans Jenkins:"
echo "================================================"
echo "1. Allez dans Manage Jenkins → Configure System"
echo "2. Section 'SonarQube servers':"
echo "   - Name: SonarQubeServer"
echo "   - Server URL: http://localhost:9000"
echo "   - Authentication: Laissez vide pour l'accès anonyme"
echo ""
echo "3. Allez dans Manage Jenkins → Global Tool Configuration"
echo "4. Section 'SonarQube Scanner':"
echo "   - Name: SonarScanner"
echo "   - Install automatically: ✓"
echo "   - Version: SonarQube Scanner 6.3.0.6189"
echo ""
echo "5. Section 'NodeJS':"
echo "   - Name: Node20"
echo "   - Install automatically: ✓"
echo "   - Version: NodeJS 20.x"
echo ""
echo "6. Sauvegardez la configuration"
echo ""
echo "🎯 Ensuite, mettez à jour vos jobs Jenkins:"
echo "- Backend-Test: Script Path = backend/Jenkinsfile"
echo "- Frontend-Tests: Script Path = frontend/Jenkinsfile"
echo ""
echo "✅ Configuration terminée!"