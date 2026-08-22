// ============================================================================
// HACKATHON MODULE: React Components (UI)
// Copy these into your `src/components` or `src/app` as needed.
// ============================================================================

import React, { useState } from "react";
// import { Download, CheckCircle, XCircle } from "lucide-react";

/**
 * Component 1: Multi-Tier Approval Queue
 * HR & Manager interface to review leaves.
 */
export function ApprovalQueue({ requests, currentUserRole }: { requests: any[]; currentUserRole: string }) {
  const handleAction = async (id: string, tier: string, status: string) => {
    // API Call to PATCH /api/leaves/[id]
    // fetch(`/api/leaves/${id}`, { method: 'PATCH', body: JSON.stringify({ tier, status }) })
    alert(`Action dispatched: ${tier} marked as ${status}`);
  };

  return (
    <div className="overflow-x-auto bg-white rounded-lg border">
      <table className="min-w-full text-sm text-left">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="p-4">Employee</th>
            <th className="p-4">Leave Info</th>
            <th className="p-4">Manager Status</th>
            <th className="p-4">HR Status</th>
            <th className="p-4">Overall</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {requests.map((req) => {
            const isManager = currentUserRole === "MANAGER" || currentUserRole === "ADMIN";
            const isHR = currentUserRole === "HR" || currentUserRole === "ADMIN";
            const hrDisabled = req.managerApprovalStatus !== "APPROVED";

            return (
              <tr key={req.id}>
                <td className="p-4 font-medium">{req.user.name}</td>
                <td className="p-4">
                  {req.leaveType} ({req.totalDays} days) <br />
                  <span className="text-xs text-gray-500">
                    {new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()}
                  </span>
                  {req.hasConflict && (
                    <span className="ml-2 px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full">
                      ⚠️ Department Conflict
                    </span>
                  )}
                </td>
                
                {/* Manager Column */}
                <td className="p-4">
                  {req.managerApprovalStatus === "PENDING" && isManager ? (
                    <div className="flex gap-2">
                      <button onClick={() => handleAction(req.id, "MANAGER", "APPROVED")} className="text-green-600 hover:bg-green-50 p-1 rounded">Approve</button>
                      <button onClick={() => handleAction(req.id, "MANAGER", "REJECTED")} className="text-red-600 hover:bg-red-50 p-1 rounded">Reject</button>
                    </div>
                  ) : (
                    <span className="font-medium">{req.managerApprovalStatus}</span>
                  )}
                </td>

                {/* HR Column */}
                <td className="p-4">
                  {req.hrApprovalStatus === "PENDING" && isHR ? (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleAction(req.id, "HR", "APPROVED")} 
                        disabled={hrDisabled}
                        className={`p-1 rounded ${hrDisabled ? 'text-gray-400 cursor-not-allowed' : 'text-green-600 hover:bg-green-50'}`}
                      >
                        Approve
                      </button>
                      <button 
                        onClick={() => handleAction(req.id, "HR", "REJECTED")}
                        disabled={hrDisabled && req.managerApprovalStatus !== "REJECTED"}
                        className={`p-1 rounded ${hrDisabled ? 'text-gray-400 cursor-not-allowed' : 'text-red-600 hover:bg-red-50'}`}
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    <span className="font-medium">{req.hrApprovalStatus}</span>
                  )}
                </td>

                <td className="p-4 font-bold">{req.overallStatus}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}


/**
 * Component 2: Audit Log Viewer & CSV Exporter
 * Shows the immutable trail of system actions.
 */
export function AuditLogTable({ logs }: { logs: any[] }) {
  const downloadCSV = () => {
    const headers = ["Timestamp", "Actor", "Role", "Action", "Entity", "IP Address"];
    const rows = logs.map(l => [
      new Date(l.createdAt).toISOString(),
      l.actor.name,
      l.actor.role,
      l.action,
      l.entityType,
      l.ipAddress
    ]);
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `audit-logs-${new Date().toISOString()}.csv`;
    link.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold">System Audit Logs</h2>
        <button onClick={downloadCSV} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">
          Download CSV
        </button>
      </div>

      <div className="border rounded-lg overflow-hidden bg-white">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-3">Timestamp</th>
              <th className="p-3">Actor</th>
              <th className="p-3">Action</th>
              <th className="p-3">Details (JSON)</th>
              <th className="p-3">IP Address</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="p-3 whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</td>
                <td className="p-3">
                  <div className="font-medium">{log.actor.name}</div>
                  <div className="text-xs text-gray-500">{log.actor.role}</div>
                </td>
                <td className="p-3">
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                    {log.action}
                  </span>
                </td>
                <td className="p-3 font-mono text-xs">
                  {JSON.stringify(log.metadata)}
                </td>
                <td className="p-3 font-mono text-xs text-gray-500">{log.ipAddress}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
