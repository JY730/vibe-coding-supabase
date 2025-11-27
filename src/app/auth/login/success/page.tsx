import { Suspense } from "react";
import LoginSuccessComponent from "@/components/auth/login/success";

export default function LoginSuccessPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">로딩 중...</div>}>
      <LoginSuccessComponent />
    </Suspense>
  );
}
