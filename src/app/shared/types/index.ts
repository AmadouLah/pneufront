// Types pour l'application BiblioTech

// Énumération pour les rôles d'utilisateur
export enum CommissionStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
}

export enum DeliveryStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  DELIVERED = 'DELIVERED',
  CANCELED = 'CANCELED',
}

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELED = 'CANCELED',
}

export enum PaymentMethod {
  ORANGE_MONEY = 'ORANGE_MONEY',
  MALITEL_MONEY = 'MALITEL_MONEY',
  MOOV_MONEY = 'MOOV_MONEY',
  BANK_CARD = 'BANK_CARD',
  PAYPAL = 'PAYPAL',
  CASH_ON_DELIVERY = 'CASH_ON_DELIVERY',
}

export const PaymentMethodDisplay: Record<PaymentMethod, string> = {
  [PaymentMethod.ORANGE_MONEY]: 'Orange Money',
  [PaymentMethod.MALITEL_MONEY]: 'Malitel Money',
  [PaymentMethod.MOOV_MONEY]: 'Moov Money',
  [PaymentMethod.BANK_CARD]: 'Carte bancaire',
  [PaymentMethod.PAYPAL]: 'PayPal',
  [PaymentMethod.CASH_ON_DELIVERY]: 'Paiement à la livraison',
} as const;

export const isMobileMoney = (m: PaymentMethod): boolean =>
  m === PaymentMethod.ORANGE_MONEY || m === PaymentMethod.MALITEL_MONEY || m === PaymentMethod.MOOV_MONEY;

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  EXPIRED = 'EXPIRED',
}

export const PaymentStatusDisplay: Record<PaymentStatus, string> = {
  [PaymentStatus.PENDING]: 'En attente',
  [PaymentStatus.PROCESSING]: 'En cours',
  [PaymentStatus.SUCCESS]: 'Succès',
  [PaymentStatus.FAILED]: 'Échec',
  [PaymentStatus.REFUNDED]: 'Remboursé',
  [PaymentStatus.EXPIRED]: 'Expiré',
} as const;

export const isPaymentCompleted = (s: PaymentStatus): boolean =>
  s === PaymentStatus.SUCCESS || s === PaymentStatus.FAILED || s === PaymentStatus.REFUNDED;

export enum PromotionType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
  BUY_ONE_GET_ONE = 'BUY_ONE_GET_ONE',
  INFLUENCER_CODE = 'INFLUENCER_CODE',
}

export const PromotionTypeDisplay: Record<PromotionType, string> = {
  [PromotionType.PERCENTAGE]: 'Pourcentage',
  [PromotionType.FIXED_AMOUNT]: 'Montant fixe',
  [PromotionType.BUY_ONE_GET_ONE]: 'Achetez 1, obtenez 1',
  [PromotionType.INFLUENCER_CODE]: 'Code influenceur',
} as const;

export enum Role {
  ADMIN = 'ADMIN',
  CLIENT = 'CLIENT',
  INFLUENCEUR = 'INFLUENCEUR',
}

export const RoleDisplay: Record<Role, string> = {
  [Role.ADMIN]: 'Administrateur',
  [Role.CLIENT]: 'Client',
  [Role.INFLUENCEUR]: 'Influenceur',
} as const;

export const hasAdminPrivileges = (r: Role): boolean => r === Role.ADMIN;

export enum TireSeason {
  ETE = 'ETE',
  HIVER = 'HIVER',
  QUATRE_SAISONS = 'QUATRE_SAISONS',
  TOUT_TERRAIN = 'TOUT_TERRAIN',
}

export const TireSeasonDisplay: Record<TireSeason, string> = {
  [TireSeason.ETE]: 'Été',
  [TireSeason.HIVER]: 'Hiver',
  [TireSeason.QUATRE_SAISONS]: '4 saisons',
  [TireSeason.TOUT_TERRAIN]: 'Tout-terrain',
} as const;

export enum VehicleType {
  CITADINE = 'CITADINE',
  BERLINE = 'BERLINE',
  SUV = 'SUV',
  PICKUP = 'PICKUP',
  CAMION = 'CAMION',
  MOTO = 'MOTO',
}

export const VehicleTypeDisplay: Record<VehicleType, string> = {
  [VehicleType.CITADINE]: 'Citadine',
  [VehicleType.BERLINE]: 'Berline',
  [VehicleType.SUV]: 'SUV/4x4',
  [VehicleType.PICKUP]: 'Pick-up',
  [VehicleType.CAMION]: 'Camion',
  [VehicleType.MOTO]: 'Moto',
} as const;

export enum Country {
  MALI = 'MALI',
  MOROCCO = 'MOROCCO',
  BURKINA_FASO = 'BURKINA_FASO',
  SENEGAL = 'SENEGAL',
  IVORY_COAST = 'IVORY_COAST',
}

export type CountryMeta = Readonly<{ displayName: string; countryCode: string; phonePrefix: string }>;

export const Countries: Readonly<Record<Country, CountryMeta>> = {
  [Country.MALI]: { displayName: 'Mali', countryCode: 'ML', phonePrefix: '+223' },
  [Country.MOROCCO]: { displayName: 'Maroc', countryCode: 'MA', phonePrefix: '+212' },
  [Country.BURKINA_FASO]: { displayName: 'Burkina Faso', countryCode: 'BF', phonePrefix: '+226' },
  [Country.SENEGAL]: { displayName: 'Sénégal', countryCode: 'SN', phonePrefix: '+221' },
  [Country.IVORY_COAST]: { displayName: "Côte d'Ivoire", countryCode: 'CI', phonePrefix: '+225' },
} as const;