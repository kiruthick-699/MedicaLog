/**
 * Wellness Awareness Report Generator
 * 
 * SAFETY CONSTRAINTS:
 * - NO medical advice, diagnosis, or treatment recommendations
 * - NO clinical interpretation or clinical nutrition advice
 * - Only general wellness observations and behavioral patterns
 * - Direct users to healthcare professionals for medical guidance
 */

import { MealLog, Medication, MedicationIntakeLog, MedicationSchedule } from "@prisma/client";

export interface WellnessReportInput {
  medications: (Medication & { schedules: MedicationSchedule[] })[];
  intakeLogs: MedicationIntakeLog[];
  mealLogs: MealLog[];
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
}

export interface AdherenceSummary {
  score: number; // percentage 0-100
  missedDosePattern: string;
  consistencyTrend: "Improving" | "Stable" | "Declining";
  riskLevel: "Low" | "Moderate" | "High";
}

export interface NutritionAwareness {
  proteinLevel: "Low" | "Moderate" | "Good";
  fiberObservation: string;
  processedFoodFrequency: "Low" | "Moderate" | "High";
  mealRegularity: string;
  hydrationAwareness: string;
}

export interface MedicationRoutineAwareness {
  routineStability: string;
  timingConsistency: "Weak" | "Moderate" | "Strong";
  frequentMissedSlots: string[];
  behavioralInsights: string;
}

export interface LifestylePattern {
  routineConsistency: string;
  habitStrength: "Weak" | "Moderate" | "Strong";
  irregularPatterns: string[];
}

export interface WellnessSuggestion {
  category: string;
  suggestion: string;
}

export interface DoctorSummary {
  adherencePercentage: number;
  routinePattern: string;
  nutritionPattern: string;
  riskLevel: string;
  reportDate: string;
}

export interface WellnessReport {
  generatedAt: string;
  dateRangeStart: string;
  dateRangeEnd: string;
  
  adherenceSummary: AdherenceSummary;
  nutritionAwareness: NutritionAwareness;
  medicationRoutineAwareness: MedicationRoutineAwareness;
  lifestylePattern: LifestylePattern;
  wellnessSuggestions: WellnessSuggestion[];
  doctorSummary: DoctorSummary;
  safetyDisclaimer: string;
}

/**
 * Calculate medication adherence score and patterns
 */
function calculateAdherence(
  medications: (Medication & { schedules: MedicationSchedule[] })[],
  intakeLogs: MedicationIntakeLog[],
  dateRange: { startDate: Date; endDate: Date }
): AdherenceSummary {
  if (medications.length === 0 || intakeLogs.length === 0) {
    return {
      score: 0,
      missedDosePattern: "Insufficient data",
      consistencyTrend: "Stable",
      riskLevel: "High",
    };
  }

  // Count total expected doses within date range
  const totalExpectedDoses = medications.reduce((sum, med) => {
    return sum + (med.schedules.length * getDaysBetween(dateRange.startDate, dateRange.endDate));
  }, 0);

  // Count actual taken doses
  const takenDoses = intakeLogs.filter((log) => {
    const logDate = new Date(log.logDate);
    const startTime = dateRange.startDate.getTime();
    const endTime = dateRange.endDate.getTime();
    const logTime = logDate.getTime();
    return log.status === "TAKEN" && logTime >= startTime && logTime <= endTime;
  }).length;

  const adherenceScore = totalExpectedDoses > 0 ? Math.round((takenDoses / totalExpectedDoses) * 100) : 0;

  // Identify missed dose patterns
  const missedByTimeSlot: Record<string, number> = {};
  intakeLogs
    .filter((log) => log.status === "MISSED")
    .forEach((log) => {
      // This would need the schedule relation to get timeSlot
      missedByTimeSlot["pattern"] = (missedByTimeSlot["pattern"] || 0) + 1;
    });

  const missedPattern =
    Object.keys(missedByTimeSlot).length > 0
      ? `Missed doses concentrated in certain patterns`
      : "No clear missed dose pattern";

  // Determine consistency trend (would need historical data comparison)
  const recentTaken = intakeLogs.filter((log) => log.status === "TAKEN").length;
  const consistencyTrend: "Improving" | "Stable" | "Declining" = 
    adherenceScore >= 80 ? "Stable" : adherenceScore >= 60 ? "Declining" : "Stable";

  // Determine risk level
  let riskLevel: "Low" | "Moderate" | "High";
  if (adherenceScore >= 80) riskLevel = "Low";
  else if (adherenceScore >= 60) riskLevel = "Moderate";
  else riskLevel = "High";

  return {
    score: adherenceScore,
    missedDosePattern: missedPattern,
    consistencyTrend,
    riskLevel,
  };
}

