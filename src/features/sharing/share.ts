import type { Room } from '../../types/game';

export function getBasePath(): string {
  return import.meta.env.BASE_URL;
}

export function getAppOrigin(): string {
  if (typeof window === 'undefined') return 'http://localhost';
  return window.location.origin;
}

export function buildAppUrl(path: string): string {
  const base = getBasePath();
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  const normalizedPath = path.replace(/^\/+/, '');
  return `${getAppOrigin()}${normalizedBase}${normalizedPath}`;
}

export function buildRoomUrl(code: string): string {
  return buildAppUrl(`resenha/${code.toUpperCase()}`);
}

export function buildResultUrl(code: string): string {
  return buildAppUrl(`resenha/${code.toUpperCase()}/resultado`);
}

export function buildJoinUrl(code: string): string {
  return buildAppUrl(`entrar?codigo=${encodeURIComponent(code.toUpperCase())}`);
}

export function buildWhatsAppUrl(message: string): string {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

export function buildInviteMessage(room: Pick<Room, 'name' | 'code'>): string {
  return [
    `🎉 Bora votar na Resenha Secreta "${room.name}"?`,
    'Entre pelo link, escolha um apelido e descubra quem é quem no grupo.',
    buildRoomUrl(room.code),
    `Código da sala: ${room.code}`,
  ].join('\n');
}

export function buildShareCardMessage(categoryName: string, winnerName: string, roomUrl?: string): string {
  const message = `🏆 O prêmio ${categoryName} foi para ${winnerName} na Resenha Secreta! O grupo votou e não aceita recurso 😂`;
  return roomUrl ? `${message}\n\n${roomUrl}` : message;
}

export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Tenta o fallback abaixo.
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand('copy');
    document.body.removeChild(textarea);
    return copied;
  } catch {
    return false;
  }
}
