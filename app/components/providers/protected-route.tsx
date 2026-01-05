import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/components/providers/auth-provider";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, authToken } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authToken) {
      navigate("/login", { replace: true });
    }
  }, [authToken, navigate]);

  // Show loading spinner while checking auth
  //if (isLoading) {
  //return (
  //<div className="flex min-h-svh items-center justify-center">
  //<div className="text-center">
  //<div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
  // <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
  //       </div>
  //     </div>
  //   );
  // }

  // Don't render children if not authenticated
  if (!authToken) {
    return null;
  }

  return <>{children}</>;
}
