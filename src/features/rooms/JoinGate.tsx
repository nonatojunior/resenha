import { useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, EyeOff, Lock, Sparkles, Trophy, Users } from 'lucide-react';
import { Button, LinkButton } from '../../components/Button';
import { CheckboxField, TextField } from '../../components/Field';
import { Avatar } from '../../components/ParticipantList';
import { StatusBadge } from '../../components/StatusBadge';
import { useToast } from '../../components/Toast';
import { getErrorMessage } from '../../lib/errors';
import { validateNickname } from '../../lib/validation';
import { getRepository } from '../../services';
import type { AuthenticatedSession, RoomPreview } from '../../types/game';

interface JoinGateProps {
  preview: RoomPreview;
  code: string;
  onAuthenticated: (session: AuthenticatedSession) => void;
}

export function JoinGate({ preview, code, onAuthenticated }: JoinGateProps) {
  const [nickname, setNickname] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [nicknameError, setNicknameError] = useState<string | null>(null);
  const [termsError, setTermsError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const closed = preview.status === 'closed' || preview.status === 'revealed' || preview.status === 'archived';
  const canSeeResults = preview.status === 'revealed' || preview.status === 'archived';
  const accessCodeLabel = useMemo(
    () => (preview.hasAccessCode ? 'Código de acesso' : ''),
    [preview.hasAccessCode],
  );

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setNicknameError(null);
    setTermsError(null);

    const validation = validateNickname(nickname);
    if (!validation.valid) {
      setNicknameError(validation.error);
      return;
    }
    if (!accepted) {
      setTermsError('Para entrar, confirme que você leu as regras de convivência.');
      return;
    }

    setLoading(true);
    try {
      const auth = await getRepository().joinRoom(code, nickname, accessCode || undefined);
      onAuthenticated(auth);
      showToast(`Bem-vindo(a), ${auth.session.participant.nickname}!`, 'success');
    } catch (error) {
      setFormError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="join-gate section">
      <div className="container join-gate__grid">
        <div className="join-gate__intro">
          <span className="eyebrow">
            <Sparkles size={16} aria-hidden="true" /> Convite recebido
          </span>
          <div className="join-gate__room">
            <h1>{preview.name}</h1>
            <StatusBadge status={preview.status} />
          </div>
          <p className="join-gate__meta">
            <Users size={17} aria-hidden="true" /> {preview.participantCount}{' '}
            {preview.participantCount === 1 ? 'participante' : 'participantes'} · Código{' '}
            <strong>{preview.code}</strong>
          </p>

          <div className="join-gate__promise">
            <div>
              <EyeOff size={22} aria-hidden="true" />
              <strong>Voto secreto de verdade</strong>
              <p>Ninguém vê em quem você votou. Nem o organizador.</p>
            </div>
            <div>
              <Lock size={22} aria-hidden="true" />
              <strong>Sem cadastro</strong>
              <p>Um apelido, as regras aceitas e você está dentro.</p>
            </div>
          </div>

          <div className="fake-ticket" aria-hidden="true">
            <span>seu apelido</span>
            <Avatar nickname={nickname || '??'} size="lg" />
            <span>muito suspeito</span>
          </div>
        </div>

        <div className="card join-gate__card">
          {closed ? (
            <div className="join-gate__closed">
              <Trophy size={34} aria-hidden="true" />
              <h2>Essa resenha já tem veredito.</h2>
              <p>
                Novas entradas estão encerradas, mas os resultados agregados podem estar
                disponíveis.
              </p>
              {canSeeResults ? (
                <LinkButton
                  to={`/resenha/${code}/resultado`}
                  icon={<ArrowRight size={18} aria-hidden="true" />}
                >
                  Ver resultados
                </LinkButton>
              ) : (
                <p className="muted">O organizador ainda não liberou o placar.</p>
              )}
              <Link className="text-link" to="/entrar">
                Entrar em outra resenha
              </Link>
            </div>
          ) : (
            <form onSubmit={(event) => void submit(event)} noValidate>
              <div className="join-gate__card-heading">
                <h2>Entrar na resenha</h2>
                <p>Só o necessário para o grupo saber quem está sendo julgado.</p>
              </div>

              <TextField
                label="Seu apelido"
                name="nickname"
                value={nickname}
                onChange={(event) => {
                  setNickname(event.target.value);
                  setNicknameError(null);
                }}
                placeholder="Ex.: Bia do rolê"
                maxLength={24}
                autoComplete="nickname"
                error={nicknameError}
                hint="De 2 a 24 caracteres. Nada de nome completo ou dado pessoal."
                counter={`${nickname.length}/24`}
                required
              />

              {preview.hasAccessCode ? (
                <TextField
                  label={accessCodeLabel}
                  name="accessCode"
                  value={accessCode}
                  onChange={(event) => setAccessCode(event.target.value)}
                  placeholder="Código combinado com o organizador"
                  maxLength={16}
                  autoComplete="off"
                  hint="A sala é reservada. Pergunte o código a quem criou a resenha."
                />
              ) : null}

              <CheckboxField
                checked={accepted}
                onChange={(checked) => {
                  setAccepted(checked);
                  setTermsError(null);
                }}
                error={termsError}
                label={
                  <>
                    Li e aceito as <Link to="/privacidade">regras de convivência e privacidade</Link>.
                    Vou usar um apelido e manter a resenha no humor.
                  </>
                }
              />

              {formError ? (
                <p className="form-error" role="alert">
                  {formError}
                </p>
              ) : null}

              <Button type="submit" full size="lg" loading={loading} icon={<ArrowRight size={20} />}>
                Entrar na resenha
              </Button>
              <p className="join-gate__fineprint">
                Ao entrar, você concorda que o organizador pode encerrar a sala e excluir os dados.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
