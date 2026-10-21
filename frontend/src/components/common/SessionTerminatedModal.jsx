import React from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, LogIn } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export const SessionTerminatedModal = () => {
  const { sessionTerminatedMsg, dismissSessionModal } = useAuth();
  const navigate = useNavigate();

  if (!sessionTerminatedMsg) return null;

  const handleReLogin = () => {
    dismissSessionModal();
    navigate("/login");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-rose-100 text-center space-y-4 animate-scale-up">
        <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center shadow-inner">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div>
          <h3 className="text-xl font-bold text-slate-900">Session Terminated</h3>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            {sessionTerminatedMsg}
          </p>
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 text-left">
            <span className="font-semibold">Security Policy:</span> To protect courses and accounts, only one active device session is permitted at a time. Authenticate again on this device to continue learning.
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={handleReLogin}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all"
          >
            <LogIn className="w-4 h-4" />
            Log In on This Device
          </button>
        </div>
      </div>
    </div>
  );
};
