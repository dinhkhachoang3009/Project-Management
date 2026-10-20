import { useAuth } from "@/provider/auth-context";
import { publicRoutes } from "@/lib";
import { Loader } from "@/components/loader";
import React from "react";
import { Navigate, Outlet, useLocation } from "react-router";

const AuthLayout = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { pathname } = useLocation();
  const isPublicRoute = publicRoutes.includes(pathname);

  // Chỉ hiện loading trên private routes
  if (isLoading && !isPublicRoute) {
    return <Loader />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" />;
  }

  return <Outlet />;
};

export default AuthLayout;
