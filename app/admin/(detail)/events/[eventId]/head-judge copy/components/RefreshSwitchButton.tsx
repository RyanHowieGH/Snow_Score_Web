'use client'
import React from 'react';
import { useState } from 'react';


type refreshSwitchButton = {
    onLiveToggle: (toggle: boolean) => void,
}

export default function RefreshSwitchButton ({onLiveToggle}: refreshSwitchButton) {
    const [liveSwitch, setLiveSwitch] = useState<boolean>(false);

    const handleLiveSwitch = () => {
        setLiveSwitch(prev => !prev);
    }

    if (liveSwitch){
        return(
            <button
            className='btn bg-green-500 text-white font-semibold w-20'
            onClick={() => {
                onLiveToggle(false);
                handleLiveSwitch();
            }}>
                Live
            </button>
        )
    }

        if (!liveSwitch){
        return(
            <button
            className='btn bg-red-500 text-white font-semibold w-20'
            onClick={() => {
                onLiveToggle(true);
                handleLiveSwitch();
            }}>
                Offline
            </button>
        )
    }
}