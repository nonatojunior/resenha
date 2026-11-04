import type { Category } from '../../types/game';
import { CategoryIcon } from '../../components/CategoryIcon';

export function CategoryPreview({ categories }: { categories: Category[] }) {
  if (categories.length === 0) {
    return <p className="muted">O organizador ainda está escolhendo as categorias.</p>;
  }

  return (
    <ul className="category-preview">
      {categories.map((category) => (
        <li key={category.id}>
          <span className="category-preview__icon">
            <CategoryIcon name={category.icon} size={19} />
          </span>
          <div>
            <strong>{category.name}</strong>
            <p>{category.description}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
