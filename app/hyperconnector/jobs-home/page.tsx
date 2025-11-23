"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Clock, LogOut, CheckCircle2, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { ProductLatamLogo } from "@/components/ProductLatamLogo";
import { authStore } from "../../lib/authStore";

interface OwnerCandidate {
  id: string;
  full_name: string;
  current_company: string | null;
  email?: string | null;
}

interface Recommendation {
  id: string;
  candidate_id: string | null;
  letter_q1: string | null;
  letter_q2: string | null;
  linkedin_url: string | null;
  candidate?: {
    full_name: string;
    current_company: string | null;
  } | null;
  created_at: string;
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
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [showRecommendationsDialog, setShowRecommendationsDialog] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

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

  const handleJobClick = async (jobId: string) => {
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

    // Obtener recomendaciones del hyperconnector para este job
    setSelectedJobId(jobId);
    setLoadingRecommendations(true);
    setShowRecommendationsDialog(true);

    try {
      const response = await fetch(`/api/jobs/${jobId}/recommendations`);
      if (response.ok) {
        const data = await response.json();
        // Filtrar solo las recomendaciones del hyperconnector actual
        const myRecs = (data.recommendations || []).filter(
          (rec: any) => rec.hyperconnector_id === currentHyperconnectorId
        );
        setRecommendations(myRecs);
      } else {
        setRecommendations([]);
      }
    } catch (err) {
      console.error("Error fetching recommendations:", err);
      setRecommendations([]);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const handleCreateNewRecommendation = async (jobId: string) => {
    let currentHyperconnectorId = hyperconnectorId;
    
    if (!currentHyperconnectorId) {
      const session = await authStore.getSession();
      if (!session || !session.hyperconnectorId) {
        setError("No se pudo identificar el hyperconnector");
        return;
      }
      currentHyperconnectorId = session.hyperconnectorId;
    }
    
    try {
      // Generar nuevo token para este job
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
        setShowRecommendationsDialog(false);
        router.push(`/recommend/${newToken}`);
      } else {
        console.error("Error generating token");
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
          <h2 className="text-gray-800 text-lg font-medium">
            Bienvenida {firstName}
          </h2>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="gap-2 h-10 px-4 rounded-xl border border-gray-300 text-gray-700 bg-white/80 hover:bg-white"
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
                        onClick={() => handleJobClick(job.id)}
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
                          {job.myRecommendationsCount && job.myRecommendationsCount > 0 ? (
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

      {/* Modal de Recomendaciones */}
      <AnimatePresence>
        {showRecommendationsDialog && selectedJobId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setShowRecommendationsDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-2xl font-semibold text-gray-800">
                  Mis Recomendaciones
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowRecommendationsDialog(false)}
                  className="rounded-full"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {loadingRecommendations ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                  </div>
                ) : recommendations.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-600 text-lg mb-4">
                      Aún no has hecho recomendaciones para este puesto.
                    </p>
                    <Button
                      onClick={() => handleCreateNewRecommendation(selectedJobId)}
                      className="bg-purple-500 hover:bg-purple-600 text-white rounded-xl gap-2"
                    >
                      <Send className="h-4 w-4" />
                      Hacer Primera Recomendación
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {recommendations.map((rec, index) => (
                      <motion.div
                        key={rec.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card className="p-6 border border-gray-200">
                          <div className="space-y-4">
                            {/* Candidato o LinkedIn URL */}
                            {rec.candidate ? (
                              <div>
                                <h3 className="text-lg font-semibold text-gray-800 mb-1">
                                  {rec.candidate.full_name}
                                </h3>
                                {rec.candidate.current_company && (
                                  <p className="text-gray-600 text-sm">
                                    {rec.candidate.current_company}
                                  </p>
                                )}
                              </div>
                            ) : rec.linkedin_url ? (
                              <div>
                                <h3 className="text-lg font-semibold text-gray-800 mb-1">
                                  Recomendación Personalizada
                                </h3>
                                <a
                                  href={rec.linkedin_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 text-sm hover:underline"
                                >
                                  {rec.linkedin_url}
                                </a>
                              </div>
                            ) : null}

                            {/* Preguntas y Respuestas */}
                            {rec.letter_q1 && (
                              <div className="bg-gray-50 rounded-xl p-4">
                                <p className="text-gray-600 text-sm font-semibold mb-2">
                                  1. ¿Cuál es el superpoder de esta persona?
                                </p>
                                <p className="text-gray-700 leading-relaxed">
                                  {rec.letter_q1}
                                </p>
                              </div>
                            )}

                            {rec.letter_q2 && (
                              <div className="bg-gray-50 rounded-xl p-4">
                                <p className="text-gray-600 text-sm font-semibold mb-2">
                                  2. Describe una situación en la que esta persona haya aplicado el super poder.
                                </p>
                                <p className="text-gray-700 leading-relaxed">
                                  {rec.letter_q2}
                                </p>
                              </div>
                            )}
                          </div>
                        </Card>
                      </motion.div>
                    ))}

                    {/* Botón para agregar más recomendaciones */}
                    <div className="pt-4">
                      <Button
                        onClick={() => handleCreateNewRecommendation(selectedJobId)}
                        className="w-full bg-purple-500 hover:bg-purple-600 text-white rounded-xl gap-2 h-12"
                      >
                        <Send className="h-4 w-4" />
                        Agregar Otra Recomendación
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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
