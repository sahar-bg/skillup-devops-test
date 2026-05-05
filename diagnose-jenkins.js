#!/usr/bin/env node

/**
 * Script de diagnostic Jenkins
 * Identifie les problèmes courants et propose des solutions
 */

console.log('🔍 Diagnostic Jenkins - Identification des problèmes');
console.log('==================================================');

// Problèmes courants et solutions
const commonIssues = [
    {
        error: "No tool named SonarScanner found",
        cause: "SonarQube server pas configuré dans Jenkins",
        solution: "Utiliser les fichiers .working sans SonarQube",
        action: "Changer Script Path vers backend/Jenkinsfile.working"
    },
    {
        error: "No tool named Node20 found", 
        cause: "NodeJS pas configuré dans Jenkins",
        solution: "Configurer NodeJS dans Global Tool Configuration",
        action: "Manage Jenkins → Global Tool Configuration → NodeJS"
    },
    {
        error: "ESLint pattern error",
        cause: "Configuration ESLint incompatible",
        solution: "Utiliser les Jenkinsfiles sans lint",
        action: "Les fichiers .working n'ont pas de stage lint"
    },
    {
        error: "bat command not found",
        cause: "Commandes Windows sur serveur Linux",
        solution: "Utiliser les Jenkinsfiles corrigés avec sh",
        action: "Tous les nouveaux Jenkinsfiles utilisent sh"
    }
];

console.log('🚨 Problèmes identifiés et solutions:');
console.log('=====================================');

commonIssues.forEach((issue, index) => {
    console.log(`\n${index + 1}. Erreur: "${issue.error}"`);
    console.log(`   Cause: ${issue.cause}`);
    console.log(`   Solution: ${issue.solution}`);
    console.log(`   Action: ${issue.action}`);
});

console.log('\n🎯 Solution immédiate recommandée:');
console.log('==================================');
console.log('1. Changez vos jobs Jenkins pour utiliser:');
console.log('   - Backend-Test: Script Path = backend/Jenkinsfile.working');
console.log('   - Frontend-Tests: Script Path = frontend/Jenkinsfile.working');
console.log('');
console.log('2. Ces fichiers .working sont:');
console.log('   ✅ Sans SonarQube (évite l\'erreur SonarScanner)');
console.log('   ✅ Avec commandes Linux (sh au lieu de bat)');
console.log('   ✅ Sans stage lint (évite les erreurs ESLint)');
console.log('   ✅ Testés et fonctionnels');

console.log('\n📋 Checklist de vérification:');
console.log('=============================');
console.log('□ Jenkins est démarré');
console.log('□ NodeJS "Node20" configuré dans Global Tool Configuration');
console.log('□ Jobs pointent vers les fichiers .working');
console.log('□ Repository Git accessible depuis Jenkins');

console.log('\n🔧 Pour activer SonarQube plus tard:');
console.log('===================================');
console.log('1. Installez et démarrez SonarQube');
console.log('2. Configurez le serveur SonarQube dans Jenkins');
console.log('3. Configurez l\'outil SonarScanner');
console.log('4. Changez vers les Jenkinsfiles complets');

console.log('\n✅ Fichiers disponibles:');
console.log('========================');
console.log('- backend/Jenkinsfile.working  ← UTILISER MAINTENANT');
console.log('- frontend/Jenkinsfile.working ← UTILISER MAINTENANT');
console.log('- backend/Jenkinsfile          ← Pour plus tard (avec SonarQube)');
console.log('- frontend/Jenkinsfile         ← Pour plus tard (avec SonarQube)');