export interface UserDetails {
  exists: boolean;
  user: {
    id: string;
    email: string;
    name?: string;
    plan?: string;
    subscriptionStatus?: string;
    subscriptionEndDate?: string;
    stripeKey?: string;
    invoicesSent?: number;
  };
} 