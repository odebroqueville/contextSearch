const fs = require('fs');
const path = require('path');

// Function to ensure directory exists
function ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

// Function to copy a file
function copyFile(src, dest) {
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

// Function to copy directory recursively
function copyDir(src, dest) {
    ensureDir(dest);
    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
        // Skip build directory, node_modules, and hidden files/directories
        if (entry.name === 'build' || 
            entry.name === 'node_modules' || 
            entry.name.startsWith('.')) {
            continue;
        }

        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else if (entry.isFile()) {
            copyFile(srcPath, destPath);
        }
    }
}

// Clean build directory for browser
function cleanBuildDir(browser) {
    const buildDir = path.join(__dirname, 'build', browser);
    if (fs.existsSync(buildDir)) {
        fs.rmSync(buildDir, { recursive: true, force: true });
    }
}

// Function to build for a specific browser
function buildForBrowser(browser) {
    console.log(`Building for ${browser}...`);
    
    // Clean and create build directory
    const buildDir = path.join(__dirname, 'build', browser);
    cleanBuildDir(browser);
    ensureDir(buildDir);

    // Copy all files except manifests and build-related files
    const files = fs.readdirSync(__dirname, { withFileTypes: true });
    for (const file of files) {
        // Skip special files and directories
        if (file.name === 'build' || 
            file.name === 'node_modules' || 
            file.name.startsWith('.') ||
            file.name.startsWith('manifest') ||
            ['build.js', 'package.json', 'package-lock.json'].includes(file.name)) {
            continue;
        }

        const srcPath = path.join(__dirname, file.name);
        const destPath = path.join(buildDir, file.name);

        if (file.isDirectory()) {
            copyDir(srcPath, destPath);
        } else if (file.isFile()) {
            copyFile(srcPath, destPath);
        }
    }

    // Copy the appropriate manifest
    const manifestSource = path.join(__dirname, `manifest.${browser}.json`);
    const manifestDest = path.join(buildDir, 'manifest.json');
    copyFile(manifestSource, manifestDest);

    console.log(`✅ Build completed for ${browser}. Output directory: ${buildDir}`);
}

// Main build process
console.log('🚀 Starting build process...');

try {
    // Build for both browsers
    buildForBrowser('chrome');
    buildForBrowser('firefox');
    
    console.log('✨ Build process completed successfully!');
    console.log('📁 Build outputs:');
    console.log('   - Chrome: ./build/chrome');
    console.log('   - Firefox: ./build/firefox');
} catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
}
