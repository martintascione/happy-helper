import { useState, useEffect, useRef } from "react";
import { Bell, Clock, CheckCircle, XCircle, Info, Calendar, Wallet, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "@tanstack/react-router";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export function NotificationBell({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId) return;
    
    fetchNotifications();

    // Subscribe to new notifications
    const channel = supabase.channel(`notifications:${userId}`);
    
    channel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          setNotifications((prev) => [payload.new, ...prev]);
          setUnreadCount((prev) => prev + 1);
        }
      )
      .subscribe();

    // Close dropdown on outside click
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    
    return () => {
      supabase.removeChannel(channel);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [userId]);

  async function fetchNotifications() {
    const { data } = await supabase
      .from("notifications" as any)
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);
    
    if (data) {
      setNotifications(data);
      setUnreadCount(data.filter((n: any) => !n.read).length);
    }
  }

  async function markAsRead(id: string) {
    const { error } = await supabase
      .from("notifications" as any)
      .update({ read: true })
      .eq("id", id);
    
    if (!error) {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  }

  async function markAllAsRead() {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    if (unreadIds.length === 0) return;

    const { error } = await supabase
      .from("notifications" as any)
      .update({ read: true })
      .in("id", unreadIds);
    
    if (!error) {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    }
  }

  const handleNotificationClick = (notification: any) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    setIsOpen(false);
    if (notification.link_to) {
      navigate({ to: notification.link_to as any });
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'reserva_confirmada':
      case 'pago_aprobado':
      case 'perfil_aprobado':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'reserva_rechazada':
      case 'pago_rechazado':
        return <XCircle size={16} className="text-red-500" />;
      case 'reserva_solicitada':
      case 'reserva_aceptada':
        return <Calendar size={16} className="text-pink-500" />;
      case 'payout_liquidado':
        return <Wallet size={16} className="text-slate-900" />;
      default:
        return <Info size={16} className="text-slate-400" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-soft border border-slate-100 relative active:scale-95 transition-all"
      >
        <Bell size={20} className={unreadCount > 0 ? "text-slate-900" : "text-slate-400"} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-pink-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white animate-in zoom-in">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-14 right-0 w-80 max-h-[480px] bg-white rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden z-[70] animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="p-5 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-black text-slate-900 text-sm tracking-tight">Notificaciones</h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="text-[9px] font-black text-slate-400 hover:text-pink-500 uppercase tracking-widest flex items-center gap-1 transition-colors"
              >
                <Check size={10} /> Marcar todo leido
              </button>
            )}
          </div>
          
          <div className="overflow-y-auto max-h-[400px]">
            {notifications.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200 mx-auto">
                  <Bell size={24} />
                </div>
                <p className="text-xs font-bold text-slate-400">Sin notificaciones nuevas</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`w-full p-5 text-left flex gap-4 transition-colors hover:bg-slate-50/80 ${!n.read ? 'bg-white' : 'opacity-60'}`}
                  >
                    <div className="mt-1 shrink-0">
                      <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center">
                        {getIcon(n.type)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex justify-between items-start gap-2">
                        <p className={`text-xs font-black truncate ${!n.read ? 'text-slate-900' : 'text-slate-600'}`}>
                          {n.title}
                        </p>
                        {!n.read && <div className="w-1.5 h-1.5 bg-pink-500 rounded-full shrink-0 mt-1" />}
                      </div>
                      <p className="text-[11px] font-medium text-slate-500 leading-relaxed line-clamp-2">
                        {n.body}
                      </p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter flex items-center gap-1">
                        <Clock size={8} /> {format(new Date(n.created_at), 'HH:mm', { locale: es })}
                        <span className="mx-1">•</span>
                        {format(new Date(n.created_at), 'd MMM', { locale: es })}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
