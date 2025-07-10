"use client";
import React from "react";
import Link from "next/link";

import { useParams } from "next/navigation";

const HeadJudgePage = () => {
  const { eventId } = useParams();
  const eventBaseUrl = `/admin/events/${eventId}/head-judge`;
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-center text-primary">
        Head Judge Dashboard
      </h1>

      <div className="overflow-x-auto mb-8">
        <table className="min-w-full border border-base-300 bg-base-100 shadow-md rounded-lg">
          <thead className="bg-base-200 text-base-content uppercase text-sm font-semibold">
            <tr>
              <th className="px-4 py-3 border-b border-base-300 text-left">
                Judge Name
              </th>
              <th className="px-4 py-3 border-b border-base-300 text-left">
                Judge Type
              </th>
              <th className="px-4 py-3 border-b border-base-300 text-left">
                Judge Status
              </th>
              <th className="px-4 py-3 border-b border-base-300 text-left">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Replace with dynamic data */}
            <tr className="hover:bg-base-100">
              <td className="px-4 py-2 border-t border-base-300">John Doe</td>
              <td className="px-4 py-2 border-t border-base-300">Head Judge</td>
              <td className="px-4 py-2 border-t border-base-300">Active</td>
              <td className="px-4 py-2 border-t border-base-300">
                <Link
                  href="/admin/judges/edit"
                  className="text-blue-600 hover:underline"
                >
                  Edit
                </Link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href={`${eventBaseUrl}/addJudge`}
          className="btn btn-primary w-full"
        >
          Add Judge
        </Link>
        <Link
          href={`${eventBaseUrl}/judges`}
          className="btn btn-secondary w-full"
        >
          Monitor Judges
        </Link>
        <Link href={`${eventBaseUrl}/events`} className="btn btn-accent w-full">
          Monitor Events
        </Link>
        <Link
          href={`${eventBaseUrl}/judgePanel`}
          className="btn btn-accent w-full"
        >
          Judge Panel
        </Link>
      </div>
    </div>
  );
};

export default HeadJudgePage;
