import React, { useState } from 'react';
import { 
  Cloud, 
  Smartphone, 
  Laptop, 
  Tablet, 
  CheckCircle2, 
  Copy, 
  Check, 
  X, 
  RefreshCw, 
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { useNotes } from '../context/NotesContext';

interface SyncDevicesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SyncDevicesModal: React.FC<SyncDevicesModalProps> = ({ isOpen, onClose }) => {
  const { state } = useNotes();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentUrl = window.location.href;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div 
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header banner */}
        <div className="bg-linear-to-br from-blue-600 via-indigo-600 to-purple-600 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition text-white"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-3">
            <Cloud className="w-7 h-7 text-white" />
          </div>
          <h3 className="text-xl font-bold">Sincronización en la Nube Activa</h3>
          <p className="text-sm text-blue-100 mt-1">
            Tus notas y carpetas se guardan y actualizan automáticamente en tiempo real en todos tus dispositivos.
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Status cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
              <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Estado de la nube</span>
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${
                  state.syncState === 'saving' ? 'bg-amber-500 animate-ping' :
                  state.isOnline ? 'bg-emerald-500' : 'bg-red-500'
                }`} />
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {state.syncState === 'saving' ? 'Sincronizando...' : state.isOnline ? 'Conectado (En vivo)' : 'Modo fuera de línea'}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
              <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Última sincronización</span>
              <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-800 dark:text-slate-200">
                <RefreshCw className="w-3.5 h-3.5 text-blue-500" />
                <span>
                  {state.lastSyncTime ? state.lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Ahora'}
                </span>
              </div>
            </div>
          </div>

          {/* Cross device illustration */}
          <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50">
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-300 mb-3 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Acceso multiplataforma instantáneo
            </h4>
            <div className="flex items-center justify-around py-2 text-slate-700 dark:text-slate-300">
              <div className="flex flex-col items-center gap-1.5 text-center">
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 shadow-xs flex items-center justify-center text-blue-600">
                  <Smartphone className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium">Móvil</span>
              </div>
              <span className="text-indigo-300 dark:text-indigo-600 font-bold">⇄</span>
              <div className="flex flex-col items-center gap-1.5 text-center">
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 shadow-xs flex items-center justify-center text-indigo-600">
                  <Tablet className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium">Tablet</span>
              </div>
              <span className="text-indigo-300 dark:text-indigo-600 font-bold">⇄</span>
              <div className="flex flex-col items-center gap-1.5 text-center">
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 shadow-xs flex items-center justify-center text-purple-600">
                  <Laptop className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium">Ordenador</span>
              </div>
            </div>
            <p className="text-xs text-indigo-800/80 dark:text-indigo-300/80 mt-2 text-center">
              Cualquier cambio que hagas se reflejará al instante en tus demás pantallas conectadas a <b>{state.logged?.email || 'tu cuenta'}</b>.
            </p>
          </div>

          {/* Test link sharing */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Enlace de tu aplicación para abrir en otro dispositivo
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={currentUrl}
                className="flex-1 px-3.5 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 truncate"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="px-3.5 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition flex items-center gap-1.5 shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5 text-white" />}
                {copied ? '¡Copiado!' : 'Copiar'}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5">
              Consejo: Abre este enlace en una pestaña de incógnito u otro navegador e inicia sesión para probar la sincronización en vivo.
            </p>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition"
            >
              Entendido
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
