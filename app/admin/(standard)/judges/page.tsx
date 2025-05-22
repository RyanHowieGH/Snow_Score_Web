// /app/admin/(standard)/judges/page.tsx
import React from 'react';
import Link from 'next/link';
const page = () => {
  return (
    <div>
        <table>
            <thead>
                <tr>
                    <th>Judge Name</th>
                    <th>Judge Type</th>
                    <th>Judge Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {/* Replace with dynamic data */}
                <tr>
                    <td>John Doe</td>
                    <td>Head Judge</td>
                    <td>Active</td>
                    <td><Link href="/admin/judges/edit">Edit</Link></td>
                </tr>
                {/* Add more rows as needed */}
            </tbody>
        </table>
    </div>
  )
}

export default page