import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import Login from '../features/auth/Login';
import DashboardLayout from '../components/layout/DashboardLayout';
import Dashboard from '../pages/dashboard/Dashboard';
import PropertiesList from '../pages/properties/PropertiesList';
import World from '../pages/world/World';
import CategoryList from '../pages/categories/CategoryList';
import PropertyList from '../pages/types/PropertyList';
import Amenties from '../pages/property-settings/Amenties';
import Facilities from '../pages/property-settings/Facilities';

import Seller from '../pages/users/Sellers';
import Customer from '../pages/users/Customers';
import AdminUsers from '../pages/users/AdminUsers';


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
      {
        path: '/world',
        element: <World />,
      },
      { path: '/categories/property-type', element: <PropertyList /> },
      { path: '/categories/property-category', element: <CategoryList /> },
      { path: '/property-setting/amenities', element: <Amenties /> },
      { path: '/property-setting/facilities', element: <Facilities /> },
      { path: '/users/admin', element: <AdminUsers /> },
      { path: '/users/sellers', element: <Seller /> },
      { path: '/users/customers', element: <Customer /> },
    ]
  }
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
