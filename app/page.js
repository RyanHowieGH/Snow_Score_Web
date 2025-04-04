"use client"
import BlankHeader from "./components/blankHeader";
import React from 'react'
import Link from 'next/link';


export default function Home() { 
  return (
    <main>
<BlankHeader/>
<div className="hero bg-white min-h-screen">
  <div className="hero-content text-center">
    <div className="max-w-md">
      <h1 className="text-5xl font-bold">Welcome to SnowScore</h1>
      <p className="py-6">
        The new way to track snowboarding and skiing events.
      </p>
      <Link href="/login" className="btn btn-primary mr-10">Log In</Link>
      <Link href="https://example.com" className="btn btn-primary">Browse Events</Link>
    </div>
  </div>
</div>
</main>
  )
}