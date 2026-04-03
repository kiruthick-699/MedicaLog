export interface MockDoctor {
  id: string;
  name: string;
  specialization: string;
  yearsExperience: number;
  clinic: string;
  monitoringFocus: string;
  description: string;
  status: 'Available' | 'Request Sent' | 'Access Granted';
}

export const mockDoctors: MockDoctor[] = [
  {
    id: 'doc-1',
    name: 'Dr. Ananya Sharma',
    specialization: 'General Physician',
    yearsExperience: 12,
    clinic: 'Sunrise Family Clinic',
    monitoringFocus: 'Medication adherence and routine monitoring',
    description: 'Focuses on reviewing medication adherence patterns and supporting patients in building consistent health routines through awareness-based monitoring.',
    status: 'Available',
  },
  {
    id: 'doc-2',
    name: 'Dr. Rahul Mehta',
    specialization: 'Endocrinologist',
    yearsExperience: 15,
    clinic: 'Metro Diabetes Centre',
    monitoringFocus: 'Chronic care adherence awareness',
    description: 'Specializes in monitoring long-term medication consistency for chronic conditions, helping patients understand their adherence patterns over time.',
    status: 'Available',
  },
  {
    id: 'doc-3',
    name: 'Dr. Vikram Iyer',
    specialization: 'Cardiologist',
    yearsExperience: 18,
    clinic: 'HeartCare Institute',
    monitoringFocus: 'Long-term medication consistency monitoring',
    description: 'Reviews cardiovascular medication adherence trends and routine consistency to support patients in maintaining stable health habits.',
    status: 'Available',
  },
  {
    id: 'doc-4',
    name: 'Dr. Sneha Kapoor',
    specialization: 'Internal Medicine',
    yearsExperience: 10,
    clinic: 'Green Valley Hospital',
    monitoringFocus: 'Lifestyle and medication routine awareness',
    description: 'Monitors both medication adherence and lifestyle patterns to provide comprehensive routine awareness support for patients managing multiple conditions.',
    status: 'Available',
  },
  {
    id: 'doc-5',
    name: 'Dr. Arjun Nair',
    specialization: 'Preventive Care',
    yearsExperience: 9,
    clinic: 'WellnessPoint Clinic',
    monitoringFocus: 'Habit consistency and wellness awareness',
    description: 'Focuses on preventive health through monitoring daily habit consistency, medication adherence, and wellness routine patterns.',
    status: 'Available',
  },
];
