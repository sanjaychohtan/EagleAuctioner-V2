export enum MODULE_NAME {
  AUTH = "AUTH",
  USER_MANAGEMENT = "USER_MANAGEMENT",
  ROLE_MANAGEMENT = "ROLE_MANAGEMENT",
  AUCTION = "AUCTION",
  BIDDING = "BIDDING",
  BILLING = "BILLING",
  FINANCE = "FINANCE",
  KYC = "KYC",
  MARKETING = "MARKETING",
  SUPPORT = "SUPPORT",
  REPORTING = "REPORTING",
  COMPLIANCE = "COMPLIANCE",
  LEGAL = "LEGAL",
  IT = "IT",
}

export enum DATA_SCOPE_TYPE {
  COMPANY = "COMPANY",
  REGION = "REGION",
  STATE = "STATE",
  DISTRICT = "DISTRICT",
  CITY = "CITY",
  BRANCH = "BRANCH",
  WAREHOUSE = "WAREHOUSE",
  SELLER = "SELLER",
  BUYER = "BUYER",
  AUCTION = "AUCTION",
}

export interface PermissionDTO {
  id: string;
  name: string;
  actionKey: string;
  module: MODULE_NAME;
  description: string;
}

export interface RoleDTO {
  id: string;
  name: string;
  description: string;
  systemRole: boolean;
  permissions: PermissionDTO[];
}

export interface RoleCreateRequestDTO {
  name: string;
  description?: string;
  permissionIds: string[];
}

export interface DepartmentDTO {
  id: string;
  code: string;
  name: string;
  description?: string;
  parentId?: string;
  subDepartments?: DepartmentDTO[];
}

export interface DataScopeDTO {
  id: string;
  scopeType: DATA_SCOPE_TYPE;
  scopeValueId?: string;
  name: string;
  userId?: string;
  roleId?: string;
}
