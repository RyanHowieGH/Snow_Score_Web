import React from "react";
import Image from "next/image";
import Link from "next/link"; // Don't forget this import

export default function BlankHeader() {
  const imageSize = 90; // Set the desired size for the image

  return (
    <div className="navbar bg-primary shadow-sm">
      <div className="navbar-start"> {/* Use navbar-start for left items */}
        <Image
          src="/assets/goggles_borderless.png"
          alt="Goggles"
          width={imageSize}
          height={imageSize}
          className="ml-5 rounded-full"
          priority
        />
      </div>
      {/* <div className="navbar-center"> You could put a title here if needed </div> */}
      <div className="navbar-end"> {/* Use navbar-end for right items */}
        <Link href="/sign-in" className="btn bg-blue-300 hover:bg-blue-400 border-blue-300 hover:border-blue-400 text-black-800 mr-5"> {/* btn-ghost or btn-primary */}
          Log In
        </Link>
      </div>
    </div>
  );
}