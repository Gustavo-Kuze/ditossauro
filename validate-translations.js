/**
 * Translation Validation Script
 * 
 * This script checks that all translation keys used in the code exist in the translation files.
 * Run this after completing the i18n implementation to ensure no keys are missing.
 * 
 * Usage: node validate-translations.js
 */

const fs = require('fs');
const path = require('path');

// Load translation files
const ptBR = JSON.parse(fs.readFileSync(path.join(__dirname, 'src/locales/pt-BR.json'), 'utf-8'));
const en = JSON.parse(fs.readFileSync(path.join(__dirname, 'src/locales/en.json'), 'utf-8'));

// Function to get all keys from a nested object
function getAllKeys(obj, prefix = '') {
    let keys = [];
    for (const key in obj) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (typeof obj[key] === 'object' && obj[key] !== null) {
            keys = keys.concat(getAllKeys(obj[key], fullKey));
        } else {
            keys.push(fullKey);
        }
    }
    return keys;
}

// Get all keys from both translation files
const ptBRKeys = getAllKeys(ptBR);
const enKeys = getAllKeys(en);

console.log('🔍 Translation Validation Report\n');
console.log(`📊 Statistics:`);
console.log(`   - Portuguese (pt-BR): ${ptBRKeys.length} keys`);
console.log(`   - English (en): ${enKeys.length} keys`);
console.log('');

// Check for missing keys
const missingInEnglish = ptBRKeys.filter(key => !enKeys.includes(key));
const missingInPortuguese = enKeys.filter(key => !ptBRKeys.length(key));

if (missingInEnglish.length > 0) {
    console.log('❌ Keys missing in English translation:');
    missingInEnglish.forEach(key => console.log(`   - ${key}`));
    console.log('');
} else {
    console.log('✅ All Portuguese keys have English translations');
    console.log('');
}

if (missingInPortuguese.length > 0) {
    console.log('❌ Keys missing in Portuguese translation:');
    missingInPortuguese.forEach(key => console.log(`   - ${key}`));
    console.log('');
} else {
    console.log('✅ All English keys have Portuguese translations');
    console.log('');
}

// Check for empty values
const emptyInPortuguese = ptBRKeys.filter(key => {
    const value = key.split('.').reduce((obj, k) => obj[k], ptBR);
    return value === '' || value === null || value === undefined;
});

const emptyInEnglish = enKeys.filter(key => {
    const value = key.split('.').reduce((obj, k) => obj[k], en);
    return value === '' || value === null || value === undefined;
});

if (emptyInPortuguese.length > 0) {
    console.log('⚠️  Empty values in Portuguese:');
    emptyInPortuguese.forEach(key => console.log(`   - ${key}`));
    console.log('');
}

if (emptyInEnglish.length > 0) {
    console.log('⚠️  Empty values in English:');
    emptyInEnglish.forEach(key => console.log(`   - ${key}`));
    console.log('');
}

// Summary
console.log('📋 Summary:');
if (missingInEnglish.length === 0 && missingInPortuguese.length === 0 &&
    emptyInPortuguese.length === 0 && emptyInEnglish.length === 0) {
    console.log('   ✅ All translations are complete and valid!');
} else {
    console.log(`   ⚠️  Found ${missingInEnglish.length + missingInPortuguese.length + emptyInPortuguese.length + emptyInEnglish.length} issues`);
    console.log('   Please fix the issues listed above.');
}
console.log('');

// List all available translation keys (useful for reference)
console.log('📚 Available Translation Keys:');
console.log('');
const groupedKeys = {};
ptBRKeys.forEach(key => {
    const category = key.split('.')[0];
    if (!groupedKeys[category]) {
        groupedKeys[category] = [];
    }
    groupedKeys[category].push(key);
});

Object.keys(groupedKeys).sort().forEach(category => {
    console.log(`   ${category}:`);
    groupedKeys[category].forEach(key => {
        console.log(`      - ${key}`);
    });
    console.log('');
});
