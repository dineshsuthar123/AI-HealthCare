// scripts/validate-translations.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get the path to the messages directory
const messagesDir = path.join(__dirname, '..', 'messages');

// Define the base language file (usually English)
const baseLanguage = 'en';

// Function to load and parse JSON safely
function loadJSON(filePath) {
    try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(fileContent);
    } catch (error) {
        console.error(`Error loading or parsing ${filePath}:`, error.message);
        return null;
    }
}

// Function to check for nested key consistency
function checkNestedKeys(basePath, baseObj, compObj, compLang, issues) {
    for (const key in baseObj) {
        const currentPath = basePath ? `${basePath}.${key}` : key;

        // Check if the key exists in the comparison object
        if (!(key in compObj)) {
            issues.push(`Missing key in ${compLang}: ${currentPath}`);
            continue;
        }

        // If the value is an object, recurse
        if (typeof baseObj[key] === 'object' && baseObj[key] !== null &&
            typeof compObj[key] === 'object' && compObj[key] !== null) {
            checkNestedKeys(currentPath, baseObj[key], compObj[key], compLang, issues);
        }
    }
}

// Function to find duplicate keys in the same object context
function findDuplicateKeys(jsonString) {
    try {
        // Parse the JSON to check for duplicates at the same level
        JSON.parse(jsonString);
        return []; // If we get here, there are no duplicate keys that affect parsing
    } catch (error) {
        if (error.message.includes('Duplicate key')) {
            // Extract the duplicate key from the error message
            const match = error.message.match(/Duplicate key '([^']+)'/);
            return match ? [match[1]] : ["Unknown duplicate key detected"];
        }
        return []; // Some other JSON error, not a duplicate key issue
    }
}

// Main validation function
function validateTranslations() {
    // Get all JSON files in the messages directory
    const files = fs.readdirSync(messagesDir).filter(file => file.endsWith('.json'));

    // Load the base language file
    const baseFilePath = path.join(messagesDir, `${baseLanguage}.json`);
    const baseData = loadJSON(baseFilePath);

    if (!baseData) {
        console.error(`Base language file (${baseLanguage}.json) could not be loaded. Aborting validation.`);
        return;
    }

    let hasErrors = false;

    // Check each language file
    for (const file of files) {
        if (file === `${baseLanguage}.json`) continue; // Skip the base language file

        const langCode = path.basename(file, '.json');
        const filePath = path.join(messagesDir, file);

        console.log(`\nValidating ${langCode.toUpperCase()} translations...`);

        // Check for JSON parsing issues
        const fileContent = fs.readFileSync(filePath, 'utf8');
        try {
            JSON.parse(fileContent);
        } catch (error) {
            console.error(`❌ JSON parsing error in ${file}: ${error.message}`);
            hasErrors = true;
            continue;
        }

        // Check for duplicate keys
        const duplicates = findDuplicateKeys(fileContent);
        if (duplicates.length > 0) {
            console.error(`❌ Duplicate keys found in ${file}:`, duplicates);
            hasErrors = true;
        }

        // Load the comparison language file
        const compData = loadJSON(filePath);

        if (!compData) {
            console.error(`❌ Could not load ${file} for validation`);
            hasErrors = true;
            continue;
        }

        // Check for missing keys
        const issues = [];
        checkNestedKeys('', baseData, compData, langCode, issues);

        if (issues.length > 0) {
            console.log(`❌ Found ${issues.length} issues in ${file}:`);
            issues.forEach(issue => console.log(`   - ${issue}`));
            hasErrors = true;
        } else {
            console.log(`✅ No missing keys found in ${file}`);
        }
    }

    if (hasErrors) {
        console.log('\n❌ Validation failed. Please fix the issues above.');
        process.exit(1);
    } else {
        console.log('\n✅ All translation files are valid!');
    }
}

// Run the validation
validateTranslations();
