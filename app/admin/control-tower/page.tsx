"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Zap, Users, Target, TrendingUp, LogOut, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProductLatamLogo } from "@/components/ProductLatamLogo";
import { authStore } from "@/app/lib/authStore";

interface Statistics {
  totalCandidates: number;
  activeJobs: number;
  matchRate: number;
}

export default function ControlTowerPage() {
  const router = useRouter();
  const [statistics, setStatistics] = useState<Statistics>({
    totalCandidates: 0,
    activeJobs: 0,
    matchRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [activationStatus, setActivationStatus] = useState<string | null>(null);

  useEffect(() => {
    // Verificar autenticación
    async function checkAuth() {
      const session = await authStore.getSession();
      if (!session || session.role !== "admin") {
        router.push("/solicitante/login-simulado");
        return;
      }

      fetchStatistics();
    }
    checkAuth();
  }, [router]);

  const fetchStatistics = async () => {
    try {
      const response = await fetch("/api/admin/control-tower/stats");
      if (!response.ok) {
        throw new Error("Error al cargar estadísticas");
      }
      const data = await response.json();
      setStatistics(data);
    } catch (error) {
      console.error("Error fetching statistics:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleActivateAgent = async () => {
    if (activating) return;

    setActivating(true);
    setActivationStatus("Iniciando agente...");

    try {
      const response = await fetch("/api/admin/control-tower/activate", {
        method: "POST",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al activar el agente");
      }

      const data = await response.json();
      setActivationStatus(
        `✅ Agente activado. ${data.processed || 0} matches procesados.`
      );

      // Refrescar estadísticas después de un delay
      setTimeout(() => {
        fetchStatistics();
      }, 2000);
    } catch (error: any) {
      console.error("Error activating agent:", error);
      setActivationStatus(`❌ Error: ${error.message}`);
    } finally {
      setActivating(false);
      // Limpiar el mensaje después de 5 segundos
      setTimeout(() => {
        setActivationStatus(null);
      }, 5000);
    }
  };

  const handleLogout = async () => {
    window.location.href = "/api/auth/logout";
  };

  const handleBack = () => {
    router.push("/admin/solicitudes");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-100 via-purple-100 to-indigo-200">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-700">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 py-8 relative bg-gradient-to-b from-blue-100 via-purple-100 to-indigo-200">
      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <Button
              onClick={handleBack}
              variant="outline"
              className="gap-2 h-10 px-4 rounded-xl border border-gray-300 text-gray-700 bg-white/80 hover:bg-white active:bg-gray-100 transition-all duration-200"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>
            <h2 className="text-gray-800 text-lg font-medium">Admin</h2>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="gap-2 h-10 px-4 rounded-xl border border-gray-300 text-gray-700 bg-white/80 hover:bg-white active:bg-gray-100 transition-all duration-200"
          >
            <LogOut className="h-4 w-4" />
            Cerrar Sesión
          </Button>
        </motion.div>

        {/* Logo and Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex flex-col items-center space-y-6"
        >
          <ProductLatamLogo />
          <h1 className="text-5xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-pink-600 bg-clip-text text-transparent">
            Control Tower
          </h1>
        </motion.div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Agent Recruiter Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="backdrop-blur-[130px] bg-white/40 border border-white/50 rounded-3xl shadow-xl p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-full bg-gradient-to-r from-pink-500 to-purple-500">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-gray-800">
                    Agent Recruiter
                  </h2>
                  <p className="text-gray-600 text-sm">
                    Sistema inteligente de matching automático
                  </p>
                </div>
              </div>

              <p className="text-gray-700 mb-6 leading-relaxed">
                El Agent Recruiter analiza todas las solicitudes activas y
                encuentra automáticamente los mejores candidatos de la comunidad
                basándose en sus perfiles, experiencia y recomendaciones previas.
              </p>

              <Button
                onClick={handleActivateAgent}
                disabled={activating}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 active:from-pink-700 active:to-purple-700 text-white rounded-xl h-12 gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {activating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Activando...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" />
                    Activar Agent Recruiter
                  </>
                )}
              </Button>

              {activationStatus && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-sm"
                >
                  {activationStatus}
                </motion.div>
              )}
            </Card>
          </motion.div>

          {/* Right: Statistics Cards */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="space-y-4"
          >
            {/* Total Candidatos */}
            <Card className="backdrop-blur-[130px] bg-white/40 border border-white/50 rounded-2xl shadow-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm mb-1">Total Candidatos</p>
                  <p className="text-3xl font-bold text-gray-800">
                    {statistics.totalCandidates.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-blue-100">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </Card>

            {/* Solicitudes Activas */}
            <Card className="backdrop-blur-[130px] bg-white/40 border border-white/50 rounded-2xl shadow-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm mb-1">
                    Solicitudes Activas
                  </p>
                  <p className="text-3xl font-bold text-gray-800">
                    {statistics.activeJobs}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-purple-100">
                  <Target className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </Card>

            {/* Tasa de Match */}
            <Card className="backdrop-blur-[130px] bg-white/40 border border-white/50 rounded-2xl shadow-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm mb-1">Tasa de Match</p>
                  <p className="text-3xl font-bold text-gray-800">
                    {statistics.matchRate.toFixed(1)}%
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-green-100">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

