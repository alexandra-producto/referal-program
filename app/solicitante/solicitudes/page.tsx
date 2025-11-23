"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Building, Plus, LogOut, Eye, List, Grid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProductLatamLogo } from "@/components/ProductLatamLogo";
import { authStore } from "@/app/lib/authStore";

interface Job {
  id: string;
  job_title: string;
  description: string | null;
  company_name: string;
  status: string;
  created_at: string;
  recommendations_count: number;
}

type ViewMode = "lista" | "tarjetas";

export default function MisSolicitudesPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("lista");

  useEffect(() => {
    // Verificar autenticación
    async function checkAuth() {
      const currentSession = await authStore.getSession();
      if (!currentSession || currentSession.role !== "solicitante" || !currentSession.candidateId) {
        router.push("/solicitante/login-simulado");
        return;
      }

      setSession(currentSession);
      fetchJobs(currentSession.candidateId);
    }
    checkAuth();
  }, [router]);

  const fetchJobs = async (candidateId: string) => {
    try {
      const response = await fetch(`/api/jobs?owner_candidate_id=${candidateId}`);
      if (!response.ok) {
        throw new Error("Error al cargar las solicitudes");
      }
      const data = await response.json();
      setJobs(data.jobs || []);
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    // Redirigir directamente al endpoint de logout que cerrará sesión en LinkedIn también
    window.location.href = "/api/auth/logout";
  };

  const truncateText = (text: string, maxLength: number) => {
    if (!text) return "";
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
  };

  if (loading) {
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
    <div className="min-h-screen bg-gradient-to-b from-teal-100 via-emerald-100 to-green-200 px-4 py-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="backdrop-blur-[130px] bg-white/40 border border-white/50 rounded-2xl px-4 py-2 shadow-lg">
              <p className="text-gray-800 font-medium">
                Bienvenido {session?.fullName || "Usuario"}
              </p>
            </div>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="gap-2 h-10 px-4 rounded-xl border border-gray-300 text-gray-700 bg-white/80 hover:bg-white backdrop-blur-sm"
          >
            <LogOut className="h-4 w-4" />
            Cerrar Sesión
          </Button>
        </motion.div>

        {/* Logo and Title Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex flex-col items-center space-y-6"
        >
          <ProductLatamLogo className="justify-center" />

          {/* Title with gradient */}
          <h1 className="text-5xl font-bold bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-600 bg-clip-text text-transparent">
            Mis Solicitudes
          </h1>

          {/* Description */}
          <p className="text-gray-700 text-center max-w-2xl text-lg">
            Aquí puedes ver todas las solicitudes que has realizado y las recomendaciones que has recibido
          </p>

          {/* Create Button - Centered */}
          <div className="flex justify-center pt-4">
            <Button
              onClick={() => router.push("/solicitante/crear")}
              className="bg-teal-500 hover:bg-teal-600 text-white rounded-xl flex items-center gap-2 px-6 shadow-lg h-12"
            >
              <Plus className="h-5 w-5" />
              Solicitar Recomendación
            </Button>
          </div>
        </motion.div>

        {/* Jobs List/Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {jobs.length === 0 ? (
            <Card className="backdrop-blur-[130px] bg-white/40 border border-white/50 rounded-3xl shadow-xl p-12 text-center">
              <p className="text-gray-700 text-lg">
                No tienes solicitudes aún. Crea tu primera solicitud haciendo clic en "Obtener Recomendación".
              </p>
            </Card>
          ) : viewMode === "lista" ? (
            /* Table View */
            <Card className="backdrop-blur-[130px] bg-white/40 border border-white/50 rounded-3xl shadow-xl overflow-hidden relative">
            {/* View Mode Toggle - Top Right */}
            <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
              <Button
                onClick={() => setViewMode("lista")}
                variant="default"
                className="rounded-xl h-9 bg-teal-500 text-white"
              >
                <List className="h-4 w-4 mr-2" />
                Lista
              </Button>
              <Button
                onClick={() => setViewMode("tarjetas")}
                variant="outline"
                className="rounded-xl h-9 bg-white/80 text-gray-700 border-gray-300 backdrop-blur-sm"
              >
                <Grid className="h-4 w-4 mr-2" />
                Tarjetas
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-teal-100/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-gray-800 font-semibold">Perfil Solicitado</th>
                    <th className="px-6 py-4 text-left text-gray-800 font-semibold">Descripción de Rol</th>
                    <th className="px-6 py-4 text-left text-gray-800 font-semibold">Empresa</th>
                    <th className="px-6 py-4 text-left text-gray-800 font-semibold">Recomendaciones</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job, index) => (
                    <motion.tr
                      key={job.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="border-t border-gray-200/50 hover:bg-white/30"
                    >
                      <td className="px-6 py-4">
                        <p className="text-gray-800 font-medium">{job.job_title}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-gray-700">{truncateText(job.description || "", 80)}</p>
                        <button className="text-gray-500 text-sm mt-1 flex items-center gap-1 hover:text-gray-700">
                          <Eye className="h-3 w-3" />
                          Ver detalles
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-gray-700">
                          <Building className="h-4 w-4" />
                          <span>{job.company_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Button
                          variant="outline"
                          className="bg-teal-500 hover:bg-teal-600 text-white border-teal-500 rounded-xl"
                        >
                          Ver {job.recommendations_count}
                        </Button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ) : (
          /* Cards View */
          <div className="relative">
            {/* View Mode Toggle - Top Right */}
            <div className="absolute top-0 right-0 z-10 flex items-center gap-2 mb-4">
              <Button
                onClick={() => setViewMode("lista")}
                variant="outline"
                className="rounded-xl h-9 bg-white/80 text-gray-700 border-gray-300 backdrop-blur-sm"
              >
                <List className="h-4 w-4 mr-2" />
                Lista
              </Button>
              <Button
                onClick={() => setViewMode("tarjetas")}
                variant="default"
                className="rounded-xl h-9 bg-teal-500 text-white"
              >
                <Grid className="h-4 w-4 mr-2" />
                Tarjetas
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-12">
            {jobs.map((job, index) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card className="backdrop-blur-[130px] bg-white/40 border border-white/50 rounded-3xl shadow-xl p-6 h-full flex flex-col">
                  <h3 className="text-gray-800 font-semibold text-xl mb-3">{job.job_title}</h3>
                  <p className="text-gray-700 text-sm mb-4 flex-1">
                    {truncateText(job.description || "", 120)}
                  </p>
                  <div className="flex items-center gap-2 text-gray-600 mb-4">
                    <Building className="h-4 w-4" />
                    <span className="text-sm">{job.company_name}</span>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full bg-teal-500 hover:bg-teal-600 text-white border-teal-500 rounded-xl"
                  >
                    Ver {job.recommendations_count} recomendaciones
                  </Button>
                </Card>
              </motion.div>
            ))}
            </div>
          </div>
        )}
        </motion.div>
      </div>
    </div>
  );
}

