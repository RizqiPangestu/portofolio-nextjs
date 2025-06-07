import SimulatorFisika from "./simulator-fisika";

export default function Page(){
    return <>
        <h1 className="text-3xl text-bold">Hooke&apos;s Law Spring Simulation</h1>
        <div className="mt-8">
            <SimulatorFisika></SimulatorFisika>
        </div>
    </>
}