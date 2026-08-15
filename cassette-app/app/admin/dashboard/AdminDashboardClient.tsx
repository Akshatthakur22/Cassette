"use client";

import { useState } from "react";
import type { DashboardStats, TapeMetrics, ShareMetrics } from "@/app/lib/admin-metrics";

interface AdminDashboardClientProps {
  initialStats: DashboardStats;
  topTapes: TapeMetrics[];
  shareMetrics: ShareMetrics[];
  reportedTapes: any[];
  viewsTimeSeries: any[];
}

export default function AdminDashboardClient({
  initialStats,
  topTapes,
  shareMetrics,
  reportedTapes,
  viewsTimeSeries,
}: AdminDashboardClientProps) {
  const [stats, setStats] = useState(initialStats);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Cassette platform metrics & moderation</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KPICard
            label="Total Tapes"
            value={stats.totalTapes}
            subtext={`${stats.publicTapes} public`}
          />
          <KPICard
            label="Total Views"
            value={stats.totalViews}
            subtext={`Avg: ${stats.avgViewsPerTape}/tape`}
          />
          <KPICard
            label="Total Shares"
            value={stats.totalShares}
            subtext={`Avg: ${stats.avgSharesPerTape}/tape`}
          />
          <KPICard
            label="Reports"
            value={stats.totalReports}
            subtext={`${stats.reportedTapes} flagged`}
            alert={stats.reportedTapes > 0}
          />
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Top Tapes */}
            <section className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Top Tapes by Views</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left py-2">Title</th>
                      <th className="text-center py-2">Views</th>
                      <th className="text-center py-2">Shares</th>
                      <th className="text-center py-2">Reports</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topTapes.map((tape) => (
                      <tr key={tape.tapeId} className="border-b hover:bg-gray-50">
                        <td className="py-3">
                          <a
                            href={`/t/${tape.publicId}`}
                            className="text-blue-600 hover:underline"
                          >
                            {tape.title}
                          </a>
                        </td>
                        <td className="text-center">{tape.views}</td>
                        <td className="text-center">{tape.shares}</td>
                        <td className="text-center">
                          {tape.reports > 0 && (
                            <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">
                              {tape.reports}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Share Breakdown */}
            <section className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Share Platforms</h2>
              <div className="space-y-3">
                {shareMetrics.map((metric) => (
                  <div key={metric.platform} className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="font-medium">{metric.platform}</span>
                        <span className="text-sm text-gray-600">
                          {metric.count} shares ({metric.percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded h-2">
                        <div
                          className="bg-blue-500 h-2 rounded"
                          style={{ width: `${metric.percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Reported Tapes */}
            <section className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
              <h2 className="text-lg font-bold mb-4">⚠️ Flagged for Review</h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {reportedTapes.length === 0 ? (
                  <p className="text-gray-500 text-sm">No flagged tapes</p>
                ) : (
                  reportedTapes.slice(0, 10).map((tape) => (
                    <div key={tape.id} className="p-3 bg-red-50 rounded border border-red-200">
                      <a
                        href={`/t/${tape.publicId}`}
                        className="font-medium text-red-900 hover:underline block text-sm"
                      >
                        {tape.title}
                      </a>
                      <p className="text-xs text-red-700 mt-1">
                        by {tape.senderName} • {tape.reportCount} reports
                      </p>
                      <div className="flex gap-2 mt-2">
                        <button className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600">
                          Approve
                        </button>
                        <button className="px-2 py-1 text-xs bg-gray-400 text-white rounded hover:bg-gray-500">
                          Dismiss
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Stats Summary */}
            <section className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-bold mb-4">Summary</h2>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-medium">Private Tapes:</span> {stats.privateTapes}
                </p>
                <p>
                  <span className="font-medium">Public Tapes:</span> {stats.publicTapes}
                </p>
                <p>
                  <span className="font-medium">Avg Views:</span> {stats.avgViewsPerTape}
                </p>
                <p>
                  <span className="font-medium">Avg Shares:</span> {stats.avgSharesPerTape}
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function KPICard({
  label,
  value,
  subtext,
  alert,
}: {
  label: string;
  value: number;
  subtext?: string;
  alert?: boolean;
}) {
  return (
    <div
      className={`rounded-lg shadow p-6 ${
        alert ? "bg-red-50 border-l-4 border-red-500" : "bg-white"
      }`}
    >
      <p className={`text-sm font-medium ${alert ? "text-red-700" : "text-gray-600"}`}>
        {label}
      </p>
      <p className={`text-3xl font-bold mt-2 ${alert ? "text-red-900" : "text-gray-900"}`}>
        {value.toLocaleString()}
      </p>
      {subtext && <p className="text-xs text-gray-500 mt-1">{subtext}</p>}
    </div>
  );
}
