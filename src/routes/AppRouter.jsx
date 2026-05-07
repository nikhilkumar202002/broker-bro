import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import Login from '../features/auth/Login';
import DashboardLayout from '../components/layout/DashboardLayout';
import Dashboard from '../pages/dashboard/Dashboard';
import PropertiesList from '../pages/properties/PropertiesList';
import CategoryList from '../pages/categories/CategoryList';
import PropertyList from '../pages/types/PropertyList';


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
      { path: '/categories/property-type', element: <PropertyList /> },
      { path: '/categories/property-category', element: <CategoryList /> },
    ]
  }
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}