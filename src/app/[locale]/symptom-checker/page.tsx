'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Stethoscope, Plus, X, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { analyzeSymptoms, type SymptomInput } from '@/lib/ai/symptom-analyzer';
import { cn, getRiskColor, getUrgencyColor } from '@/lib/utils';

export default function SymptomCheckerPage() {
    const t = useTranslations('SymptomChecker');
    const [symptoms, setSymptoms] = useState<SymptomInput[]>([]);
    const [currentSymptom, setCurrentSymptom] = useState<SymptomInput>({
        name: '',
        severity: 'mild',
        duration: '',
        description: '',
    });
    const [analysis, setAnalysis] = useState<any>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const addSymptom = () => {
        if (currentSymptom.name && currentSymptom.duration) {
            setSymptoms([...symptoms, currentSymptom]);
            setCurrentSymptom({
                name: '',
                severity: 'mild',
                duration: '',
                description: '',
            });
        }
    };

    const removeSymptom = (index: number) => {
        setSymptoms(symptoms.filter((_, i) => i !== index));
    };

    const handleAnalyze = async () => {
        if (symptoms.length === 0) return;

        setIsAnalyzing(true);
        try {
            const result = await fetch('/api/symptom-check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ symptoms }),
            });

            if (result.ok) {
                const data = await result.json();
                setAnalysis(data.analysis);
            }
        } catch (error) {
            console.error('Error analyzing symptoms:', error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <Stethoscope className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        AI Symptom Checker
                    </h1>
                    <p className="text-lg text-gray-600">
                        Describe your symptoms for AI-powered health assessment
                    </p>
                </div>

                {/* Symptom Input */}
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle>Add Your Symptoms</CardTitle>
                        <CardDescription>
                            Provide as much detail as possible for accurate analysis
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Symptom Name
                                </label>
                                <Input
                                    type="text"
                                    placeholder="e.g., headache, fever, cough"
                                    value={currentSymptom.name}
                                    onChange={(e) => setCurrentSymptom({ ...currentSymptom, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Duration
                                </label>
                                <Input
                                    type="text"
                                    placeholder="e.g., 2 days, 1 week"
                                    value={currentSymptom.duration}
                                    onChange={(e) => setCurrentSymptom({ ...currentSymptom, duration: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Severity
                            </label>
                            <select
                                className="w-full p-2 border border-gray-300 rounded-md"
                                value={currentSymptom.severity}
                                onChange={(e) => setCurrentSymptom({ ...currentSymptom, severity: e.target.value as 'mild' | 'moderate' | 'severe' })}
                            >
                                <option value="mild">Mild</option>
                                <option value="moderate">Moderate</option>
                                <option value="severe">Severe</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Additional Details (Optional)
                            </label>
                            <textarea
                                className="w-full p-2 border border-gray-300 rounded-md"
                                rows={3}
                                placeholder="Any additional information about this symptom"
                                value={currentSymptom.description}
                                onChange={(e) => setCurrentSymptom({ ...currentSymptom, description: e.target.value })}
                            />
                        </div>

                        <Button onClick={addSymptom} className="w-full">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Symptom
                        </Button>
                    </CardContent>
                </Card>

                {/* Added Symptoms */}
                {symptoms.length > 0 && (
                    <Card className="mb-8">
                        <CardHeader>
                            <CardTitle>Your Symptoms ({symptoms.length})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {symptoms.map((symptom, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-2">
                                                <span className="font-medium">{symptom.name}</span>
                                                <span className={cn(
                                                    "px-2 py-1 rounded-full text-xs",
                                                    symptom.severity === 'mild' && "bg-green-100 text-green-800",
                                                    symptom.severity === 'moderate' && "bg-yellow-100 text-yellow-800",
                                                    symptom.severity === 'severe' && "bg-red-100 text-red-800"
                                                )}>
                                                    {symptom.severity}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600">Duration: {symptom.duration}</p>
                                            {symptom.description && (
                                                <p className="text-sm text-gray-500">{symptom.description}</p>
                                            )}
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeSymptom(index)}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>

                            <Button
                                onClick={handleAnalyze}
                                disabled={isAnalyzing}
                                className="w-full mt-4"
                                size="lg"
                            >
                                {isAnalyzing ? 'Analyzing...' : 'Analyze Symptoms'}
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Analysis Results */}
                {analysis && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                                AI Analysis Results
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Risk Level */}
                            <div>
                                <h3 className="font-semibold mb-2">Risk Assessment</h3>
                                <div className={cn(
                                    "p-3 rounded-lg flex items-center",
                                    getRiskColor(analysis.riskLevel)
                                )}>
                                    <AlertTriangle className="h-5 w-5 mr-2" />
                                    <span className="font-medium">
                                        {analysis.riskLevel.charAt(0).toUpperCase() + analysis.riskLevel.slice(1)} Risk
                                    </span>
                                </div>
                            </div>

                            {/* Urgency */}
                            <div>
                                <h3 className="font-semibold mb-2">Urgency Level</h3>
                                <div className={cn(
                                    "p-3 rounded-lg",
                                    getUrgencyColor(analysis.urgency)
                                )}>
                                    <span className="font-medium">
                                        {analysis.urgency.charAt(0).toUpperCase() + analysis.urgency.slice(1)}
                                    </span>
                                </div>
                            </div>

                            {/* Recommendations */}
                            <div>
                                <h3 className="font-semibold mb-2">Recommendations</h3>
                                <ul className="space-y-2">
                                    {analysis.recommendations.map((rec: string, index: number) => (
                                        <li key={index} className="flex items-start">
                                            <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                                            <span className="text-sm">{rec}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Possible Conditions */}
                            <div>
                                <h3 className="font-semibold mb-2">Possible Conditions</h3>
                                <div className="space-y-3">
                                    {analysis.possibleConditions.map((condition: any, index: number) => (
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

                            {/* Disclaimer */}
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <div className="flex">
                                    <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2 flex-shrink-0" />
                                    <div className="text-sm text-yellow-800">
                                        <strong>Medical Disclaimer:</strong> This AI analysis is for informational purposes only and should not replace professional medical advice. Please consult with a healthcare provider for proper diagnosis and treatment.
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex space-x-4">
                                <Button asChild className="flex-1">
                                    <a href="/consultations">Book Consultation</a>
                                </Button>
                                <Button variant="outline" className="flex-1">
                                    Save Results
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
