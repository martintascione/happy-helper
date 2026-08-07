import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, Lock, User, Key, Building2, DoorOpen, ArrowRight, ArrowLeft, ShieldCheck } from "lucide-react";
import { AgreementModal } from "@/components/AgreementModal";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): { mode?: "signup"; redirect?: string } => ({
    ...(search['mode'] === "signup" ? { mode: "signup" as const } : {}),
    ...(typeof search['redirect'] === "string" ? { redirect: search['redirect'] } : {}),
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { mode } = Route.useSearch();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Auth, 2: Invitation/Profile
  const [isSignUp, setIsSignUp] = useState(mode === "signup");
  const [existingSession, setExistingSession] = useState<string | null>(null);
  const [signupNotice, setSignupNotice] = useState(false);

  useEffect(() => {
    if (mode === "signup") setIsSignUp(true);
  }, [mode]);
  
  // Auth fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  
  // Profile fields (Step 2)
  const [inviteCode, setInviteCode] = useState("");
  const [units, setUnits] = useState<any[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState("");
  const [foundBuilding, setFoundBuilding] = useState<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Limpieza de flags viejos e inseguros
    localStorage.removeItem('is_super_admin');

    let isMounted = true;

    const runCheck = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!isMounted) return;
      // No redirigir automáticamente: mostrar la opción de continuar o cambiar de cuenta
      if (session) setExistingSession(session.user.email ?? "tu cuenta");
    };

    runCheck();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      if (event === 'SIGNED_IN' && session) checkSession();
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function checkSession() {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) return;

    // El rol y el estado salen SIEMPRE de la base (protegida por RLS)
    const { data: profile } = await supabase
      .from("profiles")
      .select("status, role")
      .eq("id", session.user.id)
      .maybeSingle();
    
    if (profile) {
      if (profile.role === "super_admin" || profile.status === "aprobado") {
        navigate({ to: "/muro" });
      } else if (profile.status === "pendiente") {
        setStep(3); // Pending screen
      } else {
        setStep(2);
      }
    } else {
      setStep(2); // Authenticated but needs invitation
    }
  }

  const handleAuth = async (e: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    
    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName }
        }
      });
      if (error) {
        toast.error(error.message);
        setLoading(false);
      } else {
        toast.success("Cuenta creada");
        setShowRegisterAgreement(false);
        if (!data.session) {
          // Supabase exige confirmar el email antes de iniciar sesión
          setSignupNotice(true);
        }
        // Si hay sesión, onAuthStateChange dispara checkSession y sigue al paso del código
      }
    } else {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
          toast.error("Email o contraseña incorrectos");
          setLoading(false);
        } else if (data?.user) {
          await checkSession();
        }
      } catch (err: any) {
        toast.error("Error inesperado al iniciar sesión");
      }
    }
    setLoading(false);
  };

  const [showRegisterAgreement, setShowRegisterAgreement] = useState(false);
  const registerAgreementItems = [
    { text: "Al crear tu cuenta aceptás los Términos y Condiciones y la Política de Privacidad de Comunidad Tower.", link: { label: "Ver legales", to: "/terminos" } },
    { text: "Tu cuenta va a ser verificada por la administración de tu edificio antes de activarse." },
    { text: "Los datos que declarás (nombre, piso y departamento) deben ser reales. Una cuenta con datos falsos puede ser dada de baja." }
  ];

  const handleRegisterClick = (e: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isSignUp) {
      handleAuth(e);
      return;
    }
    // If we're signing up, we show the agreement first
    setShowRegisterAgreement(true);
  };

  const handleCheckInvite = async () => {
    setLoading(true);
    const code = inviteCode.trim().toUpperCase();
    
    const { data: building, error } = await supabase
      .from("buildings")
      .select("*")
      .eq("invite_code", code)
      .maybeSingle();

    if (error) {
      console.error("Supabase error checking invite:", error);
      toast.error("Error al verificar código");
    } else if (!building) {
      toast.error("Código de invitación inválido");
    } else {
      setFoundBuilding(building);
      const { data: unitsData } = await supabase
        .from("units")
        .select("*")
        .eq("building_id", building.id)
        .order("floor")
        .order("apartment");
      setUnits(unitsData || []);
      toast.success("Edificio encontrado: " + building.name);
    }
    setLoading(false);
  };

  const handleCompleteProfile = async () => {
    if (!foundBuilding || !selectedUnitId) {
      toast.error("Seleccioná tu unidad");
      return;
    }
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("profiles").insert({
      id: user.id,
      full_name: fullName || user.user_metadata['full_name'],
      building_id: foundBuilding.id,
      unit_id: selectedUnitId,
      status: "pendiente"
    });

    if (error) {
      toast.error("Error al crear perfil: " + error.message);
    } else {
      setStep(3);
    }
    setLoading(false);
  };

  if (step === 3) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center p-6">
        <div className="w-full max-w-[400px] bg-white rounded-[2.5rem] p-10 shadow-xl text-center space-y-6">
          <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-amber-500">
            <Lock size={40} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Cuenta en espera</h1>
          <p className="text-slate-500">Tu cuenta está esperando la aprobación del administrador de tu edificio. Te avisaremos cuando puedas ingresar.</p>
          <button 
            onClick={() => supabase.auth.signOut().then(() => window.location.reload())}
            className="text-primary font-bold"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F5F1] flex items-center justify-center p-6">
      <div className="w-full max-w-[420px] bg-white rounded-[28px] p-8 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-8 animate-in fade-in zoom-in-95 duration-500">
        <div className="flex flex-col items-center gap-2">
          <div className="w-14 h-14 bg-black rounded-[18px] flex items-center justify-center shadow-lg shadow-black/10">
            <Building2 size={28} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight mt-2">
            {step === 1 ? (isSignUp ? "Crear cuenta" : "Bienvenido") : "Vinculá tu edificio"}
          </h1>
        </div>

        {step === 1 ? (
          <div className="space-y-6">
            {existingSession && (
              <div className="tint-info rounded-[20px] p-4 space-y-3">
                <p className="text-[13px] font-medium leading-relaxed">
                  Ya hay una sesión iniciada como <span className="font-semibold">{existingSession}</span>
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => checkSession()}
                    className="flex-1 py-2.5 bg-black text-white rounded-full text-[13px] font-semibold active:scale-[0.98] transition-all"
                  >
                    Continuar
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await supabase.auth.signOut();
                      setExistingSession(null);
                      toast.success("Sesión cerrada");
                    }}
                    className="flex-1 py-2.5 bg-white rounded-full text-[13px] font-semibold text-slate-600 shadow-subtle active:scale-[0.98] transition-all"
                  >
                    Usar otra cuenta
                  </button>
                </div>
              </div>
            )}

            {signupNotice && (
              <div className="tint-warning rounded-[20px] p-4">
                <p className="text-[13px] font-medium leading-relaxed">
                  Te enviamos un correo para confirmar tu cuenta. Abrí el link y después ingresá con tu email y contraseña.
                </p>
              </div>
            )}

            <div className="space-y-4">
              {isSignUp && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nombre Completo</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Tu nombre completo"
                    className="w-full p-4 bg-[#F5F5F3] rounded-[20px] border-none focus:ring-2 focus:ring-black/5 transition-all text-sm font-medium"
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  className="w-full p-4 bg-[#F5F5F3] rounded-[20px] border-none focus:ring-2 focus:ring-black/5 transition-all text-sm font-medium"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Contraseña</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full p-4 bg-[#F5F5F3] rounded-[20px] border-none focus:ring-2 focus:ring-black/5 transition-all text-sm font-medium"
                />
              </div>
            </div>

            <button
              id="auth-submit-button"
              key={isSignUp ? "signup" : "signin"}
              type="button"
              onClick={handleRegisterClick}
              disabled={loading}
              className="w-full py-4 bg-black text-white rounded-full font-bold shadow-xl shadow-black/10 active:scale-[0.98] transition-all disabled:opacity-50 text-sm"
            >
              {loading ? "Procesando..." : isSignUp ? "Registrarme" : "Ingresar"}
            </button>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="w-full py-2 text-[13px] text-slate-500 font-semibold hover:text-black transition-colors"
              >
                {isSignUp ? "¿Ya tenés cuenta? Ingresá" : "¿No tenés cuenta? Registrate"}
              </button>
              
              <Link 
                to="/" 
                className="w-full py-2 text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest hover:text-slate-600"
              >
                Volver al inicio
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {!foundBuilding ? (
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center w-full block">Código de invitación</label>
                  <input
                    type="text"
                    value={inviteCode}
                    autoFocus
                    inputMode="text"
                    onChange={(e) => setInviteCode(e.target.value)}
                    placeholder="TORREXXXX"
                    className="w-full p-6 bg-[#F5F5F3] rounded-[24px] border-none focus:ring-2 focus:ring-black/5 transition-all text-2xl font-black text-center tracking-[0.2em] font-mono uppercase"
                  />
                  <p className="text-[10px] text-slate-400 text-center font-medium">El código fue enviado a tu correo o entregado por la administración.</p>
                </div>
                <button
                  onClick={handleCheckInvite}
                  disabled={loading || !inviteCode}
                  className="w-full py-4 bg-black text-white rounded-full font-bold flex items-center justify-center gap-2 shadow-xl shadow-black/10"
                >
                  Verificar código <ArrowRight size={18} strokeWidth={2.5} />
                </button>
              </div>
            ) : (
              <div className="space-y-6 animate-in slide-in-from-right duration-300">
                <div className="tint-positive p-5 rounded-[24px] border border-green-200/20 text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-70">Edificio encontrado</p>
                  <p className="text-lg font-bold">{foundBuilding.name}</p>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Seleccioná tu unidad</label>
                  <select
                    value={selectedUnitId}
                    onChange={(e) => setSelectedUnitId(e.target.value)}
                    className="w-full p-4 bg-[#F5F5F3] rounded-[20px] border-none focus:ring-2 focus:ring-black/5 transition-all text-sm font-semibold appearance-none"
                  >
                    <option value="">Seleccionar Piso/Depto</option>
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        Piso {u.floor} - Depto {u.apartment}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setFoundBuilding(null)}
                    className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
                  >
                    <ArrowLeft size={20} strokeWidth={2.5} />
                  </button>
                  <button
                    onClick={handleCompleteProfile}
                    disabled={loading || !selectedUnitId}
                    className="flex-1 py-4 bg-black text-white rounded-full font-bold shadow-xl shadow-black/10 active:scale-[0.98] transition-all"
                  >
                    Confirmar vinculación
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <AgreementModal
        isOpen={showRegisterAgreement}
        onClose={() => setShowRegisterAgreement(false)}
        onAccept={() => handleAuth({ preventDefault: () => {} } as any)}
        title="Antes de empezar"
        agreementKey="terminos"
        items={registerAgreementItems}
      />
    </div>
  );
}