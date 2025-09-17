// env-loader.js - Simple environment variable loader for browser extensions
// This module reads the .env file and provides environment variables

const fs = require('fs');
const path = require('path');

/**
 * Loads environment variables from .env file
 * @param {string} envPath - Path to the .env file
 * @returns {object} - Object containing environment variables
 */
function loadEnv(envPath = '.env') {
    const fullPath = path.resolve(envPath);
    
    if (!fs.existsSync(fullPath)) {
        console.warn(`Environment file not found at ${fullPath}`);
        return {};
    }
    
    const envContent = fs.readFileSync(fullPath, 'utf8');
    const env = {};
    
    // Parse the .env file
    envContent.split('\n').forEach(line => {
        // Skip empty lines and comments
        if (!line || line.trim() === '' || line.trim().startsWith('#')) {
            return;
        }
        
        // Parse key=value pairs
        const [key, ...valueParts] = line.split('=');
        const value = valueParts.join('=').trim();
        
        if (key && value !== undefined) {
            // Remove quotes if present and convert to appropriate type
            let processedValue = value.replace(/^["']|["']$/g, '');
            
            // Convert boolean strings
            if (processedValue.toLowerCase() === 'true') {
                processedValue = true;
            } else if (processedValue.toLowerCase() === 'false') {
                processedValue = false;
            }
            
            env[key.trim()] = processedValue;
        }
    });
    
    return env;
}

module.exports = { loadEnv };
