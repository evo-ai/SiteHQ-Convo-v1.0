import { useQuery } from "@tanstack/react-query";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDateRangePicker } from "@/components/ui/date-range-picker";
import { Activity, MessageCircle, ThumbsUp, Timer } from "lucide-react";
import { format } from "date-fns";

export default function AnalyticsDashboard() {
  const { data: metricsData, isLoading: isLoadingMetrics } = useQuery({
    queryKey: ["/api/analytics/metrics"],
  });

  const { data: feedbackData, isLoading: isLoadingFeedback } = useQuery({
    queryKey: ["/api/analytics/feedback"],
  });

  if (isLoadingMetrics || isLoadingFeedback) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const pieColors = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Conversation Analytics</h1>
        <div className="flex items-center gap-4">
          <CalendarDateRangePicker />
          <Button>Download Report</Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <MetricCard
          title="Total Conversations"
          value={metricsData?.totalConversations || 0}
          icon={<MessageCircle />}
          trend={+5}
        />
        <MetricCard
          title="Avg. Duration"
          value={`${metricsData?.avgDuration || 0}m`}
          icon={<Timer />}
          trend={-2}
        />
        <MetricCard
          title="User Engagement"
          value={`${metricsData?.avgEngagement || 0}%`}
          icon={<Activity />}
          trend={+8}
        />
        <MetricCard
          title="Satisfaction Rate"
          value={`${metricsData?.satisfactionRate || 0}%`}
          icon={<ThumbsUp />}
          trend={+12}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Conversations Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metricsData?.timeSeriesData || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => format(new Date(value), 'MMM d')}
                  />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="conversations"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Engagement Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metricsData?.engagementDistribution || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Feedback Sentiment Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={feedbackData?.sentimentDistribution || []}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {(feedbackData?.sentimentDistribution || []).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-[300px] overflow-auto">
              {(feedbackData?.recentFeedback || []).map((feedback: any) => (
                <div
                  key={feedback.id}
                  className="p-4 rounded-lg border bg-card text-card-foreground"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex-1">
                      <div className="text-sm font-medium">
                        {format(new Date(feedback.created_at), 'PPp')}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Rating: {feedback.rating}/5
                      </div>
                    </div>
                  </div>
                  <p className="text-sm">{feedback.feedback}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon, trend }: any) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-x-4">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-primary/10 rounded-full text-primary">
              {icon}
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <h3 className="text-2xl font-bold">{value}</h3>
            </div>
          </div>
          <div className={`text-sm ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend > 0 ? '+' : ''}{trend}%
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
