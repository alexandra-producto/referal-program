"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Building, MapPin, Send, CheckCircle2, HelpCircle } from "lucide-react";
import { Button } from "../../../../components/ui/button";
import { Card } from "../../../../components/ui/card";
import { ProductLatamLogo } from "../../../../components/ProductLatamLogo";
import { authStore } from "@/app/lib/authStore";
import { ImageWithFallback } from "../../../../../../components/ImageWithFallback";

interface Candidate {
  id: string;
  full_name: string;
  current_company: string | null;
  current_job_title: string | null;
  email: string | null;
  linkedin_url: string | null;
}

interface Hyperconnector {
  id: string;
  full_name: string;
  email: string | null;
}

interface Recommendation {
  id: string;
  job_id: string;
  candidate_id: string | null;
  hyperconnector_id: string;
  notes: string | null;
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

  useEffect(() => {
    // Verificar autenticación
    async function checkAuth() {
      const session = await authStore.getSession();
      if (!session || session.role !== "admin") {
        router.push("/solicitante/login-simulado");
        return;
      }

      fetchData();
    }
    checkAuth();
  }, [jobId, router]);

  const fetchData = async () => {
    try {
      // Obtener job
      const jobResponse = await fetch(`/api/jobs/${jobId}`);
      if (jobResponse.ok) {
        const jobData = await jobResponse.json();
        setJob(jobData.job || jobData);
      }

      // Obtener recomendaciones
      const recResponse = await fetch(`/api/jobs/${jobId}/recommendations`);
      if (!recResponse.ok) {
        throw new Error("Error al cargar las recomendaciones");
      }
      const recData = await recResponse.json();
      setRecommendations(recData.recommendations || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
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
          <ProductLatamLogo />
          <Button
            onClick={() => router.push("/admin/solicitudes")}
            variant="outline"
            className="gap-2 h-10 px-4 rounded-xl border border-gray-300 text-gray-700 bg-white/80 hover:bg-white backdrop-blur-sm"
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
          <ProductLatamLogo className="justify-center" />

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
        )}

        {/* Recommendations Header */}
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <h2 className="text-gray-800 text-2xl font-bold">
            {recommendations.length} Recomendaciones
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
                  <Card className="backdrop-blur-[130px] bg-white/40 border border-white/50 rounded-3xl shadow-xl p-6">
                    {/* Candidate Header */}
                    <div className="flex items-start gap-6 mb-6">
                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        {rec.candidate ? (
                          <ImageWithFallback
                            src={null}
                            alt={rec.candidate.full_name}
                            className="w-20 h-20 rounded-2xl object-cover ring-2 ring-orange-200 shadow-md"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-2xl bg-orange-500 flex items-center justify-center text-white text-2xl font-bold">
                            {rec.linkedin_url ? "L" : "?"}
                          </div>
                        )}
                      </div>

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
                      </div>
                    </div>
                  </div>

                  {/* Recommendation Details */}
                  <div className="border-t border-gray-200 pt-6 space-y-4">
                    {/* Hyperconnector Info */}
                    {rec.hyperconnector && (
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-semibold">
                          {getInitials(rec.hyperconnector.full_name)}
                        </div>
                        <div>
                          <p className="text-gray-800 font-semibold">
                            {rec.hyperconnector.full_name}
                          </p>
                          <p className="text-gray-600 text-sm">
                            {formatDate(rec.created_at)}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Recommendation Notes */}
                    {rec.notes && (
                      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200">
                        <p className="text-gray-700 leading-relaxed">{rec.notes}</p>
                      </div>
                    )}

                    {/* Action Button */}
                    <div className="flex justify-end">
                      <Button className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl flex items-center gap-2 shadow-lg">
                        <Send className="h-4 w-4" />
                        Enviar
                      </Button>
                    </div>
                  </div>
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
          className="rounded-full w-12 h-12 bg-gray-800 hover:bg-gray-700 text-white border-gray-700"
        >
          <HelpCircle className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}

