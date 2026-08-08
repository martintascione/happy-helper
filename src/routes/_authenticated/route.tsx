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

    // Limpieza de flags viejos e inseguros
    localStorage.removeItem('is_super_admin');

    // 1. Sesión real de Supabase — única fuente de verdad
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      });
    }

    const userEmail = session.user.email?.toLowerCase() || '';

    // 2. El rol y el estado salen SIEMPRE de la base (protegida por RLS)
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
      isSuperAdmin: profile.role === 'super_admin',
      userEmail
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
    <div className="flex min-h-screen bg-background text-foreground overflow-x-hidden relative justify-center">
      <main className="flex-1 flex flex-col relative min-h-screen max-w-[480px] w-full overflow-x-hidden bg-background">
        {/* Notification Bell removed as requested */}
        
        <div className="flex-1 pb-32">
          <Outlet />
        </div>

        {/* Bottom Nav Pill */}
        <div className="fixed bottom-12 left-0 right-0 px-8 z-[100] flex justify-center pointer-events-none">
          <nav className="h-[76px] glass rounded-[2.5rem] shadow-pill flex items-center justify-around px-4 relative border border-black/[0.03] ring-1 ring-black/[0.02] touch-none w-full max-w-[400px] pointer-events-auto">
            {mobileNavItems.map((item) => {
              const isActive = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  preload="intent"
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 active:scale-90 ${
                    isActive ? "bg-primary text-primary-foreground shadow-premium scale-110" : "text-muted-foreground/60 hover:text-foreground"
                  }`}
                >
                  <item.icon size={26} strokeWidth={2.5} />
                </Link>
              );
            })}
          </nav>
        </div>
      </main>
    </div>
  );
}
