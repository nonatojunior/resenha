export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'yellow';
export type ButtonSize = 'md' | 'lg' | 'sm';

export function buttonClass(
  variant: ButtonVariant = 'primary',
  options: { size?: ButtonSize; full?: boolean; iconOnly?: boolean } = {},
): string {
  return [
    'btn',
    `btn--${variant}`,
    `btn--${options.size ?? 'md'}`,
    options.full ? 'btn--full' : '',
    options.iconOnly ? 'btn--icon' : '',
  ]
    .filter(Boolean)
    .join(' ');
}
