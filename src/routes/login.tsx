import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, Lock, User, Key, Building2, DoorOpen, ArrowRight, ArrowLeft, ShieldCheck } from "lucide-react";
import { AgreementModal } from "@/components/AgreementModal";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  console.log("LoginPage rendering");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Auth, 2: Invitation/Profile
  const [isSignUp, setIsSignUp] = useState(false);
  
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
    console.log("LoginPage mounted");
    
    let isMounted = true;

    // Check session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      console.log("Current session in mount effect:", session?.user?.email);
      if (session) {
        const userEmail = session.user.email?.toLowerCase();
        if (userEmail === 'tascione32@gmail.com') {
          console.log("Super admin detected on mount, performing immediate redirect");
          // Use a slight delay to avoid conflicts with HMR or rapid redirects
          setTimeout(() => {
            if (isMounted) window.location.href = "/muro";
          }, 100);
        } else {
          checkSession();
        }
      }
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state change event:", event, "User:", session?.user?.email);
      
      // Handle the session if it exists, regardless of the event type for Super Admin
      const currentSession = session;
      if (currentSession) {
        const userEmail = currentSession.user.email?.toLowerCase();
        if (userEmail === 'tascione32@gmail.com') {
          console.log("Super admin session detected in state change, redirecting...");
          window.location.href = "/muro";
          return;
        }
      }

      if (event === 'SIGNED_IN' && session) {
        checkSession();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function checkSession() {
    console.log("Checking session...");
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error("Session error:", sessionError);
      return;
    }

    if (!session) {
      console.log("No session found");
      return;
    }

    const userEmail = session.user.email?.toLowerCase();
    console.log("Active session for:", userEmail);
    const isSuperAdminEmail = userEmail === 'tascione32@gmail.com';

    if (isSuperAdminEmail) {
      console.log("Super admin detected, bypassing all checks...");
      // We use a clean replace to avoid history issues or loops
      // The path /muro is the target, which will match /_authenticated/muro
      window.location.replace("/muro");
      return;
    }

    // 1. Proactive check for super admin email
    if (isSuperAdminEmail) {
      console.log("Super admin detected, checking profile...");
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("status, role, building_id, unit_id")
        .eq("id", session.user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Profile error for super admin:", profileError);
      }

      // If already super_admin and approved, redirect immediately
      if (profile && profile.role === 'super_admin' && profile.status === 'aprobado' && profile.building_id && profile.unit_id) {
        console.log("Super admin fully set up, redirecting to muro");
        navigate({ to: "/muro" });
        return;
      }
      console.log("Super admin profile incomplete, attempting auto-setup...", profile);

      // Ensure at least one building and unit exist
      let bId = profile?.building_id;
      let uId = profile?.unit_id;

      if (!bId || !uId) {
        const { data: building } = await supabase.from('buildings').select('id').limit(1).maybeSingle();
        if (building) {
          const { data: unit } = await supabase.from('units').select('id').eq('building_id', building.id).limit(1).maybeSingle();
          bId = building.id;
          uId = unit?.id;
        }
      }
      
      if (bId && uId) {
        console.log("Upserting super admin profile with building/unit:", bId, uId);
        const { error: upsertError } = await supabase.from('profiles').upsert({
          id: session.user.id,
          full_name: fullName || (session.user.user_metadata as any)?.['full_name'] || 'Super Admin',
          building_id: bId,
          unit_id: uId,
          role: 'super_admin',
          status: 'aprobado'
        });
        
        if (!upsertError) {
          console.log("Upsert success, redirecting to muro");
          navigate({ to: "/muro" });
          return;
        } else {
          console.error("Upsert error for super admin:", upsertError);
        }
      } else {
        console.warn("No building/unit found for super admin auto-setup");
      }
    }

    // 2. Standard user check
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
    console.log("handleAuth starting:", { isSignUp, email, fullName });
    
    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName }
        }
      });
      console.log("Signup result:", { data, error });
      if (error) {
        toast.error(error.message);
        setLoading(false);
      } else {
        toast.success("Cuenta creada.");
        // Close modal if it was open
        setShowRegisterAgreement(false);
        // The onAuthStateChange listener or handleAuth final setLoading will trigger
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      console.log("Login attempt result:", { success: !!data?.user, error: error?.message });
      if (error) {
        toast.error(error.message);
        setLoading(false);
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
    console.log("handleRegisterClick called, isSignUp:", isSignUp);
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
    console.log("Verifying code:", code);
    
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
    <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center p-6">
      <div className="w-full max-w-[400px] bg-white rounded-[2.5rem] p-10 shadow-xl space-y-8 animate-in fade-in zoom-in-95 duration-500">
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
            <Building2 size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            {step === 1 ? (isSignUp ? "Crear cuenta" : "Bienvenido") : "Vinculá tu edificio"}
          </h1>
        </div>

        {step === 1 ? (
          <div className="space-y-4">
            {isSignUp && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Nombre Completo</label>
                <div className="relative">
                  <User className="absolute left-4 top-4 text-slate-300" size={20} />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Tu nombre"
                    className="w-full p-4 pl-12 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>
            )}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-4 text-slate-300" size={20} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  className="w-full p-4 pl-12 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-4 top-4 text-slate-300" size={20} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full p-4 pl-12 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>

            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 mb-4">
              <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">Acceso Directo (Demo)</p>
              <p className="text-[10px] text-amber-500 font-medium">Usá tascione32@gmail.com / admin123 para entrar como Super Admin.</p>
            </div>

            <button
              key={isSignUp ? "signup" : "signin"}
              type="button"
              onClick={(e) => {
                console.log("Direct button click");
                handleRegisterClick(e);
              }}
              disabled={loading}
              className="w-full py-5 bg-primary text-white rounded-2xl font-bold shadow-xl shadow-primary/20 active:scale-[0.98] transition-all disabled:opacity-50 relative z-10"
            >
              {loading ? "Procesando..." : isSignUp ? "Registrarme" : "Ingresar"}
            </button>

            <button
              type="button"
              onClick={() => {
                console.log("Toggling signup mode to:", !isSignUp);
                setIsSignUp(!isSignUp);
              }}
              className="w-full text-sm text-slate-500 font-medium"
            >
              {isSignUp ? "¿Ya tenés cuenta? Ingresá" : "¿No tenés cuenta? Registrate"}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {!foundBuilding ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Código de invitación</label>
                  <div className="relative">
                    <Key className="absolute left-4 top-4 text-slate-300" size={20} />
                    <input
                      type="text"
                      value={inviteCode}
                      autoFocus
                      onChange={(e) => setInviteCode(e.target.value)}
                      placeholder="TORREXXXX"
                      className="w-full p-4 pl-12 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-primary/20 transition-all font-mono uppercase"
                    />
                  </div>
                </div>
                <button
                  onClick={handleCheckInvite}
                  disabled={loading || !inviteCode}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2"
                >
                  Verificar código <ArrowRight size={18} />
                </button>
              </div>
            ) : (
              <div className="space-y-6 animate-in slide-in-from-right duration-300">
                <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10">
                  <p className="text-xs font-bold text-primary uppercase tracking-wider">Edificio</p>
                  <p className="font-bold text-slate-900">{foundBuilding.name}</p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Seleccioná tu unidad</label>
                  <select
                    value={selectedUnitId}
                    onChange={(e) => setSelectedUnitId(e.target.value)}
                    className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-primary/20 transition-all font-medium appearance-none"
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
                    className="p-4 bg-slate-100 rounded-2xl text-slate-500"
                  >
                    <ArrowLeft size={24} />
                  </button>
                  <button
                    onClick={handleCompleteProfile}
                    disabled={loading || !selectedUnitId}
                    className="flex-1 py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20"
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