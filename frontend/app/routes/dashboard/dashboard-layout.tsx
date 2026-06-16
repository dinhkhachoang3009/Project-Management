import { useAuth } from '@/provider/auth-context';
import React from 'react'


const DashboardLayout = () => {
  const { user, logout } = useAuth();
  return (
    <div>
      <p>Welcome, {user?.name}!</p>
      <button onClick={logout}>Logout</button>
    </div>
  )
}

export default DashboardLayout;