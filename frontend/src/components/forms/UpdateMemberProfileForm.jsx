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
    paymentStatus: initialData?.paymentStatus || 'paid',
    exercises: initialData?.exercises || []
  });

  const [newExercise, setNewExercise] = useState({
    name: '',
    type: '',
    targetMuscleGroup: '',
    description: '',
    initialWeight: '',
    initialReps: '',
    initialSets: ''
  });

  const [showAddExercise, setShowAddExercise] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showProgressChart, setShowProgressChart] = useState(false);
  const [selectedExerciseProgress, setSelectedExerciseProgress] = useState(null);

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

  const handleExerciseChange = (e) => {
    const { name, value } = e.target;
    setNewExercise(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addExercise = () => {
    if (!newExercise.name || !newExercise.type) {
      return;
    }

    const exercise = {
      id: Date.now(),
      ...newExercise,
      dateAdded: new Date().toISOString(),
      progressHistory: [{
        date: new Date().toISOString(),
        weight: parseFloat(newExercise.initialWeight) || 0,
        reps: parseInt(newExercise.initialReps) || 0,
        sets: parseInt(newExercise.initialSets) || 0,
        notes: 'Initial baseline'
      }]
    };

    setFormData(prev => ({
      ...prev,
      exercises: [...prev.exercises, exercise]
    }));

    setNewExercise({
      name: '',
      type: '',
      targetMuscleGroup: '',
      description: '',
      initialWeight: '',
      initialReps: '',
      initialSets: ''
    });
    setShowAddExercise(false);
  };

  const removeExercise = (exerciseId) => {
    setFormData(prev => ({
      ...prev,
      exercises: prev.exercises.filter(ex => ex.id !== exerciseId)
    }));
  };

  const addProgressEntry = (exerciseId, progressData) => {
    setFormData(prev => ({
      ...prev,
      exercises: prev.exercises.map(exercise => 
        exercise.id === exerciseId 
          ? {
              ...exercise,
              progressHistory: [...exercise.progressHistory, {
                ...progressData,
                date: new Date().toISOString()
              }]
            }
          : exercise
      )
    }));
  };

  const exportProgressChart = (exercise) => {
    // Create a simple CSV export for the progress data
    const csvData = [
      ['Date', 'Weight (kg)', 'Reps', 'Sets', 'Notes'],
      ...exercise.progressHistory.map(entry => [
        new Date(entry.date).toLocaleDateString(),
        entry.weight,
        entry.reps,
        entry.sets,
        entry.notes || ''
      ])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${exercise.name}_progress_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const getProgressTrend = (exercise) => {
    if (exercise.progressHistory.length < 2) return 'No trend data';
    
    const latest = exercise.progressHistory[exercise.progressHistory.length - 1];
    const previous = exercise.progressHistory[exercise.progressHistory.length - 2];
    
    const weightChange = latest.weight - previous.weight;
    const repsChange = latest.reps - previous.reps;
    
    if (weightChange > 0 || repsChange > 0) return 'Improving 📈';
    if (weightChange < 0 || repsChange < 0) return 'Declining 📉';
    return 'Stable ➡️';
  };

  const shouldShowProgressReminder = (exercise) => {
    if (exercise.progressHistory.length === 0) return false;
    
    const lastEntry = exercise.progressHistory[exercise.progressHistory.length - 1];
    const daysSinceLastEntry = Math.floor((new Date() - new Date(lastEntry.date)) / (1000 * 60 * 60 * 24));
    
    return daysSinceLastEntry >= 21;
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="e.g., Complete a marathon, Achieve target body composition, Build lean muscle mass"
              />
            </div>
          </div>
        </div>

        {/* Exercise Tracking */}
        <div className="border-b pb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Exercise Tracking & Progress</h3>
            <Button
              type="button"
              onClick={() => setShowAddExercise(true)}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm"
            >
              Add Exercise
            </Button>
          </div>

          {/* Add Exercise Form */}
          {showAddExercise && (
            <div className="bg-emerald-50 rounded-lg p-6 mb-6 border border-emerald-200">
              <h4 className="text-md font-medium text-emerald-900 mb-4">Add New Exercise</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-emerald-700 mb-1">Exercise Name</label>
                  <input
                    type="text"
                    name="name"
                    value={newExercise.name}
                    onChange={handleExerciseChange}
                    className="w-full px-3 py-2 border border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g., Bench Press"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-emerald-700 mb-1">Exercise Type</label>
                  <select
                    name="type"
                    value={newExercise.type}
                    onChange={handleExerciseChange}
                    className="w-full px-3 py-2 border border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Select type</option>
                    <option value="strength">Strength Training</option>
                    <option value="cardio">Cardio</option>
                    <option value="flexibility">Flexibility</option>
                    <option value="functional">Functional</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-emerald-700 mb-1">Target Muscle Group</label>
                  <select
                    name="targetMuscleGroup"
                    value={newExercise.targetMuscleGroup}
                    onChange={handleExerciseChange}
                    className="w-full px-3 py-2 border border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Select muscle group</option>
                    <option value="chest">Chest</option>
                    <option value="back">Back</option>
                    <option value="shoulders">Shoulders</option>
                    <option value="arms">Arms</option>
                    <option value="legs">Legs</option>
                    <option value="core">Core</option>
                    <option value="full-body">Full Body</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-emerald-700 mb-1">Initial Weight (kg)</label>
                  <input
                    type="number"
                    name="initialWeight"
                    value={newExercise.initialWeight}
                    onChange={handleExerciseChange}
                    className="w-full px-3 py-2 border border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="0"
                    step="0.5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-emerald-700 mb-1">Initial Reps</label>
                  <input
                    type="number"
                    name="initialReps"
                    value={newExercise.initialReps}
                    onChange={handleExerciseChange}
                    className="w-full px-3 py-2 border border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-emerald-700 mb-1">Initial Sets</label>
                  <input
                    type="number"
                    name="initialSets"
                    value={newExercise.initialSets}
                    onChange={handleExerciseChange}
                    className="w-full px-3 py-2 border border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-emerald-700 mb-1">Description/Notes</label>
                <textarea
                  name="description"
                  value={newExercise.description}
                  onChange={handleExerciseChange}
                  rows={2}
                  className="w-full px-3 py-2 border border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Exercise description or special notes"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddExercise(false)}
                  className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={addExercise}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white"
                >
                  Add Exercise
                </Button>
              </div>
            </div>
          )}

          {/* Exercise List */}
          <div className="space-y-4">
            {formData.exercises.map((exercise) => (
              <div key={exercise.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-lg font-medium text-gray-900">{exercise.name}</h4>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className="px-2 py-1 text-xs bg-emerald-100 text-emerald-800 rounded-full">
                        {exercise.type}
                      </span>
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                        {exercise.targetMuscleGroup}
                      </span>
                      <span className="text-sm text-gray-600">
                        {getProgressTrend(exercise)}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      onClick={() => exportProgressChart(exercise)}
                      className="bg-teal-500 hover:bg-teal-600 text-white px-3 py-1 text-xs rounded"
                    >
                      Export 📊
                    </Button>
                    <Button
                      type="button"
                      onClick={() => removeExercise(exercise.id)}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 text-xs rounded"
                    >
                      Remove
                    </Button>
                  </div>
                </div>

                {/* Progress Reminder */}
                {shouldShowProgressReminder(exercise) && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                    <div className="flex items-center">
                      <span className="text-yellow-600 mr-2">⏰</span>
                      <span className="text-sm text-yellow-800">
                        It's been 21+ days since your last progress update for this exercise!
                      </span>
                    </div>
                  </div>
                )}

                {/* Current Stats */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-gray-900">
                      {exercise.progressHistory.length > 0 
                        ? `${exercise.progressHistory[exercise.progressHistory.length - 1].weight} kg`
                        : 'N/A'
                      }
                    </div>
                    <div className="text-sm text-gray-600">Current Weight</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-gray-900">
                      {exercise.progressHistory.length > 0 
                        ? exercise.progressHistory[exercise.progressHistory.length - 1].reps
                        : 'N/A'
                      }
                    </div>
                    <div className="text-sm text-gray-600">Current Reps</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-gray-900">
                      {exercise.progressHistory.length > 0 
                        ? exercise.progressHistory[exercise.progressHistory.length - 1].sets
                        : 'N/A'
                      }
                    </div>
                    <div className="text-sm text-gray-600">Current Sets</div>
                  </div>
                </div>

                {/* Progress History */}
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Progress History ({exercise.progressHistory.length} entries)</h5>
                  <div className="max-h-32 overflow-y-auto">
                    {exercise.progressHistory.slice(-3).reverse().map((entry, index) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                        <div className="text-sm text-gray-600">
                          {new Date(entry.date).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-900">
                          {entry.weight}kg × {entry.reps} reps × {entry.sets} sets
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {exercise.description && (
                  <div className="mt-3 text-sm text-gray-600">
                    <strong>Notes:</strong> {exercise.description}
                  </div>
                )}
              </div>
            ))}

            {formData.exercises.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">🏋️‍♂️</div>
                <p>No exercises added yet. Click "Add Exercise" to start tracking progress!</p>
              </div>
            )}
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