// Utility types and functions for BlueSite

export type Feature = {
  icon: React.ReactNode;
  title: string;
  desc: string;
};

export type PricingPlan = {
  name: string;
  price: string;
  features: string[];
  highlight: boolean;
};
