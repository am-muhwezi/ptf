import React, { useState } from 'react';
import Button from '../ui/Button';

const UpdateMemberProfileForm = ({ initialData, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    height: initialData?.height || '',
    weight: initialData?.weight || '',
    bodyFatPercentage: initialData?.bodyFatPercentage || '',
    fitnessLevel: initialData?.fitnessLevel || '',
    strengthTestResults: initialData?.strengthTestResults || '',
    cardioTestResults: initialData?.cardioTestResults || '',
    flexibilityTestResults: initialData?.flexibilityTestResults || '',
    shortTermGoals: initialData?.shortTermGoals || '',
    longTermGoals: initialData?.longTermGoals || '',
    membershipPlan: initialData?.membershipPlan || '',
    membershipStartDate: initialData?.membershipStartDate || '',
    membershipEndDate: initialData?.membershipEndDate || '',
    paymentStatus: initialData?.paymentStatus || 'paid'
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (formData.height && (formData.height < 50 || formData.height > 300)) {
      newErrors.height = 'Height must be between 50-300 cm';
    }

    if (formData.weight && (formData.weight < 20 || formData.weight > 500)) {
      newErrors.weight = 'Weight must be between 20-500 kg';
    }

    if (formData.bodyFatPercentage && (formData.bodyFatPercentage < 0 || formData.bodyFatPercentage > 100)) {
      newErrors.bodyFatPercentage = 'Body fat percentage must be between 0-100%';
    }

    if (formData.membershipStartDate && formData.membershipEndDate) {
      if (new Date(formData.membershipStartDate) >= new Date(formData.membershipEndDate)) {
        newErrors.membershipEndDate = 'End date must be after start date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Calculate BMI if height and weight are provided
      let bmi = null;
      if (formData.height && formData.weight) {
        const heightInMeters = formData.height / 100;
        bmi = (formData.weight / (heightInMeters * heightInMeters)).toFixed(1);
      }

      const updatedData = {
        ...formData,
        bmi,
        // Convert string numbers to actual numbers
        height: formData.height ? parseFloat(formData.height) : null,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        bodyFatPercentage: formData.bodyFatPercentage ? parseFloat(formData.bodyFatPercentage) : null,
      };

      await onSubmit(updatedData);
    } catch (error) {
      console.error('Error updating member profile:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getBMI = () => {
    if (formData.height && formData.weight) {
      const heightInMeters = formData.height / 100;
      const bmi = (formData.weight / (heightInMeters * heightInMeters)).toFixed(1);
      return bmi;
    }
    return null;
  };

  const getBMICategory = (bmi) => {
    if (!bmi) return '';
    const bmiValue = parseFloat(bmi);
    if (bmiValue < 18.5) return 'Underweight';
    if (bmiValue < 25) return 'Normal weight';
    if (bmiValue < 30) return 'Overweight';
    return 'Obese';
  };

  const currentBMI = getBMI();

  return (
    <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Update Member Profile</h2>
        <p className="text-gray-600">Update health analysis, fitness testing, and goal information</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Physical Measurements */}
        <div className="border-b pb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Physical Measurements</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="height" className="block text-sm font-medium text-gray-700 mb-1">
                Height (cm)
              </label>
              <input
                type="number"
                id="height"
                name="height"
                value={formData.height}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.height ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., 175"
                min="50"
                max="300"
                step="0.1"
              />
              {errors.height && <p className="text-red-500 text-xs mt-1">{errors.height}</p>}
            </div>

            <div>
              <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-1">
                Weight (kg)
              </label>
              <input
                type="number"
                id="weight"
                name="weight"
                value={formData.weight}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.weight ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., 70"
                min="20"
                max="500"
                step="0.1"
              />
              {errors.weight && <p className="text-red-500 text-xs mt-1">{errors.weight}</p>}
            </div>

            <div>
              <label htmlFor="bodyFatPercentage" className="block text-sm font-medium text-gray-700 mb-1">
                Body Fat (%)
              </label>
              <input
                type="number"
                id="bodyFatPercentage"
                name="bodyFatPercentage"
                value={formData.bodyFatPercentage}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.bodyFatPercentage ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., 15.5"
                min="0"
                max="100"
                step="0.1"
              />
              {errors.bodyFatPercentage && <p className="text-red-500 text-xs mt-1">{errors.bodyFatPercentage}</p>}
            </div>
          </div>

          {/* BMI Display */}
          {currentBMI && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-blue-900">Calculated BMI:</span>
                  <span className="ml-2 text-lg font-bold text-blue-900">{currentBMI}</span>
                </div>
                <div>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                    getBMICategory(currentBMI) === 'Normal weight' ? 'bg-green-100 text-green-800' :
                    getBMICategory(currentBMI) === 'Underweight' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-orange-100 text-orange-800'
                  }`}>
                    {getBMICategory(currentBMI)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Fitness Level */}
        <div className="border-b pb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Fitness Assessment</h3>
          <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-4">
            <div>
              <label htmlFor="fitnessLevel" className="block text-sm font-medium text-gray-700 mb-1">
                Current Fitness Level
              </label>
              <select
                id="fitnessLevel"
                name="fitnessLevel"
                value={formData.fitnessLevel}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select fitness level</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="athlete">Athlete</option>
              </select>
            </div>
          </div>

          {/* Fitness Test Results */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="strengthTestResults" className="block text-sm font-medium text-gray-700 mb-1">
                Strength Test Results
              </label>
              <textarea
                id="strengthTestResults"
                name="strengthTestResults"
                value={formData.strengthTestResults}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Bench Press: 80kg, Squat: 100kg, Deadlift: 120kg"
              />
            </div>

            <div>
              <label htmlFor="cardioTestResults" className="block text-sm font-medium text-gray-700 mb-1">
                Cardio Test Results
              </label>
              <textarea
                id="cardioTestResults"
                name="cardioTestResults"
                value={formData.cardioTestResults}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 5K run: 25 minutes, Resting HR: 65 bpm, Max HR: 185 bpm"
              />
            </div>

            <div>
              <label htmlFor="flexibilityTestResults" className="block text-sm font-medium text-gray-700 mb-1">
                Flexibility Test Results
              </label>
              <textarea
                id="flexibilityTestResults"
                name="flexibilityTestResults"
                value={formData.flexibilityTestResults}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Sit-and-reach: 15cm, Shoulder flexibility: Good, Hip mobility: Needs improvement"
              />
            </div>
          </div>
        </div>

        {/* Goals */}
        <div className="border-b pb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Fitness Goals</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="shortTermGoals" className="block text-sm font-medium text-gray-700 mb-1">
                Short-term Goals (3-6 months)
              </label>
              <textarea
                id="shortTermGoals"
                name="shortTermGoals"
                value={formData.shortTermGoals}
                onChange={handleChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Lose 5kg, Run 5K without stopping, Increase bench press by 10kg"
              />
            </div>

            <div>
              <label htmlFor="longTermGoals" className="block text-sm font-medium text-gray-700 mb-1">
                Long-term Goals (6+ months)
              </label>
              <textarea
                id="longTermGoals"
                name="longTermGoals"
                value={formData.longTermGoals}
                onChange={handleChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Complete a marathon, Achieve target body composition, Build lean muscle mass"
              />
            </div>
          </div>
        </div>

        {/* Membership Details */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Membership Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="membershipPlan" className="block text-sm font-medium text-gray-700 mb-1">
                Membership Plan
              </label>
              <select
                id="membershipPlan"
                name="membershipPlan"
                value={formData.membershipPlan}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select membership plan</option>
                <option value="basic">Basic Indoor</option>
                <option value="standard">Standard Indoor</option>
                <option value="premium">Premium Indoor</option>
                <option value="vip">VIP Indoor</option>
              </select>
            </div>

            <div>
              <label htmlFor="paymentStatus" className="block text-sm font-medium text-gray-700 mb-1">
                Payment Status
              </label>
              <select
                id="paymentStatus"
                name="paymentStatus"
                value={formData.paymentStatus}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>

            <div>
              <label htmlFor="membershipStartDate" className="block text-sm font-medium text-gray-700 mb-1">
                Membership Start Date
              </label>
              <input
                type="date"
                id="membershipStartDate"
                name="membershipStartDate"
                value={formData.membershipStartDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="membershipEndDate" className="block text-sm font-medium text-gray-700 mb-1">
                Membership End Date
              </label>
              <input
                type="date"
                id="membershipEndDate"
                name="membershipEndDate"
                value={formData.membershipEndDate}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.membershipEndDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.membershipEndDate && <p className="text-red-500 text-xs mt-1">{errors.membershipEndDate}</p>}
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            className="min-w-32"
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default UpdateMemberProfileForm;