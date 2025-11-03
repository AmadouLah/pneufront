import { PriceRange, Product, SortOption } from './shop.model';

export const SORT_OPTIONS: readonly SortOption[] = [
  { id: 'featured', label: 'Featured' },
  { id: 'bestSelling', label: 'Best selling' },
  { id: 'alphabeticalAsc', label: 'Alphabetically, A-Z' },
  { id: 'alphabeticalDesc', label: 'Alphabetically, Z-A' },
  { id: 'priceLowHigh', label: 'Price, low to high' },
  { id: 'priceHighLow', label: 'Price, high to low' },
  { id: 'dateOldNew', label: 'Date, old to new' },
  { id: 'dateNewOld', label: 'Date, new to old' }
];

export const PRICE_RANGES: readonly PriceRange[] = [
  { id: 'under50000', label: 'Moins de 50,000 FCFA', max: 50000 },
  { id: '50000-100000', label: '50,000 - 100,000 FCFA', min: 50000, max: 100000 },
  { id: '100000-150000', label: '100,000 - 150,000 FCFA', min: 100000, max: 150000 },
  { id: '150000-200000', label: '150,000 - 200,000 FCFA', min: 150000, max: 200000 },
  { id: 'above200000', label: 'Plus de 200,000 FCFA', min: 200000 }
];

const continentalProducts: readonly Product[] = [
  {
    id: 1,
    name: '4x4 Contact',
    brand: 'Continental',
    price: 2399,
    fromPrice: true,
    width: 235,
    profile: 65,
    diameter: 17,
    image: '/assets/img/products/continental-4x4-contact.png',
    launchedAt: '2021-02-15',
    salesRank: 1
  },
  {
    id: 2,
    name: '4x4 SportContact',
    brand: 'Continental',
    price: 5899,
    width: 255,
    profile: 55,
    diameter: 19,
    image: '/assets/img/products/continental-4x4-sportcontact.png',
    launchedAt: '2021-08-12',
    salesRank: 6
  },
  {
    id: 3,
    name: 'ContiCrossContact AT',
    brand: 'Continental',
    price: 3899,
    fromPrice: true,
    width: 265,
    profile: 75,
    diameter: 16,
    image: '/assets/img/products/continental-crosscontact-at.png',
    launchedAt: '2020-05-03',
    salesRank: 8
  },
  {
    id: 4,
    name: 'ContiCrossContact LX',
    brand: 'Continental',
    price: 5699,
    fromPrice: true,
    width: 255,
    profile: 60,
    diameter: 18,
    image: '/assets/img/products/continental-crosscontact-lx.png',
    launchedAt: '2019-11-20',
    salesRank: 11
  },
  {
    id: 5,
    name: 'ContiCrossContact LX 2',
    brand: 'Continental',
    price: 3799,
    fromPrice: true,
    width: 255,
    profile: 65,
    diameter: 17,
    image: '/assets/img/products/continental-crosscontact-lx2.png',
    launchedAt: '2020-09-08',
    salesRank: 5
  },
  {
    id: 6,
    name: 'ContiEcoContact 5',
    brand: 'Continental',
    price: 2399,
    fromPrice: true,
    width: 205,
    profile: 55,
    diameter: 16,
    image: '/assets/img/products/continental-ecocontact-5.png',
    launchedAt: '2022-01-14',
    salesRank: 9
  },
  {
    id: 7,
    name: 'ContiPremiumContact 5',
    brand: 'Continental',
    price: 2599,
    fromPrice: true,
    width: 215,
    profile: 55,
    diameter: 17,
    image: '/assets/img/products/continental-premiumcontact-5.png',
    launchedAt: '2022-06-02',
    salesRank: 4
  },
  {
    id: 8,
    name: 'ContiSportContact 5',
    brand: 'Continental',
    price: 3199,
    fromPrice: true,
    width: 235,
    profile: 40,
    diameter: 18,
    image: '/assets/img/products/continental-sportcontact-5.png',
    launchedAt: '2021-04-23',
    salesRank: 10
  },
  {
    id: 9,
    name: 'ContiSportContact 5P',
    brand: 'Continental',
    price: 5099,
    fromPrice: true,
    width: 265,
    profile: 35,
    diameter: 20,
    image: '/assets/img/products/continental-sportcontact-5p.png',
    launchedAt: '2023-02-18',
    salesRank: 13
  },
  {
    id: 10,
    name: 'ContiSportContact 3',
    brand: 'Continental',
    price: 3399,
    fromPrice: true,
    width: 245,
    profile: 45,
    diameter: 18,
    image: '/assets/img/products/continental-sportcontact-3.png',
    launchedAt: '2018-07-11',
    salesRank: 15
  },
  {
    id: 11,
    name: 'ContiPremiumContact 2',
    brand: 'Continental',
    price: 2499,
    fromPrice: true,
    width: 205,
    profile: 55,
    diameter: 16,
    image: '/assets/img/products/continental-premiumcontact-2.png',
    launchedAt: '2017-03-30',
    salesRank: 18
  }
];

