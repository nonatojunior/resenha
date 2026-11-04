import { describe, expect, it } from 'vitest';
import {
  buildResultCardSvg,
  escapeXml,
  slugify,
  wrapText,
} from '../src/features/sharing/card';

describe('escapeXml', () => {
  it('escapa caracteres especiais de XML', () => {
    expect(escapeXml(`<Ana & "Bia" 'Caio'>`)).toBe(
      '&lt;Ana &amp; &quot;Bia&quot; &apos;Caio&apos;&gt;',
    );
  });
});

describe('wrapText', () => {
  it('quebra o texto respeitando o limite de caracteres', () => {
    const lines = wrapText('Quem sempre promete e nunca entrega nada', 18, 4);

    expect(lines.length).toBeGreaterThan(1);
    for (const line of lines) expect(line.length).toBeLessThanOrEqual(18);
  });

  it('respeita o número máximo de linhas e adiciona reticências', () => {
    const text = 'palavra '.repeat(40).trim();
    const lines = wrapText(text, 20, 2);

    expect(lines).toHaveLength(2);
    expect(lines[1].endsWith('…')).toBe(true);
  });

  it('mantém textos curtos em uma única linha', () => {
    expect(wrapText('Ana', 16, 2)).toEqual(['Ana']);
  });

  it('retorna uma linha vazia para texto vazio', () => {
    expect(wrapText('   ', 16, 2)).toEqual(['']);
  });
});

describe('buildResultCardSvg', () => {
  it('gera um SVG 1080x1080 com categoria, vencedor e votos', () => {
    const svg = buildResultCardSvg({
      categoryName: 'CEO da Enrolação',
      winnerName: 'Ana',
      phrase: 'Prometeu o rolê e desapareceu.',
      roomName: 'Resenha da Firma',
      votesText: '4 de 6 votos',
    });

    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg).toContain('width="1080" height="1080"');
    expect(svg).toContain('CEO DA ENROLAÇÃO');
    expect(svg).toContain('Ana');
    expect(svg).toContain('4 de 6 votos');
    expect(svg).toContain('RESENHA SECRETA');
  });

  it('escapa dados fornecidos pelo usuário para não quebrar o SVG', () => {
    const svg = buildResultCardSvg({
      categoryName: '<script>alert(1)</script>',
      winnerName: 'Ana & Bia',
      phrase: `Aspas "duplas" e 'simples'`,
      roomName: 'Sala <perigosa>',
      votesText: '2 & 3',
    });

    expect(svg).not.toContain('<script>');
    expect(svg).toContain('&lt;SCRIPT&gt;');
    expect(svg).toContain('Ana &amp; Bia');
    expect(svg).toContain('Sala &lt;perigosa&gt;');
    expect(svg).toContain('2 &amp; 3');
  });
});

describe('slugify', () => {
  it('remove acentos e caracteres inválidos', () => {
    expect(slugify('CEO da Enrolação!')).toBe('ceo-da-enrolacao');
    expect(slugify('  Prêmio   do Ano  ')).toBe('premio-do-ano');
  });

  it('usa um fallback para textos sem letras ou números', () => {
    expect(slugify('!!!')).toBe('card');
    expect(slugify('')).toBe('card');
  });
});
