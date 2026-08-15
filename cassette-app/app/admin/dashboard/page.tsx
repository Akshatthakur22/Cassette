import { redirect } from "next/navigation";
import { headers } from "next/headers";
import {
  getDashboardStats,
  getTopTapesByViews,
  getShareMetrics,
  getReportedTapes,
  getViewsTimeSeries,
} from "@/app/lib/admin-metrics";
import AdminDashboardClient from "./AdminDashboardClient";

/**
 * Admin Dashboard — Requires admin token
 * For MVP: Single admin token stored in ADMIN_TOKEN env var
 * Passed via Authorization: Bearer <token> header
 */
export default async function AdminDashboardPage() {
  const adminToken = process.env.ADMIN_TOKEN;
  
  // If no admin token is configured, block access entirely
  if (!adminToken) {
    redirect("/");
  }

  // Check Authorization header
  const hdrs = await headers();
  const authHeader = hdrs.get("Authorization");
  const providedToken = authHeader?.startsWith("Bearer ") 
    ? authHeader.slice(7) 
    : null;

  if (!providedToken || providedToken !== adminToken) {
    // Redirect to home (not 403 to avoid exposing that this route exists)
    redirect("/");
  }

  const [stats, topTapes, shareMetrics, reportedTapes, viewsTimeSeries] =
    await Promise.all([
      getDashboardStats(),
      getTopTapesByViews(10),
      getShareMetrics(),
      getReportedTapes(20),
      getViewsTimeSeries(),
    ]);

  if (!stats) {
    redirect("/");
  }

  return (
    <AdminDashboardClient
      initialStats={stats}
      topTapes={topTapes}
      shareMetrics={shareMetrics}
      reportedTapes={reportedTapes}
      viewsTimeSeries={viewsTimeSeries}
    />
  );
}
