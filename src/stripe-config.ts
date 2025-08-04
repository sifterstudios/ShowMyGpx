export const STRIPE_PRODUCTS = [
  {
    id: 'prod_ShKvkdB4N1q8e9',
    priceId: 'price_1RlwG2Gr53Qq4ZwgB5GU8Hsm',
    name: 'Starter Pack',
    credits: 500,
    price: 999, // $9.99 in cents
    description: 'Perfect for 2-3 race routes',
    examples: [
      '10km marathon route (50m intervals) = ~200 credits',
      '5km race route (25m intervals) = ~200 credits',
      'Multiple training route previews'
    ],
    popular: false,
    mode: 'payment' as const
  },
  {
    id: 'prod_ShKw2bzPK3aAyC',
    priceId: 'price_1RlwGaGr53Qq4ZwgB4wgpT1h',
    name: 'Race Pack',
    credits: 1200,
    price: 1999, // $19.99 in cents
    description: 'Ideal for marathon preparation',
    examples: [
      'Full marathon (42km, 50m intervals) = ~840 credits',
      'Multiple training routes for race prep',
      '5-6 typical race routes'
    ],
    popular: true,
    mode: 'payment' as const
  },
  {
    id: 'prod_ShKxNo16gtFQm6',
    priceId: 'price_1RlwHHGr53Qq4ZwgDStiuLIj',
    name: 'Training Pack',
    credits: 2800,
    price: 3999, // $39.99 in cents
    description: 'For serious athletes and coaches',
    examples: [
      'Ultra marathon (100km, 100m intervals) = ~1,000 credits',
      'Full season of race reconnaissance',
      '12-15 typical race routes'
    ],
    popular: false,
    mode: 'payment' as const
  },
  {
    id: 'prod_ShKx6Yy09nj1FK',
    priceId: 'price_1RlwHiGr53Qq4ZwgbsQPSf2s',
    name: 'Pro Pack',
    credits: 6500,
    price: 7999, // $79.99 in cents
    description: 'Maximum value for professionals',
    examples: [
      'Multiple ultra marathons',
      'Team/coaching route analysis',
      '30+ race routes'
    ],
    popular: false,
    mode: 'payment' as const
  }
];

export function formatPrice(priceInCents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(priceInCents / 100);
}

export function calculateCreditsNeeded(distanceKm: number, intervalMeters: number): number {
  return Math.ceil((distanceKm * 1000) / intervalMeters);
}

export function getProductByPriceId(priceId: string) {
  return STRIPE_PRODUCTS.find(product => product.priceId === priceId);
}