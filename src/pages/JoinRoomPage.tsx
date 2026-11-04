import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, KeyRound, Link2, MessageCircle, Sparkles, Users } from 'lucide-react';
import { Button, LinkButton } from '../components/Button';
import { TextField } from '../components/Field';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { getErrorMessage } from '../lib/errors';
import { normalizeRoomCode } from '../lib/validation';
import { getRepository } from '../services';

export function JoinRoomPage() {
  useDocumentTitle('Entrar em uma resenha');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [code, setCode] = useState(() => normalizeRoomCode(searchParams.get('codigo') ?? ''));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = normalizeRoomCode(code);
    if (normalized.length !== 6) {
      setError('O código da sala tem 6 caracteres. Confira o convite e tente de novo.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await getRepository().getRoomPreview(normalized);
      navigate(`/resenha/${normalized}`);
    } catch (caught) {
      setError(getErrorMessage(caught));
      setLoading(false);
    }
  };

  return (
    <div className="page page--join">
      <div className="container join-page">
        <div className="join-page__copy">
          <span className="eyebrow">
            <KeyRound size={16} aria-hidden="true" /> Convite na mão?
          </span>
          <h1>Entre na resenha do grupo</h1>
          <p>
            Digite o código de 6 caracteres que veio no convite. Você escolhe um apelido e
            entra direto na sala — sem cadastro, sem senha.
          </p>

          <ul className="join-benefits">
            <li>
              <span>
                <MessageCircle size={18} aria-hidden="true" />
              </span>
              <div>
                <strong>Chegou pelo WhatsApp?</strong>
                <p>O link já abre a sala certa. Se ele falhar, use o código do convite.</p>
              </div>
            </li>
            <li>
              <span>
                <Users size={18} aria-hidden="true" />
              </span>
              <div>
                <strong>Um apelido por pessoa</strong>
                <p>Nomes repetidos são bloqueados para ninguém votar duas vezes.</p>
              </div>
            </li>
            <li>
              <span>
                <Sparkles size={18} aria-hidden="true" />
              </span>
              <div>
                <strong>Voto secreto</strong>
                <p>Ninguém vê em quem você votou. Nem o organizador da resenha.</p>
              </div>
            </li>
          </ul>
        </div>

        <div className="card join-card">
          <div className="join-card__heading">
            <span className="join-card__icon">
              <KeyRound size={23} aria-hidden="true" />
            </span>
            <h2>Qual é o código?</h2>
            <p>Ele tem 6 caracteres, entre letras e números.</p>
          </div>

          <form onSubmit={(event) => void submit(event)} noValidate>
            <TextField
              label="Código da sala"
              name="roomCode"
              value={code}
              onChange={(event) => {
                setCode(normalizeRoomCode(event.target.value).slice(0, 6));
                setError(null);
              }}
              placeholder="ABC123"
              maxLength={6}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              className="input--code"
              error={error}
              hint="Exemplo: ABC123. O código não diferencia maiúsculas de minúsculas."
              required
            />

            <Button
              type="submit"
              full
              size="lg"
              loading={loading}
              icon={<ArrowRight size={20} aria-hidden="true" />}
            >
              Entrar na resenha
            </Button>
          </form>

          <div className="join-card__divider">
            <span>ou</span>
          </div>

          <LinkButton
            to="/criar"
            full
            variant="secondary"
            icon={<Sparkles size={19} aria-hidden="true" />}
          >
            Criar uma nova resenha
          </LinkButton>

          <p className="join-card__fineprint">
            Ao entrar, você aceita as <Link to="/privacidade">regras de convivência</Link>. Use
            um apelido e não compartilhe dados pessoais.
          </p>
        </div>

        <aside className="join-page__aside">
          <div className="card invite-hint">
            <span className="invite-hint__icon">
              <Link2 size={20} aria-hidden="true" />
            </span>
            <div>
              <h3>Recebeu um link?</h3>
              <p>
                Basta abrir o endereço do convite. O código da sala já vem preenchido e você cai
                direto na entrada.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
