import { useId, useMemo, useState } from 'react';
import { Check, Plus, Sparkles, Trash2 } from 'lucide-react';
import { CATEGORY_VOTING_RULE, getDefaultCategories } from '../../lib/categories';
import { normalizeSpaces, validateCustomCategory } from '../../lib/validation';
import type { CustomCategoryInput } from '../../types/game';
import { CategoryIcon } from '../../components/CategoryIcon';
import { Button } from '../../components/Button';
import { TextField } from '../../components/Field';

interface CategorySelectorProps {
  selectedSlugs: string[];
  onToggleSlug: (slug: string) => void;
  customCategories: CustomCategoryInput[];
  onAddCustom: (category: CustomCategoryInput) => void;
  onRemoveCustom: (index: number) => void;
  disabled?: boolean;
}

export function CategorySelector({
  selectedSlugs,
  onToggleSlug,
  customCategories,
  onAddCustom,
  onRemoveCustom,
  disabled = false,
}: CategorySelectorProps) {
  const defaults = useMemo(() => getDefaultCategories(), []);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const formId = useId();

  const usedNames = useMemo(
    () =>
      new Set(
        [...defaults.map((category) => category.name), ...customCategories.map((category) => category.name)]
          .map((value) =>
            value
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .toLowerCase(),
          ),
      ),
    [defaults, customCategories],
  );

  const addCustom = () => {
    const validation = validateCustomCategory(name, description);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }
    const normalized = name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
    if (usedNames.has(normalized)) {
      setError('Já existe uma categoria com esse nome.');
      return;
    }
    if (customCategories.length >= 6) {
      setError('Você pode criar no máximo 6 categorias personalizadas.');
      return;
    }
    onAddCustom({ name: normalizeSpaces(name), description: normalizeSpaces(description) });
    setName('');
    setDescription('');
    setError(null);
    setShowForm(false);
  };

  return (
    <div className="category-selector">
      <div className="category-selector__top">
        <div>
          <h3>Categorias da resenha</h3>
          <p>Todas são seguras e engraçadas. Você pode tirar ou criar as suas.</p>
        </div>
        <span className="count-pill">
          {selectedSlugs.length + customCategories.length}{' '}
          {selectedSlugs.length + customCategories.length === 1 ? 'ativa' : 'ativas'}
        </span>
      </div>

      <div className="category-options">
        {defaults.map((category) => {
          const slug = category.slug ?? category.id;
          const selected = selectedSlugs.includes(slug);
          return (
            <label
              key={slug}
              className={`category-option ${selected ? 'category-option--selected' : ''}`}
            >
              <input
                type="checkbox"
                checked={selected}
                onChange={() => onToggleSlug(slug)}
                disabled={disabled}
              />
              <span className="category-option__icon">
                <CategoryIcon name={category.icon} size={22} />
              </span>
              <span className="category-option__body">
                <strong>{category.name}</strong>
                <small>{category.description}</small>
              </span>
              <span className="category-option__check" aria-hidden="true">
                {selected ? <Check size={15} /> : null}
              </span>
            </label>
          );
        })}
      </div>

      {customCategories.length > 0 ? (
        <div className="custom-categories">
          <h4>Suas categorias</h4>
          {customCategories.map((category, index) => (
            <div className="custom-category" key={`${category.name}-${index}`}>
              <span className="category-option__icon category-option__icon--custom">
                <Sparkles size={19} />
              </span>
              <div>
                <strong>{category.name}</strong>
                <small>{category.description}</small>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={() => onRemoveCustom(index)}
                disabled={disabled}
                aria-label={`Remover categoria ${category.name}`}
              >
                <Trash2 size={17} aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      ) : null}

      {!disabled ? (
        <div className="custom-category-form">
          {showForm ? (
            <div className="custom-category-form__fields">
              <TextField
                label="Nome da categoria"
                name={`${formId}-name`}
                value={name}
                maxLength={40}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ex.: Rei do churrasco"
                counter={`${name.length}/40`}
              />
              <TextField
                label="Descrição engraçada"
                name={`${formId}-description`}
                value={description}
                maxLength={120}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Quem acende a churrasqueira e some na primeira rodada."
                counter={`${description.length}/120`}
              />
              {error ? (
                <p className="field__error" role="alert">
                  {error}
                </p>
              ) : null}
              <div className="custom-category-form__actions">
                <Button size="sm" onClick={addCustom} icon={<Plus size={17} />}>
                  Adicionar
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setShowForm(false);
                    setError(null);
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowForm(true)}
              icon={<Plus size={17} />}
            >
              Criar categoria personalizada
            </Button>
          )}
        </div>
      ) : null}

      <p className="category-selector__rule">
        <strong>Regra:</strong> {CATEGORY_VOTING_RULE} Evite exposição de dados íntimos ou
        características sensíveis.
      </p>
    </div>
  );
}
