import React from 'react';
import { 
  Cloud, 
  Smartphone, 
  Laptop, 
  Tablet, 
  FolderPlus, 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight,
  Zap,
  Download
} from 'lucide-react';
import { useNotes } from '../context/NotesContext';
import { PWAInstallButton } from './PWAInstallButton';
import { doLogin } from '../actions/login';

export const AuthScreen: React.FC = () => {
  const { loginWithGoogle, authLoading } = useNotes();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-6 relative overflow-hidden">
      {/* Decorative gradient glowing spheres */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-xl z-10 text-center space-y-8">
        {/* App Logo & Badge */}
        <div className="inline-flex flex-col items-center">
          <div className="w-20 h-20 rounded-3xl bg-linear-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-2xl shadow-blue-500/30 mb-4 animate-bounce">
            <Cloud className="w-10 h-10" />
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30">
            Sincronización en la Nube
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mt-3">
            CloudNotes
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-md mt-2">
            Escribe tus notas, organízalas en carpetas y accede a ellas en tiempo real desde cualquier dispositivo.
          </p>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-2.5">
              <Zap className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wide">Tiempo Real</h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Autoguardado inmediato en la nube con Firestore.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2.5">
              <FolderPlus className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wide">Carpetas</h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Organiza con colores, iconos personalizados y etiquetas.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-2.5">
              <Smartphone className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wide">Multi-dispositivo</h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Teléfono, tablet y ordenador sincronizados automáticamente.
            </p>
          </div>
        </div>

        {/* Google Sign In CTA */}
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800/80 shadow-2xl backdrop-blur-xl">
          <h3 className="text-base font-semibold text-white mb-2">
            Inicia sesión para sincronizar tus notas
          </h3>
          <p className="text-xs text-slate-400 mb-6 max-w-sm mx-auto">
            Utiliza tu cuenta de Google para respaldar tus notas de forma segura en la nube y acceder desde todos tus navegadores.
          </p>

          <button
            type="button"
            onClick={doLogin}
            disabled={authLoading}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm shadow-xl shadow-white/10 transition active:scale-[0.98] inline-flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continuar con Google</span>
            <ArrowRight className="w-4 h-4 text-slate-500" />
          </button>

          <div className="mt-4 flex justify-center">
            <PWAInstallButton variant="banner" />
          </div>

          <div className="flex items-center justify-center gap-1.5 mt-4 text-[11px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Datos cifrados y almacenados de forma privada en Firebase Firestore</span>
          </div>
        </div>

        {/* Sync Illustration */}
        <div className="flex items-center justify-center gap-6 text-slate-500 text-xs">
          <div className="flex items-center gap-1.5">
            <Smartphone className="w-4 h-4 text-blue-400" />
            <span>Móvil</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1.5">
            <Tablet className="w-4 h-4 text-indigo-400" />
            <span>Tablet</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1.5">
            <Laptop className="w-4 h-4 text-purple-400" />
            <span>PC / Mac</span>
          </div>
        </div>
      </div>
    </div>
  );
};
