// Скрипт для генерації іконок PWA
// Використовує SVG як основу та створює PNG іконки різних розмірів
// Для роботи потрібен sharp: npm install sharp --save-dev

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const iconSizes = [
  { size: 192, name: 'icon-192x192.png' },
  { size: 512, name: 'icon-512x512.png' },
  { size: 180, name: 'apple-touch-icon.png' },
];

// SVG іконка (градієнт з символом долара)
const svgIcon = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#8b5cf6;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="120" fill="url(#grad)"/>
  <path d="M256 80C149.96 80 64 165.96 64 272s85.96 192 192 192 192-85.96 192-192S362.04 80 256 80zm0 352c-88.22 0-160-71.78-160-160S167.78 112 256 112s160 71.78 160 160-71.78 160-160 160z" fill="white" opacity="0.1"/>
  <path d="M256 160c-61.86 0-112 50.14-112 112s50.14 112 112 112 112-50.14 112-112S317.86 160 256 160zm0 192c-44.18 0-80-35.82-80-80s35.82-80 80-80 80 35.82 80 80-35.82 80-80 80z" fill="white" opacity="0.2"/>
  <text x="256" y="320" font-family="Arial, sans-serif" font-size="200" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">$</text>
</svg>
`;

async function generateIcons() {
  const publicDir = path.join(__dirname, '..', 'public');
  
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  for (const { size, name } of iconSizes) {
    try {
      await sharp(Buffer.from(svgIcon))
        .resize(size, size)
        .png()
        .toFile(path.join(publicDir, name));
      console.log(`✓ Generated ${name}`);
    } catch (error) {
      console.error(`✗ Error generating ${name}:`, error);
    }
  }
}

generateIcons();
