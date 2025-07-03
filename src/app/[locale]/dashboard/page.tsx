'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Activity,
  Users,
  TrendingUp,
  TrendingDown,
  Calendar,
  AlertTriangle,
  Heart,
  MessageSquare,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface HealthMetric {
  id: string;
  name: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  unit?: string;
}

interface UsageStats {
  totalUsers: number;
  activeUsers: number;
  symptomChecks: number;
  appointments: number;
  smsInteractions: number;
  emergencyAlerts: number;
}

interface SymptomTrend {
  date: string;
  fever: number;
  cough: number;
  headache: number;
  fatigue: number;
  nausea: number;
}

interface DemographicData {
  ageGroup: string;
  users: number;
  percentage: number;
}

interface LanguageUsage {
  language: string;
  users: number;
  percentage: number;
  color: string;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const t = useTranslations('dashboard');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [healthMetrics, setHealthMetrics] = useState<HealthMetric[]>([]);
  const [usageStats, setUsageStats] = useState<UsageStats>({} as UsageStats);
  const [symptomTrends, setSymptomTrends] = useState<SymptomTrend[]>([]);
  const [demographics, setDemographics] = useState<DemographicData[]>([]);
  const [languageUsage, setLanguageUsage] = useState<LanguageUsage[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock data (in real app, fetch from API)
  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock health metrics
      setHealthMetrics([
        {
          id: '1',
          name: 'Average Response Time',
          value: 2.3,
          change: -15,
          trend: 'down',
          unit: 'minutes',
        },
        {
          id: '2',
          name: 'Accuracy Rate',
          value: 94.2,
          change: 3.1,
          trend: 'up',
          unit: '%',
        },
        {
          id: '3',
          name: 'User Satisfaction',
          value: 4.6,
          change: 0.2,
          trend: 'up',
          unit: '/5',
        },
        {
          id: '4',
          name: 'Emergency Detection',
          value: 98.7,
          change: 1.2,
          trend: 'up',
          unit: '%',
        },
      ]);

      // Mock usage statistics
      setUsageStats({
        totalUsers: 12847,
        activeUsers: 8234,
        symptomChecks: 45621,
        appointments: 3456,
        smsInteractions: 18903,
        emergencyAlerts: 234,
      });

      // Mock symptom trends
      setSymptomTrends([
        { date: '2024-01-01', fever: 120, cough: 95, headache: 78, fatigue: 156, nausea: 45 },
        { date: '2024-01-02', fever: 135, cough: 110, headache: 82, fatigue: 167, nausea: 52 },
        { date: '2024-01-03', fever: 98, cough: 87, headache: 91, fatigue: 143, nausea: 38 },
        { date: '2024-01-04', fever: 142, cough: 123, headache: 76, fatigue: 178, nausea: 61 },
        { date: '2024-01-05', fever: 156, cough: 134, headache: 88, fatigue: 189, nausea: 49 },
        { date: '2024-01-06', fever: 119, cough: 98, headache: 93, fatigue: 165, nausea: 43 },
        { date: '2024-01-07', fever: 178, cough: 145, headache: 84, fatigue: 203, nausea: 67 },
      ]);

      // Mock demographics
      setDemographics([
        { ageGroup: '18-25', users: 2845, percentage: 22.1 },
        { ageGroup: '26-35', users: 3956, percentage: 30.8 },
        { ageGroup: '36-45', users: 2734, percentage: 21.3 },
        { ageGroup: '46-55', users: 1967, percentage: 15.3 },
        { ageGroup: '56-65', users: 1034, percentage: 8.0 },
        { ageGroup: '65+', users: 311, percentage: 2.4 },
      ]);

      // Mock language usage
      setLanguageUsage([
        { language: 'English', users: 5834, percentage: 45.4, color: '#8884d8' },
        { language: 'Spanish', users: 3245, percentage: 25.3, color: '#82ca9d' },
        { language: 'Portuguese', users: 1876, percentage: 14.6, color: '#ffc658' },
        { language: 'French', users: 987, percentage: 7.7, color: '#ff7300' },
        { language: 'Hindi', users: 654, percentage: 5.1, color: '#00ff00' },
        { language: 'Arabic', users: 251, percentage: 2.0, color: '#ff0000' },
      ]);

      setLoading(false);
    };

