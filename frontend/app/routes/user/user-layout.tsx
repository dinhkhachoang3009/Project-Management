import { Navigate, Outlet } from "react-router";
import { Loader } from "@/components/loader";
import { useAuth } from "@/provider/auth-context";

const UserLayout = () => {
  const { isAuthenticated, isLoading } = useAuth();

  // E6: /user/* was protected only transitively — guard it directly with
  // dashboard-layout's exact pattern: Loader while auth restores, then
  // redirect when unauthenticated (no mid-load bounce, no content flash).
  if (isLoading) {
    return <Loader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/sign-in" />;
  }

  return (
    <div className="container max-w-3xl mx-auto py-8 md:py-16">
      <Outlet />
    </div>
  );
};

export default UserLayout;
