'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Stethoscope, AlertTriangle, Info, CheckCircle } from 'lucide-react';

interface Symptom {
  name: string;
  severity: number;
  duration: string;
  location: string;
  description: string;
}

interface Assessment {
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  urgency: 'immediate' | 'urgent' | 'semi_urgent' | 'non_urgent';
  possibleConditions: Array<{
    condition: string;
    probability: number;
    description: string;
  }>;
  recommendations: string[];
  referralNeeded: boolean;
  confidence: number;
}

export default function SymptomCheckerPage() {
  const [symptoms, setSymptoms] = useState<Symptom[]>([{
    name: '',
    severity: 5,
    duration: '',
    location: '',
    description: ''
  }]);
  const [vitalSigns, setVitalSigns] = useState({
    temperature: '',
    heartRate: '',
    bloodPressure: { systolic: '', diastolic: '' }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [error, setError] = useState<string | null>(null);

  const t = useTranslations('symptom_checker');
  const { data: session } = useSession();

  const addSymptom = () => {
    setSymptoms([...symptoms, {
      name: '',
      severity: 5,
      duration: '',
      location: '',
      description: ''
    }]);
  };

  const updateSymptom = (index: number, field: keyof Symptom, value: string | number) => {
    const updatedSymptoms = symptoms.map((symptom, i) => 
      i === index ? { ...symptom, [field]: value } : symptom
    );
    setSymptoms(updatedSymptoms);
  };

  const removeSymptom = (index: number) => {
    setSymptoms(symptoms.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session) {
      setError('Please sign in to use the symptom checker');
      return;
    }

    const validSymptoms = symptoms.filter(symptom => symptom.name.trim());
    if (validSymptoms.length === 0) {
      setError('Please describe at least one symptom');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/symptoms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symptoms: validSymptoms,
          vitalSigns: {
            temperature: vitalSigns.temperature ? parseFloat(vitalSigns.temperature) : undefined,
            heartRate: vitalSigns.heartRate ? parseInt(vitalSigns.heartRate) : undefined,
            bloodPressure: vitalSigns.bloodPressure.systolic && vitalSigns.bloodPressure.diastolic ? {
              systolic: parseInt(vitalSigns.bloodPressure.systolic),
              diastolic: parseInt(vitalSigns.bloodPressure.diastolic)
            } : undefined
          }
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze symptoms');
      }

      setAssessment(data.assessment);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'moderate': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'critical':
      case 'high':
        return <AlertTriangle className="h-5 w-5" />;
      case 'moderate':
        return <Info className="h-5 w-5" />;
      case 'low':
        return <CheckCircle className="h-5 w-5" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Stethoscope className="h-12 w-12 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {t('title')}
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t('description')}
          </p>
        </div>

        {!session && (
          <Card className="mb-8 border-orange-200 bg-orange-50">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <Info className="h-5 w-5 text-orange-600" />
                <p className="text-orange-800">
                  Please <a href="/auth/signin" className="underline">sign in</a> to use the symptom checker and save your health assessments.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Symptom Input Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>{t('start_assessment')}</CardTitle>
                <CardDescription>
                  Describe your symptoms in detail for an accurate assessment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Symptoms */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Symptoms</h3>
                    {symptoms.map((symptom, index) => (
                      <div key={index} className="border rounded-lg p-4 mb-4 space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium">Symptom {index + 1}</h4>
                          {symptoms.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeSymptom(index)}
                            >
                              Remove
                            </Button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">
                              {t('describe_symptoms')}
                            </label>
                            <Input
                              placeholder={t('symptoms_placeholder')}
                              value={symptom.name}
                              onChange={(e) => updateSymptom(index, 'name', e.target.value)}
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-2">
                              {t('severity')} ({symptom.severity}/10)
                            </label>
                            <input
                              type="range"
                              min="1"
                              max="10"
                              value={symptom.severity}
                              onChange={(e) => updateSymptom(index, 'severity', parseInt(e.target.value))}
                              className="w-full"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-2">
                              {t('duration')}
                            </label>
                            <Input
                              placeholder="e.g., 2 days, 1 week"
                              value={symptom.duration}
                              onChange={(e) => updateSymptom(index, 'duration', e.target.value)}
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-2">
                              {t('location')}
                            </label>
                            <Input
                              placeholder="e.g., head, chest, abdomen"
                              value={symptom.location}
                              onChange={(e) => updateSymptom(index, 'location', e.target.value)}
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">
                            {t('additional_info')}
                          </label>
                          <Textarea
                            placeholder="Any additional details about this symptom"
                            value={symptom.description}
                            onChange={(e) => updateSymptom(index, 'description', e.target.value)}
                            rows={2}
                          />
                        </div>
                      </div>
                    ))}

                    <Button
                      type="button"
                      variant="outline"
                      onClick={addSymptom}
                      className="w-full"
                    >
                      Add Another Symptom
                    </Button>
                  </div>

                  {/* Vital Signs */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Vital Signs (Optional)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Temperature (°C)
                        </label>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="37.0"
                          value={vitalSigns.temperature}
                          onChange={(e) => setVitalSigns({...vitalSigns, temperature: e.target.value})}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Heart Rate (bpm)
                        </label>
                        <Input
                          type="number"
                          placeholder="72"
                          value={vitalSigns.heartRate}
                          onChange={(e) => setVitalSigns({...vitalSigns, heartRate: e.target.value})}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Blood Pressure (mmHg)
                        </label>
                        <div className="flex space-x-2">
                          <Input
                            type="number"
                            placeholder="120"
                            value={vitalSigns.bloodPressure.systolic}
                            onChange={(e) => setVitalSigns({
                              ...vitalSigns, 
                              bloodPressure: {...vitalSigns.bloodPressure, systolic: e.target.value}
                            })}
                          />
                          <span className="self-center">/</span>
                          <Input
                            type="number"
                            placeholder="80"
                            value={vitalSigns.bloodPressure.diastolic}
                            onChange={(e) => setVitalSigns({
                              ...vitalSigns, 
                              bloodPressure: {...vitalSigns.bloodPressure, diastolic: e.target.value}
                            })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-800">{error}</p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading || !session}
                  >
                    {isLoading ? 'Analyzing...' : t('submit')}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Assessment Results */}
          <div>
            {assessment && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    {getRiskIcon(assessment.riskLevel)}
                    <span>Assessment Results</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Risk Level */}
                  <div>
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(assessment.riskLevel)}`}>
                      {t(`risk_levels.${assessment.riskLevel}`)}
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      {t(`urgency_levels.${assessment.urgency}`)}
                    </p>
                  </div>

                  {/* Possible Conditions */}
                  <div>
                    <h4 className="font-medium mb-3">Possible Conditions</h4>
                    <div className="space-y-2">
                      {assessment.possibleConditions.slice(0, 3).map((condition, index) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-medium">{condition.condition}</span>
                            <span className="text-sm text-gray-600">{condition.probability}%</span>
                          </div>
                          <p className="text-sm text-gray-600">{condition.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div>
                    <h4 className="font-medium mb-3">Recommendations</h4>
                    <ul className="space-y-2">
                      {assessment.recommendations.slice(0, 3).map((rec, index) => (
                        <li key={index} className="flex items-start space-x-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Confidence */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Confidence</span>
                      <span className="text-sm text-gray-600">{assessment.confidence}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${assessment.confidence}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Disclaimer */}
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-xs text-yellow-800">
                      <strong>Disclaimer:</strong> This assessment is for informational purposes only and should not replace professional medical advice. Always consult with a healthcare provider for proper diagnosis and treatment.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Emergency Notice */}
            <Card className="mt-6 border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium text-red-800 mb-1">
                      Emergency Situations
                    </h4>
                    <p className="text-xs text-red-700">
                      If you are experiencing severe chest pain, difficulty breathing, loss of consciousness, or other emergency symptoms, call emergency services immediately.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
