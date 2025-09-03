const fs = require('fs');
const path = require('path');

// Load environment variables from .env file
function loadEnv() {
    const envPath = path.join(__dirname, '.env');
    const env = {};

    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');

        envContent.split('\n').forEach(line => {
            if (!line || line.trim() === '' || line.trim().startsWith('#')) {
                return;
            }

            const [key, ...valueParts] = line.split('=');
            const value = valueParts.join('=').trim();

            if (key && value !== undefined) {
                let processedValue = value.replace(/^["']|["']$/g, '');

                if (processedValue.toLowerCase() === 'true') {
                    processedValue = true;
                } else if (processedValue.toLowerCase() === 'false') {
                    processedValue = false;
                }

                env[key.trim()] = processedValue;
            }
        });
    }

    return env;
}

// Load environment variables
const ENV = loadEnv();
console.log('🔧 Environment variables loaded:', ENV);

// Get the current directory
const currentDir = path.resolve();

// List of files/directories to exclude from the build
const excludeList = [
    'build',
    'crowdin.yml',
    'libs',  // Exclude libs from main repo since it's generated during build
    'node_modules',
    'web-ext-artifacts',
    'web-ext-config.js',
    'package.json',
    'package-lock.json',
    'build.js',
    'manifest.chrome.json',
    'manifest.firefox.json'
];

// Function to ensure directory exists
function ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

// Function to copy a file
function copyFile(src, dest, browser) {
    // Skip browser-polyfill.js for Firefox
    if (browser === 'firefox' && path.basename(src) === 'browser-polyfill.js') {
        return;
    }

    try {
        fs.copyFileSync(src, dest);
    } catch (error) {
        if (error.code !== 'ENOTSUP') {
            throw error;
        }
        // If file is a socket or other special file, skip it
        console.warn(`Skipping file ${src} due to unsupported file type`);
    }
}

// Function to process HTML files
function processHtmlFile(src, dest, browser) {
    let content = fs.readFileSync(src, 'utf8');

    if (browser === 'firefox') {
        // Remove browser-polyfill.min.js script tag for Firefox
        content = content.replace(/<script src="\/libs\/browser-polyfill\.min\.js"><\/script>\n?/g, '');
    }

    fs.writeFileSync(dest, content);
}

// Function to process JavaScript files
function processJsFile(src, dest, browser) {
    let content = fs.readFileSync(src, 'utf8');

    if (browser === 'firefox' && src.includes('/scripts/')) {
        // Remove specific lines for Firefox
        content = content.replace(/\/\/\/ Import browser polyfill for compatibility with Chrome and other browsers\nimport '\/libs\/browser-polyfill\.min\.js';\n?/g, '');
    }

    // Replace DEBUG_VALUE with environment variable value
    if (ENV.DEBUG !== undefined) {
        const debugValue = ENV.DEBUG;

        // First, temporarily replace ESLint global comments to protect them
        // Handle both single DEBUG_VALUE and multiple globals including DEBUG_VALUE
        content = content.replace(/\/\*\s*global\s+DEBUG_VALUE\s*\*\//g, '/*ESLINTTMP*/');
        content = content.replace(/\/\*\s*global\s+([^*]*,\s*)?DEBUG_VALUE(\s*,\s*[^*]*)?\s*\*\//g, (_, before, after) => { // eslint-disable-line no-unused-vars
            // Reconstruct the comment without DEBUG_VALUE
            let globals = [];
            if (before) globals.push(before.replace(/,\s*$/, ''));
            if (after) globals.push(after.replace(/^\s*,\s*/, ''));
            return globals.length > 0 ? `/*ESLINTTMP_MULTI ${globals.join(', ')} */` : '/*ESLINTTMP_MULTI*/';
        });

        // Replace all other DEBUG_VALUE occurrences with the actual boolean value  
        content = content.replace(/DEBUG_VALUE/g, debugValue);

        // Restore ESLint global comments
        content = content.replace(/\/\*ESLINTTMP\*\//g, '');
        content = content.replace(/\/\*ESLINTTMP_MULTI\s*(.*?)\s*\*\//g, (_, globals) => { // eslint-disable-line no-unused-vars
            return globals.trim() ? `/* global ${globals.trim()} */` : '';
        });

        if (content.includes(debugValue)) {
            console.log(`📝 Replaced DEBUG_VALUE with ${debugValue} in ${path.basename(src)}`);
        }
    }

    fs.writeFileSync(dest, content);
}

// Function to process JavaScript service worker files
function processServiceWorkerFile(src, dest, browser) {
    let content = fs.readFileSync(src, 'utf8');

    if (browser === 'firefox' && path.basename(src) === 'cs_service_worker.js') {
        // Remove first 3 lines for Firefox
        content = content.split('\n').slice(2).join('\n');
    }

    // Replace DEBUG_VALUE with environment variable value
    if (ENV.DEBUG !== undefined) {
        const debugValue = ENV.DEBUG;

        // First, temporarily replace ESLint global comments to protect them
        // Handle both single DEBUG_VALUE and multiple globals including DEBUG_VALUE
        content = content.replace(/\/\*\s*global\s+DEBUG_VALUE\s*\*\//g, '/*ESLINTTMP*/');
        content = content.replace(/\/\*\s*global\s+([^*]*,\s*)?DEBUG_VALUE(\s*,\s*[^*]*)?\s*\*\//g, (_, before, after) => { // eslint-disable-line no-unused-vars
            // Reconstruct the comment without DEBUG_VALUE
            let globals = [];
            if (before) globals.push(before.replace(/,\s*$/, ''));
            if (after) globals.push(after.replace(/^\s*,\s*/, ''));
            return globals.length > 0 ? `/*ESLINTTMP_MULTI ${globals.join(', ')} */` : '/*ESLINTTMP_MULTI*/';
        });

        // Replace all other DEBUG_VALUE occurrences with the actual boolean value
        content = content.replace(/DEBUG_VALUE/g, debugValue);

        // Restore ESLint global comments
        content = content.replace(/\/\*ESLINTTMP\*\//g, '');
        content = content.replace(/\/\*ESLINTTMP_MULTI\s*(.*?)\s*\*\//g, (_, globals) => { // eslint-disable-line no-unused-vars
            return globals.trim() ? `/* global ${globals.trim()} */` : '';
        });

        if (content.includes(debugValue)) {
            console.log(`📝 Replaced DEBUG_VALUE with ${debugValue} in ${path.basename(src)}`);
        }
    }

    fs.writeFileSync(dest, content);
}

// Function to check if a file/directory should be excluded
function shouldExclude(name) {
    return excludeList.includes(name) ||
        name.startsWith('.')
}

// Function to copy directory recursively
function copyDir(src, dest, browser) {
    ensureDir(dest);
    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
        if (shouldExclude(entry.name)) {
            continue;
        }

        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            copyDir(srcPath, destPath, browser);
        } else if (entry.isFile()) {
            if (entry.name.endsWith('.html')) {
                processHtmlFile(srcPath, destPath, browser);
            } else if (entry.name === 'cs_service_worker.js') {
                processServiceWorkerFile(srcPath, destPath, browser);
            } else if (entry.name.endsWith('.js')) {
                processJsFile(srcPath, destPath, browser);
            } else {
                copyFile(srcPath, destPath, browser);
            }
        }
    }
}

