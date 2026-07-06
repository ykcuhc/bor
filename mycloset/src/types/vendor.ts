// ─── Vendor Registration & Onboarding Types ───────────────────────────────────

export type VendorType =
  | 'individual'
  | 'registered_business'
  | 'official_brand'
  | 'authorized_distributor';

export type ApplicationStatus =
  | 'draft'
  | 'submitted'
  | 'pending_verification'
  | 'under_review'
  | 'additional_info_required'
  | 'approved'
  | 'rejected'
  | 'suspended'
  | 'closed';

export type IdentityDocType =
  | 'civil_id'
  | 'passport'
  | 'national_id'
  | 'residence_permit';

export type VerificationStatus = 'pending' | 'approved' | 'rejected';

export type PayoutMethod = 'bank_transfer' | 'knet' | 'future';

export interface ShippingMethod {
  id: string;
  name: string;
  enabled: boolean;
  estimatedDays: string;
}

export interface ShippingFees {
  standard: number;
  express: number;
  sameDay: number;
}

export interface SocialLinks {
  instagram?: string;
  twitter?: string;
  tiktok?: string;
  facebook?: string;
  snapchat?: string;
  youtube?: string;
}

// ─── Per-step data shapes ─────────────────────────────────────────────────────

export interface VendorStep1 {
  vendorType: VendorType | null;
}

export interface VendorStep2 {
  storeName: string;
  storeUsername: string;
  storeDescription: string;
  businessCategory: string;
  businessType: string;
  country: string;
  governorate: string;
  businessAddress: string;
  website: string;
  socialLinks: SocialLinks;
}

export interface VendorStep3 {
  legalName: string;
  dateOfBirth: string;
  identityDocType: IdentityDocType | null;
  identityDocPath: string;
}

export interface VendorStep4 {
  commercialRegPath: string;
  tradeLicensePath: string;
  taxRegPath: string;
  distributorCertPath: string;
}

export interface VendorStep5 {
  storeLogoPath: string;
  storeBannerPath: string;
  storeTagline: string;
  aboutStore: string;
  storeCategories: string[];
}

export interface VendorStep6 {
  payoutHolderName: string;
  payoutBankName: string;
  payoutIban: string;
  payoutAccountNumber: string;
  payoutMethod: PayoutMethod;
}

export interface VendorStep7 {
  shippingMethods: ShippingMethod[];
  processingTime: string;
  deliveryRegions: string[];
  pickupAvailable: boolean;
  shippingFees: ShippingFees;
  freeShippingThreshold: number | null;
}

export interface VendorStep8 {
  returnPolicy: string;
  refundPolicy: string;
  warrantyPolicy: string;
  cancellationPolicy: string;
  supportContact: string;
}

// ─── Complete application ─────────────────────────────────────────────────────

export interface VendorApplication
  extends VendorStep1,
    VendorStep2,
    VendorStep3,
    VendorStep4,
    VendorStep5,
    VendorStep6,
    VendorStep7,
    VendorStep8 {
  id: string | null;
  userId: string;
  status: ApplicationStatus;
  currentStep: number;
  completedSteps: number[];
  termsAccepted: boolean;
  identityVerificationStatus: VerificationStatus;
  businessVerificationStatus: VerificationStatus;
  submittedAt: string | null;
  additionalInfoRequested: string | null;
  rejectionReason: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export const DEFAULT_SHIPPING_METHODS: ShippingMethod[] = [
  { id: 'standard', name: 'Standard Delivery',  enabled: true,  estimatedDays: '2–4 days' },
  { id: 'express',  name: 'Express Delivery',   enabled: false, estimatedDays: '1–2 days' },
  { id: 'same_day', name: 'Same-Day Delivery',  enabled: false, estimatedDays: 'Same day' },
  { id: 'pickup',   name: 'In-Store Pickup',    enabled: false, estimatedDays: 'Ready in 1 hour' },
];

export function defaultApplication(userId: string): VendorApplication {
  return {
    id: null,
    userId,
    status: 'draft',
    currentStep: 1,
    completedSteps: [],
    termsAccepted: false,
    vendorType: null,
    // Step 2
    storeName: '',
    storeUsername: '',
    storeDescription: '',
    businessCategory: '',
    businessType: '',
    country: 'Kuwait',
    governorate: '',
    businessAddress: '',
    website: '',
    socialLinks: {},
    // Step 3
    legalName: '',
    dateOfBirth: '',
    identityDocType: null,
    identityDocPath: '',
    identityVerificationStatus: 'pending',
    // Step 4
    commercialRegPath: '',
    tradeLicensePath: '',
    taxRegPath: '',
    distributorCertPath: '',
    businessVerificationStatus: 'pending',
    // Step 5
    storeLogoPath: '',
    storeBannerPath: '',
    storeTagline: '',
    aboutStore: '',
    storeCategories: [],
    // Step 6
    payoutHolderName: '',
    payoutBankName: '',
    payoutIban: '',
    payoutAccountNumber: '',
    payoutMethod: 'bank_transfer',
    // Step 7
    shippingMethods: DEFAULT_SHIPPING_METHODS,
    processingTime: '1-2',
    deliveryRegions: [],
    pickupAvailable: false,
    shippingFees: { standard: 1.5, express: 3.0, sameDay: 5.0 },
    freeShippingThreshold: null,
    // Step 8
    returnPolicy: '',
    refundPolicy: '',
    warrantyPolicy: '',
    cancellationPolicy: '',
    supportContact: '',
    // Meta
    submittedAt: null,
    additionalInfoRequested: null,
    rejectionReason: null,
    createdAt: null,
    updatedAt: null,
  };
}
