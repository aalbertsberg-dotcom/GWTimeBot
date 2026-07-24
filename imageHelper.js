const sharp = require("sharp");
const fs = require("fs");
const path = require("path");
const { getBeat } = require("./gwtime");

async function loadCleanLogo(logoPath, size) {
  const { data, info } = await sharp(logoPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    if (r < 35 && g < 35 && b < 35) {
      data[i + 3] = 0;
    }
  }

  return sharp(data, { raw: info })
    .trim()
    .resize({ width: size, height: size, fit: "contain" })
    .png()
    .toBuffer();
}

async function buildGwTimeImage(date = new Date()) {
  const beat = getBeat(date);
  const beatNum = Number(beat);

  const r = 92;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference * (1 - beatNum / 1000);
  const knobAngle = (beatNum / 1000) * 360 - 90;

  const tickLines = Array.from({ length: 24 }, (_, i) => {
    const angle = (i / 24) * Math.PI * 2 - Math.PI / 2;
    const isMajor = i % 2 === 0;
    const inner = isMajor ? 72 : 78;
    const outer = isMajor ? 84 : 86;

    return `<line
      x1="${(Math.cos(angle) * inner).toFixed(2)}"
      y1="${(Math.sin(angle) * inner).toFixed(2)}"
      x2="${(Math.cos(angle) * outer).toFixed(2)}"
      y2="${(Math.sin(angle) * outer).toFixed(2)}"
      stroke="${isMajor ? "#35506f" : "#29425d"}"
      stroke-width="${isMajor ? 1.5 : 1}"
      stroke-linecap="round"
      opacity="${isMajor ? 0.9 : 0.7}"
    />`;
  }).join("");

  const svg = `
  <svg width="1040" height="720" viewBox="0 0 520 360" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#050d19"/>
        <stop offset="100%" stop-color="#071629"/>
      </linearGradient>

      <linearGradient id="panelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#09172b"/>
        <stop offset="100%" stop-color="#0b1b31"/>
      </linearGradient>

      <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#f8df6a"/>
        <stop offset="100%" stop-color="#d4a93a"/>
      </linearGradient>

      <filter id="goldGlow" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="3.2" result="blur"/>
        <feMerge>
          <feMergeNode in="blur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>

      <filter id="softGlow" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="2" result="blur"/>
        <feMerge>
          <feMergeNode in="blur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>

    <rect x="0" y="0" width="520" height="360" rx="18" fill="url(#bgGrad)"/>

    <rect x="14" y="14" width="492" height="332" rx="4"
          fill="#081426" stroke="#1e3048" stroke-width="1.3"/>

    <rect x="24" y="24" width="472" height="58" rx="4"
          fill="url(#panelGrad)" stroke="#1e3048" stroke-width="1.2"/>

    <rect x="31" y="31" width="34" height="34" rx="4"
          fill="#0b1d35" stroke="#1e3048" stroke-width="1.1"/>

    <text x="260" y="60"
          text-anchor="middle"
          font-family="Consolas, monospace"
          font-size="18"
          font-weight="700"
          letter-spacing="4.5"
          fill="#d9e5f2">GOLDENWOLF</text>

    <circle cx="476" cy="45" r="4" fill="#f0d060" filter="url(#softGlow)"/>

    <g transform="translate(260,188)">
      <circle cx="0" cy="0" r="105" fill="#071224" opacity="0.42"/>

      ${tickLines}

      <circle cx="0" cy="0" r="${r}" fill="none" stroke="#22344d" stroke-width="6"/>

      <circle
        cx="0"
        cy="0"
        r="${r}"
        fill="none"
        stroke="url(#goldGrad)"
        stroke-width="6"
        stroke-linecap="round"
        stroke-dasharray="${circumference}"
        stroke-dashoffset="${dashOffset}"
        transform="rotate(-90)"
        filter="url(#goldGlow)"
      />

      <g transform="rotate(${knobAngle}) translate(${r},0)">
        <circle cx="0" cy="0" r="8.2" fill="#f0d060" stroke="#071224" stroke-width="3"/>
      </g>

      <text x="0" y="-32"
            text-anchor="middle"
            font-family="Consolas, monospace"
            font-size="14"
            font-weight="600"
            letter-spacing="4"
            fill="#a8bfd5">@ BEATS</text>

      <text x="0" y="25"
            text-anchor="middle"
            font-family="Consolas, monospace"
            font-size="58"
            font-weight="800"
            fill="#f5edd8">${beat}</text>
    </g>

    <rect x="122" y="292" width="276" height="42" rx="3"
          fill="url(#panelGrad)" stroke="#1e3048" stroke-width="1.2"/>

    <text x="260" y="319"
          text-anchor="middle"
          font-family="Consolas, monospace"
          font-size="16"
          font-weight="600"
          letter-spacing="2"
          fill="#f0d060">GWTime @${beat}</text>
  </svg>`;

  const logoPath = path.join(__dirname, "goldenwolf-logo.png");

  if (!fs.existsSync(logoPath)) {
    throw new Error("Missing goldenwolf-logo.png in the GWTimeBot folder.");
  }

  const baseImage = await sharp(Buffer.from(svg))
    .resize(520, 360)
    .png()
    .toBuffer();

  const logoBuffer = await loadCleanLogo(logoPath, 28);

  return sharp(baseImage)
    .composite([
      {
        input: logoBuffer,
        left: 34,
        top: 34
      }
    ])
    .png()
    .toBuffer();
}

module.exports = {
  buildGwTimeImage
};