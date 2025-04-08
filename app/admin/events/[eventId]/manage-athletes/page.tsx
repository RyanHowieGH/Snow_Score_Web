// app/admin/events/[eventId]/manage-athletes/page.tsx
'use client';

import { useState, ChangeEvent, useTransition } from 'react';
import { useParams } from 'next/navigation';
import Papa from 'papaparse';
// Import only Server Actions
import { checkAthletesAgainstDb, addAndRegisterAthletes } from './actions';
import Link from 'next/link';

// Define types locally (or import from a shared types file/actions export)
// Ensure Division uses number for division_id
interface Division {
    division_id: number;
    division_name: string;
}

interface CheckedAthleteClient extends Record<string, any> { // Allow extra props from CSV
    csvIndex: number;
    status: 'matched' | 'new' | 'error';
    dbAthleteId?: number | null;
    validationError?: string;
    dbDetails?: {
        first_name: string;
        last_name: string;
        dob: Date | string;
    };
    isSelected?: boolean;
    // Fields for potential editing
    last_name?: string;
    first_name?: string;
    dob?: string;
    gender?: string;
    nationality?: string | null;
    stance?: string | null;
    fis_num?: string | null;
}


export default function ManageAthletesPage() {
    const params = useParams();
    const eventId = parseInt(params.eventId as string, 10);

    // State Hooks
    const [file, setFile] = useState<File | null>(null);
    const [isParsing, setIsParsing] = useState(false);
    const [isChecking, setIsChecking] = useState(false);
    const [isRegistering, setIsRegistering] = useState(false);
    const [checkedAthletes, setCheckedAthletes] = useState<CheckedAthleteClient[]>([]);
    const [eventDivisions, setEventDivisions] = useState<Division[]>([]);
    const [selectedDivisionId, setSelectedDivisionId] = useState<string>(''); // State is STRING
    const [processingError, setProcessingError] = useState<string | null>(null);
    const [registrationResult, setRegistrationResult] = useState<{ success: boolean; message: string } | null>(null);

    // useTransition for Server Action pending states
    const [isCheckPending, startCheckTransition] = useTransition();
    const [isRegisterPending, startRegisterTransition] = useTransition();

    // Handlers
    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            // Reset everything when a new file is chosen
            setCheckedAthletes([]);
            setEventDivisions([]);
            setSelectedDivisionId('');
            setProcessingError(null);
            setRegistrationResult(null);
        }
    };

    const handleProcessFile = () => {
        if (!file) {
            setProcessingError("Please select a CSV file first.");
            return;
        }
        // Reset state before processing
        setProcessingError(null);
        setRegistrationResult(null);
        setIsParsing(true);
        setCheckedAthletes([]);
        setEventDivisions([]);
        setSelectedDivisionId('');

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            transformHeader: header => header.toLowerCase().replace(/\s+/g, '_'),
            complete: (results) => {
                setIsParsing(false);
                console.log("Parsed CSV data:", results.data);

                if (!results.data || results.data.length === 0) {
                     setProcessingError("CSV file is empty or could not be parsed.");
                     return;
                }
                 if (results.errors.length > 0) {
                    console.error("CSV Parsing errors:", results.errors);
                     setProcessingError(`Error parsing CSV: ${results.errors[0].message}`);
                     // Consider if you want to proceed despite parsing errors
                }

                 // Call the server action to check athletes and get/create divisions
                 setIsChecking(true);
                 startCheckTransition(async () => {
                     try {
                         // Call action with eventId
                         const response = await checkAthletesAgainstDb(eventId, results.data);
                         setIsChecking(false);

                         if (response.success && response.data) {
                            // Update athletes state
                            setCheckedAthletes(response.data.athletes.map(athlete => ({
                                ...athlete,
                                isSelected: athlete.status !== 'error', // Pre-select valid rows
                            })));
                            // Update divisions state
                            setEventDivisions(response.data.divisions);

                            // Set default selected division *using string conversion*
                             if (response.data.divisions.length > 0) {
                                  const defaultDivisionIdAsString = String(response.data.divisions[0].division_id); // Convert number to string
                                  setSelectedDivisionId(defaultDivisionIdAsString); // Set string state
                             } else {
                                 // Handle case where no divisions are available after check
                                  setProcessingError("Warning: No divisions found or created for this event. Cannot register athletes without selecting a division.");
                                  setSelectedDivisionId(''); // Ensure state is empty string
                             }
                         } else {
                             // Handle error from server action
                             setProcessingError(response.error || "Failed to check athletes.");
                             // Ensure divisions are empty on error
                             setEventDivisions([]);
                             setSelectedDivisionId('');
                         }
                     } catch (error) {
                         // Handle unexpected errors during action call
                         setIsChecking(false);
                         console.error("Error calling checkAthletesAgainstDb:", error);
                         setProcessingError("An error occurred while checking athletes.");
                         setEventDivisions([]);
                         setSelectedDivisionId('');
                     }
                 });
            },
            error: (error) => {
                // Handle file reading/parsing errors
                setIsParsing(false);
                console.error("PapaParse error:", error);
                setProcessingError(`Failed to parse CSV file: ${error.message}`);
            }
        });
    };

     const handleSelectionChange = (csvIndex: number) => {
        // Toggle the isSelected property for the specific athlete
        setCheckedAthletes(prev =>
            prev.map(athlete =>
                athlete.csvIndex === csvIndex
                    ? { ...athlete, isSelected: !athlete.isSelected }
                    : athlete
            )
        );
     };

     const handleEditAthlete = (csvIndex: number) => {
          // Placeholder for launching an edit UI (e.g., modal)
          const athleteToEdit = checkedAthletes.find(a => a.csvIndex === csvIndex);
          console.log("Edit athlete data:", athleteToEdit);
          alert(`Implement editing UI for athlete: ${athleteToEdit?.first_name} ${athleteToEdit?.last_name} (CSV index: ${csvIndex})`);
          // After editing, you would update the specific athlete in the checkedAthletes state
          // using setCheckedAthletes and handleNewAthleteDataChange or similar logic.
     };

     // Example handler if implementing inline editing (currently just linked to placeholder button)
     const handleNewAthleteDataChange = (csvIndex: number, field: keyof CheckedAthleteClient, value: string | null) => {
         setCheckedAthletes(prev =>
             prev.map(athlete => {
                 if (athlete.csvIndex === csvIndex && athlete.status === 'new') {
                     return { ...athlete, [field]: value };
                 }
                 return athlete;
             })
         );
     };

    const handleRegisterAthletes = () => {
        // --- Parse selectedDivisionId (string) to number ---
        if (!selectedDivisionId) {
             setProcessingError("Please select a division.");
             return;
        }
        const divisionIdAsNumber = parseInt(selectedDivisionId, 10);
        if (isNaN(divisionIdAsNumber)) {
             setProcessingError("Invalid division selected. Please try again.");
             console.error("Failed to parse selectedDivisionId to number:", selectedDivisionId);
             return;
        }
        // --- End Parsing ---

        // Filter selected, valid athletes and prepare payload
        const athletesToSubmit = checkedAthletes
            .filter(a => a.isSelected && a.status !== 'error')
            .map(a => {
                const payload: any = { // Consider creating a stricter AthleteToRegister type for this payload
                    csvIndex: a.csvIndex,
                    status: a.status,
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
                }
                return payload;
            });

        if (athletesToSubmit.length === 0) {
            setProcessingError("No valid athletes selected for registration.");
            return;
        }

        // Reset errors/results and set loading state
        setProcessingError(null);
        setRegistrationResult(null);
        setIsRegistering(true);

        startRegisterTransition(async () => {
             try {
                 // Call the action with the parsed numeric division ID
                 const response = await addAndRegisterAthletes(eventId, divisionIdAsNumber, athletesToSubmit);
                 setIsRegistering(false);
                 if (response.success) {
                     setRegistrationResult({ success: true, message: `Successfully processed. ${response.registeredCount ?? 0} new registrations added.` });
                     // Clear form state on success
                     setCheckedAthletes([]);
                     setEventDivisions([]);
                     setSelectedDivisionId('');
                     setFile(null);
                     const fileInput = document.getElementById('csv-file-input') as HTMLInputElement;
                     if (fileInput) fileInput.value = '';
                 } else {
                     // Show error from server action
                     setRegistrationResult({ success: false, message: response.error || "Failed to register athletes." });
                 }
             } catch (error) {
                 // Handle unexpected errors during action call
                 setIsRegistering(false);
                 console.error("Error calling addAndRegisterAthletes:", error);
                 const message = error instanceof Error ? error.message : "An unknown error occurred.";
                 setRegistrationResult({ success: false, message: `Registration error: ${message}` });
             }
        });
    };

    // Calculate counts for display
    const selectedCount = checkedAthletes.filter(a => a.isSelected && a.status !== 'error').length;
    const newSelectedCount = checkedAthletes.filter(a => a.isSelected && a.status === 'new').length;
    const matchedSelectedCount = checkedAthletes.filter(a => a.isSelected && a.status === 'matched').length;
    const errorCount = checkedAthletes.filter(a => a.status === 'error').length;

    // Combined loading state
    const isLoading = isParsing || isChecking || isRegistering || isCheckPending || isRegisterPending;

    // JSX Rendering
    return (
        <div className="space-y-6">
            {/* Header and Back Button */}
            <div className='flex justify-between items-center mb-6'>
                 <h2 className="text-3xl font-bold">Manage Athletes via CSV Import</h2>
                 <Link href={`/admin/events/${eventId}`} className="btn btn-sm btn-outline">
                      Back to Event Dashboard
                 </Link>
            </div>

            {/* 1. File Upload Section */}
            <div className="card bg-base-100 shadow">
                <div className="card-body">
                    <h3 className="card-title text-lg">1. Upload CSV File</h3>
                     <p className="text-sm opacity-70 mb-2">
                        Required Headers (case-insensitive, spaces ignored): <strong>last_name</strong>, <strong>first_name</strong>, <strong>dob</strong> (YYYY-MM-DD), <strong>gender</strong>. <br />
                        Optional Headers: nationality (3 letters), stance (Regular/Goofy), fis_num (7 digits).
                    </p>
                    <div className="form-control">
                        <input
                            id="csv-file-input"
                            type="file"
                            accept=".csv, text/csv"
                            onChange={handleFileChange}
                            className="file-input file-input-bordered w-full max-w-md"
                            disabled={isLoading}
                        />
                    </div>
                    {file && <p className="mt-2 text-sm">Selected file: {file.name}</p>}
                    <div className="card-actions justify-start mt-4">
                        <button
                            className="btn btn-primary"
                            onClick={handleProcessFile}
                            disabled={!file || isLoading}
                        >
                            {isParsing && <> <span className="loading loading-spinner loading-xs"></span> Parsing... </>}
                            {(isChecking || isCheckPending) && <> <span className="loading loading-spinner loading-xs"></span> Checking DB... </>}
                            {(!isParsing && !isChecking && !isCheckPending) && 'Process File & Check Athletes'}
                        </button>
                    </div>
                     {processingError && <p className="text-error mt-2">{processingError}</p>}
                </div>
            </div>

            {/* 2. Review and Confirmation Section (only show if athletes are checked) */}
            {checkedAthletes.length > 0 && (
                <div className="card bg-base-100 shadow mt-6">
                    <div className="card-body">
                         <h3 className="card-title text-lg">2. Review Athletes & Select Division</h3>

                         {errorCount > 0 && (
                              <div role="alert" className="alert alert-warning shadow-sm mb-4">
                                    {/* Warning Icon */}
                                   <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                   <span>{errorCount} row(s) had validation errors and cannot be processed. See details below.</span>
                              </div>
                         )}

                        {/* Division Selection */}
                         <div className="form-control w-full max-w-xs mb-4">
                              <label className="label" htmlFor="division-select">
                                   <span className="label-text font-semibold">Assign Division for Registration*</span>
                              </label>
                              <select
                                   id="division-select"
                                   className="select select-bordered"
                                   value={selectedDivisionId} // Value is string from state
                                   onChange={(e) => setSelectedDivisionId(e.target.value)}
                                   disabled={eventDivisions.length === 0 || isLoading}
                              >
                                   <option value="" disabled>{eventDivisions.length === 0 ? 'No Divisions Available' : 'Select Division'}</option>
                                   {eventDivisions.map(div => (
                                        // Option value must be string for select element
                                        <option key={div.division_id} value={String(div.division_id)}>
                                             {div.division_name}
                                        </option>
                                   ))}
                              </select>
                              {eventDivisions.length === 0 && checkedAthletes.length > 0 && !isLoading &&
                                   <span className="label-text-alt text-warning mt-1">No divisions were found or created for this event.</span>}
                         </div>


                        {/* Display Table */}
                        <div className="overflow-x-auto mb-4">
                              <table className="table table-sm table-zebra w-full">
                                   <thead>
                                        <tr>
                                             <th> {/* Maybe add bulk select checkbox here */} </th>
                                             <th>Status</th>
                                             <th>CSV Data</th>
                                             <th>Details / DB Match</th>
                                             <th>Action / Error</th>
                                        </tr>
                                   </thead>
                                   <tbody>
                                        {checkedAthletes.map(athlete => (
                                             <tr key={athlete.csvIndex} className={athlete.status === 'error' ? 'opacity-60' : ''}>
                                                  <td>
                                                       <input
                                                            type="checkbox"
                                                            className="checkbox checkbox-sm"
                                                            checked={!!athlete.isSelected} // Ensure boolean for controlled input
                                                            onChange={() => handleSelectionChange(athlete.csvIndex)}
                                                            disabled={athlete.status === 'error' || isLoading}
                                                       />
                                                  </td>
                                                  <td>
                                                        <span className={`badge badge-sm ${
                                                            athlete.status === 'matched' ? 'badge-success' :
                                                            athlete.status === 'new' ? 'badge-info' :
                                                            'badge-error'
                                                            }`}>
                                                            {athlete.status}
                                                        </span>
                                                   </td>
                                                  <td>
                                                       {/* Display key CSV data */}
                                                       <div className='text-sm'>
                                                           <strong>{athlete.first_name} {athlete.last_name}</strong> <br />
                                                           <span className='text-xs opacity-70'>DOB: {athlete.dob || 'N/A'} | Gen: {athlete.gender || 'N/A'} | FIS: {athlete.fis_num || 'N/A'}</span>
                                                        </div>
                                                  </td>
                                                  <td>
                                                      {athlete.status === 'matched' && athlete.dbDetails && (
                                                           <div className='text-xs'>
                                                                <span className='font-semibold'>DB ID: {athlete.dbAthleteId}</span> <br />
                                                                {athlete.dbDetails.first_name} {athlete.dbDetails.last_name} <br />
                                                                <span className='opacity-70'> DOB: {new Date(athlete.dbDetails.dob).toLocaleDateString()}</span>
                                                            </div>
                                                      )}
                                                       {athlete.status === 'new' && (
                                                           <span className='text-xs italic text-info'>Will be added to DB</span>
                                                      )}
                                                  </td>
                                                  <td>
                                                        {athlete.status === 'error' && athlete.validationError && (
                                                            <div className="text-error text-xs tooltip tooltip-left" data-tip={athlete.validationError}>
                                                                Validation Error
                                                            </div>
                                                        )}
                                                       {athlete.status === 'new' && !isLoading && (
                                                             <button
                                                                  className="btn btn-xs btn-ghost"
                                                                  onClick={() => handleEditAthlete(athlete.csvIndex)} // Use specific handler
                                                                  title="Edit athlete details before adding">
                                                                  Edit
                                                                  </button>
                                                        )}
                                                  </td>
                                             </tr>
                                        ))}
                                   </tbody>
                              </table>
                         </div>


                        {/* Summary and Final Button */}
                        <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                              <div>
                                   <p className="font-semibold">Selected for Registration: {selectedCount}</p>
                                   <p className="text-sm">(New: {newSelectedCount}, Matched: {matchedSelectedCount})</p>
                              </div>
                              <button
                                   className="btn btn-success w-full sm:w-auto"
                                   onClick={handleRegisterAthletes}
                                   disabled={selectedCount === 0 || !selectedDivisionId || isLoading} // Also disable if no division selected
                              >
                                  {(isRegistering || isRegisterPending) && <> <span className="loading loading-spinner loading-xs"></span> Registering... </>}
                                  {(!isRegistering && !isRegisterPending) && 'Confirm & Register Selected Athletes'}
                              </button>
                         </div>

                         {/* Display Registration Result */}
                         {registrationResult && (
                              <div role="alert" className={`alert ${registrationResult.success ? 'alert-success' : 'alert-error'} shadow-sm mt-4`}>
                                   {/* Success/Error Icon */}
                                   {registrationResult.success ?
                                        <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        :
                                        <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    }
                                   <span>{registrationResult.message}</span>
                              </div>
                         )}
                    </div>
                </div>
            )}
        </div>
    );
}