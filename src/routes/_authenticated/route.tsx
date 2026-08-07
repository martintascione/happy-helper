import { createFileRoute, Outlet, Link, useLocation, redirect } from "@tanstack/react-router";
import { Home, Car, MessageSquare, AlertCircle, User, Plus, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ location }) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw redirect({
        to: "/login",
        search: {
          redirect: location.href,
        },
      });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("status, role")
      .eq("id", session.user.id)
      .single();

    if (!profile) {
      throw redirect({ to: "/login" });
    }

    if (profile.status === "pendiente") {
      throw redirect({ to: "/login" });
    }

    return { userRole: profile.role };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const location = useLocation();
  const { userRole } = Route.useRouteContext();
  
  const navItems = [
    { label: "Muro", icon: Home, to: "/_authenticated/muro" },
    { label: "Cocheras", icon: Car, to: "/_authenticated/cocheras" },
    { label: "Chat", icon: MessageSquare, to: "/_authenticated/chat" },
    { label: "Reportes", icon: AlertCircle, to: "/_authenticated/reportes" },
    { label: "Perfil", icon: User, to: "/_authenticated/perfil" },
  ];

  if (userRole === "admin" || userRole === "super_admin") {
    navItems.splice(navItems.length - 1, 0, { label: "Admin", icon: ShieldCheck, to: "/_authenticated/admin" });
  }

  return (
    <div className="flex min-h-screen bg-[#F2F2F2] text-foreground font-sans">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r p-8 gap-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shadow-xl shadow-black/10">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <span className="font-extrabold text-slate-900 tracking-tight text-2xl">Tower</span>
        </div>
        
        <nav className="flex flex-col gap-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all ${
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
            {navItems.map((item) => {
              const isActive = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex flex-col items-center gap-1.5 p-2 transition-all ${
                    isActive ? "text-slate-900" : "text-slate-300"
                  }`}
                >
                  <div className={`p-1.5 rounded-full transition-colors ${isActive ? "bg-accent/30" : ""}`}>
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
      </main>
    </div>
  );
}
