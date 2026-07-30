/**
 * Centralized Payment Constants
 */

export const PAYMENT_METHODS = {
  TUNAI: 'Tunai',
  BCA_TRANSFER: 'BCA Transfer',
  QRIS: 'QRIS',
} as const;

export const PAYMENT_METHOD_OPTIONS = [
  PAYMENT_METHODS.TUNAI,
  PAYMENT_METHODS.BCA_TRANSFER,
  PAYMENT_METHODS.QRIS,
] as const;

export type PaymentMethod = typeof PAYMENT_METHODS[keyof typeof PAYMENT_METHODS];
