import React from "react";

export default function Header() {
    return (
        <div className="navbar bg-primary shadow-sm">
            <div className="flex-1">
                <img src="/assets/goggles_borderless.png" alt="Goggles" className="ml-5 h-10 rounded-full" />
            </div>
            <div className="flex gap-2">
                <a className="link text-white text-4xl mb-1 mr-10 b-1" href="/athletes">Athletes</a>
                <a className="link text-white text-4xl mr-10" href="/events">Events</a>
                <button className="btn inline-block mt-1 mr-10 w-18 rounded-full bg-primary hover:bg-primary-focus text-white border-none shadow-sm">
                    <img src="/assets/admin_logo.png" alt="Admin Logo" />

            {/* <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block h-5 w-5 stroke-current"> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"></path> </svg> */}
                </button>
            </div>
        </div>
        )
    }   