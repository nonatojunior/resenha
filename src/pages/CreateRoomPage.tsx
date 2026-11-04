import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  CalendarClock,
  Check,
  Eye,
  Info,
  Lock,
  Sparkles,
  Users,
} from 'lucide-react';
import { Button, LinkButton } from '../components/Button';
import { CategoryIcon } from '../components/CategoryIcon';
import { TextField, SwitchField } from '../components/Field';
import { useToast } from '../components/Toast';
import { CategorySelector } from '../features/rooms/CategorySelector';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import {
  GROUP_TYPE_OPTIONS,
  THEME_OPTIONS,
  VISIBILITY_OPTIONS,
  getDefaultCategories,
} from '../lib/categories';
import { getErrorMessage } from '../lib/errors';
import { saveSessionToken } from '../lib/session';
import {
  normalizeSpaces,
  validateAccessCode,
  validateNickname,
  validateRoomName,
} from '../lib/validation';
import { getRepository } from '../services';
import type {
  CreateRoomInput,
  CustomCategoryInput,
  GroupType,
  RoomTheme,
  RoomVisibility,
} from '../types/game';

interface FormErrors {
  name?: string;
  organizerName?: string;
  customGroupType?: string;
  accessCode?: string;
  categories?: string;
  revealAt?: string;
}

const DEFAULT_SELECTED = getDefaultCategories()
  .slice(0, 6)
  .map((category) => category.slug ?? '')
  .filter(Boolean);

