// ============================================================
// Login Route - /login
// Public route. Middleware handles redirect if already logged in.
// ============================================================

import { LoginPage } from "@/components/login-page"

export default function LoginRoute() {
  return <LoginPage />
}
