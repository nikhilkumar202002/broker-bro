import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import Login from '../features/auth/Login';
import DashboardLayout from '../components/layout/DashboardLayout';
import Dashboard from '../pages/dashboard/Dashboard';
import PropertiesList from '../pages/properties/PropertiesList';

// Temporary dummy component to test the layout
const DashboardHome = () => <Dashboard />;

const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/login" replace />, 
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    // Every route inside this block will have the Sidebar and Header!
    element: <DashboardLayout />,
    children: [
      {
        path: '/dashboard',
        element: <DashboardHome />,
      },
      {
        path: '/properties',
        element: <PropertiesList />,
      },
      // You can add /properties/create and /properties/:id here later
    ]
  }
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}