export function CreateRoomPage() {
  useDocumentTitle('Criar resenha');
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [organizerName, setOrganizerName] = useState('');
  const [groupType, setGroupType] = useState<GroupType>('amigos');
  const [customGroupType, setCustomGroupType] = useState('');
  const [theme, setTheme] = useState<RoomTheme>('livre');
  const [visibility, setVisibility] = useState<RoomVisibility>('link');
  const [accessCode, setAccessCode] = useState('');
  const [revealAt, setRevealAt] = useState('');
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>(DEFAULT_SELECTED);
  const [customCategories, setCustomCategories] = useState<CustomCategoryInput[]>([]);
  const [allowLateJoin, setAllowLateJoin] = useState(true);
  const [allowVoteChange, setAllowVoteChange] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const totalCategories = selectedSlugs.length + customCategories.length;

  const validate = (): boolean => {
    const next: FormErrors = {};
    const roomName = validateRoomName(name);
    if (!roomName.valid) next.name = roomName.error ?? undefined;

    const nickname = validateNickname(organizerName);
    if (!nickname.valid) next.organizerName = nickname.error ?? undefined;

    if (groupType === 'personalizado') {
      const custom = normalizeSpaces(customGroupType);
      if (custom.length < 3 || custom.length > 30) {
        next.customGroupType = 'Dê um nome de 3 a 30 caracteres para o grupo.';
      }
    }

    if (visibility === 'code') {
      const code = validateAccessCode(accessCode);
      if (!code.valid) next.accessCode = code.error ?? undefined;
    }

    if (totalCategories === 0) {
      next.categories = 'Ative pelo menos uma categoria para a resenha existir.';
    }

    if (revealAt) {
      const date = new Date(revealAt);
      if (Number.isNaN(date.getTime())) {
        next.revealAt = 'Escolha uma data e um horário válidos.';
      } else if (date.getTime() < Date.now()) {
        next.revealAt = 'A data de revelação precisa estar no futuro.';
      }
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    if (!validate()) {
      document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
      return;
    }

    const input: CreateRoomInput = {
      name: normalizeSpaces(name),
      organizerName: normalizeSpaces(organizerName),
      groupType,
      customGroupType: groupType === 'personalizado' ? normalizeSpaces(customGroupType) : null,
      theme,
      visibility,
      accessCode: visibility === 'code' ? accessCode.trim().toUpperCase() : null,
      revealAt: revealAt ? new Date(revealAt).toISOString() : null,
      categorySlugs: selectedSlugs,
      customCategories,
      allowLateJoin,
      allowVoteChange,
    };

    setLoading(true);
    try {
      const authenticated = await getRepository().createRoom(input);
      saveSessionToken(authenticated.session.room.code, authenticated.token);
      showToast('Resenha criada! Agora chama o grupo.', 'success');
      navigate(`/resenha/${authenticated.session.room.code}`);
    } catch (error) {
      setFormError(getErrorMessage(error));
      setLoading(false);
    }
  };

  return (
    <div className="page page--create">
      <div className="container">
        <div className="page-heading">
          <span className="eyebrow">
            <Sparkles size={16} aria-hidden="true" /> Nova resenha
          </span>
          <h1>Monte o tribunal mais divertido do grupo</h1>
          <p>
            Você define as regras, as categorias e o momento da revelação. Os votos ficam
            secretos até lá.
          </p>
        </div>

        <form className="create-layout" onSubmit={(event) => void submit(event)} noValidate>
          <div className="create-main">
            <section className="card form-card">
              <div className="form-card__heading">
                <span className="form-card__step">1</span>
                <div>
                  <h2>A resenha</h2>
                  <p>O nome que vai aparecer no convite e no placar.</p>
                </div>
              </div>

              <div className="field-grid">
                <TextField
                  label="Nome da resenha"
                  name="roomName"
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    setErrors((current) => ({ ...current, name: undefined }));
                  }}
                  placeholder="Ex.: Confraternização do time sem filtro"
                  maxLength={60}
                  counter={`${name.length}/60`}
                  error={errors.name}
                  hint="De 3 a 60 caracteres. Pode ser o nome do grupo, do evento ou da resenha."
                  required
                />
                <TextField
                  label="Seu nome ou apelido"
                  name="organizerName"
                  value={organizerName}
                  onChange={(event) => {
                    setOrganizerName(event.target.value);
                    setErrors((current) => ({ ...current, organizerName: undefined }));
                  }}
                  placeholder="Ex.: Nonato"
                  maxLength={24}
                  counter={`${organizerName.length}/24`}
                  error={errors.organizerName}
                  hint="Você será o organizador. Use um apelido, não seu nome completo."
                  autoComplete="nickname"
                  required
                />
              </div>

              <div className="field-group">
                <span className="field-group__label">Tipo de grupo</span>
                <div className="option-grid option-grid--four">
                  {GROUP_TYPE_OPTIONS.map((option) => (
                    <label
                      key={option.value}
                      className={`option-card ${groupType === option.value ? 'option-card--selected' : ''}`}
                    >
                      <input
                        type="radio"
                        name="groupType"
                        value={option.value}
                        checked={groupType === option.value}
                        onChange={() => setGroupType(option.value)}
                      />
                      <span className="option-card__check" aria-hidden="true">
                        {groupType === option.value ? <Check size={14} /> : null}
                      </span>
                      <strong>{option.label}</strong>
                      <small>{option.description}</small>
                    </label>
                  ))}
                </div>
              </div>

              {groupType === 'personalizado' ? (
                <TextField
                  label="Nome do seu tipo de grupo"
                  name="customGroupType"
                  value={customGroupType}
                  onChange={(event) => {
                    setCustomGroupType(event.target.value);
                    setErrors((current) => ({ ...current, customGroupType: undefined }));
                  }}
                  placeholder="Ex.: Turma da faculdade"
                  maxLength={30}
                  counter={`${customGroupType.length}/30`}
                  error={errors.customGroupType}
                  required
                />
              ) : null}

              <div className="field-group">
                <span className="field-group__label">Tema da resenha</span>
                <div className="theme-options">
                  {THEME_OPTIONS.map((option) => (
                    <label
                      key={option.value}
                      className={`theme-chip ${theme === option.value ? 'theme-chip--selected' : ''}`}
                    >
                      <input
                        type="radio"
                        name="theme"
                        value={option.value}
                        checked={theme === option.value}
                        onChange={() => setTheme(option.value)}
                      />
                      <CategoryIcon name={option.icon} size={18} />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </section>

            <section className="card form-card">
              <div className="form-card__heading">
                <span className="form-card__step">2</span>
                <div>
                  <h2>Categorias</h2>
                  <p>Cada categoria vira uma pergunta secreta no placar.</p>
                </div>
              </div>
              <CategorySelector
                selectedSlugs={selectedSlugs}
                onToggleSlug={(slug) => {
                  setSelectedSlugs((current) =>
                    current.includes(slug)
                      ? current.filter((item) => item !== slug)
                      : [...current, slug],
                  );
                  setErrors((current) => ({ ...current, categories: undefined }));
                }}
                customCategories={customCategories}
                onAddCustom={(category) => {
                  setCustomCategories((current) => [...current, category]);
                  setErrors((current) => ({ ...current, categories: undefined }));
                }}
                onRemoveCustom={(index) =>
                  setCustomCategories((current) =>
                    current.filter((_, position) => position !== index),
                  )
                }
              />
              {errors.categories ? (
                <p className="field__error" role="alert">
                  {errors.categories}
                </p>
              ) : null}
            </section>

            <section className="card form-card">
              <div className="form-card__heading">
                <span className="form-card__step">3</span>
                <div>
                  <h2>Acesso e revelação</h2>
                  <p>Defina quem entra e quando o grupo descobre a verdade.</p>
                </div>
              </div>

              <div className="field-group">
                <span className="field-group__label">Quem pode entrar</span>
                <div className="visibility-options">
                  {VISIBILITY_OPTIONS.map((option) => (
                    <label
                      key={option.value}
                      className={`visibility-card ${
                        visibility === option.value ? 'visibility-card--selected' : ''
                      }`}
                    >
                      <input
                        type="radio"
                        name="visibility"
                        value={option.value}
                        checked={visibility === option.value}
                        onChange={() => setVisibility(option.value)}
                      />
                      <span className="visibility-card__icon">
                        {option.value === 'link' ? (
                          <Users size={20} aria-hidden="true" />
                        ) : (
                          <Lock size={20} aria-hidden="true" />
                        )}
                      </span>
                      <span>
                        <strong>{option.label}</strong>
                        <small>{option.description}</small>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {visibility === 'code' ? (
                <TextField
                  label="Código de acesso da sala"
                  name="accessCode"
                  value={accessCode}
                  onChange={(event) => {
                    setAccessCode(event.target.value);
                    setErrors((current) => ({ ...current, accessCode: undefined }));
                  }}
                  placeholder="Ex.: RESENHA2026"
                  maxLength={16}
                  counter={`${accessCode.length}/16`}
                  error={errors.accessCode}
                  hint="De 4 a 16 letras/números. Combine com o grupo por outro canal."
                  autoComplete="off"
                  required
                />
              ) : null}

              <TextField
                label="Data e horário para revelar (opcional)"
                name="revealAt"
                type="datetime-local"
                value={revealAt}
                onChange={(event) => {
                  setRevealAt(event.target.value);
                  setErrors((current) => ({ ...current, revealAt: undefined }));
                }}
                error={errors.revealAt}
                hint="É só uma referência para o organizador. O placar só aparece quando ele liberar."
              />

              <div className="form-card__switches">
                <SwitchField
                  label="Aceitar entradas durante a votação"
                  description="Quem chegar atrasado ainda pode entrar e votar nas categorias."
                  checked={allowLateJoin}
                  onChange={setAllowLateJoin}
                />
                <SwitchField
                  label="Permitir troca de voto"
                  description="Cada pessoa pode corrigir a escolha até o encerramento. O voto final é o que conta."
                  checked={allowVoteChange}
                  onChange={setAllowVoteChange}
                />
              </div>
            </section>

            {formError ? (
              <p className="form-error form-error--boxed" role="alert">
                {formError}
              </p>
            ) : null}

            <div className="create-actions">
              <Button
                type="submit"
                size="lg"
                loading={loading}
                icon={<ArrowRight size={20} aria-hidden="true" />}
              >
                Criar resenha e convidar o grupo
              </Button>
              <LinkButton to="/" variant="ghost">
                Cancelar
              </LinkButton>
            </div>
          </div>

          <aside className="create-sidebar">
            <div className="card summary-card">
              <span className="eyebrow">Prévia do convite</span>
              <h2>{name.trim() || 'Sua resenha sem filtro'}</h2>
              <p className="summary-card__organizer">
                organizada por <strong>{organizerName.trim() || 'você'}</strong>
              </p>

              <ul className="summary-card__facts">
                <li>
                  <Users size={17} aria-hidden="true" />
                  <span>
                    {groupType === 'personalizado'
                      ? customGroupType.trim() || 'Grupo personalizado'
                      : GROUP_TYPE_OPTIONS.find((option) => option.value === groupType)?.label}
                  </span>
                </li>
                <li>
                  <Sparkles size={17} aria-hidden="true" />
                  <span>
                    {totalCategories} {totalCategories === 1 ? 'categoria ativa' : 'categorias ativas'}
                  </span>
                </li>
                <li>
                  {visibility === 'code' ? (
                    <Lock size={17} aria-hidden="true" />
                  ) : (
                    <Eye size={17} aria-hidden="true" />
                  )}
                  <span>{visibility === 'code' ? 'Link + código de acesso' : 'Quem tem o link, entra'}</span>
                </li>
                <li>
                  <CalendarClock size={17} aria-hidden="true" />
                  <span>{revealAt ? 'Revelação marcada' : 'Revelação manual pelo organizador'}</span>
                </li>
              </ul>

              <div className="summary-card__categories">
                {selectedSlugs.slice(0, 4).map((slug) => {
                  const category = getDefaultCategories().find((item) => item.slug === slug);
                  if (!category) return null;
                  return (
                    <span className="mini-tag" key={slug}>
                      {category.name}
                    </span>
                  );
                })}
                {customCategories.slice(0, 2).map((category) => (
                  <span className="mini-tag mini-tag--custom" key={category.name}>
                    {category.name}
                  </span>
                ))}
                {totalCategories > 6 ? (
                  <span className="mini-tag mini-tag--more">+{totalCategories - 6}</span>
                ) : null}
              </div>

              <p className="summary-card__note">
                <Info size={15} aria-hidden="true" /> O código da sala é gerado na criação. Você
                poderá copiar o link e mandar no WhatsApp.
              </p>
            </div>

            <div className="card sidebar-tip">
              <h3>Antes de convidar</h3>
              <ul className="check-list">
                <li>Use apelidos, nunca dados pessoais.</li>
                <li>Combine o tom da brincadeira com o grupo.</li>
                <li>Remova qualquer categoria que possa magoar alguém.</li>
              </ul>
              <LinkButton to="/privacidade" variant="ghost" size="sm">
                Regras e privacidade
              </LinkButton>
            </div>
          </aside>
        </form>
      </div>
    </div>
  );
}
