"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Linkedin, Zap, Search, HelpCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductLatamLogo } from "@/components/ProductLatamLogo";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam) {
      switch (errorParam) {
        case "linkedin_auth_failed":
          setError("Error al autenticar con LinkedIn. Por favor intenta de nuevo.");
          break;
        case "missing_params":
          setError("Faltan parámetros en la respuesta de LinkedIn.");
          break;
        case "invalid_state":
          setError("Solicitud inválida. Por favor intenta de nuevo.");
          break;
        case "unauthorized_admin":
          setError("Tu email no está autorizado para acceder como administrador.");
          break;
        case "invalid_role":
          setError("Rol inválido.");
          break;
        case "token_error":
          setError("Error al obtener el token de LinkedIn. Por favor intenta de nuevo.");
          break;
        case "userinfo_error":
          setError("Error al obtener información de tu perfil de LinkedIn. Por favor intenta de nuevo.");
          break;
        case "auth_error":
          setError("Error durante la autenticación. Por favor intenta de nuevo.");
          break;
        default:
          setError("Error al autenticar. Por favor intenta de nuevo.");
      }
      
      // Limpiar el error después de 10 segundos para permitir reintentar
      const timer = setTimeout(() => {
        setError(null);
        // Limpiar el parámetro de error de la URL
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete("error");
        window.history.replaceState({}, "", newUrl.toString());
      }, 10000);
      
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  const handleLinkedInLogin = (role: "admin" | "hyperconnector" | "solicitante") => {
    // Redirigir a la ruta de LinkedIn OAuth
    window.location.href = `/api/auth/linkedin?role=${role}`;
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-purple-100 via-pink-100 to-rose-200 px-4 py-12">
      <div className="max-w-md w-full space-y-8">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex justify-center mb-8"
        >
          <ProductLatamLogo className="justify-center" />
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-center space-y-4"
        >
          <h1 className="text-5xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-pink-600 bg-clip-text text-transparent">
            Programa de Referidos
          </h1>
          <p className="text-gray-700 text-lg">
            Conecta talento con oportunidades y obtén recomendaciones directas de los expertos de la comunidad.
          </p>
        </motion.div>

        {/* Login Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="space-y-4 backdrop-blur-[130px] bg-white/40 border border-white/50 rounded-3xl shadow-xl p-6"
        >
          {/* Admin Button */}
          <Button
            onClick={() => handleLinkedInLogin("admin")}
            className="w-full h-14 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-2xl flex items-center justify-center gap-3 text-lg font-medium shadow-lg"
          >
            <Linkedin className="h-5 w-5" />
            Continuar como Admin
          </Button>

          {/* Hiperconector Button */}
          <Button
            onClick={() => handleLinkedInLogin("hyperconnector")}
            className="w-full h-14 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white rounded-2xl flex items-center justify-center gap-3 text-lg font-medium shadow-lg"
          >
            <Zap className="h-5 w-5" />
            Continuar como Hiperconector
          </Button>

          {/* Solicitante Button */}
          <Button
            onClick={() => handleLinkedInLogin("solicitante")}
            className="w-full h-14 bg-gradient-to-r from-teal-400 to-emerald-500 hover:from-teal-500 hover:to-emerald-600 text-white rounded-2xl flex items-center justify-center gap-3 text-lg font-medium shadow-lg"
          >
            <Search className="h-5 w-5" />
            Continuar como Solicitante
          </Button>
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-red-100/80 backdrop-blur-sm border border-red-300 rounded-2xl p-4 flex items-start gap-3"
          >
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-700 text-sm font-medium">{error}</p>
              <p className="text-red-600 text-xs mt-1">
                Puedes intentar de nuevo haciendo clic en el botón de login.
              </p>
            </div>
            <button
              onClick={() => {
                setError(null);
                const newUrl = new URL(window.location.href);
                newUrl.searchParams.delete("error");
                window.history.replaceState({}, "", newUrl.toString());
              }}
              className="text-red-600 hover:text-red-800 text-sm font-medium"
            >
              ✕
            </button>
          </motion.div>
        )}

        {/* Info Message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="backdrop-blur-[130px] bg-white/40 border border-white/50 rounded-3xl shadow-xl p-4 text-center"
        >
          <p className="text-gray-700 text-sm">
            Inicia sesión con tu cuenta de LinkedIn para acceder a la plataforma.
          </p>
        </motion.div>
      </div>

      {/* Help Button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="fixed bottom-6 right-6"
      >
        <Button
          variant="outline"
          size="icon"
          className="rounded-full w-12 h-12 bg-gray-800 hover:bg-gray-700 text-white border-gray-700"
        >
          <HelpCircle className="h-5 w-5" />
        </Button>
      </motion.div>
    </div>
  );
}