    if (session?.user) {
      loadDashboardData();
    }
  }, [session, timeRange]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">{t('auth.required')}</CardTitle>
            <CardDescription className="text-center">
              {t('auth.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => window.location.href = '/auth/signin'}>
              {t('auth.signIn')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 dashboard-container">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
              <p className="mt-2 text-gray-600">{t('subtitle')}</p>
            </div>
            <div className="mt-4 sm:mt-0">
              <select
                title="Time Range"
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as '7d' | '30d' | '90d' | '1y')}
                className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="7d">{t('timeRange.7d')}</option>
                <option value="30d">{t('timeRange.30d')}</option>
                <option value="90d">{t('timeRange.90d')}</option>
                <option value="1y">{t('timeRange.1y')}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {healthMetrics.map((metric) => (
            <Card key={metric.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{metric.name}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {metric.value}
                      {metric.unit && <span className="text-sm text-gray-500 ml-1">{metric.unit}</span>}
                    </p>
                  </div>
                  <div className={`p-2 rounded-full ${metric.trend === 'up' ? 'bg-green-100' :
                    metric.trend === 'down' ? 'bg-red-100' : 'bg-gray-100'
                    }`}>
                    {metric.trend === 'up' ? (
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    ) : metric.trend === 'down' ? (
                      <TrendingDown className="w-5 h-5 text-red-600" />
                    ) : (
                      <Activity className="w-5 h-5 text-gray-600" />
                    )}
                  </div>
                </div>
                <div className="mt-2">
                  <span className={`text-sm ${metric.change > 0 ? 'text-green-600' :
                    metric.change < 0 ? 'text-red-600' : 'text-gray-600'
                    }`}>
                    {metric.change > 0 ? '+' : ''}{metric.change}%
                  </span>
                  <span className="text-sm text-gray-500 ml-1">
                    {t('metrics.fromPrevious')}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Usage Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {[
            { label: t('usage.totalUsers'), value: usageStats.totalUsers, icon: Users, color: 'bg-blue-500' },
            { label: t('usage.activeUsers'), value: usageStats.activeUsers, icon: Activity, color: 'bg-green-500' },
            { label: t('usage.symptomChecks'), value: usageStats.symptomChecks, icon: Heart, color: 'bg-purple-500' },
            { label: t('usage.appointments'), value: usageStats.appointments, icon: Calendar, color: 'bg-orange-500' },
            { label: t('usage.smsInteractions'), value: usageStats.smsInteractions, icon: MessageSquare, color: 'bg-teal-500' },
            { label: t('usage.emergencyAlerts'), value: usageStats.emergencyAlerts, icon: AlertTriangle, color: 'bg-red-500' },
          ].map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${stat.color}`}>
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">{stat.label}</p>
                    <p className="text-lg font-bold text-gray-900">{formatNumber(stat.value)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Symptom Trends */}
          <Card>
            <CardHeader>
              <CardTitle>{t('charts.symptomTrends')}</CardTitle>
              <CardDescription>{t('charts.symptomTrendsDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={symptomTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString()} />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    formatter={(value: number, name: string) => [value, t(`symptoms.${name}`)]}
                  />
                  <Legend formatter={(value) => t(`symptoms.${value}`)} />
                  <Line type="monotone" dataKey="fever" stroke="#ef4444" strokeWidth={2} />
                  <Line type="monotone" dataKey="cough" stroke="#f59e0b" strokeWidth={2} />
                  <Line type="monotone" dataKey="headache" stroke="#8b5cf6" strokeWidth={2} />
                  <Line type="monotone" dataKey="fatigue" stroke="#06b6d4" strokeWidth={2} />
                  <Line type="monotone" dataKey="nausea" stroke="#10b981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Demographics */}
          <Card>
            <CardHeader>
              <CardTitle>{t('charts.demographics')}</CardTitle>
              <CardDescription>{t('charts.demographicsDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={demographics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="ageGroup" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => [formatNumber(value), t('charts.users')]} />
                  <Bar dataKey="users" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Language Usage and Emergency Trends */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Language Usage */}
          <Card>
            <CardHeader>
              <CardTitle>{t('charts.languageUsage')}</CardTitle>
              <CardDescription>{t('charts.languageUsageDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col lg:flex-row items-center">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={languageUsage}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="users"
                      label={({ percentage }) => `${percentage.toFixed(1)}%`}
                    >
                      {languageUsage.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [formatNumber(value), t('charts.users')]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="lg:ml-4 mt-4 lg:mt-0">
                  {languageUsage.map((lang, index) => (
                    <div key={index} className="flex items-center space-x-2 mb-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: lang.color }}
                      ></div>
                      <span className="text-sm">{lang.language}</span>
                      <Badge variant="secondary" className="text-xs">
                        {lang.percentage.toFixed(1)}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>{t('activity.title')}</CardTitle>
              <CardDescription>{t('activity.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    type: 'emergency',
                    message: t('activity.emergencyAlert'),
                    time: '2 minutes ago',
                    icon: AlertTriangle,
                    color: 'text-red-600',
                  },
                  {
                    type: 'appointment',
                    message: t('activity.appointmentBooked'),
                    time: '15 minutes ago',
                    icon: Calendar,
                    color: 'text-blue-600',
                  },
                  {
                    type: 'symptom',
                    message: t('activity.symptomCheck'),
                    time: '32 minutes ago',
                    icon: Heart,
                    color: 'text-green-600',
                  },
                  {
                    type: 'sms',
                    message: t('activity.smsInteraction'),
                    time: '1 hour ago',
                    icon: MessageSquare,
                    color: 'text-purple-600',
                  },
                  {
                    type: 'user',
                    message: t('activity.newUser'),
                    time: '2 hours ago',
                    icon: Users,
                    color: 'text-teal-600',
                  },
                ].map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className={`p-1 rounded-full ${activity.color}`}>
                      <activity.icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{activity.message}</p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
