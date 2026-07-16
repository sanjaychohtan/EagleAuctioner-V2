import React from "react";
import { Check } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";

interface KycProgressStepperProps {
  activeStep: number;
  entityType: "INDIVIDUAL" | "CORPORATE";
}

export const KycProgressStepper: React.FC<KycProgressStepperProps> = ({
  activeStep,
}) => {
  const { themeMode } = useAppStore();
  const isDark = themeMode === "dark";

  const steps = [
    { label: "Business Details" },
    { label: "Personal Details" },
    { label: "Documents Details" },
    { label: "Set Password" },
    { label: "Products of Interest" },
  ];

  return (
    <div 
      className="w-full relative overflow-hidden rounded-t-2xl pt-8 pb-10 px-6 select-none"
      style={{
        background: isDark
          ? "linear-gradient(135deg, #091a33 0%, #0d284f 100%)"
          : "linear-gradient(135deg, #0d346c 0%, #12589f 100%)",
      }}
    >
      {/* Dynamic Background Accents */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute -top-12 -left-12 w-48 h-48 rounded-full bg-white blur-2xl" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-blue-400 blur-3xl" />
      </div>

      {/* Stepper container */}
      <div className="max-w-4xl mx-auto relative z-10">
        <div className="flex items-center justify-between relative">
          
          {/* Connection Line */}
          <div className="absolute left-[5%] right-[5%] top-4 h-[2px] bg-white/20 -z-10">
            <div 
              className="h-full bg-emerald-500 transition-all duration-500 ease-out"
              style={{ width: `${Math.min(100, Math.round((activeStep / (steps.length - 1)) * 100))}%` }}
            />
          </div>

          {/* Steps */}
          {steps.map((step, index) => {
            const isCompleted = index < activeStep;
            const isActive = index === activeStep;

            return (
              <div key={index} className="flex flex-col items-center w-1/5 relative">
                
                {/* Step Circle */}
                <div
                  className={`h-9 w-9 rounded-full flex items-center justify-center transition-all duration-300 border-2 ${
                    isCompleted
                      ? "bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/20 scale-105"
                      : isActive
                      ? "bg-[#12589f] border-white text-white shadow-md scale-110"
                      : "bg-transparent border-dashed border-white/40 text-white/40"
                  }`}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4 stroke-[3]" />
                  ) : isActive ? (
                    /* Elegant half-filled circle representation */
                    <div className="relative w-full h-full flex items-center justify-center">
                      <div className="absolute inset-0 rounded-full border-2 border-white" />
                      <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center">
                        <div className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-700 to-[#12589f] relative overflow-hidden">
                          {/* Half overlay to make it moon-like split */}
                          <div className="absolute top-0 right-0 w-2 h-4 bg-white/30" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-1.5 w-1.5 rounded-full bg-white/40" />
                  )}
                </div>

                {/* Step Label */}
                <span 
                  className={`text-center font-sans font-medium text-[11px] md:text-xs mt-3 tracking-wide transition-all ${
                    isActive 
                      ? "text-white font-semibold" 
                      : isCompleted 
                      ? "text-slate-200" 
                      : "text-white/50"
                  }`}
                >
                  {step.label}
                </span>

              </div>
            );
          })}

        </div>
      </div>
    </div>
  );
};

export default KycProgressStepper;
