export interface CartItem {
  readonly productId: number;
  readonly name: string;
  readonly brand: string;
  readonly price: number;
  readonly image: string;
  readonly width?: number;
  readonly profile?: number;
  readonly diameter?: number;
  readonly quantity: number;
}

export type CartItemPayload = Omit<CartItem, 'quantity'>;

