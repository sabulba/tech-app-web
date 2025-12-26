const fs = require('fs');
const path = require('path');

// Check if sharp is available
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.log('Sharp not found. Installing...');
  require('child_process').execSync('npm install sharp --save-dev', { stdio: 'inherit' });
  sharp = require('sharp');
}

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const sourcePath = path.join(__dirname, 'public', 'afimilk-logo.png');
const outputDir = path.join(__dirname, 'public', 'icons');

async function generateIcons() {
  console.log('Generating PWA icons...');

  for (const size of sizes) {
    const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);
    await sharp(sourcePath)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .png()
      .toFile(outputPath);
    console.log(`✓ Generated ${size}x${size}`);
  }

  // Generate maskable icons (with padding for safe zone)
  const maskableSizes = [192, 512];
  for (const size of maskableSizes) {
    const paddingSize = Math.floor(size * 0.2); // 20% padding for safe zone
    const iconSize = size - (paddingSize * 2);
    const outputPath = path.join(outputDir, `icon-${size}x${size}-maskable.png`);
    
    await sharp(sourcePath)
      .resize(iconSize, iconSize, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .extend({
        top: paddingSize,
        bottom: paddingSize,
        left: paddingSize,
        right: paddingSize,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .png()
      .toFile(outputPath);
    console.log(`✓ Generated ${size}x${size} (maskable)`);
  }

  console.log('\n✨ All icons generated successfully!');
}

generateIcons().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
