"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Building, LogOut, List, Grid, Plus, Zap, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProductLatamLogo } from "@/components/ProductLatamLogo";
import { authStore } from "@/app/lib/authStore";
import { getJobStatusConfig, getJobStatusLabel, getJobStatusDotColor } from "@/src/utils/jobStatus";

interface OwnerCandidate {
  id: string;
  full_name: string;
  current_company: string | null;
  current_job_title: string | null;
}

interface Job {
  id: string;
  job_title: string;
  description: string | null;
  company_name: string;
  status: string; // Status viene directamente de jobs.status
  owner_candidate_id: string | null;
  owner_role_title: string | null;
  created_at: string;
  recommendations_count: number;
  potential_candidates_count: number;
  ownerCandidate: OwnerCandidate | null;
}

type ViewMode = "lista" | "grid";

export default function AdminSolicitudesPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("lista");
  const [navigating, setNavigating] = useState<string | null>(null);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    // Verificar autenticación
    async function checkAuth() {
      try {
        console.log("🔍 [Admin Solicitudes] Verificando autenticación...");
        const currentSession = await authStore.getSession();
        console.log("🔍 [Admin Solicitudes] Sesión obtenida:", currentSession ? { role: currentSession.role, userId: currentSession.userId } : "null");
        
        if (!currentSession || currentSession.role !== "admin") {
          console.warn("⚠️ [Admin Solicitudes] No autorizado, redirigiendo a login");
          router.push("/login");
          return;
        }
        
        console.log("✅ [Admin Solicitudes] Autenticación exitosa");
        setSession(currentSession);
        await fetchJobs();
      } catch (error) {
        console.error("❌ [Admin Solicitudes] Error en checkAuth:", error);
        setLoading(false);
      }
    }
    checkAuth();
  }, [router]);

  const fetchJobs = async () => {
    try {
      console.log("📡 [Admin Solicitudes] Iniciando fetch de jobs...");
      const response = await fetch("/api/jobs/all", {
        credentials: "include", // Asegurar que las cookies se envíen
      });
      
      console.log("📡 [Admin Solicitudes] Respuesta recibida:", response.status, response.ok);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("❌ [Admin Solicitudes] Error en respuesta:", response.status, errorData);
        throw new Error(errorData.error || `Error al cargar las solicitudes (${response.status})`);
      }
      
      const data = await response.json();
      console.log("✅ [Admin Solicitudes] Jobs obtenidos:", data.jobs?.length || 0);
      setJobs(data.jobs || []);
    } catch (error) {
      console.error("❌ [Admin Solicitudes] Error fetching jobs:", error);
      // Mostrar error al usuario pero no bloquear la UI
      setJobs([]);
    } finally {
      console.log("✅ [Admin Solicitudes] Finalizando loading");
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    // Redirigir directamente al endpoint de logout que cerrará sesión en LinkedIn también
    window.location.href = "/api/auth/logout";
  };

  const handleViewRecommendations = (jobId: string) => {
    setNavigating(`recommendations-${jobId}`);
    router.push(`/admin/solicitudes/${jobId}/recomendaciones`);
  };

  const handleViewPotentialCandidates = (jobId: string) => {
    setNavigating(`candidates-${jobId}`);
    router.push(`/admin/solicitudes/${jobId}/candidatos-potenciales`);
  };

  const handleNavigateToCreate = () => {
    setNavigating("create");
    router.push("/solicitante/crear");
  };

  const handleNavigateToControlTower = () => {
    setNavigating("control-tower");
    router.push("/admin/control-tower");
  };

  const getStatusColor = (status: string) => {
    const { bgColor, borderColor, textColor } = getJobStatusConfig(status);
    return `${bgColor} ${borderColor} ${textColor} border`;
  };

  const getStatusText = (status: string) => {
    return getJobStatusLabel(status);
  };

  const getStatusDot = (status: string) => {
    return getJobStatusDotColor(status);
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
    <div className="min-h-screen bg-gradient-to-b from-orange-100 via-red-100 to-amber-200 px-4 py-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="bg-orange-400 border border-white rounded-2xl px-5 py-2.5 shadow-md">
              <p className="text-white font-medium">Hola {session?.fullName?.split(" ")[0] || "Admin"}</p>
            </div>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="gap-2 h-10 px-4 rounded-2xl border border-white text-white bg-amber-400 hover:bg-amber-500 active:bg-amber-600 transition-all duration-200"
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
          <h1 className="text-5xl font-bold bg-gradient-to-r from-orange-500 via-red-500 to-orange-600 bg-clip-text text-transparent">
            Todas las Solicitudes
          </h1>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="space-y-4"
        >

          <div className="flex items-center justify-between">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setViewMode("lista")}
                variant={viewMode === "lista" ? "default" : "outline"}
                size="icon"
                className={`rounded-xl transition-all duration-200 ${
                  viewMode === "lista"
                    ? "bg-orange-500 text-white hover:bg-orange-600 active:bg-orange-700"
                    : "bg-white/80 text-gray-700 border-gray-300 backdrop-blur-sm hover:bg-white active:bg-gray-100"
                }`}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => setViewMode("grid")}
                variant={viewMode === "grid" ? "default" : "outline"}
                size="icon"
                className={`rounded-xl transition-all duration-200 ${
                  viewMode === "grid"
                    ? "bg-orange-500 text-white hover:bg-orange-600 active:bg-orange-700"
                    : "bg-white/80 text-gray-700 border-gray-300 backdrop-blur-sm hover:bg-white active:bg-gray-100"
                }`}
              >
                <Grid className="h-4 w-4" />
              </Button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <Button 
                onClick={handleNavigateToCreate}
                disabled={navigating === "create"}
                className="bg-orange-500 hover:bg-orange-600 active:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl flex items-center gap-2 shadow-lg transition-all duration-200"
              >
                {navigating === "create" ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Cargando...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Solicitar Recomendación
                  </>
                )}
              </Button>
              <Button
                onClick={handleNavigateToControlTower}
                disabled={navigating === "control-tower"}
                className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 active:from-pink-700 active:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl flex items-center gap-2 shadow-lg transition-all duration-200"
              >
                {navigating === "control-tower" ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Cargando...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" />
                    Control Tower
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Jobs List/Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          {jobs.length === 0 ? (
            <Card className="backdrop-blur-[130px] bg-white/40 border border-white/50 rounded-3xl shadow-xl p-12 text-center">
              <p className="text-gray-700 text-lg">
                No hay solicitudes en el sistema.
              </p>
            </Card>
          ) : viewMode === "lista" ? (
            /* Table View */
            <Card className="backdrop-blur-[130px] bg-white/40 border border-white/50 rounded-3xl shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-orange-100/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-gray-800 font-semibold">Perfil Solicitado</th>
                    <th className="px-6 py-4 text-left text-gray-800 font-semibold">Descripción de Rol</th>
                    <th className="px-6 py-4 text-left text-gray-800 font-semibold">Quien Solicita</th>
                    <th className="px-6 py-4 text-left text-gray-800 font-semibold">Puesto</th>
                    <th className="px-6 py-4 text-left text-gray-800 font-semibold">Empresa</th>
                    <th className="px-6 py-4 text-left text-gray-800 font-semibold">Estado</th>
                    <th className="px-6 py-4 text-left text-gray-800 font-semibold">Matches</th>
                    <th className="px-6 py-4 text-left text-gray-800 font-semibold">Recomendaciones</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job, index) => (
                    <motion.tr
                      key={job.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="border-t border-gray-200/50 hover:bg-white/30"
                    >
                      <td className="px-6 py-4">
                        <p className="text-gray-800 font-medium">{job.job_title}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-gray-700">{truncateText(job.description || "", 60)}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-gray-700">
                          {job.ownerCandidate?.full_name || "N/A"}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-gray-700">
                          {job.owner_role_title || job.ownerCandidate?.current_job_title || "N/A"}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-gray-700">
                          <Building className="h-4 w-4" />
                          <span>{job.company_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${getStatusColor(job.status)}`}>
                          <div className={`h-2 w-2 rounded-full ${getStatusDot(job.status)}`} />
                          <span className="text-sm font-medium">{getStatusText(job.status)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Button
                          onClick={() => handleViewPotentialCandidates(job.id)}
                          disabled={job.potential_candidates_count === 0 || navigating === `candidates-${job.id}`}
                          variant="outline"
                          className={`rounded-xl transition-all duration-200 ${
                            job.potential_candidates_count === 0
                              ? "bg-gray-300 text-gray-500 border-gray-300 cursor-not-allowed"
                              : "bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white border-blue-500"
                          }`}
                        >
                          {navigating === `candidates-${job.id}` ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                              Cargando...
                            </>
                          ) : (
                            `Ver ${job.potential_candidates_count}`
                          )}
                        </Button>
                      </td>
                      <td className="px-6 py-4">
                        <Button
                          onClick={() => handleViewRecommendations(job.id)}
                          disabled={job.recommendations_count === 0 || navigating === `recommendations-${job.id}`}
                          variant="outline"
                          className={`rounded-xl transition-all duration-200 ${
                            job.recommendations_count === 0
                              ? "bg-gray-300 text-gray-500 border-gray-300 cursor-not-allowed"
                              : "bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white border-orange-500"
                          }`}
                        >
                          {navigating === `recommendations-${job.id}` ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                              Cargando...
                            </>
                          ) : (
                            `Ver ${job.recommendations_count}`
                          )}
                        </Button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ) : (
          /* Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job, index) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card className="backdrop-blur-[130px] bg-white/40 border border-white/50 rounded-3xl shadow-xl p-6 h-full flex flex-col">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-gray-800 font-semibold text-xl flex-1">{job.job_title}</h3>
                  </div>

                  <p className="text-gray-600 text-sm mb-4 flex-1">
                    {truncateText(job.description || "", 100)}
                  </p>

                  <div className="space-y-2 mb-4">
                    <div className="text-gray-700 text-sm">
                      <span className="font-medium">Solicitante:</span>{" "}
                      {job.ownerCandidate?.full_name || "N/A"}
                    </div>
                    <div className="text-gray-700 text-sm">
                      <span className="font-medium">Puesto:</span>{" "}
                      {job.owner_role_title || job.ownerCandidate?.current_job_title || "N/A"}
                    </div>
                    <div className="text-gray-700 text-sm flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      <span className="font-medium">Empresa:</span> {job.company_name}
                    </div>
                  </div>

                  <Button
                    onClick={() => handleViewPotentialCandidates(job.id)}
                    disabled={job.potential_candidates_count === 0 || navigating === `candidates-${job.id}`}
                    className={`w-full rounded-xl mb-3 transition-all duration-200 ${
                      job.potential_candidates_count === 0
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white"
                    }`}
                  >
                    {navigating === `candidates-${job.id}` ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Cargando...
                      </>
                    ) : (
                      `Ver ${job.potential_candidates_count} Candidatos Potenciales`
                    )}
                  </Button>
                  <Button
                    onClick={() => handleViewRecommendations(job.id)}
                    disabled={job.recommendations_count === 0 || navigating === `recommendations-${job.id}`}
                    className={`w-full rounded-xl mb-3 transition-all duration-200 ${
                      job.recommendations_count === 0
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white"
                    }`}
                  >
                    {navigating === `recommendations-${job.id}` ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Cargando...
                      </>
                    ) : (
                      `Ver ${job.recommendations_count} Recomendaciones`
                    )}
                  </Button>

                  <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${getStatusColor(job.status)}`}>
                    <div className={`h-2 w-2 rounded-full ${getStatusDot(job.status)}`} />
                    <span className="text-sm font-medium">{getStatusText(job.status)}</span>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
        </motion.div>
      </div>
    </div>
  );
}

