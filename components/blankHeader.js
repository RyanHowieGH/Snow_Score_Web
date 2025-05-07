import React from "react";
import Image from "next/image";

export default function BlankHeader() {
const imageSize = 90; // Set the desired size for the image

    return (
        <div className="navbar bg-primary shadow-sm">
            <div className="flex-1">
                <Image src="/assets/goggles_borderless.png" alt="Goggles" width={imageSize} height={imageSize} className="ml-5 rounded-full" priority/>
            </div>
        </div>
        )
    }   