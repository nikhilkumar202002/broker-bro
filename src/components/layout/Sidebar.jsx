import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { logout } from '../../services/api';
import { FiGlobe, FiHome, FiPackage, FiTag, FiUsers, FiChevronDown, FiLogOut, FiX, FiChevronsLeft, FiChevronsRight } from 'react-icons/fi';

export default function Sidebar({ isCollapsed, isMobileOpen, onToggleCollapse, onCloseMobile }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedMenus, setExpandedMenus] = useState({});
  const isCompact = isCollapsed && !isMobileOpen;

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: FiHome },
    { name: 'Properties', path: '/properties', icon: FiPackage },
    {
      name: 'Property Setting',
      icon: FiPackage,
      submenu: [
        { name: 'Amenities', path: '/property-setting/amenities' },
        { name: 'Facilities', path: '/property-setting/facilities' }
      ]
    },
    { 
      name: 'Categories', 
      icon: FiTag,
      submenu: [
        { name: 'Property Type', path: '/categories/property-type' },
        { name: 'Property Category', path: '/categories/property-category' }
      ]
    },
    {
      name: 'Users',
      icon: FiUsers,
      submenu: [
        { name: 'Sellers', path: '/users/sellers' },
        { name: 'Customers', path: '/users/customers' }
      ]
    },
    { name: 'World', path: '/world', icon: FiGlobe },

  ];

  // Auto-expand menu if any of its submenu items are active
  useEffect(() => {
    navItems.forEach((item) => {
      if (item.submenu) {
        const isSubitemActive = item.submenu.some(subitem => subitem.path === location.pathname);
        if (isSubitemActive && !expandedMenus[item.name]) {
          setExpandedMenus(prev => ({
            ...prev,
            [item.name]: true
          }));
        }
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // ignore - ensure navigation and local cleanup regardless
    } finally {
      onCloseMobile?.();
      navigate('/login');
    }
  };

  const toggleMenu = (menuName) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuName]: !prev[menuName]
    }));
  };

  const sidebarContent = (
    <>
      <div className={`h-16 flex items-center border-b border-gray-800 ${isCompact ? 'justify-center px-3' : 'justify-between px-6'}`}>
        {!isCompact && (
          <h1 className="text-xl font-bold tracking-wider text-white">Property<span className="text-blue-500">Hub</span></h1>
        )}
        <button
          type="button"
          onClick={onToggleCollapse}
          className="hidden md:inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white"
          title={isCompact ? 'Open sidebar' : 'Close sidebar'}
        >
          {isCompact ? <FiChevronsRight className="w-5 h-5" /> : <FiChevronsLeft className="w-5 h-5" />}
        </button>
        <button
          type="button"
          onClick={onCloseMobile}
          className="md:hidden h-9 w-9 items-center justify-center rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white"
          title="Close sidebar"
        >
          <FiX className="w-5 h-5" />
        </button>
      </div>

      <nav className={`flex-1 py-6 space-y-2 ${isCompact ? 'px-3' : 'px-4'}`}>
        {navItems.map((item) => (
          <div key={item.name}>
            {item.submenu ? (
              <>
                <button
                  onClick={() => toggleMenu(item.name)}
                  className={`flex items-center rounded-lg transition-colors font-medium w-full ${
                    isCompact ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2.5 text-left'
                  } ${
                    expandedMenus[item.name]
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                  title={isCompact ? item.name : undefined}
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  {!isCompact && (
                    <>
                      <span className="flex-1">{item.name}</span>
                      <FiChevronDown className={`w-4 h-4 transition-transform ${expandedMenus[item.name] ? 'rotate-180' : ''}`} />
                    </>
                  )}
                </button>

                {!isCompact && expandedMenus[item.name] && (
                  <div className="ml-4 mt-2 space-y-1">
                    {item.submenu.map((subitem) => (
                      <NavLink
                        key={subitem.name}
                        to={subitem.path}
                        onClick={onCloseMobile}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm ${
                            isActive
                              ? 'bg-blue-500 text-white shadow-sm'
                              : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                          }`
                        }
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                        {subitem.name}
                      </NavLink>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <NavLink
                to={item.path}
                onClick={onCloseMobile}
                title={isCompact ? item.name : undefined}
                className={({ isActive }) =>
                  `flex items-center rounded-lg transition-colors font-medium ${
                    isCompact ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2.5'
                  } ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`
                }
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {!isCompact && item.name}
              </NavLink>
            )}
          </div>
        ))}
      </nav>

      <div className={`border-t border-gray-800 ${isCompact ? 'p-3' : 'p-4'}`}>
        <button
          onClick={handleLogout}
          className={`flex items-center w-full rounded-lg text-gray-300 hover:bg-red-500/10 hover:text-red-500 transition-colors font-medium ${
            isCompact ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2.5'
          }`}
          title={isCompact ? 'Logout' : undefined}
        >
          <FiLogOut className="w-5 h-5 shrink-0" />
          {!isCompact && 'Logout'}
        </button>
      </div>
    </>
  );

  return (
    <>
      {isMobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={onCloseMobile} />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-gray-900 text-white transition-transform duration-300 md:static md:z-auto md:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } w-64 ${isCollapsed ? 'md:w-20' : 'md:w-64'}`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
