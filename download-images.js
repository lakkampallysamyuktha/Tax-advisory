const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

// Ensure sharp is installed
try {
    require.resolve('sharp');
} catch (e) {
    console.log('Installing sharp...');
    execSync('npm install sharp', { stdio: 'inherit' });
}
const sharp = require('sharp');

const images = [
    {
        url: 'https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&q=80&w=800',
        filename: 'review_table.webp'
    },
    {
        url: 'https://images.unsplash.com/photo-1434626881859-194d67b2b86f?auto=format&fit=crop&q=80&w=800',
        filename: 'notepad_pen.webp'
    },
    {
        url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=800',
        filename: 'audit_documents.webp'
    }
];

const assetsDir = path.join(__dirname, 'assets');

async function downloadAndConvert(url, filename) {
    const destPath = path.join(assetsDir, filename);
    
    console.log(`Downloading ${filename}...`);
    
    return new Promise((resolve, reject) => {
        https.get(url, (response) => {
            if (response.statusCode !== 200) {
                return reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
            }

            const chunks = [];
            response.on('data', (chunk) => chunks.push(chunk));
            
            response.on('end', () => {
                const buffer = Buffer.concat(chunks);
                
                // Convert to webp and compress to stay under ~100kb
                sharp(buffer)
                    .webp({ quality: 65 }) // adjust quality as needed to stay small
                    .toFile(destPath)
                    .then((info) => {
                        const sizeKb = (info.size / 1024).toFixed(2);
                        console.log(`Saved ${filename} (${sizeKb} KB)`);
                        resolve();
                    })
                    .catch(reject);
            });
        }).on('error', reject);
    });
}

async function run() {
    // Make sure package.json exists so npm install works without polluting higher dirs
    if (!fs.existsSync('package.json')) {
        execSync('npm init -y', { stdio: 'ignore' });
    }

    for (const img of images) {
        try {
            await downloadAndConvert(img.url, img.filename);
        } catch (error) {
            console.error(`Error processing ${img.filename}:`, error.message);
        }
    }
    console.log('All done!');
}

run();
