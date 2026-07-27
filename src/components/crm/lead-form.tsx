/**
 * PMN ERP Platform - Lead Form Component
 * 
 * Progressive data collection form with stages
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface LeadFormProps {
  onSubmit: (data: LeadFormData) => Promise<void>;
  onCancel?: () => void;
  initialData?: Partial<LeadFormData>;
  stage?: 1 | 2 | 3 | 4;
}

interface LeadFormData {
  // Stage 1
  fullName: string;
  mobileNumber: string;
  email?: string;
  leadSource: string;
  interestedCourse?: string;
  preferredLanguage?: string;
  city?: string;
  consentToContact: boolean;
  // Stage 2
  qualification?: string;
  pcmBackground?: boolean;
  passingYear?: number;
  preferredBatch?: string;
  modePreference?: string;
  budgetRange?: string;
  parentAvailability?: boolean;
  // Stage 3
  careerGoal?: string;
  sponsorshipInterest?: boolean;
  passportStatus?: string;
  previousImuAttempt?: boolean;
  medicalAwareness?: boolean;
  decisionMaker?: string;
  // Stage 4 - Fee details are for REFERENCE ONLY (billing via Razorpay)
  feeDiscussionDone?: boolean;
  feeAmountDiscussed?: string; // Manual entry - reference only
  scholarshipInterest?: boolean;
  parentCounsellingDone?: boolean;
  admissionProbability?: number;
  joiningMonth?: string;
}

const leadSources = [
  { value: 'website', label: 'Website' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'google_ads', label: 'Google Ads' },
  { value: 'referral', label: 'Referral' },
  { value: 'walk_in', label: 'Walk-in' },
  { value: 'phone_inquiry', label: 'Phone Inquiry' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'event', label: 'Event/Seminar' },
  { value: 'other', label: 'Other' },
];

const courses = [
  { value: 'gp', label: 'GP Rating' },
  { value: 'eto', label: 'Electro Technical Officer (ETO)' },
  { value: 'bsc_nautical', label: 'B.Sc Nautical Science' },
  { value: 'btech_marine', label: 'B.Tech Marine Engineering' },
  { value: 'dns', label: 'Diploma in Nautical Science' },
  { value: 'gme', label: 'Graduate Marine Engineering' },
];

const languages = [
  { value: 'english', label: 'English' },
  { value: 'hindi', label: 'Hindi' },
  { value: 'marathi', label: 'Marathi' },
  { value: 'gujarati', label: 'Gujarati' },
  { value: 'other', label: 'Other' },
];

export function LeadForm({ onSubmit, onCancel, initialData, stage = 1 }: LeadFormProps) {
  const [formData, setFormData] = useState<LeadFormData>({
    fullName: initialData?.fullName ?? '',
    mobileNumber: initialData?.mobileNumber ?? '',
    email: initialData?.email ?? '',
    leadSource: initialData?.leadSource ?? '',
    interestedCourse: initialData?.interestedCourse ?? '',
    preferredLanguage: initialData?.preferredLanguage ?? 'english',
    city: initialData?.city ?? '',
    consentToContact: initialData?.consentToContact ?? true,
    ...initialData,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: keyof LeadFormData, value: string | boolean | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Name is required';
    }

    if (!formData.mobileNumber.trim()) {
      newErrors.mobileNumber = 'Mobile number is required';
    } else if (!/^\+?[\d\s-]{10,15}$/.test(formData.mobileNumber.replace(/\s/g, ''))) {
      newErrors.mobileNumber = 'Invalid mobile number';
    }

    if (!formData.leadSource) {
      newErrors.leadSource = 'Lead source is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>
            {initialData?.fullName ? 'Edit Lead' : 'Add New Lead'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Stage 1 - Lead Capture */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-sm">1</span>
              Basic Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Full Name *"
                value={formData.fullName}
                onChange={(e) => handleChange('fullName', e.target.value)}
                error={errors.fullName}
                placeholder="Enter full name"
              />
              <Input
                label="Mobile Number *"
                value={formData.mobileNumber}
                onChange={(e) => handleChange('mobileNumber', e.target.value)}
                error={errors.mobileNumber}
                placeholder="+91 XXXXX XXXXX"
              />
              <Input
                label="Email"
                type="email"
                value={formData.email ?? ''}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="email@example.com"
              />
              <Select
                label="Lead Source *"
                value={formData.leadSource}
                onChange={(e) => handleChange('leadSource', e.target.value)}
                options={leadSources}
                error={errors.leadSource}
                placeholder="Select source"
              />
              <Select
                label="Interested Course"
                value={formData.interestedCourse ?? ''}
                onChange={(e) => handleChange('interestedCourse', e.target.value)}
                options={courses}
                placeholder="Select course"
              />
              <Select
                label="Preferred Language"
                value={formData.preferredLanguage ?? 'english'}
                onChange={(e) => handleChange('preferredLanguage', e.target.value)}
                options={languages}
              />
              <Input
                label="City"
                value={formData.city ?? ''}
                onChange={(e) => handleChange('city', e.target.value)}
                placeholder="Enter city"
              />
              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="consentToContact"
                  checked={formData.consentToContact}
                  onChange={(e) => handleChange('consentToContact', e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="consentToContact" className="text-sm text-gray-700">
                  Consent to contact
                </label>
              </div>
            </div>
          </div>

          {/* Stage 2 - Qualification (if stage >= 2) */}
          {stage >= 2 && (
            <div className="space-y-4 pt-4 border-t">
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-sm">2</span>
                Qualification Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Qualification"
                  value={formData.qualification ?? ''}
                  onChange={(e) => handleChange('qualification', e.target.value)}
                  placeholder="e.g., 12th Science, B.Tech"
                />
                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="pcmBackground"
                    checked={formData.pcmBackground ?? false}
                    onChange={(e) => handleChange('pcmBackground', e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="pcmBackground" className="text-sm text-gray-700">
                    PCM Background
                  </label>
                </div>
                <Input
                  label="Passing Year"
                  type="number"
                  value={formData.passingYear ?? ''}
                  onChange={(e) => handleChange('passingYear', parseInt(e.target.value))}
                  placeholder="e.g., 2024"
                />
                <Input
                  label="Preferred Batch"
                  value={formData.preferredBatch ?? ''}
                  onChange={(e) => handleChange('preferredBatch', e.target.value)}
                  placeholder="e.g., January 2025"
                />
                <Select
                  label="Mode Preference"
                  value={formData.modePreference ?? ''}
                  onChange={(e) => handleChange('modePreference', e.target.value)}
                  options={[
                    { value: 'online', label: 'Online' },
                    { value: 'offline', label: 'Offline' },
                    { value: 'hybrid', label: 'Hybrid' },
                  ]}
                  placeholder="Select mode"
                />
                <Input
                  label="Budget Range"
                  value={formData.budgetRange ?? ''}
                  onChange={(e) => handleChange('budgetRange', e.target.value)}
                  placeholder="e.g., 5-10 Lakhs"
                />
              </div>
            </div>
          )}

          {/* Stage 3 - Career Details (if stage >= 3) */}
          {stage >= 3 && (
            <div className="space-y-4 pt-4 border-t">
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-sm">3</span>
                Career Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Input
                    label="Career Goal"
                    value={formData.careerGoal ?? ''}
                    onChange={(e) => handleChange('careerGoal', e.target.value)}
                    placeholder="What is the student's career aspiration?"
                  />
                </div>
                <Select
                  label="Passport Status"
                  value={formData.passportStatus ?? ''}
                  onChange={(e) => handleChange('passportStatus', e.target.value)}
                  options={[
                    { value: 'available', label: 'Available' },
                    { value: 'applied', label: 'Applied' },
                    { value: 'not_available', label: 'Not Available' },
                  ]}
                  placeholder="Select status"
                />
                <Input
                  label="Decision Maker"
                  value={formData.decisionMaker ?? ''}
                  onChange={(e) => handleChange('decisionMaker', e.target.value)}
                  placeholder="Who makes the final decision?"
                />
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.sponsorshipInterest ?? false}
                      onChange={(e) => handleChange('sponsorshipInterest', e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">Sponsorship Interest</span>
                  </label>
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.previousImuAttempt ?? false}
                      onChange={(e) => handleChange('previousImuAttempt', e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">Previous IMU Attempt</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Stage 4 - Admission Readiness (if stage >= 4) */}
          {stage >= 4 && (
            <div className="space-y-4 pt-4 border-t">
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-sm">4</span>
                Admission Readiness
              </h4>
              {/* Fee Notice */}
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                ⚠️ <strong>Note:</strong> Fee details here are for <strong>reference only</strong>. 
                Actual billing and payment collection is handled separately through Razorpay.
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.feeDiscussionDone ?? false}
                      onChange={(e) => handleChange('feeDiscussionDone', e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">Fee Discussion Done</span>
                  </label>
                </div>
                <Input
                  label="Fee Amount Discussed (Reference Only)"
                  value={formData.feeAmountDiscussed ?? ''}
                  onChange={(e) => handleChange('feeAmountDiscussed', e.target.value)}
                  placeholder="e.g., 8.5 Lakhs"
                  helperText="For counsellor reference - not for billing"
                />
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.scholarshipInterest ?? false}
                      onChange={(e) => handleChange('scholarshipInterest', e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">Scholarship Interest</span>
                  </label>
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.parentCounsellingDone ?? false}
                      onChange={(e) => handleChange('parentCounsellingDone', e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">Parent Counselling Done</span>
                  </label>
                </div>
                <Input
                  label="Admission Probability (%)"
                  type="number"
                  value={formData.admissionProbability ?? ''}
                  onChange={(e) => handleChange('admissionProbability', parseInt(e.target.value))}
                  placeholder="0-100"
                />
                <Input
                  label="Expected Joining Month"
                  value={formData.joiningMonth ?? ''}
                  onChange={(e) => handleChange('joiningMonth', e.target.value)}
                  placeholder="e.g., January 2025"
                />
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-end gap-3">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" isLoading={isSubmitting}>
            {initialData?.fullName ? 'Update Lead' : 'Create Lead'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