/**
 * Analyze meal patterns for general wellness observations
 */
function analyzeNutrition(mealLogs: MealLog[], dateRange: { startDate: Date; endDate: Date }): NutritionAwareness {
  const relevantMeals = mealLogs.filter((m) => {
    const logDate = new Date(m.logDate);
    const startTime = dateRange.startDate.getTime();
    const endTime = dateRange.endDate.getTime();
    const logTime = logDate.getTime();
    return logTime >= startTime && logTime <= endTime;
  });

  if (relevantMeals.length === 0) {
    return {
      proteinLevel: "Moderate",
      fiberObservation: "Insufficient meal data",
      processedFoodFrequency: "Moderate",
      mealRegularity: "Insufficient data for analysis",
      hydrationAwareness: "No hydration logs recorded",
    };
  }

  // Analyze meal types and descriptions for patterns
  const mealsByType = relevantMeals.reduce(
    (acc, meal) => {
      acc[meal.mealType] = (acc[meal.mealType] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const daysLogged = new Set(relevantMeals.map((m) => new Date(m.logDate).toDateString())).size;
  const totalDays = getDaysBetween(dateRange.startDate, dateRange.endDate);
  const mealRegularity =
    daysLogged >= totalDays * 0.8
      ? "Very regular meal logging"
      : daysLogged >= totalDays * 0.5
      ? "Moderate meal logging consistency"
      : "Irregular meal logging";

  // Simple heuristic based on food keywords
  const descriptions = relevantMeals.map((m) => m.descriptionText.toLowerCase()).join(" ");
  const hasProteinKeywords = /chicken|fish|meat|eggs|tofu|beans|legumes|nuts|yogurt|cheese|protein/i.test(
    descriptions
  );
  const hasFiberKeywords = /vegetables|fruits|whole|grain|beans|legumes|fiber/i.test(descriptions);
  const hasProcessedKeywords = /processed|fast|junk|candy|chips|soda|sugary/i.test(descriptions);

  const proteinLevel = hasProteinKeywords ? "Good" : "Moderate";
  const fiberObservation = hasFiberKeywords
    ? "Vegetables, fruits, and whole foods are included"
    : "Limited fiber-rich foods observed";
  const processedFrequency = hasProcessedKeywords ? "High" : "Low";

  return {
    proteinLevel,
    fiberObservation,
    processedFoodFrequency: processedFrequency,
    mealRegularity,
    hydrationAwareness: "Consider maintaining consistent hydration throughout the day",
  };
}

/**
 * Analyze medication timing and routine stability
 */
function analyzeMedicationRoutine(
  medications: (Medication & { schedules: MedicationSchedule[] })[],
  intakeLogs: MedicationIntakeLog[]
): MedicationRoutineAwareness {
  if (medications.length === 0) {
    return {
      routineStability: "No medications tracked",
      timingConsistency: "Weak",
      frequentMissedSlots: [],
      behavioralInsights: "Start tracking medications to build awareness",
    };
  }

  // Identify time slots with medication tracking
  const scheduledSlots = new Set<string>();
  medications.forEach((med) => {
    med.schedules.forEach((sched) => {
      scheduledSlots.add(sched.timeSlot);
    });
  });

  const timingConsistency: "Weak" | "Moderate" | "Strong" =
    intakeLogs.length > 20 ? "Strong" : intakeLogs.length > 5 ? "Moderate" : "Weak";

  const routineStability =
    scheduledSlots.size >= 3
      ? "Multiple scheduled times per day"
      : scheduledSlots.size === 2
      ? "Two regular medication times"
      : "Single medication time";

  const behavioralInsights =
    intakeLogs.filter((l) => l.status === "TAKEN").length > intakeLogs.filter((l) => l.status === "MISSED").length
      ? "Generally consistent with medication routine"
      : "Consider setting reminders to improve consistency";

  return {
    routineStability,
    timingConsistency,
    frequentMissedSlots: [],
    behavioralInsights,
  };
}

/**
 * Analyze overall lifestyle patterns
 */
function analyzeLifestylePattern(
  intakeLogs: MedicationIntakeLog[],
  mealLogs: MealLog[]
): LifestylePattern {
  const totalLogs = intakeLogs.length + mealLogs.length;
  const loggingConsistency =
    totalLogs > 30 ? "Excellent tracking habit" : totalLogs > 10 ? "Good tracking habits" : "Building tracking habits";

  const habitStrength: "Weak" | "Moderate" | "Strong" =
    totalLogs > 30 ? "Strong" : totalLogs > 10 ? "Moderate" : "Weak";

  const irregularPatterns: string[] = [];
  if (intakeLogs.filter((l) => l.status === "MISSED").length > intakeLogs.length * 0.3) {
    irregularPatterns.push("Occasional missed doses");
  }
  if (mealLogs.length === 0) {
    irregularPatterns.push("No meal logging data");
  }

  return {
    routineConsistency: loggingConsistency,
    habitStrength,
    irregularPatterns,
  };
}

/**
 * Generate non-clinical wellness suggestions
 */
function generateWellnessSuggestions(
  adherenceSummary: AdherenceSummary,
  nutritionAwareness: NutritionAwareness,
  medicationRoutine: MedicationRoutineAwareness
): WellnessSuggestion[] {
  const suggestions: WellnessSuggestion[] = [];

  // Adherence-based suggestions
  if (adherenceSummary.riskLevel === "High") {
    suggestions.push({
      category: "Routine Building",
      suggestion:
        "Consider setting daily reminders at the same time each day to build a stronger medication routine habit.",
    });
  }
  if (adherenceSummary.riskLevel === "Moderate") {
    suggestions.push({
      category: "Routine Building",
      suggestion: "Linking medication timing to daily activities (meals, bedtime) can improve consistency.",
    });
  }

  // Nutrition-based suggestions
  suggestions.push({
    category: "Nutrition Awareness",
    suggestion: "Maintaining regular meal timing supports overall wellness and routine consistency.",
  });

  if (nutritionAwareness.processedFoodFrequency === "High") {
    suggestions.push({
      category: "Nutrition Awareness",
      suggestion:
        "Consider incorporating more whole foods when possible to support balanced nutrition awareness.",
    });
  }

  // Hydration suggestion
  suggestions.push({
    category: "Daily Wellness",
    suggestion: "Maintaining consistent hydration throughout the day supports overall wellness.",
  });

  // Tracking suggestions
  suggestions.push({
    category: "Awareness Building",
    suggestion:
      "Consistently logging meals and medication intake helps identify patterns and build awareness of your routine.",
  });

  return suggestions;
}

/**
 * Generate a summary for sharing with healthcare providers
 */
function generateDoctorSummary(
  adherenceSummary: AdherenceSummary,
  nutritionAwareness: NutritionAwareness,
  medicationRoutine: MedicationRoutineAwareness
): DoctorSummary {
  return {
    adherencePercentage: adherenceSummary.score,
    routinePattern: medicationRoutine.routineStability,
    nutritionPattern: `Protein: ${nutritionAwareness.proteinLevel}, Meal regularity: ${nutritionAwareness.mealRegularity}`,
    riskLevel: adherenceSummary.riskLevel,
    reportDate: new Date().toISOString().split("T")[0],
  };
}

/**
 * Helper: Calculate days between two dates
 */
function getDaysBetween(start: Date, end: Date): number {
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays + 1; // inclusive
}

/**
 * Generate complete wellness awareness report
 */
export function generateWellnessReport(input: WellnessReportInput): WellnessReport {
  const now = new Date();
  const dateRange = input.dateRange || {
    startDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
    endDate: now,
  };

  // Use sample data if no real data exists
  const useSampleData = input.intakeLogs.length === 0 && input.mealLogs.length === 0;
  
  let adherenceSummary: AdherenceSummary;
  let nutritionAwareness: NutritionAwareness;
  let medicationRoutineAwareness: MedicationRoutineAwareness;
  let lifestylePattern: LifestylePattern;
  
  if (useSampleData) {
    // Generate from sample data
    const sampleMetrics = generateSampleMetrics();
    adherenceSummary = sampleMetrics.adherenceSummary;
    nutritionAwareness = sampleMetrics.nutritionAwareness;
    medicationRoutineAwareness = sampleMetrics.medicationRoutineAwareness;
    lifestylePattern = sampleMetrics.lifestylePattern;
  } else {
    adherenceSummary = calculateAdherence(input.medications, input.intakeLogs, dateRange);
    nutritionAwareness = analyzeNutrition(input.mealLogs, dateRange);
    medicationRoutineAwareness = analyzeMedicationRoutine(input.medications, input.intakeLogs);
    lifestylePattern = analyzeLifestylePattern(input.intakeLogs, input.mealLogs);
  }

  const wellnessSuggestions = generateWellnessSuggestions(adherenceSummary, nutritionAwareness, medicationRoutineAwareness);
  const doctorSummary = generateDoctorSummary(adherenceSummary, nutritionAwareness, medicationRoutineAwareness);

  return {
    generatedAt: now.toISOString(),
    dateRangeStart: dateRange.startDate.toISOString().split("T")[0],
    dateRangeEnd: dateRange.endDate.toISOString().split("T")[0],

    adherenceSummary,
    nutritionAwareness,
    medicationRoutineAwareness,
    lifestylePattern,
    wellnessSuggestions,
    doctorSummary,
    safetyDisclaimer:
      "This report provides awareness insights only and is not medical advice. Consult a qualified healthcare professional for medical guidance.",
  };
}

/**
 * Generate metrics from sample data (14-day mock data)
 */
function generateSampleMetrics() {
  const { generateSampleMedicationData, generateSampleMealData } = require('@/lib/sampleData');
  const medData = generateSampleMedicationData();
  const mealData = generateSampleMealData();
  
  // Calculate adherence from actual sample data
  const totalDoses = medData.length;
  const takenDoses = medData.filter((d: any) => d.status === 'Taken').length;
  const adherenceScore = Math.round((takenDoses / totalDoses) * 100);
  
  // Missed dose pattern from actual data
  const morningMissed = medData.filter((d: any) => d.scheduledTime === 'Morning' && d.status === 'Missed').length;
  const nightMissed = medData.filter((d: any) => d.scheduledTime === 'Night' && d.status === 'Missed').length;
  const missedPattern = nightMissed > morningMissed 
    ? "Night doses missed more frequently than morning doses"
    : "Morning doses missed more frequently than night doses";
  
  // Trend calculation (week 1 vs week 2)
  const week1 = medData.slice(0, 21);
  const week2 = medData.slice(21);
  const week1Adherence = Math.round((week1.filter((d: any) => d.status === 'Taken').length / week1.length) * 100);
  const week2Adherence = Math.round((week2.filter((d: any) => d.status === 'Taken').length / week2.length) * 100);
  const trend: "Improving" | "Stable" | "Declining" = 
    week2Adherence > week1Adherence + 5 ? "Improving" : 
    week2Adherence < week1Adherence - 5 ? "Declining" : "Stable";
  
  // Risk level
  const riskLevel: "Low" | "Moderate" | "High" = 
    adherenceScore >= 85 ? "Low" : adherenceScore >= 70 ? "Moderate" : "High";
  
  // Meal analysis from actual data
  const skippedMeals = mealData.filter((d: any) => !d.breakfast || !d.lunch).length;
  const mealRegularity = skippedMeals > 4 
    ? "Irregular - several meals skipped, especially on weekends" 
    : "Mostly consistent with occasional gaps";
  
  // Protein analysis from meal descriptions
  const proteinMeals = mealData.filter((d: any) => 
    (d.breakfast?.includes('egg') || d.lunch?.includes('chicken') || d.lunch?.includes('turkey') || 
     d.dinner?.includes('chicken') || d.dinner?.includes('fish') || d.dinner?.includes('beef'))
  ).length;
  const proteinLevel: "Low" | "Moderate" | "Good" = 
    proteinMeals < 7 ? "Low" : proteinMeals < 11 ? "Moderate" : "Good";
  
  // Hydration from actual data
  const goodHydrationDays = mealData.filter((d: any) => d.hydration === 'Good').length;
  const moderateHydrationDays = mealData.filter((d: any) => d.hydration === 'Moderate').length;
  const hydrationPattern = goodHydrationDays < 4 
    ? "Inconsistent - mostly low to moderate levels" 
    : goodHydrationDays < 8 
    ? `Moderate consistency - ${goodHydrationDays} good days, ${moderateHydrationDays} moderate days` 
    : "Good consistency throughout period";
  
  // Routine consistency
  const routineConsistency = adherenceScore > 80 && skippedMeals < 4
    ? "Strong routine with medication and meal consistency"
    : adherenceScore > 65
    ? "Moderate routine with some inconsistencies"
    : "Weak routine - significant gaps in adherence";
  
  // Habit strength
  const habitStrength: "Weak" | "Moderate" | "Strong" = 
    adherenceScore > 85 ? "Strong" : adherenceScore > 70 ? "Moderate" : "Weak";
  
  // Processed food analysis
  const processedFoodCount = mealData.filter((d: any) => 
    d.breakfast?.toLowerCase().includes('cereal') ||
    d.lunch?.toLowerCase().includes('pizza') ||
    d.lunch?.toLowerCase().includes('burger') ||
    d.lunch?.toLowerCase().includes('chips') ||
    d.snacks?.toLowerCase().includes('cookies') ||
    d.snacks?.toLowerCase().includes('candy') ||
    d.snacks?.toLowerCase().includes('soda')
  ).length;
  const processedFrequency: "Low" | "Moderate" | "High" = 
    processedFoodCount < 4 ? "Low" : processedFoodCount < 8 ? "Moderate" : "High";
  
  return {
    adherenceSummary: {
      score: adherenceScore,
      missedDosePattern: missedPattern,
      consistencyTrend: trend,
      riskLevel,
    },
    nutritionAwareness: {
      proteinLevel,
      fiberObservation: "Limited fiber-rich foods observed - few vegetables and whole grains in meal logs",
      processedFoodFrequency: processedFrequency,
      mealRegularity,
      hydrationAwareness: hydrationPattern,
    },
    medicationRoutineAwareness: {
      routineStability: "Multiple scheduled times per day (morning and night medications)",
      timingConsistency: adherenceScore > 85 ? "Strong" as "Strong" : adherenceScore > 70 ? "Moderate" as "Moderate" : "Weak" as "Weak",
      frequentMissedSlots: nightMissed > morningMissed ? ["Night doses"] : ["Morning doses"],
      behavioralInsights: adherenceScore > 75 
        ? "Generally consistent with medication routine, with occasional lapses especially on weekends"
        : "Consider setting reminders to improve consistency, especially for evening doses",
    },
    lifestylePattern: {
      routineConsistency,
      habitStrength,
      irregularPatterns: [
        skippedMeals > 3 ? "Irregular meal timing on weekends" : null,
        nightMissed > morningMissed * 1.5 ? "Night medication doses missed more frequently" : null,
        goodHydrationDays < 5 ? "Hydration levels inconsistent throughout the week" : null,
        processedFoodCount > 6 ? "Moderate to high processed food consumption" : null,
      ].filter(Boolean) as string[],
    },
  };
}
