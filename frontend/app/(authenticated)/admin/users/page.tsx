// ============================================================
// User Management Route - /admin/users (Admin only)
// Middleware enforces admin role for /admin/* routes.
// ============================================================

import { UserManagementPage } from "@/components/pages/user-management-page"

export default function AdminUsersRoute() {
  return <UserManagementPage />
}
