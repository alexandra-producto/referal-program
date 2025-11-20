"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Building, LogOut, List, Grid, Plus, Users, Zap, MoreVertical, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProductLatamLogo } from "@/components/ProductLatamLogo";
import { authStore } from "@/app/lib/authStore";

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
  ownerCandidate: OwnerCandidate | null;
}

type ViewMode = "lista" | "grid";

export default function AdminSolicitudesPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("lista");

  useEffect(() => {
    // Verificar autenticación
    async function checkAuth() {
      const session = await authStore.getSession();
      if (!session || session.role !== "admin") {
        router.push("/solicitante/login-simulado");
        return;
      }

      fetchJobs();
    }
    checkAuth();
  }, [router]);

  const fetchJobs = async () => {
    try {
      const response = await fetch("/api/jobs/all");
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
    await authStore.clearSession();
    router.push("/solicitante/login-simulado");
  };

  const handleViewRecommendations = (jobId: string) => {
    router.push(`/admin/solicitudes/${jobId}/recomendaciones`);
  };

  const getStatusColor = (status: string) => {
    // Los estados vienen directamente de la BD
    if (status === 'Recomendación Contratada') {
      return 'bg-green-100 border-green-300 text-green-800';
    } else if (status === 'Recomendaciones Recibidas') {
      return 'bg-blue-100 border-blue-300 text-blue-800';
    } else if (status === 'En Proceso Reclutamiento') {
      return 'bg-purple-100 border-purple-300 text-purple-800';
    } else if (status === 'Recomendaciones Rechazadas') {
      return 'bg-red-100 border-red-300 text-red-800';
    } else if (status === 'Esperando Recomendaciones') {
      return 'bg-orange-100 border-orange-300 text-orange-800';
    }
    return 'bg-gray-100 border-gray-300 text-gray-800';
  };

  const getStatusText = (status: string) => {
    // Retornar el status tal como viene de la BD
    return status || 'Desconocido';
  };

  const getStatusDot = (status: string) => {
    if (status === 'Recomendación Contratada') {
      return 'bg-green-500';
    } else if (status === 'Recomendaciones Recibidas') {
      return 'bg-blue-500';
    } else if (status === 'En Proceso Reclutamiento') {
      return 'bg-purple-500';
    } else if (status === 'Recomendaciones Rechazadas') {
      return 'bg-red-500';
    } else if (status === 'Esperando Recomendaciones') {
      return 'bg-orange-500';
    }
    return 'bg-gray-500';
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
            <div className="backdrop-blur-[130px] bg-white/40 border border-white/50 rounded-2xl px-4 py-2 shadow-lg">
              <p className="text-gray-800 font-medium">Bienvenido Admin</p>
            </div>
            <ProductLatamLogo />
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
                className={`rounded-xl ${
                  viewMode === "lista"
                    ? "bg-orange-500 text-white"
                    : "bg-white/80 text-gray-700 border-gray-300 backdrop-blur-sm"
                }`}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => setViewMode("grid")}
                variant={viewMode === "grid" ? "default" : "outline"}
                size="icon"
                className={`rounded-xl ${
                  viewMode === "grid"
                    ? "bg-orange-500 text-white"
                    : "bg-white/80 text-gray-700 border-gray-300 backdrop-blur-sm"
                }`}
              >
                <Grid className="h-4 w-4" />
              </Button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <Button className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl flex items-center gap-2 shadow-lg">
                <Plus className="h-4 w-4" />
                Obtener Recomendación
              </Button>
              <Button className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl flex items-center gap-2 shadow-lg">
                <Users className="h-4 w-4" />
                Recomendar
              </Button>
              <Button className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white rounded-xl flex items-center gap-2 shadow-lg">
                <Zap className="h-4 w-4" />
                Vista Hiperconector
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
                        <Button
                          onClick={() => handleViewRecommendations(job.id)}
                          disabled={job.recommendations_count === 0}
                          variant="outline"
                          className={`rounded-xl ${
                            job.recommendations_count === 0
                              ? "bg-gray-300 text-gray-500 border-gray-300 cursor-not-allowed"
                              : "bg-orange-500 hover:bg-orange-600 text-white border-orange-500"
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
                    <button className="text-gray-400 hover:text-gray-600">
                      <MoreVertical className="h-5 w-5" />
                    </button>
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
                    onClick={() => handleViewRecommendations(job.id)}
                    disabled={job.recommendations_count === 0}
                    className={`w-full rounded-xl mb-3 ${
                      job.recommendations_count === 0
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-orange-500 hover:bg-orange-600 text-white"
                    }`}
                  >
                    Ver {job.recommendations_count} Recomendaciones
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

