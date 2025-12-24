/**
 * Conditions server view - reference only
 */

import { generateMockPatientWithData } from "@/lib/data/preparation";

export function ConditionsView() {
  const patient = generateMockPatientWithData();
  const conditions = patient.conditions || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Your Conditions</h1>
        <p className="text-gray-600">
          Reference information about your diagnosed conditions. This helps us tailor
          your medication reminder settings.
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <p className="text-sm text-amber-900">
          <span className="font-semibold">Note:</span> This is informational only. We
          provide no medical advice or diagnosis.
        </p>
      </div>

      {conditions.length > 0 ? (
        <div className="space-y-3">
          {conditions.map((condition) => (
            <div
              key={condition.id}
              className="bg-white border border-gray-200 rounded-lg p-4"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{condition.name}</h3>
                  {condition.icdCode && (
                    <p className="text-sm text-gray-500">Code: {condition.icdCode}</p>
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  Since{" "}
                  {condition.dateOfDiagnosis.toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                  })}
                </p>
              </div>
              {condition.notes && (
                <p className="text-sm text-gray-600 mt-2">{condition.notes}</p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg p-6 text-center">
          <p className="text-gray-600">No conditions recorded yet.</p>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          You can add or update your conditions anytime in your profile settings.
        </p>
      </div>
    </div>
  );
}
