"use client";

import { useEffect, useState, use } from "react";
import { Users, MapPin, Building, User, Send, UserPlus, Link as LinkIcon, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { ImageWithFallback } from "@/components/ImageWithFallback";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Candidate {
  id: string;
  full_name: string;
  current_company: string | null;
  current_job_title?: string | null;
  country?: string | null;
  industry?: string | null;
  fit_score: number | null;
  match_score: number | null; // Match score from job_candidate_matches
  shared_experience: string | null;
}

interface Job {
  id: string;
  company_name: string;
  job_title?: string;
  role_title?: string;
  description?: string | null;
  non_negotiables?: string[] | null;
  owner_candidate_id?: string | null;
  owner_role?: string | null; // Role of the job owner
}

interface Hyperconnector {
  id: string;
  full_name: string;
}

interface OwnerCandidate {
  id: string;
  full_name: string;
  current_company: string | null;
  current_title?: string | null;
  email?: string | null;
}

export default function RecommendPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  // Unwrap params using React.use() for Next.js 16
  const { token } = use(params);
  
  const [loading, setLoading] = useState(true);
  const [expandedPersonId, setExpandedPersonId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, { q1: string; q2: string }>>({});
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [recommendedIds, setRecommendedIds] = useState<string[]>([]);
  
  // Custom recommendation state
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [linkedinUrlError, setLinkedinUrlError] = useState("");
  const [customAnswers, setCustomAnswers] = useState({ q1: "", q2: "" });

  const [data, setData] = useState<{
    job: Job;
    hyperconnector: Hyperconnector;
    candidates: Candidate[];
    ownerCandidate?: OwnerCandidate | null;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(`/api/recommend/${token}`);
        if (!response.ok) {
          const errorData = await response.json();
          setError(errorData.error || "Error al cargar los datos");
          return;
        }
        const result = await response.json();
        setData(result);
      } catch (err: any) {
        setError("Error al cargar los datos");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [token]);

  const validateLinkedinUrl = (url: string) => {
    const linkedinPattern = /^https?:\/\/(www\.)?linkedin\.com\/(in|company)\/[a-zA-Z0-9-]+\/?$/;
    return linkedinPattern.test(url);
  };

  const handleLinkedinChange = (value: string) => {
    setLinkedinUrl(value);
    if (value && !validateLinkedinUrl(value)) {
      setLinkedinUrlError("Por favor ingresa una URL válida de LinkedIn (ej: https://linkedin.com/in/username)");
    } else {
      setLinkedinUrlError("");
    }
  };

  const handleAnswerChange = (personId: string, question: "q1" | "q2", value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [personId]: {
        ...prev[personId],
        [question]: value,
      },
    }));
  };

  const handleCustomAnswerChange = (question: "q1" | "q2", value: string) => {
    setCustomAnswers((prev) => ({
      ...prev,
      [question]: value,
    }));
  };

  const isFormComplete = (personId: string) => {
    const personAnswers = answers[personId];
    if (!personAnswers) return false;
    return personAnswers.q1?.length >= 20 && personAnswers.q2?.length >= 20;
  };

  const isCustomFormComplete = () => {
    return (
      linkedinUrl &&
      validateLinkedinUrl(linkedinUrl) &&
      customAnswers.q1.length >= 20 &&
      customAnswers.q2.length >= 20
    );
  };

  const handleRecommendClick = (personId: string) => {
    setSelectedPersonId(personId);
    setShowConfirmDialog(true);
  };

  const handleCustomRecommendClick = () => {
    setSelectedPersonId("custom");
    setShowConfirmDialog(true);
  };

  const handleConfirmRecommendation = async () => {
    setShowConfirmDialog(false);
    
    try {
      const candidateIds = selectedPersonId === "custom" ? [] : [selectedPersonId!];
      const notes = selectedPersonId === "custom"
        ? `1. ${customAnswers.q1}\n2. ${customAnswers.q2}`
        : `1. ${answers[selectedPersonId!]?.q1}\n2. ${answers[selectedPersonId!]?.q2}`;

      console.log("📤 Enviando recomendación:", {
        candidateIds,
        hasNotes: !!notes,
        linkedinUrl: selectedPersonId === "custom" ? linkedinUrl : null,
      });

      const response = await fetch(`/api/recommend/${token}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          candidateIds,
          notes,
          linkedinUrl: selectedPersonId === "custom" ? linkedinUrl : null,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.error("❌ Error en la respuesta:", responseData);
        alert(responseData.error || responseData.details || "Error al enviar la recomendación");
        return;
      }

      console.log("✅ Recomendación enviada exitosamente:", responseData);
      setShowSuccessMessage(true);

      // Reset forms
      if (selectedPersonId === "custom") {
        setLinkedinUrl("");
        setCustomAnswers({ q1: "", q2: "" });
        setShowCustomForm(false);
      } else if (selectedPersonId) {
        setAnswers((prev) => {
          const newAnswers = { ...prev };
          delete newAnswers[selectedPersonId];
          return newAnswers;
        });
        setExpandedPersonId(null);
        setRecommendedIds((prev) => [...prev, selectedPersonId]);
      }

      setTimeout(() => {
        setShowSuccessMessage(false);
        setSelectedPersonId(null);
      }, 3000);
    } catch (err: any) {
      console.error("❌ Error al enviar la recomendación:", err);
      alert(`Error al enviar la recomendación: ${err.message || "Error desconocido"}`);
    }
  };

  const getMatchColor = (percentage: number | null) => {
    return "text-white font-semibold";
  };

  const getMatchBgColor = (percentage: number | null) => {
    if (!percentage) return "bg-gray-500/40 border border-gray-400/60";
    if (percentage >= 90) return "bg-green-500/40 border border-green-400/60";
    if (percentage >= 75) return "bg-yellow-500/40 border border-yellow-400/60";
    return "bg-orange-500/40 border border-orange-400/60";
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

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-100 via-purple-100 to-indigo-200">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <p className="text-gray-800 text-lg">{error || "Error desconocido"}</p>
        </div>
      </div>
    );
  }

  const { job, hyperconnector, candidates, ownerCandidate } = data;

  // Obtener el título del job (job_title o role_title)
  const jobTitle = job.job_title || job.role_title || "Posición";

  return (
    <div className="min-h-screen px-4 py-12 relative bg-gradient-to-b from-cyan-100 via-blue-100 to-sky-200">
      <div className="max-w-5xl mx-auto space-y-8 relative z-10">
        {/* Botón "Ver más solicitudes" - Arriba a la izquierda, fuera del card */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-4"
        >
          <Button
            onClick={() => {
              // Navegar a la vista de jobs hub
              window.location.href = `/hyperconnector/jobs-home?token=${token}`;
            }}
            variant="outline"
            className="gap-2 h-10 px-4 rounded-full border border-cyan-300 text-gray-700 bg-cyan-50/80 hover:bg-cyan-100 active:bg-cyan-200 active:scale-95 transition-all duration-150 backdrop-blur-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Ver más perfiles abiertos
          </Button>
        </motion.div>
        {/* Success Message */}
        <AnimatePresence>
          {showSuccessMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-8 left-1/2 -translate-x-1/2 z-50"
            >
              <Card className="backdrop-blur-[130px] bg-green-500/90 border-2 border-green-400 shadow-2xl px-8 py-4 rounded-2xl">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-6 w-6 text-white" />
                  <p className="text-white">¡Recomendación enviada con éxito!</p>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Job Request Card - Diseño Glassmorphism */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Card className="overflow-hidden backdrop-blur-[130px] bg-white/40 border border-white/50 shadow-xl rounded-3xl">
            <div className="p-8 space-y-6">
              {/* Job Title - Grande y centrado */}
              <h1 className="text-gray-800 text-[48px] font-semibold text-center leading-tight">
                {jobTitle}
              </h1>
              
              {/* Descripción del job si existe */}
              {job.description && (
                <p className="text-gray-700 text-lg text-center max-w-3xl mx-auto">
                  {job.description}
                </p>
              )}

              {/* Información del owner candidate y empresa */}
              <div className="flex flex-wrap items-center justify-center gap-6 pt-4">
                {ownerCandidate && (
                  <>
                    <div className="flex items-center gap-2 text-gray-700">
                      <User className="h-4 w-4" />
                      <span>{ownerCandidate.full_name}</span>
                    </div>
                    {(job.owner_role || ownerCandidate.current_title) && (
                      <div className="flex items-center gap-2 text-gray-700">
                        <Users className="h-4 w-4" />
                        <span>{job.owner_role || ownerCandidate.current_title}</span>
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

              {/* Requisitos no negociables */}
              {job.non_negotiables && job.non_negotiables.length > 0 && (
                <div className="pt-6 border-t border-gray-300/30">
                  <h3 className="text-gray-800 font-semibold mb-3">Requisitos no negociables:</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    {job.non_negotiables.map((req, idx) => (
                      <li key={idx}>{req}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Section Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-center"
        >
          <h2 className="text-gray-800 text-[32px] font-semibold">
            Sugerencias disponibles ({candidates.length})
          </h2>
        </motion.div>

        {/* Suggested People */}
        <div className="space-y-6">
          {candidates.map((person, index) => (
            <motion.div
              key={person.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
            >
              <Card className="overflow-hidden backdrop-blur-[130px] bg-blue-50/60 border border-blue-200/50 shadow-lg hover:bg-blue-50/70 transition-all duration-300 rounded-3xl">
                <div className="p-8">
                  {/* Person Header */}
                  <div className="flex flex-col md:flex-row gap-6 pb-6 relative">
                    <div className="flex-shrink-0">
                      <ImageWithFallback
                        src={null}
                        alt={person.full_name}
                        className="w-24 h-24 rounded-2xl object-cover ring-2 ring-blue-200/50 shadow-md"
                      />
                    </div>

                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2">
                          <h3 className="text-gray-800 text-[28px] font-semibold">{person.full_name}</h3>
                          {/* Mostrar título actual, industria y empresa */}
                          {(person.current_job_title || person.industry || person.current_company) && (
                            <p className="text-gray-700 text-base">
                              {[person.current_job_title, person.industry, person.current_company]
                                .filter(Boolean)
                                .join(" - ")}
                            </p>
                          )}
                        </div>
                        {/* Match Score Badge - Esquina superior derecha */}
                        {(person.match_score !== null && person.match_score !== undefined) && (
                          <div className="flex items-center gap-2 bg-white/80 rounded-xl px-4 py-2 border border-gray-200 shadow-sm">
                            <div
                              className={`h-3 w-3 rounded-full ${
                                person.match_score >= 90
                                  ? "bg-green-500"
                                  : person.match_score >= 75
                                  ? "bg-yellow-500"
                                  : "bg-orange-500"
                              }`}
                            />
                            <span className="text-gray-800 font-semibold text-base">{Math.round(person.match_score)}%</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Información adicional: empresa y ubicación */}
                      <div className="flex flex-wrap items-center gap-4 text-gray-600">
                        {person.current_company && (
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4" />
                            <span className="text-sm">{person.current_company}</span>
                          </div>
                        )}
                        {person.country && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span className="text-sm">{person.country}</span>
                          </div>
                        )}
                      </div>
                      
                      {person.shared_experience && (
                        <div className="flex items-center gap-2 text-gray-600 text-sm">
                          <Users className="h-4 w-4" />
                          <span>{person.shared_experience}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Check if already recommended */}
                  {recommendedIds.includes(person.id) ? (
                    <div className="border-t border-gray-300/30 pt-6">
                      <Card className="backdrop-blur-sm bg-green-100/80 border-2 border-green-400/70 p-6 rounded-xl">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="h-6 w-6 text-green-600" />
                          <div>
                            <p className="text-gray-800 font-semibold">Recomendación Enviada</p>
                            <p className="text-gray-700 text-sm">
                              Ya has recomendado a esta persona para este puesto
                            </p>
                          </div>
                        </div>
                      </Card>
                    </div>
                  ) : (
                    <>
                      {/* Recommendation Form */}
                      {expandedPersonId === person.id ? (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="border-t border-gray-300/30 pt-6 space-y-6"
                        >
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <label className="text-gray-800 font-semibold">
                                1. ¿Cuál es el superpoder de esta persona?
                              </label>
                              <Textarea
                                placeholder="Describe el superpoder o habilidad única de esta persona..."
                                value={answers[person.id]?.q1 || ""}
                                onChange={(e) =>
                                  handleAnswerChange(person.id, "q1", e.target.value)
                                }
                                className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 min-h-[80px] rounded-xl font-medium"
                              />
                              <p className="text-gray-500 text-xs">
                                {answers[person.id]?.q1?.length || 0}/20 caracteres mínimos
                              </p>
                            </div>

                            <div className="space-y-2">
                              <label className="text-gray-800 font-semibold">
                                2. Describe una situación en la que esta persona haya aplicado el super poder.
                              </label>
                              <Textarea
                                placeholder="Comparte un ejemplo específico de cómo esta persona aplicó su superpoder..."
                                value={answers[person.id]?.q2 || ""}
                                onChange={(e) =>
                                  handleAnswerChange(person.id, "q2", e.target.value)
                                }
                                className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 min-h-[80px] rounded-xl font-medium"
                              />
                              <p className="text-gray-500 text-xs">
                                {answers[person.id]?.q2?.length || 0}/20 caracteres mínimos
                              </p>
                            </div>
                          </div>

                          <div className="flex gap-3">
                            <Button
                              onClick={() => handleRecommendClick(person.id)}
                              disabled={
                                !isFormComplete(person.id) || recommendedIds.includes(person.id)
                              }
                              className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 active:scale-95 transition-all duration-150 gap-2 h-12 rounded-xl text-white disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Send className="h-4 w-4" />
                              Enviar Recomendación
                            </Button>
                            <Button
                              onClick={() => setExpandedPersonId(null)}
                              variant="outline"
                              className="h-12 px-6 rounded-xl border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 active:bg-gray-100 active:scale-95 transition-all duration-150"
                            >
                              Cancelar
                            </Button>
                          </div>
                        </motion.div>
                      ) : (
                        <div className="border-t border-gray-300/30 pt-6">
                          <Button
                            onClick={() => setExpandedPersonId(person.id)}
                            className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 active:scale-95 transition-all duration-150 gap-2 h-12 rounded-xl text-white"
                          >
                            <Send className="h-4 w-4" />
                            Enviar Recomendación
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}

          {/* Recommend Someone Else Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 + candidates.length * 0.1 }}
          >
            <Card className="overflow-hidden backdrop-blur-[130px] bg-white/30 border-2 border-[#0047ff]/40 shadow-[8px_8px_30px_0px_rgba(0,0,0,0.06)] hover:bg-white/40 transition-all duration-300 rounded-2xl">
              <div className="p-8">
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-[#0047ff]/20 backdrop-blur-sm">
                      <UserPlus className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white">Recomendar alguien más</h3>
                      <p className="text-white/80 text-sm">
                        ¿Conoces a alguien perfecto para este rol que no está en la lista?
                      </p>
                    </div>
                  </div>

                  {showCustomForm ? (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="space-y-4"
                    >
                      <div className="space-y-2">
                        <label className="text-white text-sm flex items-center gap-2">
                          <LinkIcon className="h-4 w-4" />
                          URL de perfil de LinkedIn
                        </label>
                        <Input
                          placeholder="https://linkedin.com/in/username"
                          value={linkedinUrl}
                          onChange={(e) => handleLinkedinChange(e.target.value)}
                          className={`backdrop-blur-sm bg-white/20 border-white/40 text-white placeholder:text-white/50 h-12 rounded-xl ${
                            linkedinUrlError ? "border-red-400" : ""
                          }`}
                        />
                        {linkedinUrlError && (
                          <p className="text-red-300 text-sm">{linkedinUrlError}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-white text-sm">
                          1. ¿Cuál es el superpoder de esta persona?
                        </label>
                        <Textarea
                          placeholder="Describe el superpoder o habilidad única de esta persona..."
                          value={customAnswers.q1}
                          onChange={(e) => handleCustomAnswerChange("q1", e.target.value)}
                          className="backdrop-blur-sm bg-white/20 border-white/40 text-white placeholder:text-white/50 min-h-[80px] rounded-xl"
                        />
                        <p className="text-white/60 text-xs">
                          {customAnswers.q1.length}/20 caracteres mínimos
                        </p>
                      </div>

                      <div className="space-y-2">
                        <label className="text-white text-sm">
                          2. Describe una situación en la que esta persona haya aplicado ese superpoder.
                        </label>
                        <Textarea
                          placeholder="Comparte un ejemplo específico de cómo esta persona aplicó su superpoder..."
                          value={customAnswers.q2}
                          onChange={(e) => handleCustomAnswerChange("q2", e.target.value)}
                          className="backdrop-blur-sm bg-white/20 border-white/40 text-white placeholder:text-white/50 min-h-[80px] rounded-xl"
                        />
                        <p className="text-white/60 text-xs">
                          {customAnswers.q2.length}/20 caracteres mínimos
                        </p>
                      </div>

                      <div className="flex gap-3">
                        <div className="relative flex-1">
                          <div className="absolute bg-[#0047ff] blur-[22px] h-5 left-14 mix-blend-hard-light top-9 w-64" />
                          <Button
                            onClick={handleCustomRecommendClick}
                            disabled={!isCustomFormComplete()}
                            className="relative bg-[#0047ff] hover:bg-[#0047ff]/90 active:bg-[#0033cc] active:scale-95 transition-all duration-150 gap-2 h-12 rounded-2xl shadow-[3px_4px_8px_0px_inset_rgba(0,114,255,0.5),0px_-4px_12px_0px_inset_rgba(5,59,203,0.5)] text-white disabled:opacity-50 disabled:cursor-not-allowed w-full"
                          >
                            <UserPlus className="h-4 w-4" />
                            Enviar Recomendación
                          </Button>
                        </div>
                        <Button
                          onClick={() => setShowCustomForm(false)}
                          variant="outline"
                          className="h-12 px-6 rounded-2xl border border-white text-white bg-transparent hover:bg-white/10 active:bg-white/20 active:scale-95 transition-all duration-150"
                        >
                          Cancelar
                        </Button>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="relative">
                      <div className="absolute bg-[#0047ff] blur-[22px] h-5 left-14 mix-blend-hard-light top-9 w-64" />
                      <Button
                        onClick={() => setShowCustomForm(true)}
                        className="relative bg-[#0047ff] hover:bg-[#0047ff]/90 active:bg-[#0033cc] active:scale-95 transition-all duration-150 gap-2 h-12 rounded-2xl shadow-[3px_4px_8px_0px_inset_rgba(0,114,255,0.5),0px_-4px_12px_0px_inset_rgba(5,59,203,0.5)] text-white"
                      >
                        <UserPlus className="h-4 w-4" />
                        Recomendar a alguien de mi red
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="backdrop-blur-[130px] bg-white/95 border-2 border-[#0047ff]/40 rounded-3xl max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#0047ff] text-[24px]">
              Por los dioses del Product Market Fit
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-700 text-lg pt-2">
              ¿Aseguras que este perfil es del nivel del puesto que están solicitando?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-2xl border-gray-300 hover:bg-gray-100">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmRecommendation}
              className="bg-[#0047ff] hover:bg-[#0047ff]/90 rounded-2xl shadow-[3px_4px_8px_0px_inset_rgba(0,114,255,0.5),0px_-4px_12px_0px_inset_rgba(5,59,203,0.5)] text-white"
            >
              Acepto
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
