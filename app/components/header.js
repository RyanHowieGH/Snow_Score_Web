import React from "react";

export default function Header() {
    return (
        <div className="navbar bg-primary shadow-sm">
            <div className="flex-1">
                <img src="/assets/goggles_borderless.png" alt="Goggles" className="ml-5 h-10 rounded-full" />
            </div>
            <div className="flex gap-2">
                <button className="btn inline-block mt-1 mr-10 w-18 rounded-full bg-primary hover:bg-primary-focus text-white text-2xl border-none shadow-sm">
                    Athletes
                    </button>
                    <button className="btn inline-block mt-1 mr-10 w-18 rounded-full bg-primary hover:bg-primary-focus text-white text-2xl border-none shadow-sm">
                    Events
                    </button>
                <button className="btn inline-block mt-1 mr-10 w-18 rounded-full bg-primary hover:bg-primary-focus text-white border-none shadow-sm">
                    <img src="/assets/admin_logo.png" alt="Admin Logo" />
                </button>
            </div>
        </div>
        )
    }   