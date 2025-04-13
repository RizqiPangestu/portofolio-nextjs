
import Image from 'next/image'

function GithubContact({link}:{link: string}){
    return <a href={link} target="_blank" className='flex flex-row items-center justify-center gap-1'>
        <div className='w-4 h-4 md:w-8 md:h-8 relative'>
            <Image
                src={"/assets/images/github-mark-white.svg"}
                alt=""
                objectFit="contain"
                fill={true}
            />
        </div>
        <div className='text-sm md:text-lg'>Github</div>
    </a>
}

function EmailContact(){
    return <a href="mailto:pangestu.rizqi.pr@gmail.com" target="_blank" className='flex flex-row items-center justify-center gap-1'>
        <div className='w-4 h-4 md:w-8 md:h-8 relative'>
            <Image
                src={"/assets/images/envelope.png"}
                alt=""
                objectFit="contain"
                fill={true}
            />
        </div>
        <div className='text-sm md:text-lg'>Email</div>
    </a>
}

function LinkedInContact({link}:{link: string}){
    return <a href={link} target="_blank" className='flex flex-row items-center justify-center gap-1'>
        <div className='w-4 h-4 md:w-8 md:h-8 relative'>
            <Image
                src={"/assets/images/InBug-White.png"}
                alt=""
                objectFit="contain"
                fill={true}
            />
        </div>
        <div className='text-sm md:text-lg'>LinkedIn</div>
    </a>
}

export default function Footer(){
    return <footer className="w-full flex flex-col items-center justify-center h-20">
        <div className='flex flex-col items-center justify-center  w-3/4 md:w-1/2'>
            <div className="border-t-1 border-gray-600 w-full mt-4 mb-8"></div>
            <div className='w-full flex flex-wrap items-center justify-evenly'>
                <GithubContact link='https://github.com/RizqiPangestu'></GithubContact>
                <EmailContact></EmailContact>
                <LinkedInContact link='https://www.linkedin.com/in/rizqi-pangestu-b9a1aa121/'></LinkedInContact>
            </div>
        </div>
    </footer>
}