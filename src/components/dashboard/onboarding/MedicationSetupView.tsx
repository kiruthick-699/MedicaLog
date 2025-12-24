/**
 * Medication setup server view
 */

import { generateMockPatientWithData } from "@/lib/data/preparation";
import { MedicationForm } from "./MedicationForm";

interface MedicationSetupViewProps {
  onMedicationAdded?: (medicationName: string) => void;
}

export function MedicationSetupView({ onMedicationAdded }: MedicationSetupViewProps) {
  const patient = generateMockPatientWithData();
  const existingMedications = patient.medications || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Your Medications</h1>
        <p className="text-gray-600">
          Add each medication you take regularly. We'll set up time-based reminders for
          each one.
        </p>
      </div>

      {existingMedications.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold text-sm">Current Medications</h2>
          {existingMedications.map((med) => (
            <div key={med.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">{med.name}</h3>
                  <p className="text-sm text-gray-600">{med.frequency}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{med.timeSlots.length} times/day</p>
                </div>
              </div>
              {med.note && <p className="text-sm text-gray-500 mt-2">{med.note}</p>}
            </div>
          ))}
          <div className="border-t pt-4" />
        </div>
      )}

      <div>
        <h2 className="font-semibold text-sm mb-4">Add New Medication</h2>
        <MedicationForm
          onSubmit={(medication) => {
            if (onMedicationAdded) {
              onMedicationAdded(medication.name);
            }
          }}
        />
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          You can add more medications after completing onboarding. You need at least
          one medication to continue.
        </p>
      </div>
    </div>
  );
}