// Clean build directory for browser
function cleanBuildDir(browser) {
    const buildDir = path.join(currentDir, 'build', browser);
    if (fs.existsSync(buildDir)) {
        fs.rmSync(buildDir, { recursive: true, force: true });
    }
}

// Function to build for a specific browser
function buildForBrowser(browser) {
    console.log(`Building for ${browser}...`);

    // Clean and create build directory
    const buildDir = path.join(currentDir, 'build', browser);
    cleanBuildDir(browser);
    ensureDir(buildDir);

    // Copy all files except manifests and build-related files
    const files = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const file of files) {
        if (shouldExclude(file.name)) {
            continue;
        }

        const srcPath = path.join(currentDir, file.name);
        const destPath = path.join(buildDir, file.name);

        if (file.isDirectory()) {
            copyDir(srcPath, destPath, browser);
        } else if (file.isFile()) {
            // Process HTML files differently
            if (file.name.endsWith('.html')) {
                processHtmlFile(srcPath, destPath, browser);
            } else if (file.name === 'cs_service_worker.js') {
                processServiceWorkerFile(srcPath, destPath, browser);
            } else if (file.name.endsWith('.js')) {
                processJsFile(srcPath, destPath, browser);
            } else {
                copyFile(srcPath, destPath, browser);
            }
        }
    }

    // Copy the appropriate manifest
    const manifestSource = path.join(currentDir, `manifest.${browser}.json`);
    const manifestDest = path.join(buildDir, 'manifest.json');
    copyFile(manifestSource, manifestDest);

    // Create libs directory
    const libsDir = path.join(buildDir, 'libs');
    ensureDir(libsDir);

    // Copy Sortable.min.js for both browsers
    const sortableSource = path.join(currentDir, 'node_modules', 'sortablejs', 'Sortable.min.js');
    const sortableDest = path.join(libsDir, 'Sortable.min.js');
    copyFile(sortableSource, sortableDest);

    // Copy browser-polyfill.min.js for Chrome only
    if (browser === 'chrome') {
        const polyfillSource = path.join(currentDir, 'node_modules', 'webextension-polyfill', 'dist', 'browser-polyfill.min.js');
        const polyfillDest = path.join(libsDir, 'browser-polyfill.min.js');
        copyFile(polyfillSource, polyfillDest);
    }

    console.log(`✅ Build completed for ${browser}. Output directory: ${buildDir}`);
}

// Main execution
const command = process.argv[2];

if (command === 'chrome') {
    // Build only for Chrome
    console.log('🚀 Building for Chrome only...');
    buildForBrowser('chrome');
    copyExtPayToBuild('chrome');
    console.log('✅ Chrome build completed!');
} else if (command === 'firefox') {
    // Build only for Firefox
    console.log('🚀 Building for Firefox only...');
    buildForBrowser('firefox');
    copyExtPayToBuild('firefox');
    console.log('✅ Firefox build completed!');
} else {
    // Default: build for both browsers
    console.log('🚀 Starting build process for both browsers...');
    
    try {
        // Build for both browsers
        buildForBrowser('chrome');
        buildForBrowser('firefox');

        // Copy ExtPay.js to both builds
        copyExtPayToBuild('chrome');
        copyExtPayToBuild('firefox');

        console.log('✨ Build process completed successfully!');
        console.log('📁 Build outputs:');
        console.log('   - Chrome: ./build/chrome');
        console.log('   - Firefox: ./build/firefox');
    } catch (error) {
        console.error('❌ Build failed:', error);
        process.exit(1);
    }
}

// Helper function to copy ExtPay to specific build
function copyExtPayToBuild(browser) {
    const extPaySrc = path.join(__dirname, 'node_modules', 'extpay', 'dist', 'ExtPay.js');
    const libsDir = path.join(__dirname, 'build', browser, 'libs');
    
    ensureDir(libsDir);
    fs.copyFileSync(extPaySrc, path.join(libsDir, 'ExtPay.js'));
    fs.appendFileSync(path.join(libsDir, 'ExtPay.js'), "\nexport default ExtPay;\n");
}
