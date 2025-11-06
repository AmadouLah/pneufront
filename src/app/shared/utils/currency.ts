const defaultFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'XOF',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
});

export function formatCurrency(value: number): string {
  return defaultFormatter.format(value);
}

