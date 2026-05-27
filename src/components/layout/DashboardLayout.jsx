import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function DashboardLayout() {
  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* Static Sidebar */}
      <Sidebar />

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-white p-6">
          <div className="w-full mx-auto">
            {/* The current route's component will render here */}
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
