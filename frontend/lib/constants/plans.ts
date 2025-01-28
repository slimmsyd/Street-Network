export type PlanType = 'NONE' | 'STANDARD' | 'PRO';

export const PLANS: Record<PlanType, { name: string; features: string[] }> = {
  NONE: {
    name: 'Free Plan',
    features: ['Basic features']
  },
  STANDARD: {
    name: 'Standard Plan',
    features: [
      'Up to 50 invoices per month',
      'Basic proposal creation',
      'Email support'
    ]
  },
  PRO: {
    name: 'Pro Plan',
    features: [
      'Unlimited invoices',
      'Advanced proposal creation',
      'Priority support',
      'Custom branding'
    ]
  }
};

export type PlanFeature = typeof PLANS[PlanType]['features'][number]; 