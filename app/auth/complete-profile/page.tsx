"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Building, Briefcase, Save, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ProductLatamLogo } from "@/components/ProductLatamLogo";
import { authStore } from "@/app/lib/authStore";

function CompleteProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [currentCompany, setCurrentCompany] = useState("");
  const [currentJobTitle, setCurrentJobTitle] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkSession() {
      const currentSession = await authStore.getSession();
      if (!currentSession) {
        router.push("/solicitante/login-simulado");
        return;
      }
      setSession(currentSession);
    }
    checkSession();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!currentCompany.trim()) {
      setError("Por favor ingresa tu empresa actual");
      return;
    }

    if (!currentJobTitle.trim()) {
      setError("Por favor ingresa tu cargo actual");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/complete-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentCompany: currentCompany.trim(),
          currentJobTitle: currentJobTitle.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al guardar la información");
      }

      const data = await response.json();
      
      // Redirigir según el rol
      if (session?.role === "admin") {
        router.push("/admin/solicitudes");
      } else if (session?.role === "hyperconnector") {
        router.push("/hyperconnector/jobs-home");
      } else {
        router.push("/solicitante/solicitudes");
      }
    } catch (error: any) {
      console.error("Error completing profile:", error);
      setError(error.message || "Error al guardar la información");
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-100 via-purple-100 to-indigo-200">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-700">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 via-purple-100 to-indigo-200 flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <Card className="backdrop-blur-[130px] bg-white/95 border-2 border-blue-200/50 rounded-3xl shadow-2xl p-8">
          <div className="text-center mb-6">
            <ProductLatamLogo className="justify-center mb-4" />
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Completa tu Perfil
            </h1>
            <p className="text-gray-600 text-sm">
              Necesitamos algunos datos adicionales para personalizar tu experiencia
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm"
              >
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </motion.div>
            )}

            <div className="space-y-2">
              <label className="text-gray-700 font-medium text-sm flex items-center gap-2">
                <Building className="h-4 w-4 text-blue-600" />
                Empresa Actual <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={currentCompany}
                onChange={(e) => setCurrentCompany(e.target.value)}
                placeholder="Ej: Product Latam"
                className="h-12 rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label className="text-gray-700 font-medium text-sm flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-blue-600" />
                Cargo Actual <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={currentJobTitle}
                onChange={(e) => setCurrentJobTitle(e.target.value)}
                placeholder="Ej: CEO & Founder"
                className="h-12 rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                required
                disabled={loading}
              />
            </div>

            <Button
              type="submit"
              disabled={loading || !currentCompany.trim() || !currentJobTitle.trim()}
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar y Continuar
                </>
              )}
            </Button>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}

export default function CompleteProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-100 via-purple-100 to-indigo-200">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-700">Cargando...</p>
          </div>
        </div>
      }
    >
      <CompleteProfileContent />
    </Suspense>
  );
}

