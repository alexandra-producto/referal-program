"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Building, Plus, LogOut, Eye, List, Grid, X, Briefcase, FileText, MapPin, Code } from "lucide-react";
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
  requirements_json?: any;
  modality?: string;
  document_url?: string | null;
}

type ViewMode = "lista" | "tarjetas";

export default function MisSolicitudesPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("lista");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [loadingJobDetails, setLoadingJobDetails] = useState(false);
  const [formattedDate, setFormattedDate] = useState<string>("");

  useEffect(() => {
    // Verificar autenticación
    async function checkAuth() {
      const currentSession = await authStore.getSession();
      if (!currentSession || currentSession.role !== "solicitante" || !currentSession.candidateId) {
        router.push("/login");
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

  const handleViewDetails = async (jobId: string) => {
    setLoadingJobDetails(true);
    try {
      const response = await fetch(`/api/jobs/get?id=${jobId}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Error response:", response.status, errorData);
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      console.log("Job data recibida:", data);
      
      if (!data.job) {
        throw new Error("No se encontró información del job en la respuesta");
      }
      
      setSelectedJob(data.job);
      
      // Formatear fecha solo en el cliente para evitar errores de hidratación
      if (data.job.created_at) {
        const date = new Date(data.job.created_at);
        setFormattedDate(date.toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }));
      }
    } catch (error: any) {
      console.error("Error fetching job details:", error);
      alert(`Error al cargar los detalles de la solicitud: ${error.message || "Error desconocido"}`);
    } finally {
      setLoadingJobDetails(false);
    }
  };

  const parseRequirements = (requirementsJson: any) => {
    if (!requirementsJson) return null;
    if (typeof requirementsJson === 'string') {
      try {
        return JSON.parse(requirementsJson);
      } catch {
        return null;
      }
    }
    return requirementsJson;
  };

  const getModalityLabel = (modality: string | undefined) => {
    if (!modality) return "No especificado";
    const labels: Record<string, string> = {
      remote: "Remoto",
      hybrid: "Híbrido",
      onsite: "Presencial"
    };
    return labels[modality] || modality;
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
            <div className="bg-teal-400 border border-white rounded-2xl px-5 py-2.5 shadow-md">
              <p className="text-white font-medium">
                Hola {session?.fullName?.split(" ")[0] || "Usuario"}
              </p>
            </div>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="gap-2 h-10 px-4 rounded-2xl border border-white text-white bg-teal-400 hover:bg-teal-500 active:bg-teal-600 transition-all duration-200"
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
                No tienes solicitudes aún. Crea tu primera solicitud haciendo clic en "Solicitar Recomendación".
              </p>
            </Card>
          ) : viewMode === "lista" ? (
            /* Table View */
            <div className="relative">
              {/* View Mode Toggle - Top Right */}
              <div className="flex justify-end items-center gap-2 mb-4">
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
            <Card className="backdrop-blur-[130px] bg-white/40 border border-white/50 rounded-3xl shadow-xl overflow-hidden">
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
                        <button 
                          onClick={() => handleViewDetails(job.id)}
                          className="text-gray-500 text-sm mt-1 flex items-center gap-1 hover:text-gray-700 transition-colors"
                        >
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
                          disabled={job.recommendations_count === 0}
                          onClick={() => {
                            if (job.recommendations_count > 0) {
                              // Reutilizar la vista de recomendaciones de admin (también accesible para solicitante)
                              router.push(`/admin/solicitudes/${job.id}/recomendaciones`);
                            }
                          }}
                          className={`rounded-xl ${
                            job.recommendations_count === 0
                              ? "bg-gray-300 text-gray-500 border-gray-300 cursor-not-allowed"
                              : "bg-teal-500 hover:bg-teal-600 text-white border-teal-500"
                          }`}
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
          </div>
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
                  <button 
                    onClick={() => handleViewDetails(job.id)}
                    className="text-teal-600 text-sm mb-4 flex items-center gap-1 hover:text-teal-700 transition-colors"
                  >
                    <Eye className="h-3 w-3" />
                    Ver detalles
                  </button>
                  <Button
                    variant="outline"
                    disabled={job.recommendations_count === 0}
                    onClick={() => {
                      if (job.recommendations_count > 0) {
                        router.push(`/admin/solicitudes/${job.id}/recomendaciones`);
                      }
                    }}
                    className={`w-full rounded-xl ${
                      job.recommendations_count === 0
                        ? "bg-gray-300 text-gray-500 border-gray-300 cursor-not-allowed"
                        : "bg-teal-500 hover:bg-teal-600 text-white border-teal-500"
                    }`}
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

      {/* Modal de Detalles */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          >
            {/* Header del Modal */}
            <div className="bg-gradient-to-r from-teal-500 to-emerald-500 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Detalles de la Solicitud</h2>
              <button
                onClick={() => setSelectedJob(null)}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Contenido del Modal */}
            <div className="overflow-y-auto flex-1 p-6 space-y-6">
              {loadingJobDetails ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
                  <span className="ml-3 text-gray-600">Cargando detalles...</span>
                </div>
              ) : selectedJob ? (
                <>
                  {/* Título y Empresa */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-teal-600" />
                      <h3 className="text-xl font-semibold text-gray-800">{selectedJob.job_title}</h3>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Building className="h-4 w-4" />
                      <span>{selectedJob.company_name}</span>
                    </div>
                  </div>

                  {/* Modalidad */}
                  {selectedJob.modality && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-teal-600" />
                      <span className="text-gray-700">
                        <strong>Modalidad:</strong> {getModalityLabel(selectedJob.modality)}
                      </span>
                    </div>
                  )}

                  {/* Descripción */}
                  {selectedJob.description && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-teal-600" />
                        <h4 className="font-semibold text-gray-800">Descripción del Rol</h4>
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-xl">
                        {selectedJob.description}
                      </p>
                    </div>
                  )}

                  {/* Requirements JSON */}
                  {selectedJob.requirements_json && (() => {
                    const requirements = parseRequirements(selectedJob.requirements_json);
                    if (!requirements) return null;
                    
                    return (
                      <div className="space-y-4">
                        {/* Skills Innegociables */}
                        {requirements.non_negotiables_text && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Code className="h-4 w-4 text-teal-600" />
                              <h4 className="font-semibold text-gray-800">Skills Innegociables del Rol</h4>
                            </div>
                            <p className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-xl">
                              {requirements.non_negotiables_text}
                            </p>
                          </div>
                        )}

                        {/* Trayectoria Deseada */}
                        {requirements.desired_trajectory_text && (
                          <div className="space-y-2">
                            <h4 className="font-semibold text-gray-800">Trayectoria Deseada</h4>
                            <p className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-xl">
                              {requirements.desired_trajectory_text}
                            </p>
                          </div>
                        )}

                        {/* Background Técnico */}
                        {requirements.needs_technical_background !== undefined && (
                          <div className="space-y-2">
                            <h4 className="font-semibold text-gray-800">Background Técnico Requerido</h4>
                            <p className="text-gray-700 bg-gray-50 p-4 rounded-xl">
                              {requirements.needs_technical_background ? "Sí" : "No"}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Documento */}
                  {selectedJob.document_url && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-gray-800">Documento Adjunto</h4>
                      <a
                        href={selectedJob.document_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-teal-600 hover:text-teal-700 underline flex items-center gap-2"
                      >
                        <FileText className="h-4 w-4" />
                        Ver documento
                      </a>
                    </div>
                  )}

                  {/* Fecha de Creación */}
                  {selectedJob.created_at && (
                    <div className="text-sm text-gray-500 pt-4 border-t">
                      Creado el: {formattedDate || new Date(selectedJob.created_at).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">No se pudieron cargar los detalles</p>
                </div>
              )}
            </div>

            {/* Footer del Modal */}
            <div className="bg-gray-50 px-6 py-4 flex justify-end">
              <Button
                onClick={() => setSelectedJob(null)}
                className="bg-teal-500 hover:bg-teal-600 text-white rounded-xl"
              >
                Cerrar
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

