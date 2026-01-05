async function getAccessRequests() {
  'use server';
  
  // TODO: Fetch access requests from database
  return [];
}

export default async function DoctorRequestsPage() {
  async function requestAccess(formData: FormData) {
    'use server';
    
    const patientIdentifier = formData.get('patientIdentifier');
    // TODO: POST to backend endpoint
  }

  const requests = await getAccessRequests();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Request Patient Access</h1>
      <form action={requestAccess} className="max-w-md space-y-4">
        <div>
          <label htmlFor="patientIdentifier" className="block mb-2">
            Patient Email or ID
          </label>
          <input
            type="text"
            id="patientIdentifier"
            name="patientIdentifier"
            className="w-full px-3 py-2 border rounded"
            required
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Request Access
        </button>
      </form>

      <div className="mt-12">
        <h2 className="text-xl font-bold mb-4">Access Requests</h2>
        {requests.length === 0 ? (
          <p className="text-gray-500">No access requests found.</p>
        ) : (
          <div className="space-y-4">
            {requests.map((request: any) => (
              <div
                key={request.id}
                className="border rounded p-4 flex justify-between items-start"
              >
                <div>
                  <div className="font-medium">{request.patientIdentifier}</div>
                  <div className="text-sm text-gray-600">
                    {new Date(request.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-sm font-semibold">
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
