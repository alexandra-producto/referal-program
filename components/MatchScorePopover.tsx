"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { motion } from "framer-motion";
import {
  AlertCircle,
  Award,
  Briefcase,
  TrendingUp,
  Wrench,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  X,
} from "lucide-react";

export interface MatchScoreData {
  key_gap: string;
  weights: {
    role_fit: number;
    stability: number;
    trajectory: number;
    hard_skills: number;
  };
  role_fit: {
    score: number;
    reasoning: string;
  };
  stability: {
    score: number;
    reasoning: string;
  };
  trajectory: {
    score: number;
    reasoning: string;
  };
  hard_skills: {
    score: number;
    reasoning: string;
  };
}

interface MatchScorePopoverProps {
  matchData: MatchScoreData | null;
  totalScore: number;
  trigger: React.ReactNode;
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case "role_fit":
      return <Briefcase className="h-5 w-5" />;
    case "stability":
      return <Award className="h-5 w-5" />;
    case "trajectory":
      return <TrendingUp className="h-5 w-5" />;
    case "hard_skills":
      return <Wrench className="h-5 w-5" />;
    default:
      return <Award className="h-5 w-5" />;
  }
};

const getCategoryLabel = (category: string) => {
  switch (category) {
    case "role_fit":
      return "Fit del Rol";
    case "stability":
      return "Estabilidad Laboral";
    case "trajectory":
      return "Trayectoria";
    case "hard_skills":
      return "Habilidades Técnicas";
    default:
      return category;
  }
};

const getScoreColor = (score: number) => {
  if (score >= 80) return "from-green-500 to-emerald-500";
  if (score >= 60) return "from-yellow-500 to-orange-500";
  return "from-orange-500 to-red-500";
};

const getScoreTextColor = (score: number) => {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-yellow-600";
  return "text-orange-600";
};

const getScoreBadge = (score: number) => {
  if (score >= 80)
    return {
      icon: CheckCircle2,
      label: "Excelente",
      color: "text-green-600",
      bg: "bg-green-100",
    };
  if (score >= 60)
    return {
      icon: AlertTriangle,
      label: "Moderado",
      color: "text-yellow-600",
      bg: "bg-yellow-100",
    };
  return {
    icon: XCircle,
    label: "Bajo",
    color: "text-orange-600",
    bg: "bg-orange-100",
  };
};

const getProgressColor = (score: number) => {
  if (score >= 80) return "bg-gradient-to-r from-green-500 to-emerald-500";
  if (score >= 60) return "bg-gradient-to-r from-yellow-500 to-orange-500";
  return "bg-gradient-to-r from-orange-500 to-red-500";
};

