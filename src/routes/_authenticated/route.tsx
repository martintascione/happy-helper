import { createFileRoute, Outlet, Link, useLocation, redirect } from "@tanstack/react-router";
import { Home, Car, MessageSquare, AlertCircle, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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
      .select("status")
      .eq("id", session.user.id)
      .single();

    if (!profile) {
      throw redirect({ to: "/login" });
    }

    if (profile.status === "pendiente") {
      throw redirect({ to: "/login" });
    }
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const location = useLocation();
  
  const navItems = [
    { label: "Muro", icon: Home, to: "/_authenticated/muro" },
    { label: "Cocheras", icon: Car, to: "/_authenticated/cocheras" },
    { label: "Chat", icon: MessageSquare, to: "/_authenticated/chat" },
    { label: "Reportes", icon: AlertCircle, to: "/_authenticated/reportes" },
    { label: "Perfil", icon: User, to: "/_authenticated/perfil" },
  ];

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r bg-card p-6 gap-8">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <span className="font-bold text-slate-900 tracking-tight text-lg">Tower</span>
        </div>
        
        <nav className="flex flex-col gap-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-medium transition-all ${
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/10" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <item.icon size={20} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className="flex-1 flex flex-col pb-20 md:pb-0">
        <Outlet />
      </main>

      {/* Bottom Nav for Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-card border-t flex items-center justify-around px-2 z-40">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center gap-1 p-2 transition-all ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <item.icon size={22} className={isActive ? "fill-primary/10" : ""} />
              <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}