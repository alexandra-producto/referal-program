"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Building, MapPin, CheckCircle2, HelpCircle, Linkedin, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProductLatamLogo } from "@/components/ProductLatamLogo";
import { authStore } from "@/app/lib/authStore";
import { ImageWithFallback } from "@/components/ImageWithFallback";

interface Candidate {
  id: string;
  full_name: string;
  current_company: string | null;
  current_job_title: string | null;
  email: string | null;
  linkedin_url: string | null;
  profile_picture_url: string | null;
}

interface Hyperconnector {
  id: string;
  full_name: string;
  email: string | null;
  current_company: string | null;
  current_job_title: string | null;
  linkedin_url: string | null;
  profile_picture_url: string | null;
}

interface Recommendation {
  id: string;
  job_id: string;
  candidate_id: string | null;
  hyperconnector_id: string;
  letter_q1: string | null;
  letter_q2: string | null;
  status: string;
  created_at: string;
  candidate: Candidate | null;
  hyperconnector: Hyperconnector | null;
  linkedin_url?: string | null;
  match_score: number | null; // Match score de job_candidate_matches
}

interface Job {
  id: string;
  job_title: string;
  description: string | null;
  company_name: string;
}

export default function RecomendacionesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: jobId } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState<Job | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [expandedRecs, setExpandedRecs] = useState<Set<string>>(new Set());

  const toggleExpand = (recId: string) => {
    setExpandedRecs((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(recId)) {
        newSet.delete(recId);
      } else {
        newSet.add(recId);
      }
      return newSet;
    });
  };

  const fetchData = async () => {
    if (!jobId) {
      console.error("❌ jobId no está definido");
      setLoading(false);
      return;
    }

    console.log("🔍 [fetchData] Iniciando fetch para jobId:", jobId);
    try {
      // Obtener job
      console.log("📡 [fetchData] Llamando a /api/jobs/get?id=${jobId}");
      const jobResponse = await fetch(`/api/jobs/get?id=${jobId}`);
      console.log("📡 [fetchData] Respuesta de job:", jobResponse.status, jobResponse.ok);
      if (jobResponse.ok) {
        const jobData = await jobResponse.json();
        setJob(jobData.job || jobData);
      }

      // Obtener recomendaciones
      console.log("📡 [fetchData] Llamando a /api/jobs/get-recommendations?jobId=${jobId}");
      const recResponse = await fetch(`/api/jobs/get-recommendations?jobId=${jobId}`);
      console.log("📡 [fetchData] Respuesta de recommendations:", recResponse.status, recResponse.ok);
      if (!recResponse.ok) {
        // Intentar parsear el error
        let errorMessage = "Error al cargar las recomendaciones";
        try {
          const errorData = await recResponse.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (e) {
          errorMessage = `Error ${recResponse.status}: ${recResponse.statusText}`;
        }
        console.error("❌ Error al cargar recomendaciones:", {
          status: recResponse.status,
          statusText: recResponse.statusText,
          url: `/api/jobs/get-recommendations?jobId=${jobId}`,
          jobId
        });
        throw new Error(errorMessage);
      }
      const recData = await recResponse.json();
      console.log("✅ [fetchData] Recomendaciones recibidas:", recData.recommendations?.length || 0);
      setRecommendations(recData.recommendations || []);
    } catch (error: any) {
      console.error("❌ Error fetching data:", error);
      // Mostrar error al usuario si es crítico
      if (error.message && error.message.includes("Error al cargar")) {
        alert(`Error: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Verificar autenticación
    async function checkAuth() {
      const session = await authStore.getSession();
      // Permitir acceso a admin y al solicitante dueño del job
      if (!session || (session.role !== "admin" && session.role !== "solicitante")) {
        router.push("/solicitante/login-simulado");
        return;
      }

      if (jobId) {
        fetchData();
      } else {
        console.error("❌ jobId no está disponible en useEffect");
        setLoading(false);
      }
    }
    checkAuth();
  }, [jobId, router]);

  const handleUpdateStatus = async (recId: string, newStatus: string) => {
    try {
      setUpdatingId(recId);
      console.log("🔄 Actualizando status de recomendación:", { recId, newStatus });
      
      // Usar ruta estática como workaround para Vercel
      const response = await fetch(`/api/recommendations/update-status?id=${recId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Asegurar que las cookies se envíen
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("❌ Error en respuesta:", response.status, errorData);
        throw new Error(errorData.error || `Error al actualizar el estado (${response.status})`);
      }

      const data = await response.json();
      console.log("✅ Status actualizado:", data);
      
      if (!data.recommendation) {
        throw new Error("No se recibió la recomendación actualizada");
      }
      
      const updated: Recommendation = data.recommendation;

      // Actualizar en memoria
      setRecommendations((prev) =>
        prev.map((rec) => (rec.id === recId ? { ...rec, status: updated.status } : rec))
      );
    } catch (error: any) {
      console.error("❌ Error updating recommendation status:", error);
      alert(error.message || "Error al actualizar el estado de la recomendación");
    } finally {
      setUpdatingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return "Hoy";
    } else if (diffDays === 1) {
      return "Hace 1 día";
    } else {
      return `Hace ${diffDays} días`;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-orange-100 via-red-100 to-amber-200">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-700">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-100 via-red-100 to-amber-200 px-4 py-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-between"
        >
          <div></div>
          <Button
            onClick={() => router.push("/admin/solicitudes")}
            variant="outline"
            className="gap-2 h-10 px-4 rounded-2xl border border-white text-white bg-amber-400 hover:bg-amber-500 active:bg-amber-600 transition-all duration-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a Solicitudes
          </Button>
        </motion.div>

        {/* Logo and Title Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex flex-col items-center space-y-6"
        >
          {/* Contenedor translúcido para el logo */}
          <div className="px-12 py-8 rounded-3xl bg-gradient-to-br from-orange-200/40 via-red-200/40 to-amber-200/40 backdrop-blur-sm border border-orange-300/30 shadow-lg">
            <ProductLatamLogo className="justify-center" />
          </div>

          {/* Title with gradient */}
          <h1 className="text-5xl font-bold bg-gradient-to-r from-orange-500 via-red-500 to-orange-600 bg-clip-text text-transparent">
            Recomendaciones
          </h1>
        </motion.div>

        {/* Job Info */}
        {job && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="backdrop-blur-[130px] bg-white/40 border border-white/50 rounded-3xl shadow-xl p-6">
              <h2 className="text-gray-800 text-2xl font-bold mb-2">{job.job_title}</h2>
            {job.description && (
              <p className="text-gray-700 mb-4">{job.description}</p>
            )}
            <div className="flex items-center gap-4 text-gray-600">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                <span>{job.company_name}</span>
              </div>
            </div>
          </Card>
          </motion.div>
        )}

        {/* Recommendations Header */}
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <h2 className="text-gray-800 text-2xl font-bold">
            {recommendations.length} {recommendations.length === 1 ? "Recomendación" : "Recomendaciones"}
          </h2>
        </div>

        {/* Recommendations List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          {recommendations.length === 0 ? (
            <Card className="backdrop-blur-[130px] bg-white/40 border border-white/50 rounded-3xl shadow-xl p-12 text-center">
              <p className="text-gray-700 text-lg">
                No hay recomendaciones para este job aún.
              </p>
            </Card>
          ) : (
            <div className="space-y-6">
              {recommendations.map((rec, index) => (
                <motion.div
                  key={rec.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card className="backdrop-blur-[130px] bg-white/40 border border-white/50 rounded-3xl shadow-xl overflow-hidden">
                    {/* Candidate Header - Clickable para expandir/colapsar */}
                    <button
                      onClick={() => toggleExpand(rec.id)}
                      className="w-full p-6 hover:bg-white/20 transition-colors text-left"
                    >
                      <div className="flex items-start gap-6">
                        {/* Avatar */}
                        {rec.candidate?.profile_picture_url && (
                          <div className="flex-shrink-0">
                            <ImageWithFallback
                              src={rec.candidate.profile_picture_url}
                              alt={rec.candidate.full_name}
                              className="w-20 h-20 rounded-2xl object-cover ring-2 ring-orange-200 shadow-md"
                            />
                          </div>
                        )}

                        {/* Candidate Info */}
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="text-gray-800 text-2xl font-bold mb-1">
                                {rec.candidate?.full_name || "Candidato de LinkedIn"}
                              </h3>
                              {rec.candidate?.current_job_title && (
                                <p className="text-gray-700 text-lg mb-2">
                                  {rec.candidate.current_job_title}
                                  {rec.candidate.current_company && ` • ${rec.candidate.current_company}`}
                                </p>
                              )}
                              {rec.linkedin_url && !rec.candidate && (
                                <p className="text-gray-600 text-sm mb-2">
                                  LinkedIn: {rec.linkedin_url}
                                </p>
                              )}
                            </div>
                            {rec.match_score !== null && rec.match_score !== undefined && (
                              <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-2 border border-gray-200">
                                <div
                                  className={`h-3 w-3 rounded-full ${
                                    rec.match_score >= 90
                                      ? "bg-green-500"
                                      : rec.match_score >= 75
                                      ? "bg-yellow-500"
                                      : "bg-orange-500"
                                  }`}
                                />
                                <span className="text-gray-800 font-semibold">{Math.round(rec.match_score)}%</span>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-4 text-gray-600 text-sm">
                            {rec.candidate?.current_company && (
                              <div className="flex items-center gap-2">
                                <Building className="h-4 w-4" />
                                <span>{rec.candidate.current_company}</span>
                              </div>
                            )}
                            {rec.candidate?.email && (
                              <div className="flex items-center gap-2">
                                <span>{rec.candidate.email}</span>
                              </div>
                            )}
                            {(rec.candidate?.linkedin_url || rec.linkedin_url) && (
                              <a
                                href={rec.candidate?.linkedin_url || rec.linkedin_url || "#"}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Linkedin className="h-4 w-4" />
                                <span>LinkedIn</span>
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        </div>
                        
                        {/* Icono de expandir/colapsar */}
                        <div className="flex-shrink-0">
                          {expandedRecs.has(rec.id) ? (
                            <ChevronUp className="h-5 w-5 text-gray-600" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-gray-600" />
                          )}
                        </div>
                      </div>
                    </button>

                    {/* Recommendation Details - Solo visible si está expandido */}
                    {expandedRecs.has(rec.id) && (
                      <div className="border-t border-gray-200 pt-6 px-6 pb-6 space-y-4">
                    {/* Stepper de estado */}
                    <div className={`rounded-xl p-6 border shadow-sm ${
                      rec.status === "rejected"
                        ? "bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200"
                        : "bg-gradient-to-br from-orange-100 via-red-100 to-amber-200 border-orange-200"
                    }`}>
                      <div className="flex items-center justify-between gap-4">
                        {/* Steps 1-3 */}
                        <div className="flex items-center gap-4 flex-1">
                          {[
                            { step: 1, label: "Pendiente", value: "pending" },
                            { step: 2, label: "Revisión", value: "in_review" },
                            { step: 3, label: "Contratado", value: "contracted" },
                          ].map((stepItem, idx) => {
                            const isRejected = rec.status === "rejected";
                            const currentStep =
                              rec.status === "contracted"
                                ? 3
                                : rec.status === "in_review"
                                ? 2
                                : rec.status === "pending"
                                ? 1
                                : 0;

                            const isCompleted = currentStep > stepItem.step;
                            const isActive = currentStep === stepItem.step && !isRejected;
                            const isClickable = !isRejected && updatingId !== rec.id;

                            const circleClasses = isRejected
                              ? "bg-gray-300 border-2 border-gray-400 text-gray-500"
                              : isCompleted || isActive
                              ? "bg-gradient-to-r from-orange-500 via-red-500 to-orange-600 text-white shadow-lg border-2 border-transparent"
                              : "bg-white border-2 border-gray-300 text-gray-500";

                            return (
                              <React.Fragment key={stepItem.step}>
                                <button
                                  type="button"
                                  disabled={!isClickable}
                                  onClick={() =>
                                    handleUpdateStatus(rec.id, stepItem.value as any)
                                  }
                                  className="flex items-center gap-2 group disabled:cursor-not-allowed"
                                >
                                  <div
                                    className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200 ${circleClasses}`}
                                  >
                                    {stepItem.step}
                                  </div>
                                  <span
                                    className={`text-sm font-semibold transition-colors ${
                                      isRejected
                                        ? "text-gray-500"
                                        : isActive || isCompleted
                                        ? "text-gray-900"
                                        : "text-gray-600"
                                    }`}
                                  >
                                    {stepItem.label}
                                  </span>
                                </button>

                                {/* Conector entre pasos */}
                                {idx < 2 && (
                                  <div
                                    className={`flex-1 h-1 rounded-full ${
                                      isRejected
                                        ? "bg-gray-300"
                                        : currentStep > stepItem.step
                                        ? "bg-emerald-400"
                                        : "bg-gray-300"
                                    }`}
                                  />
                                )}
                              </React.Fragment>
                            );
                          })}
                        </div>

                        {/* Rechazado */}
                        <button
                          type="button"
                          disabled={updatingId === rec.id}
                          onClick={() => handleUpdateStatus(rec.id, "rejected")}
                          className={`px-5 py-2.5 rounded-full text-sm font-semibold border-2 transition-all duration-200 ${
                            rec.status === "rejected"
                              ? "bg-gradient-to-r from-red-500 to-rose-500 text-white border-transparent shadow-lg"
                              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400"
                          } disabled:opacity-60 disabled:cursor-not-allowed`}
                        >
                          Rechazado
                        </button>
                      </div>
                    </div>
                    {/* Hyperconnector Info */}
                    {rec.hyperconnector && (
                      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200 mb-4">
                        <div className="flex items-start gap-4">
                          {rec.hyperconnector.profile_picture_url ? (
                            <ImageWithFallback
                              src={rec.hyperconnector.profile_picture_url}
                              alt={rec.hyperconnector.full_name}
                              className="w-12 h-12 rounded-full object-cover ring-2 ring-orange-200"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
                              {getInitials(rec.hyperconnector.full_name)}
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="text-gray-800 font-semibold text-lg mb-1">
                              {rec.hyperconnector.full_name}
                            </p>
                            {rec.hyperconnector.current_job_title && (
                              <p className="text-gray-700 text-sm mb-1">
                                {rec.hyperconnector.current_job_title}
                                {rec.hyperconnector.current_company && ` • ${rec.hyperconnector.current_company}`}
                              </p>
                            )}
                            {!rec.hyperconnector.current_job_title && rec.hyperconnector.current_company && (
                              <p className="text-gray-700 text-sm mb-1">
                                {rec.hyperconnector.current_company}
                              </p>
                            )}
                            <div className="flex items-center gap-3 mt-2">
                              <p className="text-gray-500 text-xs">
                                Recomendado {formatDate(rec.created_at)}
                              </p>
                              {rec.hyperconnector.linkedin_url && (
                                <a
                                  href={rec.hyperconnector.linkedin_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-blue-600 hover:text-blue-700 transition-colors text-xs"
                                >
                                  <Linkedin className="h-3 w-3" />
                                  <span>LinkedIn</span>
                                  <ExternalLink className="h-2.5 w-2.5" />
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Recommendation Questions */}
                    {(rec.letter_q1 || rec.letter_q2) && (
                      <div className="space-y-4">
                        {rec.letter_q1 && (
                          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200">
                            <p className="text-gray-600 text-sm font-semibold mb-2">1. ¿Cuál es el superpoder de esta persona?</p>
                            <p className="text-gray-700 leading-relaxed">{rec.letter_q1}</p>
                          </div>
                        )}
                        {rec.letter_q2 && (
                          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200">
                            <p className="text-gray-600 text-sm font-semibold mb-2">2. Describe una situación en la que esta persona haya aplicado el super poder.</p>
                            <p className="text-gray-700 leading-relaxed">{rec.letter_q2}</p>
                          </div>
                        )}
                      </div>
                    )}

                    </div>
                  )}
                </Card>
              </motion.div>
            ))}
          </div>
        )}
        </motion.div>
      </div>

      {/* Help Button */}
      <div className="fixed bottom-6 right-6">
        <Button
          variant="outline"
          size="icon"
          className="rounded-full w-12 h-12 bg-gray-800 hover:bg-gray-700 active:bg-gray-600 text-white border-gray-700 transition-all duration-200"
        >
          <HelpCircle className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}

