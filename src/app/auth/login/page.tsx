"use client";

import LoginComponent from "@/components/auth/login";
import { useGoogleLogin } from "@/components/auth/login/hooks/index.login.google.hook";

export default function LoginPage() {
  const { handleGoogleLogin } = useGoogleLogin();

  return <LoginComponent handleGoogleLogin={handleGoogleLogin} />;
}
