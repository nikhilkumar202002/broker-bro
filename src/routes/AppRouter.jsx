import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import Login from '../features/auth/Login';
// import Home from '../pages/Home'; // Uncomment when you create your Home/Dashboard page

const router = createBrowserRouter([
  {
    // 1. When the user visits the base URL (localhost:5173/)
    path: '/',
    // 2. Automatically redirect them to the /login route
    element: <Navigate to="/login" replace />, 
  },
  {
    // 3. The Login route loads your Login component
    path: '/login',
    element: <Login />,
  },
  // {
  //   path: '/dashboard',
  //   element: <Home />,
  // }
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}