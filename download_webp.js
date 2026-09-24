const fs = require('fs');
const axios = require('axios');
const sharp = require('sharp');

async function downloadAndOptimize(imageUrl, outputFilename) {
    try {
        console.log(`Downloading: ${imageUrl}...`);
        
        // 1. Download the image as a buffer
        const response = await axios({
            url: imageUrl,
            responseType: 'arraybuffer'
        });
        
        let quality = 80;
        let imageBuffer = response.data;
        let webpBuffer;

        // 2. Convert to WebP and gradually lower quality until it's under 100KB
        do {
            webpBuffer = await sharp(imageBuffer)
                .webp({ quality: quality })
                .toBuffer();
                
            quality -= 10; // Reduce quality by 10 for the next loop if still too big
            
            // If quality gets too low, we might need to resize the dimensions instead
            if (quality < 20 && webpBuffer.length > 100 * 1024) {
                 webpBuffer = await sharp(imageBuffer)
                    .resize({ width: 1200 }) // Shrink width to 1200px to save more space
                    .webp({ quality: 40 })
                    .toBuffer();
                 break;
            }
        } while (webpBuffer.length > 100 * 1024 && quality >= 10); 
        // (100 * 1024 = 100KB)

        // 3. Save the final optimized image
        fs.writeFileSync(outputFilename, webpBuffer);
        
        const finalSizeKB = (webpBuffer.length / 1024).toFixed(2);
        console.log(`Success! Saved ${outputFilename} (${finalSizeKB} KB)`);
        
    } catch (error) {
        console.error("Failed to process image:", error.message);
    }
}

// --- Batch Download ---
// List of URLs to download and their target filenames
const images = [
    { url: "https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&q=80&w=1200", file: "assets/photo_1556761175.webp" },
    { url: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=1200", file: "assets/photo_1454165804606.webp" },
    { url: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=1200", file: "assets/photo_1497215728101.webp" },
    { url: "https://images.unsplash.com/photo-1554200876-56c2f25224fa?auto=format&fit=crop&q=80&w=1200", file: "assets/photo_1554200876.webp" }
];

async function runBatch() {
    for (const img of images) {
        await downloadAndOptimize(img.url, img.file);
    }
    console.log("All done!");
}

runBatch();
