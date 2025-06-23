'use client';

import React, { useState, ChangeEvent, useTransition, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Papa, { ParseError, ParseResult } from 'papaparse';
import { checkAthletesAgainstDb, addAndRegisterAthletes, getEventDivisions } from './actions';
import Link from 'next/link';
import { PencilSquareIcon, InformationCircleIcon, ArrowUturnLeftIcon, ArrowRightCircleIcon } from '@heroicons/react/24/outline';

// --- Type Definitions ---
// It's best practice to import these from a central lib/definitions.ts file
// For this example, ensure these match your actual definitions:
interface Division {
    division_id: number;
    division_name: string;
}

interface CheckedAthleteClient {
    last_name?: string;
    first_name?: string;
    dob?: string;
    gender?: string;
    nationality?: string | null;
    stance?: "" | "Regular" | "Goofy" | null;
    fis_num?: string | null;
    csvIndex: number;
    status: 'matched' | 'new' | 'error';
    dbAthleteId?: number | null;
    validationError?: string;
    dbDetails?: { first_name: string; last_name: string; dob: Date | string };
    isSelected?: boolean;
    assigned_division_id?: number | null;
    suggested_division_id?: number | null;
    suggested_division_name?: string | null;
}

interface AthleteToRegister {
    csvIndex: number;
    status: 'matched' | 'new';
    division_id: number;
    last_name?: string;
    first_name?: string;
    dob?: string;
    gender?: string;
    nationality?: string | null;
    stance?: string | null;
    fis_num?: string | null;
    dbAthleteId?: number | null;
}
// --- End Type Definitions ---


export default function ManageAthletesPage() {
    const params = useParams();
    const router = useRouter();
    const eventIdParam = params.eventId as string; // Assuming eventId is always a string from params
    const [eventId, setEventId] = useState<number | null>(null);

    const [file, setFile] = useState<File | null>(null);
    const [isParsing, setIsParsing] = useState(false);
    const [isCheckingDb, setIsCheckingDb] = useState(false);
    const [isRegistering, setIsRegistering] = useState(false);
    const [checkedAthletes, setCheckedAthletes] = useState<CheckedAthleteClient[]>([]);
    const [eventDivisions, setEventDivisions] = useState<Division[]>([]);

    const [pageError, setPageError] = useState<string | null>(null);
    const [pageSuccess, setPageSuccess] = useState<string | null>(null);
    const [registrationDetails, setRegistrationDetails] = useState<{athleteName: string, status: string, error?: string}[] | null>(null);

    const [isCheckTransitionPending, startCheckTransition] = useTransition();
    const [isRegisterTransitionPending, startRegisterTransition] = useTransition();

    // Define the URL for the "Skip & Continue" button
    // This should ideally point to the next logical step in event setup, e.g., managing judges or publishing.
    // For now, it will point back to the event admin dashboard if eventId is available.
    const nextStepUrl = eventId ? `/admin/events/${eventId}` : '#'; // Fallback if eventId is null

    useEffect(() => {
        if (eventIdParam) {
            const id = parseInt(eventIdParam, 10);
            if (!isNaN(id)) {
                setEventId(id);
                setPageError(null); // Reset errors on new eventId
                setPageSuccess(null);
                getEventDivisions(id)
                    .then(response => {
                        if (response.success && response.data) {
                            setEventDivisions(response.data);
                        } else {
                            setPageError(response.error || "Could not load event divisions.");
                            setEventDivisions([]);
                        }
                    })
                    .catch(err => {
                        console.error("Error calling getEventDivisions action:", err);
                        setPageError("Failed to load event divisions due to a network or server error.");
                        setEventDivisions([]);
                    });
            } else {
                console.error("Invalid Event ID in URL parameter:", eventIdParam);
                setEventId(null);
                setPageError("Invalid Event ID in URL. Cannot manage athletes.");
                setEventDivisions([]);
            }
        }
    }, [eventIdParam]);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setCheckedAthletes([]); // Reset on new file
            setPageError(null);
            setPageSuccess(null);
            setRegistrationDetails(null);
        } else {
            setFile(null); // Clear file if selection is cancelled
        }
    };

    const handleProcessFile = () => {
        if (!file) { setPageError("Please select a CSV file first."); return; }
        if (eventId === null) { setPageError("Event ID is not loaded or invalid. Cannot process file."); return; }

        setPageError(null); setPageSuccess(null); setRegistrationDetails(null);
        setIsParsing(true); setCheckedAthletes([]);

        Papa.parse<Record<string, unknown>>(file, {
            header: true,
            skipEmptyLines: true,
            transformHeader: header => header.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
            complete: (results: ParseResult<Record<string, unknown>>) => {
                setIsParsing(false);
                if (results.errors.length > 0) {
                    const firstError: ParseError = results.errors[0];
                    let errorMessage = `CSV Parse Error: ${firstError.message}`;
                    if (typeof firstError.row === 'number') {
                        errorMessage += ` (Near CSV data row: ${firstError.row + 1}, which is line ${firstError.row + 2} in the file including header)`;
                    } else if (firstError.index !== undefined && typeof firstError.index === 'number') {
                        errorMessage += ` (Near character position: ${firstError.index})`;
                    }
                    setPageError(errorMessage);
                    return;
                }
                if (!results.data || results.data.length === 0) {
                    setPageError("CSV file is empty or could not be parsed into data rows.");
                    return;
                }

                setIsCheckingDb(true);
                startCheckTransition(async () => {
                    try {
                        const response = await checkAthletesAgainstDb(eventId, results.data);
                        setIsCheckingDb(false);
                        if (response.success && response.data) {
                            setCheckedAthletes(response.data.athletes.map(a => ({
                                ...a,
                                isSelected: a.status !== 'error',
                                assigned_division_id: a.suggested_division_id ?? null,
                            } as CheckedAthleteClient))); // Added type assertion for safety
                            setEventDivisions(response.data.divisions);
                            if (response.error && response.data?.athletes.length === 0) { // Show error if no valid athletes but still success:true
                                setPageError(response.error);
                            } else if (response.error) { // General error during check
                                setPageError(response.error);
                            }
                        } else {
                            setPageError(response.error || "Failed to check athletes against the database.");
                        }
                    } catch (error: unknown) {
                        setIsCheckingDb(false);
                        console.error("Error calling checkAthletesAgainstDb:", error);
                        const message = error instanceof Error ? error.message : "Unknown server error during athlete check.";
                        setPageError(`Error during athlete check: ${message}`);
                    }
                });
            },
            error: (papaparseError: Error) => {
                setIsParsing(false);
                console.error("PapaParse error:", papaparseError);
                setPageError(`Failed to parse CSV file: ${papaparseError.message}`);
            }
        });
    };

    const handleSelectionChange = (csvIndexToToggle: number) => {
        setCheckedAthletes(prev =>
            prev.map(athlete =>
                athlete.csvIndex === csvIndexToToggle
                    ? { ...athlete, isSelected: !athlete.isSelected }
                    : athlete
            )
        );
    };

    const handleAthleteDivisionChange = (csvIndexToUpdate: number, newDivisionIdStr: string) => {
        const divisionIdNum = newDivisionIdStr ? parseInt(newDivisionIdStr, 10) : null;
        setCheckedAthletes(prev =>
            prev.map(athlete =>
                athlete.csvIndex === csvIndexToUpdate
                    ? { ...athlete, assigned_division_id: (divisionIdNum !== null && !isNaN(divisionIdNum)) ? divisionIdNum : null }
                    : athlete
            )
        );
    };

    const handleEditAthlete = (csvIndex: number) => {
        const athleteToEdit = checkedAthletes.find(a => a.csvIndex === csvIndex);
        // In a real app, you'd open a modal or inline form here.
        // For now, we'll just log and alert.
        console.log("TODO: Implement editing for athlete:", athleteToEdit);
        alert(`Editing for ${athleteToEdit?.first_name} ${athleteToEdit?.last_name} (CSV Index ${csvIndex}) is not yet implemented. You would typically allow editing of their CSV data fields here before they are created as 'new'.`);
    };

    const handleRegisterAthletes = () => {
        if (eventId === null) { setPageError("Event ID is not loaded."); return; }

        const athletesToSubmit: AthleteToRegister[] = checkedAthletes
            .filter(a => a.isSelected && a.status !== 'error' && typeof a.assigned_division_id === 'number')
            .map(a => ({
                csvIndex: a.csvIndex,
                status: a.status as 'matched' | 'new',
                division_id: a.assigned_division_id as number,
                last_name: a.last_name,
                first_name: a.first_name,
                dob: a.dob,
                gender: a.gender,
                nationality: a.nationality,
                stance: a.stance === "" ? null : a.stance,
                fis_num: a.fis_num,
                dbAthleteId: a.dbAthleteId,
            }));

        if (athletesToSubmit.length === 0) {
            setPageError("No athletes selected for registration with a valid assigned division.");
            return;
        }

        setPageError(null); setPageSuccess(null); setRegistrationDetails(null);
        setIsRegistering(true);
        startRegisterTransition(async () => {
            try {
                const response = await addAndRegisterAthletes(eventId, athletesToSubmit);
                setIsRegistering(false);
                if (response.success) {
                    setPageSuccess(`Registration process complete. ${response.registeredCount ?? 0} athletes newly registered/updated in event divisions.`);
                    setRegistrationDetails(response.details || null);
                    // Remove successfully processed athletes from the list
                    const submittedCsvIndices = new Set(athletesToSubmit.map(s => s.csvIndex));
                    setCheckedAthletes(prev => prev.filter(a => !submittedCsvIndices.has(a.csvIndex)));

                    // If all selected athletes were processed, clear the file input
                    if (checkedAthletes.filter(a => a.isSelected && a.status !== 'error' && typeof a.assigned_division_id === 'number').length === athletesToSubmit.length) {
                        setFile(null);
                        const fileInput = document.getElementById('csv-file-input') as HTMLInputElement;
                        if (fileInput) fileInput.value = ''; // Reset file input
                    }
                    router.refresh(); // Refresh data for the current page or related server components
                } else {
                    setPageError(response.error || "Athlete registration failed.");
                    setRegistrationDetails(response.details || null);
                }
            } catch (error: unknown) {
                setIsRegistering(false);
                console.error("Error calling addAndRegisterAthletes:", error);
                const message = error instanceof Error ? error.message : "Unknown server error during registration.";
                setPageError(`Registration error: ${message}`);
            }
        });
    };

    const selectedCount = checkedAthletes.filter(a => a.isSelected && a.status !== 'error').length;
    const allSelectedHaveDivision = checkedAthletes
        .filter(a => a.isSelected && a.status !== 'error')
        .every(a => typeof a.assigned_division_id === 'number');
    const errorCount = checkedAthletes.filter(a => a.status === 'error').length;
    const isLoading = isParsing || isCheckingDb || isRegistering || isCheckTransitionPending || isRegisterTransitionPending;

    return (
        <div className="space-y-8 p-4 md:p-6">
            <div className='flex flex-col sm:flex-row justify-between items-center gap-2'>
                 <h2 className="text-2xl md:text-3xl font-bold">Manage Event Athletes</h2>
                 {eventId !== null ? (
                      <Link href={`/admin/events/${eventId}`} className="btn btn-sm btn-outline">
                           Back to Event Dashboard
                      </Link>
                 ) : (
                    <span className="text-sm text-base-content/70">Loading event context...</span>
                 )}
            </div>

            {pageError && <div role="alert" className="alert alert-error text-sm mb-4"><InformationCircleIcon className="h-5 w-5 mr-2"/><span>{pageError}</span></div>}
            {pageSuccess && <div role="alert" className="alert alert-success text-sm mb-4"><InformationCircleIcon className="h-5 w-5 mr-2"/><span>{pageSuccess}</span></div>}

            {eventId === null && !pageError && (
                <div className="text-center py-10">
                    <span className="loading loading-lg loading-spinner text-primary"></span>
                    <p className="mt-2 text-base-content/80">Loading event information...</p>
                </div>
            )}

            {eventId !== null && (
                 <>
                     {/* 1. File Upload and Navigation Section */}
                     <div className="card bg-base-100 shadow-xl">
                         <div className="card-body space-y-4">
                             <div>
                                <h3 className="card-title text-xl">1. Athlete Roster CSV Upload</h3>
                                <p className="text-sm opacity-70 mt-1">
                                     Required headers: <code>last_name</code>, <code>first_name</code>, <code>dob</code> (YYYY-MM-DD), <code>gender</code>.
                                     Optional: <code>nationality</code>, <code>stance</code>, <code>fis_num</code>.
                                </p>
                             </div>

                             <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4">
                                 <div className="form-control w-full sm:flex-grow">
                                     <label htmlFor="csv-file-input" className="label pb-1 pt-0"><span className="label-text text-sm font-medium">Select CSV File:</span></label>
                                     <input id="csv-file-input" type="file" accept=".csv, text/csv" onChange={handleFileChange} className="file-input file-input-bordered file-input-primary w-full" disabled={isLoading} />
                                 </div>
                                 <button className="btn btn-primary w-full sm:w-auto shrink-0" onClick={handleProcessFile} disabled={!file || isLoading}>
                                     {(isParsing || isCheckingDb || isCheckTransitionPending) ? <span className="loading loading-spinner loading-xs"></span> : null}
                                     {isParsing ? 'Parsing...' : (isCheckingDb || isCheckTransitionPending) ? 'Checking DB...' : 'Process File'}
                                 </button>
                             </div>
                             {file && <p className="text-xs italic text-base-content/80">Selected: {file.name}</p>}

                             <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-base-300 mt-2">
                                 <Link
                                     href={`/admin/events/${eventId}/edit-details`}
                                     className="btn btn-outline btn-neutral w-full sm:w-auto text-sm"
                                     title="Return to edit core event details"
                                 >
                                     <ArrowUturnLeftIcon className="h-4 w-4 mr-1.5" />
                                     Back to Edit Details
                                 </Link>
                                 <Link
                                     href={nextStepUrl}
                                     className="btn btn-outline btn-secondary w-full sm:w-auto text-sm"
                                     title="Proceed without importing athletes from CSV at this time"
                                 >
                                     Skip CSV & Continue Setup
                                     <ArrowRightCircleIcon className="h-4 w-4 ml-1.5" />
                                 </Link>
                             </div>
                         </div>
                     </div>

                     {/* 2. Review and Confirmation Section */}
                     {checkedAthletes.length > 0 && (
                         <div className="card bg-base-100 shadow-xl mt-6">
                             <div className="card-body">
                                 <h3 className="card-title text-xl">2. Review Athletes & Assign Divisions</h3>
                                 {errorCount > 0 && (
                                     <div role="alert" className="alert alert-warning text-sm mb-4 shadow">
                                        <InformationCircleIcon className="h-5 w-5 mr-2"/>
                                        <span>{errorCount} row(s) in the CSV had validation errors and cannot be processed. See table below for details (errors highlighted).</span>
                                     </div>
                                 )}

                                 <div className="overflow-x-auto mb-4 border border-base-300 rounded-lg">
                                     <table className="table table-sm table-zebra w-full text-xs md:text-sm">
                                         <thead className="bg-base-200">
                                             <tr className="text-xs uppercase">
                                                 <th className="w-12 text-center px-2 py-3">
                                                    <input
                                                        type="checkbox"
                                                        className="checkbox checkbox-xs checkbox-primary"
                                                        title="Select/Deselect All Valid Athletes"
                                                        onChange={(e) => setCheckedAthletes(prev => prev.map(a => a.status !== 'error' ? {...a, isSelected: e.target.checked} : a))}
                                                        checked={checkedAthletes.length > 0 && checkedAthletes.filter(a=>a.status!=='error').length > 0 && checkedAthletes.filter(a=>a.status!=='error').every(a=>a.isSelected)}
                                                        disabled={isLoading || checkedAthletes.filter(a=>a.status !== 'error').length === 0}
                                                    />
                                                 </th>
                                                 <th className="px-2 py-3">Status</th>
                                                 <th className="px-2 py-3">CSV Data</th>
                                                 <th className="px-2 py-3">DB Match Info</th>
                                                 <th className="px-2 py-3 min-w-[180px]">Assign Event Division*</th>
                                                 <th className="px-2 py-3 text-center">Actions</th>
                                             </tr>
                                         </thead>
                                         <tbody>
                                             {checkedAthletes.map(athlete => (
                                                 <tr key={athlete.csvIndex} className={`${athlete.status === 'error' ? 'bg-error/10 opacity-60' : ''} hover:bg-base-200/70 transition-colors`}>
                                                     <td className="text-center px-2 py-2"><input type="checkbox" className="checkbox checkbox-primary checkbox-xs" checked={!!athlete.isSelected} onChange={() => handleSelectionChange(athlete.csvIndex)} disabled={athlete.status === 'error' || isLoading} /></td>
                                                     <td className="px-2 py-2"><span className={`badge badge-sm whitespace-nowrap ${athlete.status === 'matched' ? 'badge-success' : athlete.status === 'new' ? 'badge-info' : 'badge-error'}`}>{athlete.status}</span></td>
                                                     <td className="px-2 py-2"><div className='text-xs'><strong>{athlete.first_name} {athlete.last_name}</strong> <br /><span className='opacity-70'>DOB: {athlete.dob||'N/A'} | G: {athlete.gender||'N/A'} | FIS: {athlete.fis_num||'N/A'}</span></div></td>
                                                     <td className="px-2 py-2">
                                                         {athlete.status === 'matched' && athlete.dbDetails ? (
                                                             <div className='text-xs'><span className='font-semibold'>ID: {athlete.dbAthleteId}</span><br/>{athlete.dbDetails.first_name} {athlete.dbDetails.last_name}<br/><span className='opacity-70'> DOB: {new Date(athlete.dbDetails.dob).toLocaleDateString()}</span></div>
                                                         ) : athlete.status === 'new' ? (
                                                             <span className='text-xs italic text-info opacity-80'>New Athlete Profile</span>
                                                         ) : null}
                                                     </td>
                                                     <td className="px-2 py-2">
                                                         {athlete.status !== 'error' && (
                                                             <select
                                                                 className="select select-xs select-bordered w-full py-1 leading-tight focus:ring-primary focus:border-primary"
                                                                 value={athlete.assigned_division_id?.toString() ?? ''}
                                                                 onChange={(e) => handleAthleteDivisionChange(athlete.csvIndex, e.target.value)}
                                                                 disabled={isLoading}
                                                                 aria-label={`Assign division for ${athlete.first_name} ${athlete.last_name}`}
                                                             >
                                                                 <option value="" disabled>{athlete.suggested_division_name ? `Suggested: ${athlete.suggested_division_name}` : (eventDivisions.length > 0 ? 'Select Division' : 'No Divisions Available')}</option>
                                                                 {eventDivisions.map(div => (
                                                                     <option key={div.division_id} value={String(div.division_id)}>
                                                                         {div.division_name}
                                                                     </option>
                                                                 ))}
                                                             </select>
                                                         )}
                                                     </td>
                                                     <td className='text-center px-2 py-2'>
                                                         {athlete.status === 'new' && !isLoading && (
                                                             <button className="btn btn-xs btn-ghost text-blue-600 hover:bg-blue-100 p-0.5" onClick={() => handleEditAthlete(athlete.csvIndex)} title="Edit athlete details before creation">
                                                                 <PencilSquareIcon className="h-4 w-4" />
                                                             </button>
                                                         )}
                                                         {athlete.status === 'error' && athlete.validationError && (
                                                             <div className="text-error text-xs tooltip tooltip-left whitespace-normal max-w-xs" data-tip={`Error: ${athlete.validationError.substring(0, 200)}${athlete.validationError.length > 200 ? '...' : ''}`}>
                                                                 <InformationCircleIcon className="h-5 w-5 inline-block mr-1"/>Details
                                                             </div>
                                                         )}
                                                     </td>
                                                 </tr>
                                             ))}
                                             {checkedAthletes.length === 0 && !isLoading && (
                                                <tr><td colSpan={6} className="text-center italic py-4">No athletes loaded or all processed.</td></tr>
                                             )}
                                         </tbody>
                                     </table>
                                 </div>

                                 <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                                     <div>
                                        <p className="font-semibold text-sm">Total Selected for Registration: {selectedCount}</p>
                                        {selectedCount > 0 && !allSelectedHaveDivision && <p className="text-xs text-warning mt-1">Note: Ensure all selected athletes have a division assigned before registering.</p>}
                                     </div>
                                     <button
                                         className="btn btn-success w-full sm:w-auto"
                                         onClick={handleRegisterAthletes}
                                         disabled={selectedCount === 0 || !allSelectedHaveDivision || isLoading}
                                     >
                                         {(isRegistering || isRegisterTransitionPending) ? <span className="loading loading-spinner loading-xs mr-2"></span> : null}
                                         {(isRegistering || isRegisterTransitionPending) ? 'Registering...' : `Confirm & Register ${selectedCount} Athletes`}
                                     </button>
                                 </div>

                                 {registrationDetails && registrationDetails.length > 0 && (
                                     <div className="mt-6 p-4 border rounded-lg bg-base-200/70">
                                         <h4 className="font-semibold mb-2 text-md">Registration Attempt Summary:</h4>
                                         <ul className="list-disc list-inside text-xs space-y-1 max-h-48 overflow-y-auto">
                                             {registrationDetails.map((detail, index) => (
                                                 <li key={index} className={
                                                     detail.error ? 'text-error font-medium' :
                                                     (detail.status.toLowerCase().includes('failed') || detail.status.toLowerCase().includes('skipped') ? 'text-warning' : 'text-success' )
                                                 }>
                                                     <strong>{detail.athleteName}:</strong> {detail.status}
                                                     {detail.error && <span className="italic text-error/80"> - Note: {detail.error}</span>}
                                                 </li>
                                             ))}
                                         </ul>
                                     </div>
                                 )}
                             </div>
                         </div>
                     )}
                 </>
             )}
        </div>
    );
}