import React from "react";
import Image from "next/image";

export default function BlankHeader() {
    return (
        <div className="navbar bg-primary shadow-sm">
            <div className="flex-1">
                <Image src="/assets/goggles_borderless.png" alt="Goggles" className="ml-5 h-10 rounded-full" />
            </div>
        </div>
        )
    }   