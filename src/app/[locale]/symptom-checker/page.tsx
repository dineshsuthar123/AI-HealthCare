'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Stethoscope, Plus, X, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { type SymptomInput, type AIAnalysis } from '@/lib/ai/symptom-analyzer';
import { cn, getRiskColor, getUrgencyColor } from '@/lib/utils';
import { Link } from '@/navigation';
import { EmergencyContact } from '@/components/symptom-checker/emergency-contact';

export default function SymptomCheckerPage() {
    const t = useTranslations('SymptomChecker');
    const [symptoms, setSymptoms] = useState<SymptomInput[]>([]);
    const [currentSymptom, setCurrentSymptom] = useState<SymptomInput>({
        name: '',
        severity: 'mild',
        duration: '',
        description: '',
    });
    const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isClient, setIsClient] = useState(false);

    // This helps prevent hydration errors by ensuring forms render only client-side
    useEffect(() => {
        setIsClient(true);
    }, []); const addSymptom = () => {
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
        setIsAnalyzing(true);
        setError(null);

        try {
            // Add AbortController with timeout to prevent UI freeze on slow responses
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

            console.log('Submitting symptoms for analysis:', symptoms);

            const result = await fetch('/api/symptom-check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ symptoms }),
                signal: controller.signal
            });

            // Clear timeout
            clearTimeout(timeoutId);

            const responseData = await result.json();

            if (!result.ok) {
                throw new Error(responseData.error || 'Failed to analyze symptoms');
            }

            console.log('Analysis result:', responseData.analysis);

            if (!responseData.analysis || !responseData.analysis.riskLevel) {
                throw new Error('Invalid response format from symptom checker API');
            }

            setAnalysis(responseData.analysis);

            // Auto show emergency contact form for critical or emergency cases
            if (responseData.analysis.riskLevel === 'critical' || responseData.analysis.urgency === 'emergency') {
                setShowEmergencyForm(true);
            }
        } catch (error) {
            console.error('Error analyzing symptoms:', error);
            let errorMessage = 'An unexpected error occurred while analyzing symptoms. Please try again later.';

            if (error instanceof Error) {
                if (error.name === 'AbortError') {
                    errorMessage = 'Analysis is taking longer than expected. Please try again with fewer symptoms.';
                } else {
                    errorMessage = error.message;
                }
            }

            setError(errorMessage);
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Render a simple skeleton during SSR to prevent hydration mismatch
    if (!isClient) {
        return (
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <Stethoscope className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            {t('title')}
                        </h1>
                        <p className="text-lg text-gray-600">
                            {t('subtitle')}
                        </p>
                    </div>
                    <div className="h-12 bg-gray-200 animate-pulse rounded-md mb-8"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <Stethoscope className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        {t('title')}
                    </h1>
                    <p className="text-lg text-gray-600">
                        {t('subtitle')}
                    </p>
                </div>

                {/* Symptom Input */}
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle>{t('addSymptoms')}</CardTitle>
                        <CardDescription>
                            Provide as much detail as possible for accurate analysis
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t('symptomNameLabel')}
                                </label>
                                <Input
                                    type="text"
                                    placeholder={t('symptomNamePlaceholder')}
                                    value={currentSymptom.name}
                                    onChange={(e) => setCurrentSymptom({ ...currentSymptom, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t('durationLabel')}
                                </label>
                                <Input
                                    type="text"
                                    placeholder={t('durationPlaceholder')}
                                    value={currentSymptom.duration}
                                    onChange={(e) => setCurrentSymptom({ ...currentSymptom, duration: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {t('severityLabel')}
                            </label>
                            <select
                                className="w-full p-2 border border-gray-300 rounded-md"
                                value={currentSymptom.severity}
                                onChange={(e) => setCurrentSymptom({ ...currentSymptom, severity: e.target.value as 'mild' | 'moderate' | 'severe' })}
                                aria-label={t('severityLabel')}
                            >
                                <option value="mild">{t('mild')}</option>
                                <option value="moderate">{t('moderate')}</option>
                                <option value="severe">{t('severe')}</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {t('detailsLabel')}
                            </label>
                            <textarea
                                className="w-full p-2 border border-gray-300 rounded-md"
                                rows={3}
                                placeholder={t('detailsPlaceholder')}
                                value={currentSymptom.description}
                                onChange={(e) => setCurrentSymptom({ ...currentSymptom, description: e.target.value })}
                            />
                        </div>

                        <Button onClick={addSymptom} className="w-full">
                            <Plus className="h-4 w-4 mr-2" />
                            {t('addSymptomButton')}
                        </Button>
                    </CardContent>
                </Card>

                {/* Added Symptoms */}
                {symptoms.length > 0 && (
                    <Card className="mb-8">
                        <CardHeader>
                            <CardTitle>{t('yourSymptoms')} ({symptoms.length})</CardTitle>
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
                                            <p className="text-sm text-gray-600">{t('durationLabel')}: {symptom.duration}</p>
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

                            {error && (
                                <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg">
                                    <AlertTriangle className="h-5 w-5 inline-block mr-2" />
                                    {error}
                                </div>
                            )}

                            <Button
                                onClick={handleAnalyze}
                                disabled={isAnalyzing}
                                className="w-full mt-4"
                                size="lg"
                            >
                                {isAnalyzing ? (
                                    <>
                                        <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                        {t('analyzingButton')}
                                    </>
                                ) : (
                                    t('analyzeButton')
                                )}
                            </Button>

                            {isAnalyzing && (
                                <div className="mt-4 p-3 bg-blue-50 text-blue-700 rounded-lg">
                                    <div className="flex items-center">
                                        <div className="mr-3">
                                            <div className="animate-pulse h-6 w-6 rounded-full bg-blue-200"></div>
                                        </div>
                                        <div>
                                            <p className="font-medium">Analysis in progress</p>
                                            <p className="text-sm">This may take up to 15-30 seconds depending on the complexity of symptoms.</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Analysis Results */}
                {analysis && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                                {t('resultsTitle')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Risk Level */}
                            <div>
                                <h3 className="font-semibold mb-2">{t('riskAssessment')}</h3>
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
                                <h3 className="font-semibold mb-2">{t('urgencyLevel')}</h3>
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
                                <h3 className="font-semibold mb-2">{t('recommendations')}</h3>
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
                                <h3 className="font-semibold mb-2">{t('possibleConditions')}</h3>
                                {analysis.possibleConditions && analysis.possibleConditions.length > 0 ? (
                                    <div className="space-y-3">
                                        {analysis.possibleConditions.map((condition, index) => (
                                            <div key={index} className="p-3 bg-gray-50 rounded-lg">
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="font-medium">{condition.condition}</span>
                                                    <span className="text-sm text-gray-600">{condition.probability}%</span>
                                                </div>
                                                <p className="text-sm text-gray-600">{condition.description}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <p className="text-sm text-gray-600">
                                            Unable to determine specific conditions. Please consult a healthcare professional for proper diagnosis.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Follow-up Recommendation */}
                            {analysis.followUpIn && (
                                <div>
                                    <h3 className="font-semibold mb-2">{t('followUpRecommendation')}</h3>
                                    <div className="p-3 bg-blue-50 text-blue-800 rounded-lg flex items-center">
                                        <CheckCircle className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0" />
                                        <span>{t('followUpPrefixText')} <strong>{analysis.followUpIn}</strong></span>
                                    </div>
                                </div>
                            )}

                            {/* Disclaimer */}
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <div className="flex">
                                    <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2 flex-shrink-0" />
                                    <div className="text-sm text-yellow-800">
                                        {t('disclaimer')}
                                        {analysis.telemetry?.fallbackUsed && (
                                            <p className="mt-1 text-xs text-yellow-600">
                                                Note: This analysis was generated using our fallback system. For more accurate results, please try again later.
                                            </p>
                                        )}
                                        {analysis.telemetry?.cached && (
                                            <p className="mt-1 text-xs text-green-600">
                                                This analysis was retrieved from our cache for faster results.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Button asChild className="flex-1">
                                    <Link href="/consultations">{t('bookConsultation')}</Link>
                                </Button>
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => {
                                        // Future enhancement: Save results to user profile
                                        alert('Results saved successfully');
                                    }}
                                >
                                    {t('saveResults')}
                                </Button>
                            </div>

                            {/* Emergency Contact Component */}
                            <EmergencyContact
                                analysis={analysis}
                                symptoms={symptoms.map(s => s.name)}
                            />
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
