import { createFileRoute, Outlet, Link, useLocation, redirect } from "@tanstack/react-router";
import { Home, Car, MessageSquare, AlertCircle, User, Plus, ShieldCheck, Settings } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
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

  useEffect(() => {
    console.log("AuthenticatedLayout mounted/updated", { userEmail, userRole, isSuperAdmin });
    setActiveRole(userRole);
  }, [userRole, userEmail, isSuperAdmin]);
  
  const navItems = useMemo(() => [
    { label: "Muro", icon: Home, to: "/muro" },
    { label: "Cocheras", icon: Car, to: "/cocheras" },
    { label: "Chat", icon: MessageSquare, to: "/chat" },
    { label: "Reportes", icon: AlertCircle, to: "/reportes" },
    { label: "Admin", icon: ShieldCheck, to: "/admin" },
    { label: "Global", icon: Settings, to: "/admin-global" },
    { label: "Perfil", icon: User, to: "/perfil" },
  ], []);

  const filteredNavItems = useMemo(() => navItems.filter(item => {
    if (item.label === "Admin") return activeRole === "admin" || activeRole === "super_admin";
    if (item.label === "Global") return activeRole === "super_admin";
    return true;
  }), [navItems, activeRole]);

  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r p-8 gap-8">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center shadow-xl shadow-black/10">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </div>
              <span className="font-extrabold text-slate-900 tracking-tight text-xl">Tower</span>
            </div>
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Avisos</span>
            <NotificationBell userId={userId} />
          </div>
        </div>
        
        <nav className="flex flex-col gap-2">
          {filteredNavItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                preload="intent"
                className={`flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all cursor-pointer ${
                  isActive 
                    ? "bg-black text-white shadow-xl shadow-black/10 scale-[1.02]" 
                    : "text-slate-400 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className="flex-1 flex flex-col relative min-h-screen">
        <header className="md:hidden flex justify-end p-4 sticky top-0 z-[50]">
          <NotificationBell userId={userId} />
        </header>
        <div className="flex-1 pb-32 md:pb-8 pt-4">
          <Outlet />
        </div>

        {/* Floating Action Button - Only Mobile */}
        <button className="md:hidden fixed bottom-28 right-6 w-14 h-14 bg-black text-white rounded-full shadow-2xl flex items-center justify-center z-50 active:scale-90 transition-transform">
          <Plus size={32} strokeWidth={3} />
        </button>

        {/* Floating Pill Navigation for Mobile */}
        <div className="md:hidden fixed bottom-6 left-0 right-0 px-6 z-40">
          <nav className="h-20 bg-white rounded-full shadow-2xl border border-slate-100 flex items-center justify-around px-2">
            {filteredNavItems.map((item) => {
              const isActive = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  preload="intent"
                  className={`flex flex-col items-center gap-1.5 p-2 transition-all cursor-pointer ${
                    isActive ? "text-slate-900" : "text-slate-300"
                  }`}
                >
                  <div className={`p-1.5 rounded-full transition-colors ${isActive ? "bg-accent/10" : ""}`}>
                    <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                  <span className={`text-[9px] font-extrabold uppercase tracking-widest ${isActive ? "opacity-100" : "opacity-0"}`}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Role Switcher for Super Admin */}
        {isSuperAdmin && (
          <div className="fixed top-4 right-4 z-[60] flex gap-2">
            <NotificationBell userId={userId} />
            <div className="flex gap-2 bg-white/80 backdrop-blur-md p-2 rounded-2xl shadow-lg border border-slate-200">
              {["vecino", "admin", "super_admin"].map((role) => (
                <button
                  key={role}
                  onClick={() => setActiveRole(role as any)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${
                    activeRole === role
                      ? "bg-black text-white shadow-md shadow-black/10"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  {role.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
