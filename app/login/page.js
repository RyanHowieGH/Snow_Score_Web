import BlankHeader from "../components/blankHeader";
import Link from 'next/link';
import React from 'react'

export default function Login() { 
  return (
    <main className="flex flex-col min-h-screen bg-gray-100">
<BlankHeader/>
<div className="flex flex-grow items-center justify-center p-4">
<div className="card bg-primary w-96 shadow-sm">
  <div className="card-body">
    <h2 className="card-title text-white">Sign In</h2>
    <p className="text-white">Please enter your email and password</p>
    <label className="input validator bg-white">
  <input type="email" placeholder="mail@site.com" required/>
</label>
<div className="validator-hint hidden">Enter valid email address</div>
<label className="input validator bg-white">
  <input type="password" required placeholder="Password" minLength="8" pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}" title="Must be more than 8 characters, including number, lowercase letter, uppercase letter" />
</label>
<p className="validator-hint hidden">
  Must be more than 8 characters, including
  <br/>At least one number
  <br/>At least one lowercase letter
  <br/>At least one uppercase letter
</p>
    <div className="card-actions justify-start">
    <Link href="/admin" className="btn btn-white mr-10">Log In</Link>
    </div>
  </div>
</div>
</div>
</main>
  )
}