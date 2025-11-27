"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Clock, LogOut, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ProductLatamLogo } from "@/components/ProductLatamLogo";
import { authStore } from "../../lib/authStore";
import { getJobStatusConfig, getJobStatusLabel, getJobStatusDotColor } from "@/src/utils/jobStatus";

interface OwnerCandidate {
  id: string;
  full_name: string;
  current_company: string | null;
  email?: string | null;
}

interface Job {
  id: string;
  company_name: string;
  job_title?: string;
  role_title?: string;
  description?: string | null;
  owner_role?: string | null;
  owner_candidate_id?: string | null;
  eligibleCandidatesCount: number;
  bestMatchScore: number | null;
  ownerCandidate: OwnerCandidate | null;
  myRecommendationsCount?: number;
  status?: string;
}

interface Hyperconnector {
  id: string;
  full_name: string;
}

function HyperconnectorJobsHomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [hyperconnector, setHyperconnector] = useState<Hyperconnector | null>(null);
  const [hyperconnectorId, setHyperconnectorId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchJobs() {
      try {
        let response: Response;
        let result: any;

        // Si hay token, usar el endpoint con token (desde WhatsApp)
        if (token) {
          response = await fetch(`/api/hyperconnector/token/${token}/jobs`);
          if (!response.ok) {
            const errorData = await response.json();
            setError(errorData.error || "Error al cargar los jobs");
            return;
          }
          result = await response.json();
        } else {
          // Si no hay token, usar la sesión (login directo)
          const session = await authStore.getSession();
          if (!session || session.role !== "hyperconnector" || !session.hyperconnectorId) {
            setError("No estás autenticado. Por favor inicia sesión.");
            setLoading(false);
            router.push("/solicitante/login-simulado");
            return;
          }

          response = await fetch(`/api/hyperconnector/id/${session.hyperconnectorId}/jobs`);
          if (!response.ok) {
            const errorData = await response.json();
            setError(errorData.error || "Error al cargar los jobs");
            return;
          }
          result = await response.json();
        }

        setJobs(result.jobs || []);
        setHyperconnector(result.hyperconnector || null);
        setHyperconnectorId(result.hyperconnectorId || null);
      } catch (err: any) {
        setError("Error al cargar los jobs");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchJobs();
  }, [token, router]);

  const handleJobClick = async (jobId: string, hasRecommendations: boolean) => {
    let currentHyperconnectorId = hyperconnectorId;
    
    // Si no hay hyperconnectorId del token, obtenerlo de la sesión
    if (!currentHyperconnectorId) {
      const session = await authStore.getSession();
      if (!session || !session.hyperconnectorId) {
        setError("No se pudo identificar el hyperconnector");
        return;
      }
      currentHyperconnectorId = session.hyperconnectorId;
    }

    // Si ya hay recomendaciones, redirigir directamente a la página de recomendación
    if (hasRecommendations) {
      try {
        // Generar token para este job
        const newTokenResponse = await fetch(`/api/hyperconnector/generate-token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            hyperconnectorId: currentHyperconnectorId,
            jobId,
          }),
        });
        
        if (newTokenResponse.ok) {
          const { token: newToken } = await newTokenResponse.json();
          router.push(`/recommend/${newToken}`);
        }
      } catch (error) {
        console.error("Error generating token:", error);
      }
      return;
    }

    // Si no hay recomendaciones, mostrar modal o redirigir a crear recomendación
    // Por ahora, redirigir directamente a crear recomendación
    try {
      const newTokenResponse = await fetch(`/api/hyperconnector/generate-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hyperconnectorId: currentHyperconnectorId,
          jobId,
        }),
      });
      
      if (newTokenResponse.ok) {
        const { token: newToken } = await newTokenResponse.json();
        router.push(`/recommend/${newToken}`);
      }
    } catch (error) {
      console.error("Error generating token:", error);
    }
  };


  const handleLogout = async () => {
    // Redirigir directamente al endpoint de logout que cerrará sesión en LinkedIn también
    window.location.href = "/api/auth/logout";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-200 via-purple-200 to-indigo-300">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-700">Cargando solicitudes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-200 via-purple-200 to-indigo-300">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <p className="text-gray-800 text-lg">{error}</p>
        </div>
      </div>
    );
  }

  const hyperconnectorName = hyperconnector?.full_name || "Usuario";
  const firstName = hyperconnectorName.split(" ")[0];

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
          <div className="bg-blue-400 border border-white rounded-2xl px-5 py-2.5 shadow-md">
            <p className="text-white font-medium">Hola {firstName}</p>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="gap-2 h-10 px-4 rounded-2xl border border-white text-white bg-indigo-400 hover:bg-indigo-500 active:bg-indigo-600 transition-all duration-200"
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
          {/* Logo */}
          <ProductLatamLogo />

          {/* Title with gradient */}
          <h1 className="text-5xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-pink-600 bg-clip-text text-transparent">
            Hiperconector
          </h1>

          {/* Description */}
          <p className="text-gray-700 text-center max-w-2xl text-lg">
            Otros miembros de la comunidad están buscando a estas personas de tu red, ayúdales con una recomendación.
          </p>
        </motion.div>

        {/* Main Content - Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="backdrop-blur-[130px] bg-white/40 border border-white/50 rounded-3xl shadow-xl p-8"
        >
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">
            Solicitudes de Recomendación ({jobs.length})
          </h2>

          {jobs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">
                No hay solicitudes disponibles con candidatos elegibles en este momento.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-300/50">
                    <th className="text-left py-4 px-4 text-gray-600 font-medium text-sm">Perfil Solicitado</th>
                    <th className="text-left py-4 px-4 text-gray-600 font-medium text-sm">Descripción de Rol</th>
                    <th className="text-left py-4 px-4 text-gray-600 font-medium text-sm">Quien Solicita</th>
                    <th className="text-left py-4 px-4 text-gray-600 font-medium text-sm">Puesto</th>
                    <th className="text-left py-4 px-4 text-gray-600 font-medium text-sm">Empresa</th>
                    <th className="text-left py-4 px-4 text-gray-600 font-medium text-sm">Estatus</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job, index) => {
                    const jobTitle = job.job_title || job.role_title || "Posición";
                    const ownerName = job.ownerCandidate?.full_name || "N/A";
                    const ownerPosition = job.owner_role || "N/A";
                    const companyName = job.company_name || "N/A";
                    const description = job.description || "Sin descripción";

                    return (
                      <motion.tr
                        key={job.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.1 }}
                        onClick={() => handleJobClick(job.id, (job.myRecommendationsCount || 0) > 0)}
                        className="border-b border-gray-200/50 hover:bg-white/30 cursor-pointer transition-colors"
                      >
                        <td className="py-4 px-4">
                          <span className="text-gray-800 font-medium">{jobTitle}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-gray-700 text-sm">{description}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-gray-800">{ownerName}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-gray-700">{ownerPosition}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-gray-700">{companyName}</span>
                        </td>
                        <td className="py-4 px-4">
                          {job.status ? (
                            <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border ${getJobStatusConfig(job.status).bgColor} ${getJobStatusConfig(job.status).borderColor} ${getJobStatusConfig(job.status).textColor}`}>
                              <div className={`h-2 w-2 rounded-full ${getJobStatusDotColor(job.status)}`} />
                              <span className="text-sm font-medium">{getJobStatusLabel(job.status)}</span>
                            </div>
                          ) : job.myRecommendationsCount && job.myRecommendationsCount > 0 ? (
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-green-200 to-green-300 border border-green-300/50">
                              <CheckCircle2 className="h-4 w-4 text-green-700" />
                              <span className="text-green-800 text-sm font-medium">
                                {job.myRecommendationsCount} Perfil{job.myRecommendationsCount > 1 ? "es" : ""} Recomendado{job.myRecommendationsCount > 1 ? "s" : ""}
                              </span>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-gray-200 to-orange-200 border border-gray-300/50">
                              <Clock className="h-4 w-4 text-gray-700" />
                              <span className="text-gray-800 text-sm font-medium">Pendiente Recomendación</span>
                            </div>
                          )}
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default function HyperconnectorJobsHomePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-200 via-purple-200 to-indigo-300">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-700">Cargando...</p>
          </div>
        </div>
      }
    >
      <HyperconnectorJobsHomeContent />
    </Suspense>
  );
}
