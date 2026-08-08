import React, { useState, useEffect } from "react";
import {
  Shield,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Lock,
  Search,
  Users,
  KeyRound,
  Building2,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { authorizationService } from "../../api/authorizationService";
import { RoleDTO, PermissionDTO, MODULE_NAME, DepartmentDTO } from "../../types/authorization";

export const RoleManagementView: React.FC = () => {
  const [roles, setRoles] = useState<RoleDTO[]>([]);
  const [permissions, setPermissions] = useState<PermissionDTO[]>([]);
  const [departments, setDepartments] = useState<DepartmentDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedModule, setSelectedModule] = useState<string>("ALL");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingRole, setEditingRole] = useState<RoleDTO | null>(null);
  const [roleName, setRoleName] = useState<string>("");
  const [roleDescription, setRoleDescription] = useState<string>("");
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [rolesData, permsData, deptsData] = await Promise.all([
        authorizationService.getAllRoles().catch(() => []),
        authorizationService.getAllPermissions().catch(() => []),
        authorizationService.getAllDepartments().catch(() => []),
      ]);
      setRoles(rolesData);
      setPermissions(permsData);
      setDepartments(deptsData);
    } catch (err: any) {
      setError("Failed to load authorization data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingRole(null);
    setRoleName("");
    setRoleDescription("");
    setSelectedPermissionIds([]);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (role: RoleDTO) => {
    if (role.systemRole) return;
    setEditingRole(role);
    setRoleName(role.name.replace(/^ROLE_/, ""));
    setRoleDescription(role.description || "");
    setSelectedPermissionIds(role.permissions.map((p) => p.id));
    setIsModalOpen(true);
  };

  const handleTogglePermission = (permId: string) => {
    setSelectedPermissionIds((prev) =>
      prev.includes(permId) ? prev.filter((id) => id !== permId) : [...prev, permId]
    );
  };

  const handleSubmitRole = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanSuffix = roleName.trim().toUpperCase().replace(/^ROLE_/, "").replace(/[^A-Z0-9_]/g, "");
    if (!cleanSuffix) {
      alert("Please enter a valid role name after ROLE_ (e.g. MARKETING, FINANCE_MANAGER)");
      return;
    }
    if (selectedPermissionIds.length === 0) {
      alert("Please select at least one action permission");
      return;
    }

    const fullRoleName = `ROLE_${cleanSuffix}`;

    try {
      setSubmitting(true);
      if (editingRole) {
        await authorizationService.updateRole(editingRole.id, {
          name: fullRoleName,
          description: roleDescription,
          permissionIds: selectedPermissionIds,
        });
      } else {
        await authorizationService.createRole({
          name: fullRoleName,
          description: roleDescription,
          permissionIds: selectedPermissionIds,
        });
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to save role");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRole = async (role: RoleDTO) => {
    if (role.systemRole) {
      alert("System roles cannot be deleted.");
      return;
    }
    if (!window.confirm(`Are you sure you want to delete custom role '${role.name}'?`)) {
      return;
    }

    try {
      await authorizationService.deleteRole(role.id);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete role");
    }
  };

  const filteredRoles = roles.filter(
    (role) =>
      role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (role.description && role.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const groupedPermissions = permissions.reduce((acc, perm) => {
    const mod = perm.module || "GENERAL";
    if (!acc[mod]) acc[mod] = [];
    acc[mod].push(perm);
    return acc;
  }, {} as Record<string, PermissionDTO[]>);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 text-white p-6 rounded-2xl shadow-xl border border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-indigo-400" />
            <h1 className="text-2xl font-bold tracking-tight">Enterprise Role & Access Studio</h1>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Manage system roles, custom action permissions, departments, and dynamic access policies.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg border border-slate-700 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg shadow-lg shadow-indigo-500/20 transition"
          >
            <Plus className="w-4 h-4" />
            Create Custom Role
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-800/50 border border-slate-700/60 p-5 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-lg">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-100">{roles.length}</div>
            <div className="text-xs text-slate-400 font-medium">Configured System & Custom Roles</div>
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/60 p-5 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-100">{permissions.length}</div>
            <div className="text-xs text-slate-400 font-medium">Action-Based Permissions</div>
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/60 p-5 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-lg">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-100">{departments.length}</div>
            <div className="text-xs text-slate-400 font-medium">Active Enterprise Departments</div>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-800/30 p-4 rounded-xl border border-slate-700/50">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search roles or permissions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Roles Grid */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading roles and permissions...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRoles.map((role) => (
            <div
              key={role.id}
              className="bg-slate-800/80 border border-slate-700 rounded-xl p-5 hover:border-slate-600 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-mono text-sm font-semibold text-slate-100 bg-slate-900 px-3 py-1 rounded-md border border-slate-700">
                    {role.name}
                  </span>
                  {role.systemRole ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <Lock className="w-3 h-3" /> System
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Custom
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mb-4 line-clamp-2">
                  {role.description || "No description provided."}
                </p>

                <div className="space-y-2 mb-4">
                  <div className="text-xs font-medium text-slate-400 flex items-center justify-between">
                    <span>Permissions</span>
                    <span className="text-indigo-400">{role.permissions?.length || 0} assigned</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                    {role.permissions?.map((p) => (
                      <span
                        key={p.id}
                        className="text-[11px] font-mono bg-slate-900/80 text-slate-300 px-2 py-0.5 rounded border border-slate-700"
                        title={p.description || p.name}
                      >
                        {p.actionKey || p.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {!role.systemRole && (
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-700/60 mt-2">
                  <button
                    onClick={() => handleOpenEditModal(role)}
                    className="p-1.5 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition"
                    title="Edit Role"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteRole(role)}
                    className="p-1.5 hover:bg-rose-500/10 text-rose-400 rounded-lg transition"
                    title="Delete Role"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Role Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-100">
                {editingRole ? `Edit Role: ${editingRole.name}` : "Create Custom Role"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitRole} className="p-6 space-y-5 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Role Name (Key)
                </label>
                <div className="flex items-center">
                  <span className="bg-slate-800 border border-r-0 border-slate-700 text-slate-400 text-sm px-3 py-2 rounded-l-lg font-mono">
                    ROLE_
                  </span>
                  <input
                    type="text"
                    required
                    disabled={!!editingRole?.systemRole}
                    value={roleName}
                    onChange={(e) => setRoleName(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ""))}
                    placeholder="e.g. MARKETING_LEAD"
                    maxLength={50}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-r-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={roleDescription}
                  onChange={(e) => setRoleDescription(e.target.value)}
                  placeholder="Describe the responsibilities and scope of this role..."
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
                  Assign Action Permissions
                </label>

                <div className="space-y-4 max-h-60 overflow-y-auto pr-2 border border-slate-800 p-4 rounded-xl bg-slate-950/40">
                  {Object.entries(groupedPermissions).map(([moduleName, perms]) => (
                    <div key={moduleName} className="space-y-2">
                      <div className="text-xs font-bold text-indigo-400 tracking-wide border-b border-slate-800 pb-1">
                        {moduleName} MODULE
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {perms.map((perm) => {
                          const isChecked = selectedPermissionIds.includes(perm.id);
                          return (
                            <label
                              key={perm.id}
                              className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition ${
                                isChecked
                                  ? "bg-indigo-500/10 border-indigo-500/40 text-slate-100"
                                  : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleTogglePermission(perm.id)}
                                className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-800 border-slate-700"
                              />
                              <div>
                                <div className="text-xs font-mono font-medium text-slate-200">
                                  {perm.actionKey || perm.name}
                                </div>
                                <div className="text-[11px] text-slate-500 leading-tight">
                                  {perm.description || perm.name}
                                </div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg shadow-lg shadow-indigo-500/20 transition disabled:opacity-50"
                >
                  {submitting ? "Saving..." : editingRole ? "Update Role" : "Create Role"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
