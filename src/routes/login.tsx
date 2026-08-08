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

  return (
    <div className="min-h-screen bg-[#F7F5F1] flex flex-col items-center justify-start p-6 pt-12 pb-10">
      {/* Header Area */}
      <div className="w-full max-w-[420px] mb-8 text-center flex flex-col items-center space-y-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-[#0A0A0B] tracking-tight">
            {step === 1 ? (isSignUp ? "Crear cuenta" : "Login") : "Vinculá tu edificio"}
          </h1>
          {step === 1 && (
            <p className="text-slate-500 text-sm font-medium">
              {isSignUp ? "Unite a la comunidad de tu edificio" : "Ingresá a tu panel de control"}
            </p>
          )}
        </div>
      </div>

      <div className="w-full max-w-[420px] space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {step === 1 ? (
          <div className="space-y-6">
            {/* Sliding Switch */}
            <div className="flex justify-center">
              <div className="bg-[#F5F5F3] p-1 rounded-full flex relative w-[240px] shadow-sm">
                <div 
                  className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-full shadow-md transition-all duration-300 ease-out ${isSignUp ? 'translate-x-[calc(100%+4px)]' : 'translate-x-0'}`}
                />
                <button
                  type="button"
                  onClick={() => setIsSignUp(false)}
                  className={`flex-1 py-2 text-xs font-bold relative z-10 transition-colors duration-200 ${!isSignUp ? 'text-black' : 'text-slate-400'}`}
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => setIsSignUp(true)}
                  className={`flex-1 py-2 text-xs font-bold relative z-10 transition-colors duration-200 ${isSignUp ? 'text-black' : 'text-slate-400'}`}
                >
                  Registro
                </button>
              </div>
            </div>

            {/* Form Container */}
            <div className="premium-card p-8 md:p-10 space-y-6">
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
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-black transition-colors" size={18} />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Nombre Completo"
                      className="w-full pl-12 pr-4 py-4 bg-[#F5F5F3] rounded-[20px] border-none focus:ring-2 focus:ring-black/5 transition-all text-sm font-medium"
                    />
                  </div>
                )}
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-black transition-colors" size={18} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    className="w-full pl-12 pr-4 py-4 bg-[#F5F5F3] rounded-[20px] border-none focus:ring-2 focus:ring-black/5 transition-all text-sm font-medium"
                  />
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-black transition-colors" size={18} />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Contraseña"
                    className="w-full pl-12 pr-4 py-4 bg-[#F5F5F3] rounded-[20px] border-none focus:ring-2 focus:ring-black/5 transition-all text-sm font-medium"
                  />
                  {!isSignUp && (
                    <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400 hover:text-black">
                      ¿Olvidaste?
                    </button>
                  )}
                </div>
              </div>

              <button
                key={isSignUp ? "signup" : "signin"}
                type="button"
                onClick={handleRegisterClick}
                disabled={loading}
                className="w-full py-4 bg-black text-white rounded-full font-bold shadow-xl shadow-black/10 active:scale-[0.98] transition-all disabled:opacity-50 text-sm"
              >
                {loading ? "Procesando..." : isSignUp ? "Login" : "Login"}
              </button>
            </div>

            {/* Switch & Social Section */}
            <div className="space-y-6">
              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
                <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-bold"><span className="bg-[#F7F5F1] px-4 text-slate-400">o</span></div>
              </div>

              <div className="space-y-3">
                <button 
                  type="button"
                  className="w-full py-4 bg-[#F5F5F3] text-[#0A0A0B] rounded-full font-bold text-sm flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
                >
                  <img src="https://www.google.com/favicon.ico" className="w-4 h-4 grayscale opacity-70" alt="G" />
                  Continue with Google
                </button>
                <button 
                  type="button"
                  className="w-full py-4 bg-[#B4F481] text-[#0A0A0B] rounded-full font-bold text-sm flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
                >
                  <div className="w-4 h-4 flex items-center justify-center"><User size={16} /></div>
                  Continue As Guest
                </button>
              </div>

              <div className="flex flex-col items-center gap-4">
                <Link 
                  to="/" 
                  className="text-[10px] text-slate-400 font-bold uppercase tracking-widest hover:text-slate-600"
                >
                  Volver al inicio
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            {!foundBuilding ? (
              <div className="premium-card p-8 md:p-10 space-y-6">
                <div className="space-y-4">
                  <div className="w-full p-6 bg-[#F5F5F3] rounded-[24px] border-none focus-within:ring-2 focus-within:ring-black/5 transition-all text-center">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-4">Código de invitación</label>
                    <input
                      type="text"
                      value={inviteCode}
                      autoFocus
                      inputMode="text"
                      onChange={(e) => setInviteCode(e.target.value)}
                      placeholder="TORREXXXX"
                      className="w-full bg-transparent border-none focus:ring-0 text-3xl font-black text-center tracking-[0.2em] font-mono uppercase p-0"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 text-center font-medium px-4">El código fue enviado a tu correo o entregado por la administración.</p>
                </div>
                <button
                  onClick={handleCheckInvite}
                  disabled={loading || !inviteCode}
                  className="w-full py-4 bg-black text-white rounded-full font-bold flex items-center justify-center gap-2 shadow-xl shadow-black/10 active:scale-[0.98] transition-all"
                >
                  Verificar código <ArrowRight size={18} strokeWidth={2.5} />
                </button>
                <button onClick={() => setStep(1)} className="w-full text-center text-xs text-slate-400 font-bold uppercase py-2">Volver</button>
              </div>
            ) : (
              <div className="premium-card p-8 md:p-10 space-y-6">
                <div className="tint-positive p-5 rounded-[24px] text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-70">Edificio encontrado</p>
                  <p className="text-lg font-bold">{foundBuilding.name}</p>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Seleccioná tu unidad</label>
                  <div className="relative group">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <select
                      value={selectedUnitId}
                      onChange={(e) => setSelectedUnitId(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-[#F5F5F3] rounded-[20px] border-none focus:ring-2 focus:ring-black/5 transition-all text-sm font-semibold appearance-none"
                    >
                      <option value="">Seleccionar Piso/Depto</option>
                      {units.map((u) => (
                        <option key={u.id} value={u.id}>
                          Piso {u.floor} - Depto {u.apartment}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setFoundBuilding(null)}
                    className="w-14 h-14 bg-slate-100 rounded-[20px] flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors active:scale-90"
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