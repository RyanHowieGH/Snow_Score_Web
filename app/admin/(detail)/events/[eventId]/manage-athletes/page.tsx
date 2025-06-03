// app/admin/(detail)/events/[eventId]/manage-athletes/page.tsx
'use client';

import { useState, ChangeEvent, useTransition, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Papa from 'papaparse';
import { checkAthletesAgainstDb, addAndRegisterAthletes, getEventDivisions } from './actions';
import Link from 'next/link';
import { PencilSquareIcon } from '@heroicons/react/24/outline';

// Define types locally (match types used/returned by actions)
interface Division {
    division_id: number;
    division_name: string;
}
// Use unknown instead of any for extra properties
interface CheckedAthleteClient extends Record<string, unknown> {
    csvIndex: number;
    status: 'matched' | 'new' | 'error';
    dbAthleteId?: number | null;
    validationError?: string;
    dbDetails?: { first_name: string; last_name: string; dob: Date | string; };
    isSelected?: boolean;
    // Fields matching AthleteCsvSchema + potentially edited values
    last_name?: string;
    first_name?: string;
    dob?: string;
    gender?: string;
    nationality?: string | null;
    stance?: string | null;
    fis_num?: string | null;
}
// Type needed for submitting data to addAndRegisterAthletes action
interface AthleteToRegister {
    csvIndex: number;
    status: 'matched' | 'new';
    last_name?: string;
    first_name?: string;
    dob?: string;
    gender?: string;
    nationality?: string | null;
    stance?: string | null;
    fis_num?: string | null;
    dbAthleteId?: number | null;
}


export default function ManageAthletesPage() {
    const params = useParams();
    const eventIdParam = params.eventId as string;
    const [eventId, setEventId] = useState<number | null>(null);

    const [file, setFile] = useState<File | null>(null);
    const [isParsing, setIsParsing] = useState(false);
    const [isChecking, setIsChecking] = useState(false);
    const [isRegistering, setIsRegistering] = useState(false);
    const [checkedAthletes, setCheckedAthletes] = useState<CheckedAthleteClient[]>([]);
    const [eventDivisions, setEventDivisions] = useState<Division[]>([]);
    const [selectedDivisionId, setSelectedDivisionId] = useState<string>('');
    const [processingError, setProcessingError] = useState<string | null>(null);
    const [registrationResult, setRegistrationResult] = useState<{ success: boolean; message: string } | null>(null);

    const [isCheckPending, startCheckTransition] = useTransition();
    const [isRegisterPending, startRegisterTransition] = useTransition();

    // Effect to parse eventId and fetch initial divisions
    useEffect(() => {
        const id = parseInt(eventIdParam, 10);
        if (!isNaN(id)) {
            setEventId(id);
            setProcessingError(null);
            getEventDivisions(id)
                .then(response => {
                    if (response.success && response.data) {
                        setEventDivisions(response.data);
                        setSelectedDivisionId(response.data.length > 0 ? String(response.data[0].division_id) : '');
                    } else {
                        setProcessingError(response.error || "Could not load event divisions.");
                        setEventDivisions([]);
                        setSelectedDivisionId('');
                    }
                })
                .catch(err => {
                    console.error("Error calling getEventDivisions action:", err);
                    setProcessingError("Failed to load event divisions.");
                    setEventDivisions([]);
                    setSelectedDivisionId('');
                });
        } else {
            console.error("Invalid Event ID in URL:", eventIdParam);
            setEventId(null);
            setProcessingError("Invalid Event ID in URL.");
             setEventDivisions([]);
             setSelectedDivisionId('');
        }
    }, [eventIdParam]);


    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setCheckedAthletes([]);
            setProcessingError(null);
            setRegistrationResult(null);
        }
     };

    const handleProcessFile = () => {
        if (!file) { setProcessingError("Please select a CSV file first."); return; }
        if (eventId === null) { setProcessingError("Invalid Event ID."); return; }

        setProcessingError(null); setRegistrationResult(null); setIsParsing(true);
        setCheckedAthletes([]);

        Papa.parse(file, {
            header: true, skipEmptyLines: true,
            transformHeader: header => header.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
            complete: (results) => {
                setIsParsing(false);
                if (!results.data || results.data.length === 0) { setProcessingError("CSV empty/unparsable."); return; }
                if (results.errors.length > 0) { setProcessingError(`CSV Parse Error: ${results.errors[0].message} (Row: ${results.errors[0].row})`); }

                setIsChecking(true);
                startCheckTransition(async () => {
                    try {
                        const response = await checkAthletesAgainstDb(eventId, results.data);
                        setIsChecking(false);
                        if (response.success && response.data) {
                            setCheckedAthletes(response.data.athletes.map(a => ({ ...a, isSelected: a.status !== 'error' })));
                            setEventDivisions(response.data.divisions);
                            setSelectedDivisionId(response.data.divisions.length > 0 ? String(response.data.divisions[0].division_id) : '');
                        } else {
                            setProcessingError(response.error || "Failed to check athletes.");
                        }
                    } catch (error: unknown) {
                        setIsChecking(false);
                        console.error("Error calling checkAthletesAgainstDb:", error);
                        const message = error instanceof Error ? error.message : "Unknown error.";
                        setProcessingError(`Error checking athletes: ${message}`);
                    }
                });
            },
            error: (error: Error) => {
                setIsParsing(false);
                console.error("PapaParse error:", error);
                setProcessingError(`Failed to parse CSV file: ${error.message}`);
             }
        });
    };

     const handleSelectionChange = (csvIndex: number) => {
        setCheckedAthletes(prev =>
            prev.map(athlete =>
                athlete.csvIndex === csvIndex
                    ? { ...athlete, isSelected: !athlete.isSelected }
                    : athlete
            )
        );
     };
     const handleEditAthlete = (csvIndex: number) => {
          const athleteToEdit = checkedAthletes.find(a => a.csvIndex === csvIndex);
          console.log("Edit athlete data:", athleteToEdit);
          alert(`Implement editing UI for athlete: ${athleteToEdit?.first_name} ${athleteToEdit?.last_name} (CSV index: ${csvIndex})`);
     };

    const handleRegisterAthletes = () => {
         if (eventId === null) { setProcessingError("Invalid Event ID."); return; }
         if (!selectedDivisionId) { setProcessingError("Please select a division."); return; }
         const divisionIdAsNumber = parseInt(selectedDivisionId, 10);
         if (isNaN(divisionIdAsNumber)) { setProcessingError("Invalid division selected."); return; }

         const athletesToSubmit: AthleteToRegister[] = checkedAthletes
            .filter(a => a.isSelected && a.status !== 'error')
            .map(a => {
                const payload: AthleteToRegister = {
                    csvIndex: a.csvIndex,
                    status: a.status as 'matched' | 'new', // Type assertion after filter
                    // Initialize optional fields
                    first_name: undefined, last_name: undefined, dob: undefined, gender: undefined,
                    nationality: null, stance: null, fis_num: null, dbAthleteId: null,
                };
                if (a.status === 'new') {
                    payload.first_name = a.first_name;
                    payload.last_name = a.last_name;
                    payload.dob = a.dob;
                    payload.gender = a.gender;
                    payload.nationality = a.nationality;
                    payload.stance = a.stance;
                    payload.fis_num = a.fis_num;
                } else if (a.status === 'matched') {
                    payload.dbAthleteId = a.dbAthleteId;
                    payload.first_name = a.first_name;
                    payload.last_name = a.last_name;
                }
                return payload; // <-- Ensure payload is returned
            });

        if (athletesToSubmit.length === 0) { setProcessingError("No valid athletes selected."); return; }

        setProcessingError(null); setRegistrationResult(null); setIsRegistering(true);
        startRegisterTransition(async () => {
            try {
                const response = await addAndRegisterAthletes(eventId, divisionIdAsNumber, athletesToSubmit);
                setIsRegistering(false);
                if (response.success) {
                    setRegistrationResult({ success: true, message: `Processed. ${response.registeredCount ?? 0} new registrations.` });
                    setCheckedAthletes([]); setFile(null);
                    setSelectedDivisionId(eventDivisions.length > 0 ? String(eventDivisions[0].division_id) : '');
                    const fileInput = document.getElementById('csv-file-input') as HTMLInputElement;
                    if (fileInput) fileInput.value = '';
                } else {
                    setRegistrationResult({ success: false, message: response.error || "Failed." });
                }
            } catch (error: unknown) {
                setIsRegistering(false);
                console.error("Error calling addAndRegisterAthletes:", error);
                const message = error instanceof Error ? error.message : "Unknown error.";
                setRegistrationResult({ success: false, message: `Registration error: ${message}` });
            }
        });
    };

    // Calculate counts for display
    const selectedCount = checkedAthletes.filter(a => a.isSelected && a.status !== 'error').length;
    const newSelectedCount = checkedAthletes.filter(a => a.isSelected && a.status === 'new').length;
    const matchedSelectedCount = checkedAthletes.filter(a => a.isSelected && a.status === 'matched').length;
    const errorCount = checkedAthletes.filter(a => a.status === 'error').length;
    const isLoading = isParsing || isChecking || isRegistering || isCheckPending || isRegisterPending;

    // --- JSX Rendering ---
    return (
        <div className="space-y-6">
            {/* Header and Back Button */}
            <div className='flex flex-col sm:flex-row justify-between items-center gap-2 mb-6'>
                 <h2 className="text-2xl md:text-3xl font-bold">Manage Athletes via CSV</h2>
                 {eventId !== null ? (
                      <Link href={`/admin/events/${eventId}`} className="btn btn-sm btn-outline">
                           Back to Event Dashboard
                      </Link>
                 ) : (
                      <span className="text-sm text-error">Invalid Event URL</span>
                 )}
            </div>

            {/* Display general processing error if eventId is invalid */}
            {eventId === null && processingError && (
                 <div role="alert" className="alert alert-error"> {/* ... error icon ... */} <span>{processingError}</span> </div>
            )}

            {/* Only show forms if eventId is valid */}
            {eventId !== null && (
                 <>
                     {/* 1. File Upload Section */}
                     <div className="card bg-base-100 shadow">
                         <div className="card-body">
                             <h3 className="card-title text-lg">1. Upload CSV File</h3>
                             <p className="text-sm opacity-70 mb-2"> Required Headers: last_name, first_name, dob (YYYY-MM-DD), gender. Optional: nationality, stance, fis_num. </p>
                             <div className="form-control"> <input id="csv-file-input" type="file" accept=".csv, text/csv" onChange={handleFileChange} className="file-input file-input-bordered w-full max-w-md" disabled={isLoading} /> </div>
                             {file && <p className="mt-2 text-sm">Selected: {file.name}</p>}
                             <div className="card-actions justify-start mt-4"> <button className="btn btn-primary" onClick={handleProcessFile} disabled={!file || isLoading}> { (isParsing) ? 'Parsing...' : (isChecking || isCheckPending) ? 'Checking DB...' : 'Process File & Check Athletes' } </button> </div>
                             {processingError && !registrationResult && <p className="text-error mt-2">{processingError}</p>}
                         </div>
                     </div>

                     {/* 2. Review and Confirmation Section */}
                     {checkedAthletes.length > 0 && (
                         <div className="card bg-base-100 shadow mt-6">
                             <div className="card-body">
                                 <h3 className="card-title text-lg">2. Review Athletes & Select Division</h3>
                                 {errorCount > 0 && ( <div role="alert" className="alert alert-warning shadow-sm mb-4"> {/* ... */} <span>{errorCount} row(s) had validation errors.</span> </div> )}

                                 {/* Division Selection Dropdown */}
                                 <div className="form-control w-full max-w-xs mb-4">
                                     <label className="label" htmlFor="division-select"><span className="label-text font-semibold">Assign Division for Registration*</span></label>
                                     <select id="division-select" className="select select-bordered" value={selectedDivisionId} onChange={(e) => setSelectedDivisionId(e.target.value)} disabled={eventDivisions.length === 0 || isLoading}>
                                         <option value="" disabled>{eventDivisions.length === 0 ? 'No Divisions Available' : 'Select Division'}</option>
                                         {eventDivisions.map(div => ( <option key={div.division_id} value={String(div.division_id)}>{div.division_name}</option> ))}
                                     </select>
                                     {eventDivisions.length === 0 && !isLoading && <span className="label-text-alt text-warning mt-1">No divisions found/created.</span>}
                                 </div>

                                 {/* Display Table */}
                                 <div className="overflow-x-auto mb-4">
    <table className="table table-sm table-zebra w-full">
        <thead>
            <tr className="text-xs uppercase">
                <th>Sel.</th>
                <th>Status</th>
                <th>CSV Data</th>
                <th>DB Match Details</th>
                <th>Action / Error</th>
            </tr>
        </thead>
        <tbody>
            {checkedAthletes.map(athlete => (
                <tr key={athlete.csvIndex} className={`${athlete.status === 'error' ? 'opacity-60' : ''} hover`}>
                    <td><input type="checkbox" className="checkbox checkbox-primary checkbox-xs" checked={!!athlete.isSelected} onChange={() => handleSelectionChange(athlete.csvIndex)} disabled={athlete.status === 'error' || isLoading} /></td>
                    <td><span className={`badge badge-sm ${athlete.status === 'matched' ? 'badge-success' : athlete.status === 'new' ? 'badge-info' : 'badge-error'}`}>{athlete.status}</span></td>
                    <td><div className='text-sm'><strong>{athlete.first_name} {athlete.last_name}</strong> <br /><span className='text-xs opacity-70'>DOB: {athlete.dob || 'N/A'} | G: {athlete.gender || 'N/A'} | FIS: {athlete.fis_num || 'N/A'}</span></div></td>
                    <td>
                        {athlete.status === 'matched' && athlete.dbDetails && (
                            <div className='text-xs'>
                                <span className='font-semibold'>ID: {athlete.dbAthleteId}</span><br />
                                {athlete.dbDetails.first_name} {athlete.dbDetails.last_name}<br />
                                <span className='opacity-70'> DOB: {new Date(athlete.dbDetails.dob).toLocaleDateString()}</span>
                            </div>
                        )}
                        {athlete.status === 'new' && (
                            <span className='text-xs italic text-info'>New Athlete</span>
                        )}
                    </td>
                    <td className='text-center'>
                        {athlete.status === 'new' && !isLoading && (
                            <button className="btn btn-xs btn-ghost text-info p-1" onClick={() => handleEditAthlete(athlete.csvIndex)} title="Edit athlete details">
                                <PencilSquareIcon className="h-4 w-4" />
                            </button>
                        )}
                        {athlete.status === 'error' && athlete.validationError && (
                            <div className="text-error text-xs tooltip tooltip-left" data-tip={athlete.validationError}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Error
                            </div>
                        )}
                    </td>
                </tr>
            ))}
            {checkedAthletes.length === 0 && (
                <tr>
                    <td colSpan={5} className="text-center italic py-2"> {/* Adjusted padding */}
                        {isLoading ? 'Processing data...' : 'No athletes to display yet.'}
                    </td>
                </tr>
            )}
        </tbody>
    </table>
</div>

                                 {/* Summary and Final Button */}
                                 <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                                     <div> <p className="font-semibold">Selected: {selectedCount}</p> <p className="text-sm">(New: {newSelectedCount}, Matched: {matchedSelectedCount})</p> </div>
                                     <button className="btn btn-success w-full sm:w-auto" onClick={handleRegisterAthletes} disabled={selectedCount === 0 || !selectedDivisionId || isLoading}> {(isRegistering || isRegisterPending) ? 'Registering...' : 'Confirm & Register Selected Athletes'} </button>
                                 </div>

                                  {/* Display Registration Result */}
                                  {registrationResult && (<div role="alert" className={`alert ${registrationResult.success ? 'alert-success' : 'alert-error'} mt-4 text-sm`}>{/* ... Result Message/Icon ... */}<span>{registrationResult.message}</span></div>)}
                             </div>
                         </div>
                     )}
                 </>
             )} {/* End check for valid eventId */}
        </div> // End main wrapper div
    );
}