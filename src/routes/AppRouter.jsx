import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import Login from '../features/auth/Login';
import DashboardLayout from '../components/layout/DashboardLayout';
import Dashboard from '../pages/dashboard/Dashboard';

// Temporary dummy component to test the layout
const DashboardHome = () => <Dashboard />;
const PropertiesList = () => <h2 className="text-2xl font-semibold text-gray-800">Properties CRUD Area</h2>;

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
        element: <PropertiesList />, // We will build the actual CRUD table here next
      },
      // You can add /properties/create and /properties/:id here later
    ]
  }
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}