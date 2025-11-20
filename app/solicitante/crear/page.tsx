"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Briefcase, FileText, Eye, BriefcaseIcon, ArrowUp, Code, MapPin, Send, LogOut } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import { ProductLatamLogo } from "../../../components/ProductLatamLogo";
import { authStore } from "@/app/lib/authStore";

type Modality = "remote" | "hybrid" | "onsite";

export default function CrearSolicitudPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Form state
  const [jobTitle, setJobTitle] = useState("");
  const [description, setDescription] = useState("");
  const [nonNegotiables, setNonNegotiables] = useState("");
  const [desiredTrajectory, setDesiredTrajectory] = useState("");
  const [scenario, setScenario] = useState("");
  const [technicalBackgroundNeeded, setTechnicalBackgroundNeeded] = useState(false);
  const [modality, setModality] = useState<Modality | "">("");

  useEffect(() => {
    // Verificar autenticación
    async function checkAuth() {
      const currentSession = await authStore.getSession();
      if (!currentSession || currentSession.role !== "solicitante" || !currentSession.candidateId) {
        router.push("/solicitante/login-simulado");
        return;
      }
      setSession(currentSession);
    }
    checkAuth();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session || !session.candidateId) {
      alert("No estás autenticado");
      return;
    }

    // Validaciones básicas
    if (!jobTitle.trim()) {
      alert("El título del puesto es requerido");
      return;
    }

    if (!description.trim() || description.length < 80) {
      alert("La descripción debe tener al menos 80 caracteres");
      return;
    }

    if (!modality) {
      alert("Debes seleccionar una modalidad");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          candidateId: session.candidateId,
          jobTitle: jobTitle.trim(),
          description: description.trim(),
          nonNegotiables: nonNegotiables.trim(),
          desiredTrajectory: desiredTrajectory.trim(),
          scenario: scenario.trim(),
          technicalBackgroundNeeded,
          modality,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al crear la solicitud");
      }

      setShowSuccess(true);
      
      // Redirigir después de 2 segundos
      setTimeout(() => {
        router.push("/solicitante/solicitudes");
      }, 2000);
    } catch (error: any) {
      console.error("Error creating job:", error);
      alert(`Error: ${error.message || "Error al crear la solicitud"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await authStore.clearSession();
    router.push("/solicitante/login-simulado");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-100 via-emerald-100 to-green-200 px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-8">
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
            <ProductLatamLogo />
          </div>
          <Button
            onClick={() => router.push("/solicitante/solicitudes")}
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
          <h1 className="text-5xl font-bold bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-600 bg-clip-text text-transparent">
            Solicitar Recomendación
          </h1>

          {/* Description */}
          <p className="text-gray-700 text-center max-w-2xl text-lg">
            Describe el rol que estás buscando y la comunidad te ayudará a encontrar candidatos ideales
          </p>
        </motion.div>

        {/* Success Message */}
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-100 border-2 border-green-400 rounded-2xl p-6 text-center"
          >
            <p className="text-green-800 font-semibold text-lg">
              ¡Solicitud creada con éxito!
            </p>
            <p className="text-green-700 text-sm mt-2">
              Redirigiendo a tus solicitudes...
            </p>
          </motion.div>
        )}

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <form onSubmit={handleSubmit}>
            <Card className="backdrop-blur-[130px] bg-white/40 border border-white/50 rounded-3xl shadow-xl p-8 space-y-8">
            {/* Título del Puesto */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-gray-700" />
                <h2 className="text-gray-800 font-semibold text-xl">Título del Puesto</h2>
              </div>
              <Input
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="Ej: Product Manager Senior, UX Designer, Frontend Developer..."
                className="bg-white border-gray-300 rounded-xl h-12 text-gray-900"
                required
              />
            </div>

            {/* Descripción del Rol */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-gray-700" />
                <h2 className="text-gray-800 font-semibold text-xl">Descripción del Rol</h2>
              </div>
              <div className="relative">
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ej: Busco un Product Manager con experiencia en fintech, conocimiento de metodologías ágiles y habilidades de liderazgo. Ideal que tenga experiencia en startups de rápido crecimiento..."
                  className="bg-white border-gray-300 rounded-xl min-h-[120px] text-gray-900 resize-none"
                  required
                />
                <div className="absolute top-3 right-3 text-gray-500 text-sm">
                  {description.length}/80 caracteres mínimos
                </div>
              </div>
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Innegociables del Rol */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Eye className="h-5 w-5 text-gray-700" />
                    <h2 className="text-gray-800 font-semibold text-lg">Innegociables del Rol</h2>
                  </div>
                  <Textarea
                    value={nonNegotiables}
                    onChange={(e) => setNonNegotiables(e.target.value)}
                    placeholder="¿Cuáles son tus no-negociables para este rol?"
                    className="bg-white border-gray-300 rounded-xl min-h-[100px] text-gray-900 resize-none"
                  />
                  <div className="flex items-start gap-2 text-gray-600 text-sm">
                    <span className="text-yellow-500">💡</span>
                    <p>Piensa en cosas que esta persona absolutamente debe tener o haber hecho.</p>
                  </div>
                </div>

                {/* Situaciones que deberá saber navegar */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <BriefcaseIcon className="h-5 w-5 text-gray-700" />
                    <h2 className="text-gray-800 font-semibold text-lg">
                      Situaciones que deberá saber navegar
                    </h2>
                  </div>
                  <Textarea
                    value={scenario}
                    onChange={(e) => setScenario(e.target.value)}
                    placeholder="Describe un escenario difícil que esta persona deberá enfrentar. ¿Qué resultado ideal esperas?"
                    className="bg-white border-gray-300 rounded-xl min-h-[100px] text-gray-900 resize-none"
                  />
                  <div className="flex items-start gap-2 text-gray-600 text-sm">
                    <span className="text-yellow-500">💡</span>
                    <p>Esto nos ayuda a identificar el seniority del rol.</p>
                  </div>
                </div>

                {/* Background técnico */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Code className="h-5 w-5 text-gray-700" />
                    <label className="text-gray-800 font-semibold text-lg flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={technicalBackgroundNeeded}
                        onChange={(e) => setTechnicalBackgroundNeeded(e.target.checked)}
                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      ¿Este rol necesita background técnico?
                    </label>
                  </div>
                  <div className="flex items-start gap-2 text-gray-600 text-sm ml-8">
                    <span className="text-blue-500">ℹ️</span>
                    <p>Úsalo solo si realmente cambia el tipo de candidato.</p>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Trayectoria Deseada */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <ArrowUp className="h-5 w-5 text-gray-700" />
                    <h2 className="text-gray-800 font-semibold text-lg">Trayectoria Deseada</h2>
                  </div>
                  <Textarea
                    value={desiredTrajectory}
                    onChange={(e) => setDesiredTrajectory(e.target.value)}
                    placeholder="¿De qué industrias o tipos de empresa te gustaría que haya trabajado?"
                    className="bg-white border-gray-300 rounded-xl min-h-[100px] text-gray-900 resize-none"
                  />
                  <div className="flex items-start gap-2 text-gray-600 text-sm">
                    <span className="text-blue-500">ℹ️</span>
                    <p>Ej: fintech, marketplaces, SaaS, high-growth startups...</p>
                  </div>
                </div>

                {/* Modalidad del rol */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-gray-700" />
                    <h2 className="text-gray-800 font-semibold text-lg">Modalidad del rol</h2>
                  </div>
                  <select
                    value={modality}
                    onChange={(e) => setModality(e.target.value as Modality)}
                    className="w-full bg-white border border-gray-300 rounded-xl h-12 px-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Selecciona una opción</option>
                    <option value="remote">Remoto</option>
                    <option value="hybrid">Híbrido</option>
                    <option value="onsite">Presencial</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center pt-6">
              <Button
                type="submit"
                disabled={loading}
                className="bg-teal-500 hover:bg-teal-600 text-white rounded-xl h-14 px-8 flex items-center gap-2 text-lg font-medium disabled:opacity-50 shadow-lg"
              >
                <Send className="h-5 w-5" />
                {loading ? "Creando..." : "Solicitar Recomendación"}
              </Button>
            </div>
          </Card>
        </form>
        </motion.div>
      </div>
    </div>
  );
}

