import { requestAccessToPatient, getMyAccessRequests } from "@/lib/actions/doctor";
import { redirect } from "next/navigation";
import { RequestAccessForm } from "./RequestAccessForm";

export default async function DoctorRequestsPage({ searchParams }: { searchParams: Promise<{ success?: string; error?: string }> }) {
  const params = await searchParams;
  const requests = await getMyAccessRequests();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Request Patient Access</h1>

      {params.success === "1" && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded text-green-800 text-sm">
          Access request sent successfully.
        </div>
      )}

      {params.error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
          {decodeURIComponent(params.error)}
        </div>
      )}

      <RequestAccessForm />

      <div className="mt-12">
        <h2 className="text-xl font-bold mb-4">My Access Requests</h2>
        {requests.length === 0 ? (
          <p className="text-gray-500">No access requests found.</p>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div
                key={request.id}
                className="border rounded p-4 flex justify-between items-start"
              >
                <div>
                  <div className="font-medium">Patient: {request.patientId}</div>
                  <div className="text-sm text-gray-600">
                    {new Date(request.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className={`text-sm font-semibold ${request.status === "PENDING" ? "text-yellow-600" : "text-red-600"}`}>
                  {request.status}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
