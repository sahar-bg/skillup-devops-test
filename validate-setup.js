#!/usr/bin/env node

/**
 * Script de validation de la configuration Jenkins + SonarQube
 * Vérifie que tous les fichiers et configurations sont corrects
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Validation de la configuration Jenkins + SonarQube');
console.log('====================================================');

let errors = 0;
let warnings = 0;

function checkFile(filePath, description) {
    if (fs.existsSync(filePath)) {
        console.log(`✅ ${description}: ${filePath}`);
        return true;
    } else {
        console.log(`❌ ${description}: ${filePath} - MANQUANT`);
        errors++;
        return false;
    }
}

function checkFileContent(filePath, searchText, description) {
    if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        if (content.includes(searchText)) {
            console.log(`✅ ${description}`);
            return true;
        } else {
            console.log(`⚠️  ${description} - CONTENU MANQUANT`);
            warnings++;
            return false;
        }
    } else {
        console.log(`❌ ${description} - FICHIER MANQUANT`);
        errors++;
        return false;
    }
}

// Vérification des Jenkinsfiles
console.log('\n📁 Vérification des Jenkinsfiles:');
checkFile('backend/Jenkinsfile', 'Jenkinsfile Backend');
checkFile('frontend/Jenkinsfile', 'Jenkinsfile Frontend');
checkFile('backend/Jenkinsfile.simple', 'Jenkinsfile Backend Simple (backup)');
checkFile('frontend/Jenkinsfile.simple', 'Jenkinsfile Frontend Simple (backup)');

// Vérification des configurations SonarQube
console.log('\n📁 Vérification des configurations SonarQube:');
checkFile('backend/sonar-project.properties', 'Configuration SonarQube Backend');
checkFile('frontend/sonar-project.properties', 'Configuration SonarQube Frontend');

// Vérification du contenu des Jenkinsfiles
console.log('\n🔍 Vérification du contenu des Jenkinsfiles:');
checkFileContent('backend/Jenkinsfile', 'SonarQubeServer', 'Backend Jenkinsfile contient SonarQubeServer');
checkFileContent('frontend/Jenkinsfile', 'SonarQubeServer', 'Frontend Jenkinsfile contient SonarQubeServer');
checkFileContent('backend/Jenkinsfile', 'Node20', 'Backend Jenkinsfile utilise Node20');
checkFileContent('frontend/Jenkinsfile', 'Node20', 'Frontend Jenkinsfile utilise Node20');

// Vérification des commandes Linux (sh au lieu de bat)
checkFileContent('backend/Jenkinsfile', 'sh \'npm', 'Backend Jenkinsfile utilise des commandes Linux (sh)');
checkFileContent('frontend/Jenkinsfile', 'sh \'npm', 'Frontend Jenkinsfile utilise des commandes Linux (sh)');

// Vérification des package.json
console.log('\n📦 Vérification des scripts package.json:');
if (fs.existsSync('backend/package.json')) {
    const backendPkg = JSON.parse(fs.readFileSync('backend/package.json', 'utf8'));
    if (backendPkg.scripts && backendPkg.scripts['test:ci']) {
        console.log('✅ Script test:ci présent dans backend/package.json');
    } else {
        console.log('❌ Script test:ci manquant dans backend/package.json');
        errors++;
    }
}

if (fs.existsSync('frontend/package.json')) {
    const frontendPkg = JSON.parse(fs.readFileSync('frontend/package.json', 'utf8'));
    if (frontendPkg.scripts && frontendPkg.scripts['test:ci']) {
        console.log('✅ Script test:ci présent dans frontend/package.json');
    } else {
        console.log('❌ Script test:ci manquant dans frontend/package.json');
        errors++;
    }
}

// Vérification des guides de configuration
console.log('\n📚 Vérification des guides:');
checkFile('SONARQUBE_JENKINS_SETUP.md', 'Guide de configuration SonarQube');
checkFile('JENKINS_VERIFICATION.md', 'Guide de vérification Jenkins');

// Résumé
console.log('\n📊 Résumé de la validation:');
console.log('============================');

if (errors === 0 && warnings === 0) {
    console.log('🎉 Parfait! Toutes les vérifications sont passées.');
    console.log('✅ Votre configuration est prête pour Jenkins + SonarQube');
} else {
    if (errors > 0) {
        console.log(`❌ ${errors} erreur(s) critique(s) trouvée(s)`);
    }
    if (warnings > 0) {
        console.log(`⚠️  ${warnings} avertissement(s) trouvé(s)`);
    }
}

console.log('\n🚀 Prochaines étapes:');
console.log('1. Corrigez les erreurs critiques si présentes');
console.log('2. Suivez le guide SONARQUBE_JENKINS_SETUP.md');
console.log('3. Configurez Jenkins avec les outils requis');
console.log('4. Testez vos pipelines');
console.log('5. Vérifiez les résultats dans SonarQube');

process.exit(errors > 0 ? 1 : 0);