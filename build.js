const fs = require('fs');
const path = require('path');

// Get the current directory
const currentDir = path.resolve();

// List of files/directories to exclude from the build
const excludeList = [
    'build',
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

    fs.writeFileSync(dest, content);
}

// Function to process JavaScript service worker files
function processServiceWorkerFile(src, dest, browser) {
    let content = fs.readFileSync(src, 'utf8');

    if (browser === 'firefox' && path.basename(src) === 'cs_service_worker.js') {
        // Remove first 3 lines for Firefox
        content = content.split('\n').slice(2).join('\n');
    }

    fs.writeFileSync(dest, content);
}

// Function to check if a file/directory should be excluded
function shouldExclude(name) {
    return excludeList.includes(name) ||
        name.startsWith('.') ||
        name.startsWith('yt_dlp_host');
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

// Main build process
console.log('🚀 Starting build process...');

try {
    // Build for both browsers
    buildForBrowser('chrome');
    buildForBrowser('firefox');

    // At the end of the build process, copy ExtPay.js to the libs directories for both Chrome and Firefox builds
    const extPaySrc = path.join(__dirname, 'node_modules', 'extpay', 'dist', 'ExtPay.js');

    // Define libs directories for Chrome and Firefox builds
    const chromeLibsDir = path.join(__dirname, 'build', 'chrome', 'libs');
    const firefoxLibsDir = path.join(__dirname, 'build', 'firefox', 'libs');

    // Ensure the Chrome libs directory exists
    if (!fs.existsSync(chromeLibsDir)) {
        fs.mkdirSync(chromeLibsDir, { recursive: true });
    }

    // Ensure the Firefox libs directory exists
    if (!fs.existsSync(firefoxLibsDir)) {
        fs.mkdirSync(firefoxLibsDir, { recursive: true });
    }

    // Copy ExtPay.js into each libs directory
    fs.copyFileSync(extPaySrc, path.join(chromeLibsDir, 'ExtPay.js'));
    fs.copyFileSync(extPaySrc, path.join(firefoxLibsDir, 'ExtPay.js'));

    // Append export default ExtPay; line to each file
    fs.appendFileSync(path.join(chromeLibsDir, 'ExtPay.js'), "\nexport default ExtPay;\n");
    fs.appendFileSync(path.join(firefoxLibsDir, 'ExtPay.js'), "\nexport default ExtPay;\n");

    console.log('ExtPay.js has been copied to the libs directories for both Chrome and Firefox.');
    console.log('✨ Build process completed successfully!');
    console.log('📁 Build outputs:');
    console.log('   - Chrome: ./build/chrome');
    console.log('   - Firefox: ./build/firefox');
} catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
}
