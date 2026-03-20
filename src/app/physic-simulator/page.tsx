"use client"

import PhysicSimulator from "./physic-simulator";

export default function Page(){
    return <>
        <h1 className="text-3xl text-bold px-5">Hooke's Law Simulator</h1>
        <div className="mt-8">
            <PhysicSimulator></PhysicSimulator>
        </div>
    </>
}