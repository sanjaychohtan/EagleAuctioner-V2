import { apiClient } from "./client";
import { API_ENDPOINTS } from "../constants";
import {
  RoleDTO,
  RoleCreateRequestDTO,
  PermissionDTO,
  DepartmentDTO,
  DataScopeDTO,
  MODULE_NAME,
} from "../types/authorization";

export const authorizationService = {
  // Roles
  getAllRoles: async (): Promise<RoleDTO[]> => {
    const response = await apiClient.get<RoleDTO[]>(API_ENDPOINTS.AUTHORIZATION.ROLES);
    return response.data;
  },

  getRoleById: async (id: string): Promise<RoleDTO> => {
    const response = await apiClient.get<RoleDTO>(API_ENDPOINTS.AUTHORIZATION.ROLE_BY_ID(id));
    return response.data;
  },

  createRole: async (payload: RoleCreateRequestDTO): Promise<RoleDTO> => {
    const response = await apiClient.post<RoleDTO>(API_ENDPOINTS.AUTHORIZATION.ROLES, payload);
    return response.data;
  },

  updateRole: async (id: string, payload: RoleCreateRequestDTO): Promise<RoleDTO> => {
    const response = await apiClient.put<RoleDTO>(API_ENDPOINTS.AUTHORIZATION.ROLE_BY_ID(id), payload);
    return response.data;
  },

  deleteRole: async (id: string): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.AUTHORIZATION.ROLE_BY_ID(id));
  },

  // Permissions
  getAllPermissions: async (): Promise<PermissionDTO[]> => {
    const response = await apiClient.get<PermissionDTO[]>(API_ENDPOINTS.AUTHORIZATION.PERMISSIONS);
    return response.data;
  },

  getPermissionsByModule: async (module: MODULE_NAME): Promise<PermissionDTO[]> => {
    const response = await apiClient.get<PermissionDTO[]>(
      API_ENDPOINTS.AUTHORIZATION.PERMISSIONS_BY_MODULE(module)
    );
    return response.data;
  },

  // Departments
  getAllDepartments: async (): Promise<DepartmentDTO[]> => {
    const response = await apiClient.get<DepartmentDTO[]>(API_ENDPOINTS.AUTHORIZATION.DEPARTMENTS);
    return response.data;
  },

  createDepartment: async (payload: Partial<DepartmentDTO>): Promise<DepartmentDTO> => {
    const response = await apiClient.post<DepartmentDTO>(API_ENDPOINTS.AUTHORIZATION.DEPARTMENTS, payload);
    return response.data;
  },

  // Scopes
  getUserDataScopes: async (userId: string): Promise<DataScopeDTO[]> => {
    const response = await apiClient.get<DataScopeDTO[]>(API_ENDPOINTS.AUTHORIZATION.USER_SCOPES(userId));
    return response.data;
  },

  assignUserDataScope: async (payload: Partial<DataScopeDTO>): Promise<DataScopeDTO> => {
    const response = await apiClient.post<DataScopeDTO>(API_ENDPOINTS.AUTHORIZATION.SCOPES, payload);
    return response.data;
  },

  removeUserDataScope: async (scopeId: string): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.AUTHORIZATION.SCOPE_BY_ID(scopeId));
  },
};
