import { createFileRoute, Outlet, Link, useLocation, redirect } from "@tanstack/react-router";
import { Home, Car, MessageSquare, AlertCircle, User, Plus, ShieldCheck, Settings, Shield } from "lucide-react";
import { useState, useEffect, useMemo, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { NotificationBell } from "@/components/NotificationBell";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ location }) => {
    // SSR Guard: localStorage is not available on server
    if (typeof window === 'undefined') {
      return { 
        userRole: 'vecino' as const, 
        userId: '',
        isSuperAdmin: false,
        userEmail: ''
      };
    }

    // 1. Check local storage for super admin bypass (fastest)
    const isSuperAdminFlag = localStorage.getItem('is_super_admin') === 'true';
    const storedSessionStr = localStorage.getItem('sb-ufsowwvgbxfasucpvzkl-auth-token');
    let userEmailFromStorage = '';
    
    if (storedSessionStr) {
      try {
        const session = JSON.parse(storedSessionStr);
        userEmailFromStorage = session?.user?.email?.toLowerCase() || '';
      } catch (e) {}
    }

    const isSuperAdminEmail = userEmailFromStorage === 'tascione32@gmail.com';

    // Immediate bypass for Super Admin
    if (isSuperAdminEmail || isSuperAdminFlag) {
      console.log("Super Admin bypass confirmed via storage");
      return { 
        userRole: 'super_admin' as const, 
        userId: 'super-admin-id',
        isSuperAdmin: true,
        userEmail: 'tascione32@gmail.com'
      };
    }

    const { data: { session } } = await supabase.auth.getSession();
    const userEmail = session?.user?.email?.toLowerCase();

    // 2. If no session AND not already identified as super admin -> login
    if (!session) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      });
    }

    // Double check email from live session
    if (userEmail === 'tascione32@gmail.com') {
      return { 
        userRole: 'super_admin' as const, 
        userId: session.user.id,
        isSuperAdmin: true,
        userEmail: 'tascione32@gmail.com'
      };
    }

    // 3. Regular users must have a profile and be approved
    const { data: profile } = await supabase
      .from("profiles")
      .select("status, role")
      .eq("id", session.user.id)
      .maybeSingle();

    if (!profile || (profile.status === "pendiente" && profile.role !== "super_admin")) {
      throw redirect({ to: "/login" });
    }

    return { 
      userRole: (profile.role || 'vecino') as "admin" | "super_admin" | "vecino", 
      userId: session.user.id,
      isSuperAdmin: false,
      userEmail: userEmail || ''
    };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const location = useLocation();
  const { userRole, userId, isSuperAdmin, userEmail } = Route.useRouteContext();
  const [activeRole, setActiveRole] = useState(userRole);
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);
  const adminMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActiveRole(userRole);
  }, [userRole]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (adminMenuRef.current && !adminMenuRef.current.contains(event.target as Node)) {
        setIsAdminMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  
  const navItems = useMemo(() => [
    { label: "Muro", icon: Home, to: "/muro" },
    { label: "Cocheras", icon: Car, to: "/cocheras" },
    { label: "Chat", icon: MessageSquare, to: "/chat" },
    { label: "Reportes", icon: AlertCircle, to: "/reportes" },
    { label: "Perfil", icon: User, to: "/perfil" },
  ], []);

  const filteredNavItems = useMemo(() => navItems, [navItems]);

  // Mobile navigation items (limited to 5)
  const mobileNavItems = useMemo(() => {
    return filteredNavItems;
  }, [filteredNavItems]);

  return (
    <div className="flex min-h-screen bg-background text-foreground overflow-x-hidden relative">
      {/* Sidebar for Desktop */}
      <aside className="hidden lg:flex flex-col w-72 bg-background p-10 gap-10 border-r border-black/[0.03]">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-premium">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              </svg>
            </div>
            <span className="font-bold text-foreground tracking-tight text-2xl">Tower</span>
          </div>
        </div>
        
        <nav className="flex flex-col gap-1">
          {filteredNavItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                preload="intent"
                className={`flex items-center gap-5 px-6 py-4 rounded-[1.25rem] font-bold transition-all duration-300 ${
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-premium scale-[1.02]" 
                    : "text-muted-foreground hover:text-foreground hover:bg-black/[0.02]"
                }`}
              >
                <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[15px] tracking-tight">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className="flex-1 flex flex-col relative min-h-screen max-w-full overflow-x-hidden">
        <header className="flex justify-end p-6 lg:p-8 sticky top-0 z-[50]">
          <NotificationBell userId={userId} />
        </header>
        <div className="flex-1 pb-32 lg:pb-8">
          <Outlet />
        </div>

        {/* Floating Pill Navigation for Mobile */}
        <div className="lg:hidden fixed bottom-10 left-0 right-0 px-8 z-[100]">
          <nav className="h-16 glass-card rounded-full shadow-pill flex items-center justify-around px-3 relative border border-white/60 ring-1 ring-black/5 touch-none">
            {mobileNavItems.map((item) => {
              const isActive = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  preload="intent"
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 active:scale-90 ${
                    isActive ? "bg-black text-white shadow-lg scale-110" : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <item.icon size={24} strokeWidth={2} />
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Role Switcher removed from here as requested */}
      </main>
    </div>
  );
}
