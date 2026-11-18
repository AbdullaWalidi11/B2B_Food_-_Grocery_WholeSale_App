export type UserRole =
  | "PLATFORM_ADMIN"
  | "VENDOR_ADMIN"
  | "VENDOR_STAFF"
  | "BUYER_ADMIN"
  | "BUYER_STAFF";

export type UnitOfMeasure = "SACK" | "CASE" | "KILOGRAM" | "PIECE" | "BOX";

export type OrderStatus =
  | "PENDING_APPROVAL"
  | "SUBMITTED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  vendorId?: string | null;
  companyId?: string | null;
  vendorName?: string;
  companyName?: string;
}

export interface Product {
  id: string;
  vendorId: string;
  sku: string;
  name: string;
  category: string;
  uom: UnitOfMeasure;
  moq: number;
  basePrice: number;
  contractedPrice?: number | null;
  effectivePrice?: number;
  stockQuantity: number;
  hasDiscount?: boolean;
  discountPercentage?: number;
}

export interface CustomerRelationship {
  id: string;
  company: {
    id: string;
    name: string;
    taxNumber: string;
    taxOffice: string;
    shippingAddress: string;
  };
  priceSheet: {
    id: string;
    name: string;
  };
  creditLimit: number;
  currentBalance: number;
  availableCredit: number;
  netTermsDays: number;
  updatedAt: string;
}

export interface BuyerVendorAccount {
  relationshipId: string;
  vendor: {
    id: string;
    name: string;
    taxNumber: string;
  };
  priceSheetName: string;
  creditLimit: number;
  currentBalance: number;
  availableCredit: number;
  netTermsDays: number;
}


export interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  priceAtPurchase: number;
  product: {
    id: string;
    name: string;
    sku: string;
    uom: UnitOfMeasure;
  };
}
export interface Order {
  id: string;
  status: OrderStatus;
  totalAmount: number;
  shippingAddress: 'SHIPPING' | 'BILLING';
  createdAt: string;
  company?: {
    id: string;
    name: string;
    shippingAddress: string;
  };
  vendor?: {
    id: string;
    name: string;
  };
  items: OrderItem[];
}