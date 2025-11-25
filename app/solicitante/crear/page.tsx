"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Briefcase, FileText, Eye, ArrowUp, Code, MapPin, Send, LogOut, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ProductLatamLogo } from "@/components/ProductLatamLogo";
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
  const [technicalBackgroundNeeded, setTechnicalBackgroundNeeded] = useState(false);
  const [modality, setModality] = useState<Modality | "">("");
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [uploadingDocument, setUploadingDocument] = useState(false);

  useEffect(() => {
    // Verificar autenticación
    async function checkAuth() {
      const currentSession = await authStore.getSession();
      // Permitir acceso a solicitantes y admins
      if (!currentSession) {
        router.push("/solicitante/login-simulado");
        return;
      }
      
      // Si es admin, permitir acceso (no necesita candidateId)
      if (currentSession.role === "admin") {
        setSession(currentSession);
        return;
      }
      
      // Si es solicitante, verificar que tenga candidateId
      if (currentSession.role === "solicitante" && currentSession.candidateId) {
        setSession(currentSession);
        return;
      }
      
      // Si no cumple ninguna condición, redirigir
      router.push("/solicitante/login-simulado");
    }
    checkAuth();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session) {
      alert("No estás autenticado");
      return;
    }
    
    // Verificar que tenga candidateId (ahora admin también lo tiene)
    if (!session.candidateId) {
      alert("Error: No se encontró información de candidato. Por favor inicia sesión nuevamente.");
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
          candidateId: session.candidateId, // Admin ahora también tiene candidateId
          jobTitle: jobTitle.trim(),
          description: description.trim(),
          nonNegotiables: nonNegotiables.trim(),
          desiredTrajectory: desiredTrajectory.trim(),
          technicalBackgroundNeeded,
          modality,
          documentUrl: documentUrl, // Incluir URL del documento si existe
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al crear la solicitud");
      }

      setShowSuccess(true);
      
      // Redirigir después de 2 segundos según el rol
      setTimeout(() => {
        if (session.role === "admin") {
          router.push("/admin/solicitudes");
        } else {
          router.push("/solicitante/solicitudes");
        }
      }, 2000);
    } catch (error: any) {
      console.error("Error creating job:", error);
      alert(`Error: ${error.message || "Error al crear la solicitud"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    // Redirigir directamente al endpoint de logout que cerrará sesión en LinkedIn también
    window.location.href = "/api/auth/logout";
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar que sea PDF
    if (file.type !== "application/pdf") {
      alert("Solo se permiten archivos PDF");
      e.target.value = ""; // Limpiar el input
      return;
    }

    // Validar tamaño (máximo 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      alert("El archivo es demasiado grande. Máximo 10MB");
      e.target.value = ""; // Limpiar el input
      return;
    }

    setDocumentFile(file);
    setUploadingDocument(true);

    try {
      // Subir el archivo
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/jobs/upload-document", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al subir el archivo");
      }

      const data = await response.json();
      setDocumentUrl(data.url);
    } catch (error: any) {
      console.error("Error uploading document:", error);
      alert(`Error al subir el documento: ${error.message}`);
      setDocumentFile(null);
      e.target.value = ""; // Limpiar el input
    } finally {
      setUploadingDocument(false);
    }
  };

  const handleRemoveDocument = () => {
    setDocumentFile(null);
    setDocumentUrl(null);
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
                <h2 className="text-gray-800 font-semibold text-xl">Título del Puesto <span className="text-red-500">*</span></h2>
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
                <h2 className="text-gray-800 font-semibold text-xl">Descripción del Rol <span className="text-red-500">*</span></h2>
              </div>
              <div className="relative">
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ej: Busco un Product Manager con experiencia en fintech, conocimiento de metodologías ágiles y habilidades de liderazgo. Ideal que tenga experiencia en startups de rápido crecimiento..."
                  className="bg-white border-gray-300 rounded-xl min-h-[120px] text-gray-900 resize-none pr-24"
                  required
                />
                <div className="absolute bottom-3 right-3 text-gray-500 text-sm">
                  {description.length}/80 caracteres mínimos
                </div>
              </div>
            </div>

            {/* Subir Documento */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-gray-700" />
                <h2 className="text-gray-800 font-semibold text-xl">Documento del Rol (Opcional)</h2>
              </div>
              
              {!documentUrl ? (
                <div className="space-y-2">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-white hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-2 text-gray-500" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click para subir</span> o arrastra el archivo
                      </p>
                      <p className="text-xs text-gray-500">PDF (MAX. 10MB)</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="application/pdf"
                      onChange={handleFileChange}
                      disabled={uploadingDocument}
                    />
                  </label>
                  {uploadingDocument && (
                    <div className="flex items-center gap-2 text-blue-600 text-sm">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      Subiendo documento...
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between p-4 bg-green-50 border-2 border-green-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <FileText className="h-6 w-6 text-green-600" />
                    <div>
                      <p className="text-green-800 font-semibold">
                        {documentFile?.name || "Documento subido"}
                      </p>
                      <p className="text-green-600 text-sm">
                        {documentFile ? `${(documentFile.size / 1024 / 1024).toFixed(2)} MB` : "Listo"}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    onClick={handleRemoveDocument}
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-full border-red-300 text-red-600 hover:bg-red-50"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <div className="flex items-start gap-2 text-gray-600 text-sm">
                <span className="text-blue-500">ℹ️</span>
                <p>Puedes subir un documento PDF con información adicional sobre el rol (JD, descripción detallada, etc.)</p>
              </div>
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Skills Innegociables del Rol */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Eye className="h-5 w-5 text-gray-700" />
                    <h2 className="text-gray-800 font-semibold text-lg">Skills Innegociables del Rol</h2>
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
                    <h2 className="text-gray-800 font-semibold text-lg">Modalidad del rol <span className="text-red-500">*</span></h2>
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

        {/* Logout Button at the bottom */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex justify-center pt-8"
        >
          <Button
            onClick={handleLogout}
            variant="outline"
            className="gap-2 h-10 px-4 rounded-xl border border-gray-300 text-gray-700 bg-white/80 hover:bg-white backdrop-blur-sm"
          >
            <LogOut className="h-4 w-4" />
            Cerrar Sesión
          </Button>
        </motion.div>
      </div>
    </div>
  );
}

