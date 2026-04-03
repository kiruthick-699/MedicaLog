'use client';

import { useState } from 'react';
import { mockDoctors, MockDoctor } from '@/lib/mockDoctors';

export function DoctorDiscovery() {
  const [doctors, setDoctors] = useState<MockDoctor[]>(mockDoctors);
  const [pendingRequests, setPendingRequests] = useState<Array<{ id: string; name: string; requestedDate: string }>>([]);

  const handleRequestAccess = (doctorId: string) => {
    setDoctors(prev => prev.map(doc => 
      doc.id === doctorId ? { ...doc, status: 'Request Sent' as const } : doc
    ));
    
    const doctor = doctors.find(d => d.id === doctorId);
    if (doctor) {
      setPendingRequests(prev => [...prev, {
        id: doctorId,
        name: doctor.name,
        requestedDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      }]);
    }
  };

  const handleCancelRequest = (doctorId: string) => {
    setDoctors(prev => prev.map(doc => 
      doc.id === doctorId ? { ...doc, status: 'Available' as const } : doc
    ));
    setPendingRequests(prev => prev.filter(req => req.id !== doctorId));
  };

  return (
    <>
      {/* Pending Requests Section */}
      {pendingRequests.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-4 text-black">Your Pending Requests</h2>
          <div className="space-y-3">
            {pendingRequests.map(request => (
              <div key={request.id} className="border border-black/10 rounded-lg p-4 bg-white flex items-center justify-between">
                <div>
                  <p className="font-semibold text-black">{request.name}</p>
                  <p className="text-sm text-black/60">Requested: {request.requestedDate}</p>
                  <p className="text-xs text-black/50 mt-1">Status: Pending</p>
                </div>
                <button
                  onClick={() => handleCancelRequest(request.id)}
                  className="border border-black/20 px-3 py-2 text-sm rounded-md hover:bg-black/5"
                >
                  Cancel Request
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Discover Doctors Section */}
      <section className="mb-12">
        <h2 className="text-xl font-bold mb-2 text-black">Discover Doctors</h2>
        <p className="text-sm text-black/70 mb-6">
          Request monitoring access from healthcare professionals who can review your adherence patterns and wellness data.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {doctors.map(doctor => (
            <div key={doctor.id} className="border border-black/10 rounded-lg p-5 bg-white space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-black">{doctor.name}</h3>
                  <p className="text-sm text-black/70">{doctor.specialization}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${
                  doctor.status === 'Available' ? 'bg-black/5 text-black/70' :
                  doctor.status === 'Request Sent' ? 'bg-black/10 text-black' :
                  'bg-black text-white'
                }`}>
                  {doctor.status}
                </span>
              </div>
              
              <div className="space-y-1 text-sm text-black/70">
                <p><span className="font-medium">Experience:</span> {doctor.yearsExperience} years</p>
                <p><span className="font-medium">Clinic:</span> {doctor.clinic}</p>
                <p><span className="font-medium">Focus:</span> {doctor.monitoringFocus}</p>
              </div>
              
              <p className="text-xs text-black/60 leading-relaxed">
                {doctor.description}
              </p>
              
              <button
                onClick={() => handleRequestAccess(doctor.id)}
                disabled={doctor.status !== 'Available'}
                className={`w-full py-2 text-sm font-medium rounded-md ${
                  doctor.status === 'Available'
                    ? 'bg-black text-white hover:bg-black/90'
                    : 'bg-black/10 text-black/40 cursor-not-allowed'
                }`}
              >
                {doctor.status === 'Available' ? 'Request Monitoring Access' : 
                 doctor.status === 'Request Sent' ? 'Request Sent' : 'Access Granted'}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* What Doctors Can See */}
      <section className="mb-12">
        <div className="border border-black/10 rounded-lg p-6 bg-white space-y-4">
          <h3 className="text-lg font-bold text-black">What Doctors Can See</h3>
          
          <div className="space-y-3">
            <div>
              <p className="text-sm font-semibold text-black mb-2">Doctors can view:</p>
              <ul className="text-sm text-black/70 space-y-1 ml-4">
                <li className="flex items-start gap-2">
                  <span className="text-black/40">•</span>
                  <span>Medication adherence history</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-black/40">•</span>
                  <span>Missed dose patterns</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-black/40">•</span>
                  <span>Routine consistency trends</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-black/40">•</span>
                  <span>Lifestyle awareness insights</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-black/40">•</span>
                  <span>Wellness report summary</span>
                </li>
              </ul>
            </div>
            
            <div className="border-t border-black/10 pt-3">
              <p className="text-sm font-semibold text-black mb-2">Doctors CANNOT:</p>
              <ul className="text-sm text-black/70 space-y-1 ml-4">
                <li className="flex items-start gap-2">
                  <span className="text-black/40">•</span>
                  <span>Modify your data</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-black/40">•</span>
                  <span>Provide medical advice through the platform</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-black/40">•</span>
                  <span>Change your medications</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-black/40">•</span>
                  <span>Access unrelated personal data</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy & Consent Info */}
      <section className="mb-12">
        <div className="border border-black/10 rounded-lg p-6 bg-white space-y-3">
          <h3 className="text-lg font-bold text-black">Privacy & Consent</h3>
          <div className="text-sm text-black/70 space-y-2">
            <p className="flex items-start gap-2">
              <span className="text-black/40 mt-1">•</span>
              <span>Access is granted only by you, the patient</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-black/40 mt-1">•</span>
              <span>You can revoke access at any time</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-black/40 mt-1">•</span>
              <span>All doctor access is read-only</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-black/40 mt-1">•</span>
              <span>No clinical decisions are made within MedicaLog</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-black/40 mt-1">•</span>
              <span>Your data remains private and secure</span>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
