export interface ResultCardInput {
  categoryName: string;
  winnerName: string;
  phrase: string;
  roomName: string;
  votesText: string;
  roomUrl?: string;
}

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Quebra textos longos em linhas para caber no card compartilhável. */
export function wrapText(text: string, maxCharacters: number, maxLines: number): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxCharacters) {
      current = candidate;
      continue;
    }
    if (current) lines.push(current);
    current = word;
    if (lines.length === maxLines - 1) break;
  }
  if (current && lines.length < maxLines) lines.push(current);
  if (lines.length === maxLines && words.join(' ').length > lines.join(' ').length) {
    const last = lines[maxLines - 1];
    lines[maxLines - 1] = `${last.slice(0, Math.max(0, maxCharacters - 1)).trimEnd()}…`;
  }
  return lines.length > 0 ? lines : [''];
}

function textLines(
  lines: string[],
  x: number,
  startY: number,
  lineHeight: number,
  attributes: string,
): string {
  return lines
    .map(
      (line, index) =>
        `<text x="${x}" y="${startY + index * lineHeight}" ${attributes}>${escapeXml(line)}</text>`,
    )
    .join('\n');
}

/** SVG puro: sem dependências e sem requisições externas, funciona bem no mobile. */
export function buildResultCardSvg(input: ResultCardInput): string {
  const categoryLines = wrapText(input.categoryName.toUpperCase(), 20, 2);
  const winnerLines = wrapText(input.winnerName, 16, 2);
  const phraseLines = wrapText(input.phrase, 46, 3);
  const roomLines = wrapText(input.roomName, 38, 1);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080" role="img" aria-label="Card de resultado da Resenha Secreta">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#2A1259"/>
      <stop offset="0.55" stop-color="#6D28D9"/>
      <stop offset="1" stop-color="#FF4D8D"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#FFD166"/>
      <stop offset="1" stop-color="#FF8A3D"/>
    </linearGradient>
  </defs>
  <rect width="1080" height="1080" fill="url(#bg)"/>
  <circle cx="90" cy="130" r="120" fill="#FFD166" opacity="0.18"/>
  <circle cx="1010" cy="90" r="180" fill="#39D98A" opacity="0.16"/>
  <circle cx="1000" cy="960" r="210" fill="#FF4D8D" opacity="0.2"/>
  <g opacity="0.9">
    <rect x="90" y="760" width="28" height="52" rx="14" fill="#FFD166" transform="rotate(-22 104 786)"/>
    <rect x="170" y="900" width="22" height="42" rx="11" fill="#39D98A" transform="rotate(18 181 921)"/>
    <rect x="920" y="240" width="24" height="48" rx="12" fill="#FFF8EE" transform="rotate(30 932 264)"/>
    <circle cx="840" cy="830" r="11" fill="#FFD166"/>
    <circle cx="220" cy="330" r="8" fill="#FFF8EE"/>
    <circle cx="760" cy="150" r="10" fill="#FF8A3D"/>
  </g>
  <rect x="66" y="66" width="948" height="948" rx="60" fill="#FFF8EE" opacity="0.98"/>
  <rect x="106" y="106" width="868" height="868" rx="42" fill="none" stroke="#2A1259" stroke-opacity="0.08" stroke-width="3" stroke-dasharray="10 14"/>
  <rect x="370" y="142" width="340" height="64" rx="32" fill="#2A1259"/>
  <text x="540" y="184" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="bold" letter-spacing="5" fill="#FFD166">RESENHA SECRETA</text>
  <g transform="translate(540 300)">
    <rect x="-86" y="-74" width="172" height="30" rx="15" fill="url(#accent)"/>
    <rect x="-54" y="-44" width="108" height="125" rx="18" fill="url(#accent)"/>
    <path d="M-54 0 h-34 a42 42 0 0 0 42 52 v-22 a20 20 0 0 1 -20 -20 h12z" fill="#FFD166"/>
    <path d="M54 0 h34 a42 42 0 0 1 -42 52 v-22 a20 20 0 0 0 20 -20 h-12z" fill="#FFD166"/>
    <rect x="-12" y="78" width="24" height="42" rx="10" fill="#FF8A3D"/>
    <rect x="-54" y="118" width="108" height="22" rx="11" fill="#FF8A3D"/>
    <circle cx="-30" cy="-20" r="8" fill="#FFF8EE" opacity="0.7"/>
    <circle cx="0" cy="-30" r="6" fill="#FFF8EE" opacity="0.5"/>
    <circle cx="28" cy="-12" r="7" fill="#FFF8EE" opacity="0.6"/>
  </g>
  <text x="540" y="510" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="bold" letter-spacing="4" fill="#8B7AA8">O PRÊMIO DE</text>
  ${textLines(
    categoryLines,
    540,
    572,
    46,
    'text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="42" font-weight="bold" fill="#7C3AED"',
  )}
  <text x="540" y="650" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="bold" letter-spacing="4" fill="#8B7AA8">VAI PARA</text>
  ${textLines(
    winnerLines,
    540,
    756,
    84,
    'text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="76" font-weight="bold" fill="#24143A"',
  )}
  <rect x="300" y="790" width="480" height="4" rx="2" fill="#FFD166"/>
  <text x="540" y="844" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="bold" fill="#FF8A3D">${escapeXml(input.votesText)}</text>
  ${textLines(
    phraseLines,
    540,
    894,
    36,
    'text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="28" fill="#5D4A75"',
  )}
  <text x="540" y="1000" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="22" fill="#8B7AA8">${escapeXml(roomLines[0] ?? '')}</text>
  <text x="540" y="1032" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="bold" letter-spacing="2" fill="#2A1259">RESENHA SECRETA · QUEM É QUEM NO GRUPO?</text>
</svg>`;
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Não foi possível gerar a imagem do card.'));
    }, 'image/png');
  });
}

export async function buildResultCardPng(svg: string): Promise<Blob> {
  const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  try {
    const image = new Image();
    image.decoding = 'async';
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('Não foi possível carregar o card.'));
      image.src = url;
    });

    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1080;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Seu navegador não suporta a geração do card.');
    context.drawImage(image, 0, 0, 1080, 1080);
    return await canvasToBlob(canvas);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function downloadResultCard(input: ResultCardInput): Promise<void> {
  const svg = buildResultCardSvg(input);
  try {
    const png = await buildResultCardPng(svg);
    downloadBlob(png, `resenha-secreta-${slugify(input.categoryName)}.png`);
  } catch {
    downloadBlob(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }), `resenha-secreta-${slugify(input.categoryName)}.svg`);
  }
}

export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50) || 'card';
}

export async function shareResultCard(input: ResultCardInput, message: string): Promise<boolean> {
  if (typeof navigator.share !== 'function') return false;

  try {
    const svg = buildResultCardSvg(input);
    const png = await buildResultCardPng(svg);
    const file = new File([png], `resenha-secreta-${slugify(input.categoryName)}.png`, {
      type: 'image/png',
    });
    const data: ShareData = { title: 'Resenha Secreta', text: message, files: [file] };

    if (typeof navigator.canShare === 'function' && !navigator.canShare(data)) {
      await navigator.share({ title: 'Resenha Secreta', text: message });
      return true;
    }
    await navigator.share(data);
    return true;
  } catch {
    return false;
  }
}
