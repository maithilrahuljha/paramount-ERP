/**
 * PMN ERP Platform - Permission Service
 * 
 * Role-Based Access Control (RBAC) implementation with support for:
 * - Hierarchical permissions
 * - Wildcard matching
 * - Resource-level access control
 * - Permission inheritance
 * - Dynamic permission checks
 */

import { getConfig } from '../config/config-loader';
import type { User, Role, Permission, PermissionAction } from '../types';

interface PermissionCheck {
  module: string;
  resource: string;
  action: PermissionAction;
  resourceId?: string;
}

interface RoleDefinition {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isSystem: boolean;
}

class PermissionService {
  private static instance: PermissionService;
  private permissionCache: Map<string, Set<string>> = new Map();

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): PermissionService {
    if (!PermissionService.instance) {
      PermissionService.instance = new PermissionService();
    }
    return PermissionService.instance;
  }

  /**
   * Check if user has permission
   * @param user - User to check
   * @param permission - Permission string (e.g., "crm:leads:read")
   * @returns boolean
   */
  hasPermission(user: User | null, permission: string): boolean {
    if (!user) return false;

    // Get all user permissions (from roles + direct)
    const userPermissions = this.getUserPermissions(user);

    // Check for exact match or wildcard
    return this.matchPermission(userPermissions, permission);
  }

  /**
   * Check if user has any of the specified permissions
   */
  hasAnyPermission(user: User | null, permissions: string[]): boolean {
    if (!user) return false;
    return permissions.some((p) => this.hasPermission(user, p));
  }

  /**
   * Check if user has all specified permissions
   */
  hasAllPermissions(user: User | null, permissions: string[]): boolean {
    if (!user) return false;
    return permissions.every((p) => this.hasPermission(user, p));
  }

  /**
   * Check permission with detailed context
   */
  checkPermission(user: User | null, check: PermissionCheck): boolean {
    if (!user) return false;

    const permission = `${check.module}:${check.resource}:${check.action}`;
    
    // Check for resource-specific permission first
    if (check.resourceId) {
      const resourcePermission = `${permission}:${check.resourceId}`;
      if (this.hasPermission(user, resourcePermission)) {
        return true;
      }
    }

    // Check for general permission
    return this.hasPermission(user, permission);
  }

  /**
   * Get all permissions for a user (including role-based)
   */
  getUserPermissions(user: User): Set<string> {
    const cacheKey = `${user.id}:${user.roles.join(',')}`;
    
    if (this.permissionCache.has(cacheKey)) {
      return this.permissionCache.get(cacheKey)!;
    }

    const permissions = new Set<string>();

    // Add direct permissions
    for (const permission of user.permissions) {
      permissions.add(permission);
    }

    // Add role-based permissions
    for (const roleId of user.roles) {
      const rolePermissions = this.getRolePermissions(roleId);
      for (const permission of rolePermissions) {
        permissions.add(permission);
      }
    }

    this.permissionCache.set(cacheKey, permissions);
    return permissions;
  }

  /**
   * Get permissions for a role
   */
  getRolePermissions(roleId: string): string[] {
    const rolesConfig = getConfig<{ roles: RoleDefinition[] }>('system.roles');
    const role = rolesConfig?.roles.find((r: RoleDefinition) => r.id === roleId);
    return role?.permissions ?? [];
  }

  /**
   * Get all roles
   */
  getAllRoles(): Role[] {
    const rolesConfig = getConfig<{ roles: RoleDefinition[] }>('system.roles');
    return (rolesConfig?.roles ?? []).map((r: RoleDefinition) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      permissions: r.permissions,
      isSystem: r.isSystem,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
  }

  /**
   * Get all permissions
   */
  getAllPermissions(): Permission[] {
    const permissionsConfig = getConfig<{ permissions: Permission[] }>('system.permissions');
    return permissionsConfig?.permissions ?? [];
  }

  /**
   * Match permission against user permissions with wildcard support
   */
  private matchPermission(userPermissions: Set<string>, requiredPermission: string): boolean {
    // Direct match
    if (userPermissions.has(requiredPermission)) {
      return true;
    }

    // Check for wildcards
    for (const userPermission of userPermissions) {
      if (this.wildcardMatch(userPermission, requiredPermission)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Wildcard permission matching
   * Supports:
   * - "*" - matches everything
   * - "crm:*" - matches all CRM permissions
   * - "crm:leads:*" - matches all lead permissions
   */
  private wildcardMatch(pattern: string, target: string): boolean {
    if (pattern === '*') return true;
    
    const patternParts = pattern.split(':');
    const targetParts = target.split(':');

    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i] === '*') {
        return true;
      }
      if (patternParts[i] !== targetParts[i]) {
        return false;
      }
    }

    return patternParts.length === targetParts.length;
  }

  /**
   * Clear permission cache (call when user roles change)
   */
  clearCache(userId?: string): void {
    if (userId) {
      for (const key of this.permissionCache.keys()) {
        if (key.startsWith(`${userId}:`)) {
          this.permissionCache.delete(key);
        }
      }
    } else {
      this.permissionCache.clear();
    }
  }

  /**
   * Check if user can access a specific resource
   */
  canAccessResource(
    user: User | null,
    module: string,
    resource: string,
    action: PermissionAction,
    ownerId?: string
  ): boolean {
    if (!user) return false;

    // Check for manage permission (implies all actions)
    if (this.hasPermission(user, `${module}:${resource}:manage`)) {
      return true;
    }

    // Check for specific action permission
    if (this.hasPermission(user, `${module}:${resource}:${action}`)) {
      return true;
    }

    // Check for "own" permission
    if (ownerId && ownerId === user.id) {
      if (this.hasPermission(user, `${module}:${resource}:${action}:own`)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Filter items based on user permissions
   */
  filterAccessible<T extends { id: string; createdBy?: string }>(
    user: User,
    items: T[],
    module: string,
    resource: string,
    action: PermissionAction
  ): T[] {
    // If user has full access, return all
    if (this.hasPermission(user, `${module}:${resource}:${action}`)) {
      return items;
    }

    // If user has "own" access, filter to owned items
    if (this.hasPermission(user, `${module}:${resource}:${action}:own`)) {
      return items.filter((item) => item.createdBy === user.id);
    }

    return [];
  }
}

// Export singleton instance
export const permissionService = PermissionService.getInstance();

// Export convenience functions
export function hasPermission(user: User | null, permission: string): boolean {
  return permissionService.hasPermission(user, permission);
}

export function hasAnyPermission(user: User | null, permissions: string[]): boolean {
  return permissionService.hasAnyPermission(user, permissions);
}

export function hasAllPermissions(user: User | null, permissions: string[]): boolean {
  return permissionService.hasAllPermissions(user, permissions);
}

export function canAccessResource(
  user: User | null,
  module: string,
  resource: string,
  action: PermissionAction,
  ownerId?: string
): boolean {
  return permissionService.canAccessResource(user, module, resource, action, ownerId);
}
