import { PriceRange, SortOption } from './shop.model';

export const SORT_OPTIONS: readonly SortOption[] = [
  { id: 'featured', label: 'En vedette' },
  { id: 'bestSelling', label: 'Meilleures ventes' },
  { id: 'alphabeticalAsc', label: 'Alphabétique, A-Z' },
  { id: 'alphabeticalDesc', label: 'Alphabétique, Z-A' },
  { id: 'priceLowHigh', label: 'Prix, croissant' },
  { id: 'priceHighLow', label: 'Prix, décroissant' },
  { id: 'dateOldNew', label: 'Date, ancien au récent' },
  { id: 'dateNewOld', label: 'Date, récent à l\'ancien' }
];

export const PRICE_RANGES: readonly PriceRange[] = [
  { id: 'under50000', label: 'Moins de 50,000 FCFA', max: 50000 },
  { id: '50000-100000', label: '50,000 - 100,000 FCFA', min: 50000, max: 100000 },
  { id: '100000-150000', label: '100,000 - 150,000 FCFA', min: 100000, max: 150000 },
  { id: '150000-200000', label: '150,000 - 200,000 FCFA', min: 150000, max: 200000 },
  { id: 'above200000', label: 'Plus de 200,000 FCFA', min: 200000 }
];

