/**
 * Wellness Report View Component - Server Component
 * Displays the wellness awareness report in a structured, readable format
 */

import { WellnessReport } from "@/lib/reports/wellnessReport";

interface WellnessReportViewProps {
  report: WellnessReport;
}

export function WellnessReportView({ report }: WellnessReportViewProps) {
  return (
    <div className="space-y-8 max-w-4xl mx-auto" aria-label="Wellness Report">
      {/* Header */}
      <div className="border-b border-black/10 pb-6">
        <h1 className="text-3xl font-bold text-black mb-2">Medication & Lifestyle Awareness Report</h1>
        <p className="text-sm text-black/60">
          Report Date: <span className="font-medium">{new Date(report.generatedAt).toLocaleDateString()}</span>
        </p>
        <p className="text-sm text-black/60">
          Analysis Period: {report.dateRangeStart} to {report.dateRangeEnd}
        </p>
      </div>

      {/* 1. Adherence Summary */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-black">1. Adherence Summary</h2>
        <div className="border border-black/10 rounded-lg p-6 bg-white space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="border-b border-black/10 pb-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-black/60">Adherence Score</p>
              <p className="text-3xl font-bold text-black mt-2">{report.adherenceSummary.score}%</p>
            </div>
            <div className="border-b border-black/10 pb-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-black/60">Risk Level</p>
              <p className={`text-lg font-semibold mt-2 ${getRiskLevelColor(report.adherenceSummary.riskLevel)}`}>
                {report.adherenceSummary.riskLevel}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-black/60">Consistency Trend</p>
              <p className="text-sm text-black/80 mt-1">{report.adherenceSummary.consistencyTrend}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-black/60">Missed Dose Pattern</p>
              <p className="text-sm text-black/80 mt-1">{report.adherenceSummary.missedDosePattern}</p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Nutrition Awareness */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-black">2. Nutrition Awareness</h2>
        <div className="border border-black/10 rounded-lg p-6 bg-white space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-black/60">Protein Level</p>
              <p className="text-sm text-black/80 mt-1">{report.nutritionAwareness.proteinLevel}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-black/60">Processed Food Frequency</p>
              <p className="text-sm text-black/80 mt-1">{report.nutritionAwareness.processedFoodFrequency}</p>
            </div>
          </div>

          <div className="space-y-3 border-t border-black/10 pt-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-black/60">Fiber Observation</p>
              <p className="text-sm text-black/80 mt-1">{report.nutritionAwareness.fiberObservation}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-black/60">Meal Regularity</p>
              <p className="text-sm text-black/80 mt-1">{report.nutritionAwareness.mealRegularity}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-black/60">Hydration Awareness</p>
              <p className="text-sm text-black/80 mt-1">{report.nutritionAwareness.hydrationAwareness}</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Medication Routine Awareness */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-black">3. Medication Routine Awareness</h2>
        <div className="border border-black/10 rounded-lg p-6 bg-white space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-black/60">Routine Stability</p>
            <p className="text-sm text-black/80 mt-1">{report.medicationRoutineAwareness.routineStability}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-black/60">Timing Consistency</p>
            <p className="text-sm text-black/80 mt-1">{report.medicationRoutineAwareness.timingConsistency}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-black/60">Behavioral Insights</p>
            <p className="text-sm text-black/80 mt-1">{report.medicationRoutineAwareness.behavioralInsights}</p>
          </div>
        </div>
      </section>

      {/* 4. Lifestyle Pattern Insights */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-black">4. Lifestyle Pattern Insights</h2>
        <div className="border border-black/10 rounded-lg p-6 bg-white space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-black/60">Routine Consistency</p>
            <p className="text-sm text-black/80 mt-1">{report.lifestylePattern.routineConsistency}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-black/60">Habit Strength</p>
            <p className="text-sm text-black/80 mt-1">{report.lifestylePattern.habitStrength}</p>
          </div>
          {report.lifestylePattern.irregularPatterns.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-black/60">Noted Patterns</p>
              <ul className="text-sm text-black/80 mt-2 space-y-1">
                {report.lifestylePattern.irregularPatterns.map((pattern, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-black/40 mt-1">•</span>
                    <span>{pattern}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      {/* 5. General Wellness Suggestions */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-black">5. General Wellness Suggestions</h2>
        <div className="space-y-3">
          {report.wellnessSuggestions.map((suggestion, idx) => (
            <div key={idx} className="border border-black/10 rounded-lg p-4 bg-white">
              <p className="text-xs font-semibold uppercase tracking-widest text-black/60">{suggestion.category}</p>
              <p className="text-sm text-black/80 mt-2">{suggestion.suggestion}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-black/50 italic">
          Note: These suggestions are general wellness observations only. Consult a healthcare professional for
          personalized guidance.
        </p>
      </section>

      {/* 6. Doctor Shareable Summary */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-black">6. Professional Summary (For Healthcare Providers)</h2>
        <div className="border border-black/10 rounded-lg p-6 bg-white space-y-3 font-mono text-sm">
          <div>
            <span className="text-black/60">Adherence Rate: </span>
            <span className="font-semibold text-black">{report.doctorSummary.adherencePercentage}%</span>
          </div>
          <div>
            <span className="text-black/60">Medication Routine: </span>
            <span className="font-semibold text-black">{report.doctorSummary.routinePattern}</span>
          </div>
          <div>
            <span className="text-black/60">Nutrition Pattern: </span>
            <span className="font-semibold text-black">{report.doctorSummary.nutritionPattern}</span>
          </div>
          <div>
            <span className="text-black/60">Risk Level: </span>
            <span className={`font-semibold ${getRiskLevelColor(report.doctorSummary.riskLevel)}`}>
              {report.doctorSummary.riskLevel}
            </span>
          </div>
          <div>
            <span className="text-black/60">Report Date: </span>
            <span className="font-semibold text-black">{report.doctorSummary.reportDate}</span>
          </div>
        </div>
        <p className="text-xs text-black/50">This summary can be printed or shared with your healthcare provider.</p>
      </section>

      {/* 7. Safety Disclaimer */}
      <section className="border-t border-black/10 pt-6">
        <div className="border border-black/20 rounded-lg p-4 bg-black/2">
          <p className="text-sm font-semibold text-black mb-2">Important Disclaimer</p>
          <p className="text-sm text-black/70">{report.safetyDisclaimer}</p>
        </div>
      </section>
    </div>
  );
}

/**
 * Helper: Get color class for risk level
 */
function getRiskLevelColor(level: string): string {
  switch (level) {
    case "Low":
      return "text-green-700";
    case "Moderate":
      return "text-amber-700";
    case "High":
      return "text-red-700";
    default:
      return "text-black";
  }
}
