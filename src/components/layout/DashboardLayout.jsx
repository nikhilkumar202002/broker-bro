import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

export default function DashboardLayout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        isMobileOpen={isMobileSidebarOpen}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      <div className="min-w-0 flex-1 flex flex-col overflow-hidden">
        <Header
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onToggleSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
        />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-white p-6">
          <div className="w-full mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
