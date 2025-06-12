import SimulatorFisika from "./simulator-fisika";

export default function Page(){
    return <>
        <h1 className="text-3xl text-bold">Simulasi Pegas Hukum Hooke</h1>
        <div className="mt-8">
            <SimulatorFisika></SimulatorFisika>
        </div>
    </>
}