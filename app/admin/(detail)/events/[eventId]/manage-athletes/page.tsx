'use client';

export const dynamic = 'force-dynamic';

import React, { useState, ChangeEvent, useTransition, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Papa, { ParseResult } from 'papaparse';
import { checkAthletesAgainstDb, addAndRegisterAthletes, getEventDivisions, deleteRegistrationAction, getEventRoster } from './actions';
import Link from 'next/link';
import { TrashIcon, InformationCircleIcon, ArrowUturnLeftIcon } from '@heroicons/react/24/outline';
import type { Division, CheckedAthleteClient, AthleteToRegister, RegistrationResultDetail, RegisteredAthleteWithDivision } from '@/lib/definitions';

// --- Promise-based PapaParse wrapper ---
function parseCsv(file: File): Promise<ParseResult<Record<string, unknown>>> {
    return new Promise((resolve, reject) => {
        Papa.parse<Record<string, unknown>>(file, {
            header: true,
            skipEmptyLines: true,
            transformHeader: header => header.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
            complete: resolve,
            error: (err) => reject(new Error(err.message)),
        });
    });
}

export default function ManageAthletesPage() {
    const params = useParams();
    const eventIdParam = params.eventId as string;
    const [eventId, setEventId] = useState<number | null>(null);

    const [currentRoster, setCurrentRoster] = useState<RegisteredAthleteWithDivision[]>([]);
    const [file, setFile] = useState<File | null>(null);
    const [checkedAthletes, setCheckedAthletes] = useState<CheckedAthleteClient[]>([]);
    const [eventDivisions, setEventDivisions] = useState<Division[]>([]);

    const [pageError, setPageError] = useState<string | null>(null);
    const [pageSuccess, setPageSuccess] = useState<string | null>(null);
    const [registrationDetails, setRegistrationDetails] = useState<RegistrationResultDetail[] | null>(null);
    
    const [isRosterLoading, startRosterTransition] = useTransition();
    const [isChecking, startCheckTransition] = useTransition();
    const [isRegistering, startRegisterTransition] = useTransition();
    const isLoading = isRosterLoading || isChecking || isRegistering;

    useEffect(() => {
        const id = parseInt(eventIdParam, 10);
        if (isNaN(id)) {
            setPageError("Invalid Event ID in URL."); return;
        }
        setEventId(id);
        
        startRosterTransition(async () => {
            const [rosterRes, divisionsRes] = await Promise.all([ getEventRoster(id), getEventDivisions(id) ]);
            if (rosterRes.success && rosterRes.data) setCurrentRoster(rosterRes.data);
            else setPageError(rosterRes.error || "Failed to load roster.");
            if (divisionsRes.success && divisionsRes.data) setEventDivisions(divisionsRes.data);
            else setPageError(prev => prev ? `${prev} & ${divisionsRes.error}` : divisionsRes.error || "Failed to load divisions.");
        });
    }, [eventIdParam]);
    
    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setFile(e.target.files[0]);
            setCheckedAthletes([]); setPageError(null); setPageSuccess(null); setRegistrationDetails(null);
        } else {
            setFile(null);
        }
    };

    const handleProcessFile = () => {
        if (!file || eventId === null) return;
        setPageError(null); setPageSuccess(null); setRegistrationDetails(null);
        
        startCheckTransition(async () => {
            try {
                const results = await parseCsv(file);
                if (!results.data.length) throw new Error("CSV file is empty or could not be parsed.");
                
                const response = await checkAthletesAgainstDb(eventId, results.data);
                if (response.success && response.data) {
                    setCheckedAthletes(response.data.athletes.map(a => ({
                        ...a, 
                        isSelected: a.status !== 'error' && a.status !== 'conflict',
                        assigned_division_id: a.suggested_division_id ?? null,
                    })));
                    setEventDivisions(response.data.divisions);
                } else {
                    setPageError(response.error || "Failed to process athletes.");
                }
            } catch (error) {
                const message = error instanceof Error ? `CSV Error: ${error.message}` : "An unknown error occurred.";
                setPageError(message);
            }
        });
    };

    const handleDeleteRegistration = (athleteId: number, divisionId: number) => {
        if (!eventId || !confirm("Are you sure? This will remove the athlete's registration from this event.")) return;
        startRegisterTransition(async () => {
            const response = await deleteRegistrationAction(eventId, athleteId, divisionId);
            if (response.success) {
                setPageSuccess(response.message);
                setCurrentRoster(prev => prev.filter(a => !(a.athlete_id === athleteId && a.division_id === divisionId)));
            } else { setPageError(response.message); }
        });
    };
    
    const handleRegisterAthletes = () => {
        if (eventId === null) return;

        const validSelectedAthletes = checkedAthletes.filter(a => 
            a.isSelected && a.status !== 'error' && a.assigned_division_id
        );

        const athletesToSubmit: AthleteToRegister[] = validSelectedAthletes.map(a => ({
            csvIndex: a.csvIndex,
            status: a.status as 'matched' | 'new',
            division_id: a.assigned_division_id as number,
            last_name: a.csvData.last_name!,
            first_name: a.csvData.first_name!,
            dob: a.csvData.dob!,
            gender: a.csvData.gender!,
            nationality: a.csvData.nationality || null,
            stance: a.csvData.stance || null,
            fis_num: a.csvData.fis_num ? parseInt(a.csvData.fis_num, 10) : null,
            dbAthleteId: a.dbAthleteId,
            isOverwrite: a.isOverwrite,
        }));

        if (athletesToSubmit.length === 0) {
            setPageError("No valid athletes are selected for registration."); return;
        }

        startRegisterTransition(async () => {
            const response = await addAndRegisterAthletes(eventId, athletesToSubmit);
            if (response.success) {
                setPageSuccess(`Registration successful! ${response.registeredCount ?? 0} athletes processed.`);
                setRegistrationDetails(response.details || null);
                const rosterRes = await getEventRoster(eventId);
                if(rosterRes.success && rosterRes.data) setCurrentRoster(rosterRes.data);
                setCheckedAthletes([]); setFile(null);
                const fileInput = document.getElementById('csv-file-input') as HTMLInputElement;
                if (fileInput) fileInput.value = '';
            } else {
                setPageError(response.error || "Registration failed.");
                setRegistrationDetails(response.details || null);
            }
        });
    };
    
    const handleConflictResolution = (csvIndex: number, resolution: 'keep_existing' | 'overwrite') => {
        setCheckedAthletes(prev => prev.map(athlete => {
            if (athlete.csvIndex !== csvIndex) return athlete;
    
            if (resolution === 'keep_existing') {
                const conflictingAthlete = athlete.conflictDetails!.conflictingAthlete;
                // We construct a new object that perfectly matches the CheckedAthleteClient type
                return { 
                    ...athlete, 
                    status: 'matched',
                    isSelected: true,
                    // Rebuild the csvData object using the correct data from the DB
                    csvData: { 
                        first_name: conflictingAthlete.first_name,
                        last_name: conflictingAthlete.last_name,
                        dob: conflictingAthlete.dob,
                        gender: conflictingAthlete.gender,
                        nationality: conflictingAthlete.nationality,
                        stance: conflictingAthlete.stance, // This now matches the type 'Regular' | 'Goofy' | null
                        fis_num: conflictingAthlete.fis_num?.toString() ?? null,
                    },
                    dbAthleteId: conflictingAthlete.athlete_id,
                    dbDetails: conflictingAthlete,
                    isOverwrite: false, // Not an overwrite
                    assigned_division_id: athlete.suggested_division_id ?? null, 
                    // We can clear conflictDetails as it's been resolved
                    conflictDetails: undefined, 
                };
            } else { // 'overwrite'
                return {
                    ...athlete,
                    status: 'new',
                    isSelected: true,
                    isOverwrite: true,
                    assigned_division_id: athlete.suggested_division_id ?? null,
                    // We can clear conflictDetails as it's been resolved
                    conflictDetails: undefined,
                };
            }
        }));
    };
    
    const handleSelectionChange = (csvIndex: number) => setCheckedAthletes(p => p.map(a => a.csvIndex === csvIndex ? { ...a, isSelected: !a.isSelected } : a));
    const handleDivisionChange = (csvIndex: number, newId: string) => setCheckedAthletes(p => p.map(a => a.csvIndex === csvIndex ? { ...a, assigned_division_id: parseInt(newId) || null } : a));
    
    const conflictCount = checkedAthletes.filter(a => a.status === 'conflict').length;
    const selectedCount = checkedAthletes.filter(a => a.isSelected && a.status !== 'error').length;
    const allSelectedHaveDivision = checkedAthletes.filter(a => a.isSelected && a.status !== 'error').every(a => !!a.assigned_division_id);
    const errorCount = checkedAthletes.filter(a => a.status === 'error').length;

    return (
        <div className="space-y-8 p-4 md:p-6">
            <div className='flex justify-between items-center'>
                <h2 className="text-3xl font-bold">Manage Event Athletes</h2>
                {eventId !== null && <Link href={`/admin/events/${eventId}`} className="btn btn-sm btn-outline"><ArrowUturnLeftIcon className="h-4 w-4 mr-2"/>Back to Dashboard</Link>}
            </div>

            {pageError && <div role="alert" className="alert alert-error text-sm"><InformationCircleIcon className="h-5 w-5 mr-2"/><span>{pageError}</span></div>}
            {pageSuccess && <div role="alert" className="alert alert-success text-sm"><InformationCircleIcon className="h-5 w-5 mr-2"/><span>{pageSuccess}</span></div>}
            
            <div className="card bg-base-100 shadow-xl">
                 <div className="card-body">
                    <h3 className="card-title text-xl">1. Import Roster from CSV</h3>
                    <div className="flex flex-col sm:flex-row items-end gap-4">
                         <div className="form-control w-full"><label htmlFor="csv-file-input" className="label"><span className="label-text">Select CSV File:</span></label><input id="csv-file-input" type="file" accept=".csv" onChange={handleFileChange} className="file-input file-input-bordered w-full" disabled={isLoading} /></div>
                         <button className="btn btn-primary w-full sm:w-auto" onClick={handleProcessFile} disabled={!file || isLoading}>{isChecking ? <span className="loading loading-spinner"></span> : 'Process & Review'}</button>
                    </div>
                </div>
            </div>
            
            {checkedAthletes.length > 0 && (
                <div className="card bg-base-100 shadow-xl">
                    <div className="card-body">
                        <h3 className="card-title text-xl">2. Review & Confirm Athletes</h3>
                        {errorCount > 0 && (<div role="alert" className="alert alert-warning text-sm mb-4"><InformationCircleIcon className="h-5 w-5 mr-2"/><span>{errorCount} row(s) had validation errors or conflicts and will be ignored unless resolved.</span></div>)}
                        {conflictCount > 0 && (<div role="alert" className="alert alert-info text-sm mb-4"><InformationCircleIcon className="h-5 w-5 mr-2"/><span>{conflictCount} conflict(s) found. Please resolve them below before registering.</span></div>)}

                        <div className="overflow-x-auto border border-base-300 rounded-lg">
                             <table className="table table-sm w-full">
                                 <thead className="bg-base-200"><tr><th><input type="checkbox" className="checkbox checkbox-xs" onChange={(e) => setCheckedAthletes(p => p.map(a => (a.status !== 'error' && a.status !== 'conflict') ? {...a, isSelected: e.target.checked} : a))} checked={selectedCount > 0 && selectedCount === checkedAthletes.filter(a => a.status !== 'error' && a.status !== 'conflict').length} /></th><th>Status</th><th>CSV Data</th><th>Database Match / Conflict</th><th>Assign Division</th></tr></thead>
                                 <tbody>
                                     {checkedAthletes.map(athlete => (
                                         <tr key={athlete.csvIndex} className={ athlete.status === 'error' ? 'bg-error/10 opacity-60' : athlete.status === 'conflict' ? 'bg-warning/10' : '' }>
                                             <td><input type="checkbox" className="checkbox checkbox-xs" checked={!!athlete.isSelected} onChange={() => handleSelectionChange(athlete.csvIndex)} disabled={athlete.status === 'error' || athlete.status === 'conflict'} /></td>
                                             <td><span className={`badge badge-sm ${athlete.status === 'matched' ? 'badge-success' : athlete.status === 'new' ? 'badge-info' : athlete.status === 'conflict' ? 'badge-warning' : 'badge-error'}`}>{athlete.status}</span></td>
                                             <td><strong>{athlete.csvData.first_name} {athlete.csvData.last_name}</strong><div className="text-xs opacity-70">DOB: {athlete.csvData.dob}<br/>FIS: {athlete.csvData.fis_num || 'N/A'}</div></td>
                                             
                                             <td>
                                                {athlete.status === 'matched' && athlete.dbDetails && <div className='text-xs'><strong>{athlete.dbDetails.first_name} {athlete.dbDetails.last_name}</strong><br/><span className='opacity-70'>DOB: {athlete.dbDetails.dob}<br/>FIS: {athlete.dbDetails.fis_num || 'N/A'}</span></div>}
                                                {athlete.status === 'new' && <span className="text-xs italic opacity-70">New Profile</span>}
                                                {athlete.status === 'conflict' && athlete.conflictDetails && (
                                                    <div className="text-xs p-2 rounded-md border border-warning bg-base-100">
                                                        <p className="font-bold text-warning-content">Conflict on `{athlete.conflictDetails.conflictOn.replace('_', ' ')}`</p>
                                                        <p className='mt-1'>This value is already used by:</p>
                                                        <p className="font-semibold mt-1">{athlete.conflictDetails.conflictingAthlete.first_name} {athlete.conflictDetails.conflictingAthlete.last_name}</p>
                                                        <div className="mt-2 flex gap-2">
                                                            <button className="btn btn-xs btn-outline" onClick={() => handleConflictResolution(athlete.csvIndex, 'keep_existing')}>Keep Existing</button>
                                                            <button className="btn btn-xs btn-warning" onClick={() => handleConflictResolution(athlete.csvIndex, 'overwrite')}>Overwrite with CSV</button>
                                                        </div>
                                                    </div>
                                                )}
                                                {athlete.status === 'error' && <span className='text-xs text-error'>{athlete.validationError}</span>}
                                             </td>
                                             
                                             <td>{athlete.status !== 'error' && athlete.status !== 'conflict' && (<select className="select select-xs select-bordered w-full" value={athlete.assigned_division_id?.toString() ?? ''} onChange={(e) => handleDivisionChange(athlete.csvIndex, e.target.value)}><option value="" disabled>{athlete.suggested_division_name ? `Suggested: ${athlete.suggested_division_name}` : 'Select...'}</option>{eventDivisions.map(div => <option key={div.division_id} value={String(div.division_id)}>{div.division_name}</option>)}</select>)}</td>
                                         </tr>
                                     ))}
                                 </tbody>
                             </table>
                        </div>
                        <div className="card-actions justify-between items-center mt-4">
                            <p className="text-sm font-semibold">{selectedCount} athletes selected.</p>
                            <button 
                                className="btn btn-success" 
                                onClick={handleRegisterAthletes} 
                                disabled={selectedCount === 0 || !allSelectedHaveDivision || isLoading || conflictCount > 0}
                                title={conflictCount > 0 ? "Please resolve all conflicts before registering" : !allSelectedHaveDivision ? "All selected athletes must have a division assigned" : ""}
                            >
                                {isRegistering ? <span className="loading loading-spinner"></span> : `Confirm & Register ${selectedCount} Athletes`}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                    <h3 className="card-title text-xl">Current Roster ({currentRoster.length})</h3>
                    {isRosterLoading ? (
                        <div className="text-center py-4"><span className="loading loading-spinner"></span><p className="text-xs">Loading...</p></div>
                    ) : currentRoster.length > 0 ? (
                        <div className="overflow-x-auto max-h-96">
                            <table className="table table-sm table-pin-rows">
                                <thead className='bg-base-200'><tr><th>Bib #</th><th>Name</th><th>Division</th><th>Actions</th></tr></thead>
                                <tbody>
                                    {currentRoster.map(athlete => (
                                        <tr key={`${athlete.athlete_id}-${athlete.division_id}`}>
                                            <td>{athlete.bib_num || 'N/A'}</td>
                                            <td>{athlete.first_name} {athlete.last_name}</td>
                                            <td>{athlete.division_name}</td>
                                            <td><button className="btn btn-xs btn-ghost text-error" onClick={() => handleDeleteRegistration(athlete.athlete_id, athlete.division_id)} disabled={isLoading}><TrashIcon className="h-4 w-4" /></button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-sm italic text-base-content/70 py-4">No athletes registered for this event.</p>
                    )}
                </div>
            </div>

            {registrationDetails && (
                <div className="card bg-base-100 shadow-xl">
                    <div className="card-body">
                        <h3 className="card-title text-xl">Last Registration Summary</h3>
                        <ul className="list-disc list-inside text-sm space-y-1 max-h-48 overflow-y-auto">
                            {registrationDetails.map((detail, index) => 
                                <li key={index} className={detail.error ? 'text-error' : detail.status.includes('Already') ? 'text-info' : detail.status.includes('Overwritten') ? 'text-warning' : 'text-success'}>
                                    <strong>{detail.athleteName}:</strong> {detail.status} {detail.error && `(${detail.error})`}
                                </li>
                            )}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
}