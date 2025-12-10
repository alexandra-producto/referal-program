"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Building, MapPin, User, Users, Link as LinkIcon, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MatchScorePopover, MatchScoreData } from "@/components/MatchScorePopover";
import { ImageWithFallback } from "@/components/ImageWithFallback";

interface Candidate {
  id: string;
  full_name: string;
  current_company: string | null;
  current_job_title: string | null;
  country: string | null;
  industry: string | null;
  profile_picture_url: string | null;
  linkedin_url: string | null;
  match_score: number | null;
  match_detail: MatchScoreData | null;
  has_recommendation: boolean;
}

interface Job {
  id: string;
  job_title: string;
  company_name: string;
  description: string | null;
  owner_role_title: string | null;
  owner_candidate_id: string | null;
}

interface OwnerCandidate {
  id: string;
  full_name: string;
  current_job_title: string | null;
}

export default function PotentialCandidatesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id: jobId } = use(params);
  
  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState<Job | null>(null);
  const [ownerCandidate, setOwnerCandidate] = useState<OwnerCandidate | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(`/api/jobs/potential-candidates?job_id=${jobId}`);
        if (!response.ok) {
          const errorData = await response.json();
          setError(errorData.error || "Error al cargar los datos");
          return;
        }
        const result = await response.json();
        setJob(result.job);
        setOwnerCandidate(result.ownerCandidate || null);
        setCandidates(result.candidates || []);
      } catch (err: any) {
        setError("Error al cargar los datos");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [jobId]);

  const handleViewRecommendations = () => {
    router.push(`/admin/solicitudes/${jobId}/recomendaciones`);
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

  if (error || !job) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-100 via-purple-100 to-indigo-200">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <p className="text-gray-800 text-lg">{error || "Error desconocido"}</p>
          <Button
            onClick={() => router.push("/admin/solicitudes")}
            className="mt-4"
          >
            Volver a solicitudes
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-12 relative bg-gradient-to-b from-cyan-100 via-blue-100 to-sky-200">
      <div className="max-w-5xl mx-auto space-y-8 relative z-10">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Button
            onClick={() => router.push("/admin/solicitudes")}
            variant="outline"
            className="gap-2 h-10 px-4 rounded-full border border-cyan-300 text-gray-700 bg-cyan-50/80 hover:bg-cyan-100 active:bg-cyan-200 active:scale-95 transition-all duration-150 backdrop-blur-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a solicitudes
          </Button>
        </motion.div>

        {/* Job Request Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Card className="overflow-hidden backdrop-blur-[130px] bg-white/40 border border-white/50 shadow-xl rounded-3xl">
            <div className="p-8 space-y-6">
              {/* Job Title - Grande y centrado */}
              <h1 className="text-gray-800 text-[48px] font-semibold text-center leading-tight">
                {job.job_title}
              </h1>
              
              {/* Descripción del job si existe */}
              {job.description && (
                <div className="text-gray-700 text-lg text-center max-w-3xl mx-auto">
                  <p
                    className={`${
                      !isDescriptionExpanded ? "line-clamp-3" : ""
                    } transition-all duration-300`}
                  >
                    {job.description}
                  </p>
                  {job.description.length > 150 && (
                    <button
                      onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                      className="mt-2 text-blue-600 hover:text-blue-700 font-semibold text-sm underline transition-colors"
                    >
                      {isDescriptionExpanded ? "Ver menos" : "Ver más"}
                    </button>
                  )}
                </div>
              )}

              {/* Información del owner candidate y empresa */}
              <div className="flex flex-wrap items-center justify-center gap-6 pt-4">
                {ownerCandidate && (
                  <>
                    <div className="flex items-center gap-2 text-gray-700">
                      <User className="h-4 w-4" />
                      <span>{ownerCandidate.full_name}</span>
                    </div>
                    {(job.owner_role_title || ownerCandidate.current_job_title) && (
                      <div className="flex items-center gap-2 text-gray-700">
                        <Users className="h-4 w-4" />
                        <span>{job.owner_role_title || ownerCandidate.current_job_title}</span>
                      </div>
                    )}
                  </>
                )}
                {job.company_name && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <Building className="h-4 w-4" />
                    <span>{job.company_name}</span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Section Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h2 className="text-gray-800 text-[32px] font-bold">
            Candidatos Potenciales ({candidates.length})
          </h2>
          <p className="text-gray-600 mt-2">
            Estos perfiles han sido identificados por nuestro sistema como potenciales matches para esta posición
          </p>
        </motion.div>

        {/* Potential Candidates */}
        <div className="space-y-6">
          {candidates.length === 0 ? (
            <Card className="backdrop-blur-[130px] bg-white/40 border border-white/50 rounded-3xl shadow-xl p-12 text-center">
              <p className="text-gray-700 text-lg">
                No hay candidatos potenciales con match mayor o igual a 40% para este puesto.
              </p>
            </Card>
          ) : (
            candidates.map((candidate, index) => (
              <motion.div
                key={candidate.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
              >
                <Card className="overflow-hidden backdrop-blur-[130px] bg-white/30 border border-white/40 shadow-[8px_8px_30px_0px_rgba(0,0,0,0.06)] hover:bg-white/40 transition-all duration-300 rounded-2xl">
                  <div className="p-8">
                    {/* Candidate Header */}
                    <div className="flex flex-col md:flex-row gap-6">
                      {candidate.profile_picture_url && (
                        <div className="flex-shrink-0">
                          <ImageWithFallback
                            src={candidate.profile_picture_url}
                            alt={candidate.full_name}
                            className="w-24 h-24 rounded-2xl object-cover ring-4 ring-white/30 shadow-lg"
                          />
                        </div>
                      )}
                      
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-2">
                            <h3 className="text-gray-800 text-[28px] font-semibold">{candidate.full_name}</h3>
                            <p className="text-gray-700 text-base">
                              {[candidate.current_job_title, candidate.industry, candidate.current_company]
                                .filter(Boolean)
                                .join(" - ")}
                            </p>
                          </div>
                          {/* Match Score Badge */}
                          {candidate.match_score !== null && candidate.match_score !== undefined && (
                            <MatchScorePopover
                              matchData={candidate.match_detail}
                              totalScore={candidate.match_score}
                              trigger={
                                <motion.div
                                  whileHover={{ scale: 1.05, y: -2 }}
                                  whileTap={{ scale: 0.98 }}
                                  className="flex items-center gap-3 bg-white/90 rounded-xl px-5 py-3 border-2 border-blue-200/50 shadow-lg hover:shadow-xl hover:border-blue-400/70 transition-all duration-300 cursor-pointer group backdrop-blur-sm"
                                >
                                  <div
                                    className={`h-3 w-3 rounded-full ${
                                      candidate.match_score >= 90
                                        ? "bg-green-500"
                                        : candidate.match_score >= 75
                                        ? "bg-yellow-500"
                                        : "bg-orange-500"
                                    }`}
                                  />
                                  <span className="text-gray-800 font-bold text-base">
                                    {Math.round(candidate.match_score)}%
                                  </span>
                                  <div className="h-4 w-px bg-gray-300"></div>
                                  <div className="flex items-center gap-1.5 text-gray-600 group-hover:text-blue-600 transition-colors">
                                    <Info className="h-4 w-4" />
                                    <span className="text-sm font-medium">Ver análisis</span>
                                  </div>
                                </motion.div>
                              }
                            />
                          )}
                        </div>
                        <div className="flex flex-wrap gap-3">
                          {candidate.current_company && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <Building className="h-4 w-4" />
                              <span>{candidate.current_company}</span>
                            </div>
                          )}
                          {candidate.country && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <MapPin className="h-4 w-4" />
                              <span>{candidate.country}</span>
                            </div>
                          )}
                        </div>
                        {candidate.linkedin_url && (
                          <div className="flex items-center gap-2">
                            <a
                              href={candidate.linkedin_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold text-sm underline transition-colors"
                            >
                              <LinkIcon className="h-4 w-4" />
                              Ver perfil de LinkedIn
                            </a>
                          </div>
                        )}
                        {candidate.has_recommendation && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="pt-2"
                          >
                            <Button
                              onClick={handleViewRecommendations}
                              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white h-10 px-6 rounded-xl shadow-lg transition-all hover:scale-105"
                            >
                              Ver recomendación
                            </Button>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

