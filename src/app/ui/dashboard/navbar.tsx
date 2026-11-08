import Link from "next/link";

export default function NavBar(){
    return <>
        <nav className='flex gap-8'>
            <Link className='font-bold' href='/home'>Home</Link>
            <Link className='font-bold' href='/home/project'>Project</Link>
        </nav>
    </>
}