import { useMemo, useState } from 'react';
import { Check, Copy, Link2, MessageCircle, Share2, ShieldCheck } from 'lucide-react';
import type { Room } from '../../types/game';
import {
  buildInviteMessage,
  buildRoomUrl,
  buildWhatsAppUrl,
  copyText,
} from '../sharing/share';
import { Button } from '../../components/Button';
import { buttonClass } from '../../lib/buttonClass';
import { useToast } from '../../components/Toast';

interface InvitePanelProps {
  room: Room;
  compact?: boolean;
}

export function InvitePanel({ room, compact = false }: InvitePanelProps) {
  const { showToast } = useToast();
  const [copied, setCopied] = useState<'link' | 'code' | null>(null);
  const roomUrl = useMemo(() => buildRoomUrl(room.code), [room.code]);
  const message = useMemo(() => buildInviteMessage(room), [room]);
  const canNativeShare = typeof navigator !== 'undefined' && Boolean(navigator.share);

  const copy = async (value: string, type: 'link' | 'code') => {
    const success = await copyText(value);
    if (success) {
      setCopied(type);
      window.setTimeout(() => setCopied(null), 2200);
      showToast(type === 'code' ? 'Código copiado!' : 'Link copiado!', 'success');
    } else {
      showToast('Não conseguimos copiar automaticamente. Selecione o texto e copie.', 'error');
    }
  };

  const nativeShare = async () => {
    try {
      await navigator.share({ title: room.name, text: message, url: roomUrl });
    } catch {
      showToast('Compartilhamento cancelado.', 'info');
    }
  };

  return (
    <section className={`card invite-panel ${compact ? 'invite-panel--compact' : ''}`}>
      <div className="invite-panel__heading">
        <span className="invite-panel__icon">
          <Link2 size={21} aria-hidden="true" />
        </span>
        <div>
          <h2>Chama o grupo</h2>
          <p>Cada apelido entra uma vez. Sem cadastro, sem senha.</p>
        </div>
      </div>

      <div className="copy-box">
        <span className="copy-box__label">Link do convite</span>
        <div className="copy-box__row">
          <input value={roomUrl} readOnly aria-label="Link do convite" onFocus={(event) => event.target.select()} />
          <Button
            size="sm"
            variant="secondary"
            onClick={() => void copy(roomUrl, 'link')}
            icon={copied === 'link' ? <Check size={16} /> : <Copy size={16} />}
            aria-label="Copiar link do convite"
          >
            {copied === 'link' ? 'Copiado' : 'Copiar'}
          </Button>
        </div>
      </div>

      <div className="invite-code">
        <div>
          <span className="copy-box__label">Código da sala</span>
          <strong className="invite-code__value">{room.code}</strong>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => void copy(room.code, 'code')}
          icon={copied === 'code' ? <Check size={16} /> : <Copy size={16} />}
        >
          {copied === 'code' ? 'Copiado' : 'Copiar código'}
        </Button>
      </div>

      {room.hasAccessCode ? (
        <p className="invite-panel__note">
          <ShieldCheck size={16} aria-hidden="true" /> Esta sala também pede um código de acesso.
          Combine com o grupo por outro canal.
        </p>
      ) : null}

      <div className="invite-panel__actions">
        <a
          className={buttonClass('primary', { size: 'md' })}
          href={buildWhatsAppUrl(message)}
          target="_blank"
          rel="noopener noreferrer"
        >
          <MessageCircle size={19} aria-hidden="true" />
          <span>Enviar no WhatsApp</span>
        </a>
        {canNativeShare ? (
          <Button
            variant="secondary"
            onClick={() => void nativeShare()}
            icon={<Share2 size={18} aria-hidden="true" />}
          >
            Compartilhar
          </Button>
        ) : null}
      </div>
    </section>
  );
}