const generalTireProducts: readonly Product[] = [
  {
    id: 30,
    name: 'Altimax Comfort',
    brand: 'General Tire',
    price: 1820,
    fromPrice: true,
    width: 205,
    profile: 60,
    diameter: 16,
    image: '/assets/img/products/generaltire-altimax-comfort.png',
    launchedAt: '2020-01-20',
    salesRank: 2
  },
  {
    id: 31,
    name: 'Altimax One',
    brand: 'General Tire',
    price: 2199,
    fromPrice: true,
    width: 215,
    profile: 55,
    diameter: 17,
    image: '/assets/img/products/generaltire-altimax-one.png',
    launchedAt: '2021-03-05',
    salesRank: 3
  },
  {
    id: 32,
    name: 'Altimax One S',
    brand: 'General Tire',
    price: 2099,
    fromPrice: true,
    width: 225,
    profile: 45,
    diameter: 18,
    image: '/assets/img/products/generaltire-altimax-one-s.png',
    launchedAt: '2021-11-09',
    salesRank: 7
  },
  {
    id: 33,
    name: 'Grabber AT3',
    brand: 'General Tire',
    price: 3299,
    fromPrice: true,
    width: 265,
    profile: 70,
    diameter: 17,
    image: '/assets/img/products/generaltire-grabber-at3.png',
    launchedAt: '2019-05-18',
    salesRank: 12
  },
  {
    id: 34,
    name: 'Grabber X3',
    brand: 'General Tire',
    price: 3499,
    fromPrice: true,
    width: 285,
    profile: 70,
    diameter: 17,
    image: '/assets/img/products/generaltire-grabber-x3.png',
    launchedAt: '2018-10-02',
    salesRank: 16
  }
];

const dunlopProducts: readonly Product[] = [
  {
    id: 50,
    name: 'SP Sport Maxx',
    brand: 'Dunlop',
    price: 3899,
    width: 245,
    profile: 45,
    diameter: 18,
    image: '/assets/img/products/dunlop-sp-sport-maxx.png',
    launchedAt: '2022-04-28',
    salesRank: 14
  },
  {
    id: 51,
    name: 'SP Winter Sport 3D',
    brand: 'Dunlop',
    price: 3699,
    width: 225,
    profile: 50,
    diameter: 17,
    image: '/assets/img/products/dunlop-winter-sport-3d.png',
    launchedAt: '2019-12-10',
    salesRank: 19
  },
  {
    id: 52,
    name: 'Grandtrek AT3G',
    brand: 'Dunlop',
    price: 3299,
    fromPrice: true,
    width: 265,
    profile: 65,
    diameter: 17,
    image: '/assets/img/products/dunlop-grandtrek-at3g.png',
    launchedAt: '2018-04-22',
    salesRank: 21
  },
  {
    id: 53,
    name: 'Grandtrek AT5',
    brand: 'Dunlop',
    price: 3199,
    fromPrice: true,
    width: 265,
    profile: 60,
    diameter: 18,
    image: '/assets/img/products/dunlop-grandtrek-at5.png',
    launchedAt: '2020-08-07',
    salesRank: 20
  }
];

const pirelliProducts: readonly Product[] = [
  {
    id: 70,
    name: 'Carrera XL',
    brand: 'Pirelli',
    price: 1699,
    width: 195,
    profile: 55,
    diameter: 15,
    image: '/assets/img/products/pirelli-carrera-xl.png',
    launchedAt: '2017-09-16',
    salesRank: 22
  },
  {
    id: 71,
    name: 'Scorpion Verde',
    brand: 'Pirelli',
    price: 4299,
    width: 255,
    profile: 50,
    diameter: 19,
    image: '/assets/img/products/pirelli-scorpion-verde.png',
    launchedAt: '2021-01-29',
    salesRank: 17
  },
  {
    id: 72,
    name: 'Scorpion ATR',
    brand: 'Pirelli',
    price: 3699,
    width: 265,
    profile: 70,
    diameter: 16,
    image: '/assets/img/products/pirelli-scorpion-atr.png',
    launchedAt: '2016-03-12',
    salesRank: 23
  },
  {
    id: 73,
    name: 'P Zero',
    brand: 'Pirelli',
    price: 4999,
    width: 245,
    profile: 40,
    diameter: 19,
    image: '/assets/img/products/pirelli-pzero.png',
    launchedAt: '2022-09-01',
    salesRank: 24
  },
  {
    id: 74,
    name: 'Cinturato P7',
    brand: 'Pirelli',
    price: 3999,
    width: 225,
    profile: 45,
    diameter: 17,
    image: '/assets/img/products/pirelli-cinturato-p7.png',
    launchedAt: '2020-03-27',
    salesRank: 25
  }
];

export const PRODUCTS: readonly Product[] = [
  ...continentalProducts,
  ...generalTireProducts,
  ...dunlopProducts,
  ...pirelliProducts
];

