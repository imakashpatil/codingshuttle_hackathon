import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  FileCode2, 
  Users, 
  Folder,
  UploadCloud, 
  AlertTriangle, 
  History,
  FileText,
  Settings,
  LogOut,
  Layers
} from 'lucide-react';

const Sidebar = () => {
  const navigate = useNavigate();
  const userRole = localStorage.getItem('user_role') || 'Admin';

  const sections = [
    {
      title: 'CORE DIRECTORY',
      items: [
        { name: 'Templates', path: '/templates', icon: <FileCode2 className="h-4 w-4" />, roles: ['Admin'] },
        { name: 'Comm Definitions', path: '/comm-definitions', icon: <Layers className="h-4 w-4" />, roles: ['Admin'] },
        { name: 'Customers', path: '/customers', icon: <Users className="h-4 w-4" />, roles: ['Admin'] },
      ]
    },
    {
      title: 'OPERATIONS',
      items: [
        { name: 'File Manager', path: '/files', icon: <Folder className="h-4 w-4" />, roles: ['Admin', 'Operations'] },
        { name: 'Batch Processing', path: '/batches', icon: <UploadCloud className="h-4 w-4" />, roles: ['Admin', 'Operations'] },
        { name: 'Queue Monitor', path: '/queues', icon: <AlertTriangle className="h-4 w-4" />, roles: ['Admin', 'Operations'] },
      ]
    },
    {
      title: 'DEVELOPER PORTAL',
      items: [
        { name: 'Reports Generator', path: '/reports', icon: <FileText className="h-4 w-4" />, roles: ['Admin', 'Operations'] },
      ]
    }
  ];

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_role');
    navigate('/login');
    window.location.reload();
  };

  return (
    <aside className="fixed top-0 left-0 bottom-0 w-64 h-screen flex flex-col py-4 border-r border-border bg-card text-foreground z-[100]">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-6 h-14 mb-4">
        <div className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-sky-600 to-blue-700 shadow-md shadow-sky-600/20 overflow-hidden shrink-0">
          <div className="absolute inset-0 bg-gradient-to-b from-white/15 to-transparent pointer-events-none" />
          <svg viewBox="0 0 24 24" fill="none" className="w-[18px] h-[18px] text-white" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="rgba(255,255,255,0.15)" />
          </svg>
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 leading-none">
            <span className="font-extrabold text-[15px] tracking-tight text-foreground">
              Notify<span className="text-sky-500 font-bold">Hub</span>
            </span>
            <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border border-sky-500/20 bg-sky-500/10 text-sky-400 shrink-0">
              {userRole}
            </span>
          </div>
          <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-widest mt-1">
            Notification Hub
          </span>
        </div>
      </div>
      
      {/* Sidebar Links */}
      <div className="flex flex-col gap-[2px] grow overflow-y-auto pr-1">
        {sections.map((section) => {
          const visibleSectionItems = section.items.filter(item => item.roles.includes(userRole));
          if (visibleSectionItems.length === 0) return null;
          return (
            <div key={section.title} className="mt-4 flex flex-col gap-[2px]">
              <p className="px-6 text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">
                {section.title}
              </p>
              <div className="flex flex-col gap-[2px]">
                {visibleSectionItems.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    className={({ isActive }) => `
                      flex items-center gap-3 py-2 px-4 mx-4 rounded-lg text-[13px] transition-colors duration-200
                      ${isActive 
                        ? 'bg-accent text-accent-foreground font-semibold border-l-2 border-primary pl-[14px]' 
                        : 'text-muted-foreground font-medium hover:bg-accent hover:text-accent-foreground border-l-2 border-transparent'
                      }
                    `}
                  >
                    {item.icon}
                    <span>{item.name}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="px-4 mt-auto">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 bg-red-500/5 border border-red-500/20 hover:bg-red-500/10 text-red-500 text-sm font-semibold py-2 px-4 rounded-lg cursor-pointer transition-colors duration-200"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