export function MatchScorePopover({
  matchData,
  totalScore,
  trigger,
}: MatchScorePopoverProps) {
  const [open, setOpen] = useState(false);

  if (!matchData) {
    return <>{trigger}</>;
  }

  const categories = [
    {
      key: "role_fit",
      data: matchData.role_fit,
      weight: matchData.weights.role_fit,
    },
    {
      key: "stability",
      data: matchData.stability,
      weight: matchData.weights.stability,
    },
    {
      key: "trajectory",
      data: matchData.trajectory,
      weight: matchData.weights.trajectory,
    },
    {
      key: "hard_skills",
      data: matchData.hard_skills,
      weight: matchData.weights.hard_skills,
    },
  ];

  // Calculate contribution to total score
  const calculateContribution = (score: number, weight: number) => {
    return (score * weight).toFixed(1);
  };

  return (
    <>
      <div onClick={() => setOpen(true)} className="cursor-pointer">
        {trigger}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto backdrop-blur-[130px] bg-white/95 border-2 border-blue-200/50 shadow-2xl rounded-3xl">
          <DialogHeader className="space-y-4">
            <DialogTitle className="text-3xl text-gray-800 flex items-center gap-3">
              <div
                className={`p-3 rounded-2xl bg-gradient-to-r ${getScoreColor(
                  totalScore
                )}`}
              >
                <Award className="h-6 w-6 text-white" />
              </div>
              Análisis de Match
            </DialogTitle>

            {/* Total Score */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="backdrop-blur-sm bg-gradient-to-br from-blue-50/60 to-white/40 rounded-2xl p-6 border border-blue-200/50 shadow-lg"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-gray-800 font-semibold text-lg">
                    Puntaje Total de Compatibilidad
                  </span>
                  <p className="text-gray-600 text-xs mt-1">
                    Basado en ponderación de criterios clave
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {(() => {
                    const badge = getScoreBadge(totalScore);
                    return (
                      <div
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl ${badge.bg} border border-gray-200`}
                      >
                        <badge.icon className={`h-4 w-4 ${badge.color}`} />
                        <span className={`text-sm font-semibold ${badge.color}`}>
                          {badge.label}
                        </span>
                      </div>
                    );
                  })()}
                  <span
                    className={`text-5xl font-bold ${getScoreTextColor(
                      totalScore
                    )}`}
                  >
                    {Math.round(totalScore)}%
                  </span>
                </div>
              </div>
              <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${totalScore}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className={`h-full ${getProgressColor(
                    totalScore
                  )} rounded-full shadow-lg`}
                />
              </div>
            </motion.div>

            {/* Key Gap Alert */}
            {matchData.key_gap && (
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="backdrop-blur-sm bg-gradient-to-br from-orange-100/80 to-orange-50/60 border-2 border-orange-300/60 rounded-2xl p-5 shadow-md"
              >
                <div className="flex gap-3">
                  <div className="p-2 rounded-xl bg-orange-200/50 h-fit">
                    <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0" />
                  </div>
                  <div>
                    <p className="text-orange-900 font-semibold mb-1.5 text-lg">
                      ⚠️ Brecha Principal Identificada
                    </p>
                    <p className="text-orange-800 leading-relaxed">
                      {matchData.key_gap}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </DialogHeader>

          {/* Categories Breakdown */}
          <div className="space-y-4 mt-6">
            <div className="flex items-center justify-between">
              <h3 className="text-gray-800 font-semibold text-lg">
                Desglose Detallado por Criterio
              </h3>
              <span className="text-xs text-gray-500">
                Score × Peso = Contribución
              </span>
            </div>

            {categories.map((category, index) => {
              const contribution = calculateContribution(
                category.data.score,
                category.weight
              );
              const badge = getScoreBadge(category.data.score);

              return (
                <motion.div
                  key={category.key}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.2 + index * 0.1 }}
                  className="backdrop-blur-sm bg-white/70 rounded-2xl p-6 border-2 border-blue-100/50 shadow-md hover:shadow-xl hover:border-blue-200/50 transition-all duration-300"
                >
                  <div className="space-y-4">
                    {/* Category Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-3 rounded-xl bg-gradient-to-r ${getScoreColor(
                            category.data.score
                          )} shadow-lg`}
                        >
                          <div className="text-white">
                            {getCategoryIcon(category.key)}
                          </div>
                        </div>
                        <div>
                          <h4 className="text-gray-900 font-semibold text-lg">
                            {getCategoryLabel(category.key)}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-gray-600 text-xs">
                              Peso en evaluación:
                            </span>
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold">
                              {(category.weight * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div
                          className={`flex items-center gap-2 px-3 py-1 rounded-xl ${badge.bg} border border-gray-200`}
                        >
                          <badge.icon className={`h-3.5 w-3.5 ${badge.color}`} />
                          <span className={`text-xs font-semibold ${badge.color}`}>
                            {badge.label}
                          </span>
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span
                            className={`text-3xl font-bold ${getScoreTextColor(
                              category.data.score
                            )}`}
                          >
                            {category.data.score}
                          </span>
                          <span className="text-gray-400 text-sm">/100</span>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar with Contribution */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600">Progreso de evaluación</span>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">
                            {category.data.score} ×{" "}
                            {(category.weight * 100).toFixed(0)}% =
                          </span>
                          <span
                            className={`font-bold ${getScoreTextColor(
                              category.data.score
                            )}`}
                          >
                            +{contribution} pts
                          </span>
                        </div>
                      </div>
                      <div className="relative h-2.5 bg-gray-200 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${category.data.score}%` }}
                          transition={{
                            duration: 0.8,
                            delay: 0.3 + index * 0.1,
                            ease: "easeOut",
                          }}
                          className={`h-full ${getProgressColor(
                            category.data.score
                          )} rounded-full shadow-md`}
                        />
                      </div>
                    </div>

                    {/* Reasoning Box */}
                    <div className="pt-2 pl-4 border-l-4 border-gray-300">
                      <p className="text-gray-600 text-xs font-semibold mb-1.5">
                        ANÁLISIS:
                      </p>
                      <p className="text-gray-700 leading-relaxed">
                        {category.data.reasoning}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Summary Footer */}
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.6 }}
            className="mt-6 backdrop-blur-sm bg-gradient-to-r from-blue-50/60 to-purple-50/40 rounded-2xl p-4 border border-blue-200/50"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-100/50">
                <Award className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-blue-900 font-semibold text-sm mb-1">
                  Cálculo del Puntaje Final
                </p>
                <p className="text-blue-800 text-xs leading-relaxed">
                  El puntaje total ({Math.round(totalScore)}%) resulta de la suma
                  ponderada de cada criterio. Cada categoría aporta según su peso
                  asignado, reflejando la importancia relativa de cada aspecto en el
                  perfil ideal para esta posición.
                </p>
              </div>
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>
    </>
  );
}

