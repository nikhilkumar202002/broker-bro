import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { logout } from '../../services/api';
import { FiGlobe, FiHome, FiPackage, FiTag, FiUsers, FiChevronDown, FiLogOut } from 'react-icons/fi';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedMenus, setExpandedMenus] = useState({});

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: FiHome },
    { name: 'Properties', path: '/properties', icon: FiPackage },
    { name: 'World', path: '/world', icon: FiGlobe },
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
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      // ignore - ensure navigation and local cleanup regardless
    } finally {
      navigate('/login');
    }
  };

  const toggleMenu = (menuName) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuName]: !prev[menuName]
    }));
  };

  return (
    <aside className="hidden md:flex flex-col w-64 bg-gray-900 min-h-screen text-white transition-all duration-300">
      <div className="h-16 flex items-center px-6 border-b border-gray-800">
        <h1 className="text-xl font-bold tracking-wider text-white">Property<span className="text-blue-500">Hub</span></h1>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => (
          <div key={item.name}>
            {item.submenu ? (
              // Menu item with submenu
              <>
                <button
                  onClick={() => toggleMenu(item.name)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors font-medium w-full text-left ${
                    expandedMenus[item.name]
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="flex-1">{item.name}</span>
                  <FiChevronDown className={`w-4 h-4 transition-transform ${expandedMenus[item.name] ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Submenu items */}
                {expandedMenus[item.name] && (
                  <div className="ml-4 mt-2 space-y-1">
                    {item.submenu.map((subitem) => (
                      <NavLink
                        key={subitem.name}
                        to={subitem.path}
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
              // Regular menu item without submenu
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors font-medium ${
                    isActive 
                      ? 'bg-blue-600 text-white shadow-sm' 
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </NavLink>
            )}
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-gray-300 hover:bg-red-500/10 hover:text-red-500 transition-colors font-medium">
          <FiLogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </aside>
  );
}
