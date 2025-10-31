export type SortOptionId =
  | 'featured'
  | 'bestSelling'
  | 'alphabeticalAsc'
  | 'alphabeticalDesc'
  | 'priceLowHigh'
  | 'priceHighLow'
  | 'dateOldNew'
  | 'dateNewOld';

export interface SortOption {
  readonly id: SortOptionId;
  readonly label: string;
}

export interface PriceRange {
  readonly id: string;
  readonly label: string;
  readonly min?: number;
  readonly max?: number;
}

export interface Product {
  readonly id: number;
  readonly name: string;
  readonly brand: string;
  readonly price: number;
  readonly fromPrice?: boolean;
  readonly width: number;
  readonly profile: number;
  readonly diameter: number;
  readonly image: string;
  readonly launchedAt: string;
  readonly salesRank: number;
}

