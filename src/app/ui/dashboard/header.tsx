import { excalibrawFont } from '../fonts/fonts';
import NavBar from './navbar';

export default function Header(){
    return <header className={`${excalibrawFont.className} flex flex-col items-center justify-center h-20 w-full sticky top-0 bg-black z-1`}>
        <div className='w-10/12 flex flex-row items-center justify-between'>
            <div className='font-bold text-lg md:text-xl'>
                Rizqi Pangestu
            </div>
            <div className='text-base md:text-lg'>
                <NavBar></NavBar>
            </div>
        </div>
    </header>
}