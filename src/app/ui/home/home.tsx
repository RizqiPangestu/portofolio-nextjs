
import Image from 'next/image'
import { excalibrawFont } from '../fonts/fonts'


export function About(){
    return <div className="flex flex-col items-center text-center my-8">
        <div className={`${excalibrawFont.className} text-3xl font-bold`}>
            About Me
        </div>
        <div className="my-2">
            Hello, I&#39;m Rizqi Pangestu, i have been working as software engineer since i graduated from bachelor degree.
            I have strong interests in software engineering. I like to learn something new by doing and read the official documentations
        </div>
    </div>
}

export function Experience(){
    return <div className="flex flex-col items-center my-8 w-full">
        <div className={`${excalibrawFont.className} text-3xl font-bold`}>
            Experience
        </div>
        <div className="flex flex-col items-start w-full my-4 text-base md:text-lg">
            <div className="w-full my-4">
                <div className="flex flex-row gap-2">
                    <div className="font-bold">Tiket.com</div>
                    <div className="text-gray-500 font-bold">-</div>
                    <div className="text-gray-500 font-bold">Jakarta, Indonesia</div>
                </div>
                <div className="text-gray-500">Online Travel Agent (OTA) and lifestyle app</div>
                <div>
                <div className="flex flex-row justify-between w-full">
                        <div className="italic">Backend Engineer Internship</div>
                        <div className="text-right">Apr 2022 - Sep 2022</div>
                    </div>
                    <div className="flex flex-row justify-between w-full">
                        <div className="italic">Software Engineer I</div>
                        <div className="text-right">Oct 2022 - Present</div>
                    </div>
                </div>
                <ul className="pl-5 text-gray-400 list-disc marker:text-green-400 text-sm md:text-base">
                    <li>Develop B2B backend service using Golang</li>
                    <li>Using MongoDB, Redis, Kafka, GCP Pubsub, and Google Cloud Storage as tech stack</li>
                    <li>Create scalable job worker using Google PubSub messaging system (~3k concurrent job/minute)</li>
                    <li>Maintaining a scalable service that can handle high network traffic (~100k concurrent traffic/minute)</li>
                    <li>Minimize network IO cost by eliminating unnecessary payload (best achievement: reduce network cost by 75% in one month)</li>
                </ul>
            </div>
            <div className="w-full my-4">
                <div className="flex flex-row gap-2">
                    <div className="font-bold">Bukit Vista</div>
                    <div className="text-gray-500 font-bold">-</div>
                    <div className="text-gray-500 font-bold">Bali, Indonesia</div>
                </div>
                <div className="text-gray-500">Property management company in Bali and Yogyakarta</div>
                <div>
                <div className="flex flex-row justify-between w-full">
                        <div className="italic">Backend Developer Internship</div>
                        <div className="text-right">Oct 2021 - Mar 2022</div>
                    </div>
                </div>
                <ul className="pl-5 text-gray-400 list-disc marker:text-green-400 text-sm md:text-base">
                    <li>Create feature request from client using Node js</li>
                    <li>Maintain the REST API from bug using Axios</li>
                    <li>Structuring database to ORM models using Sequelize</li>
                    <li>Create automation tools using Puppeteer</li>
                </ul>
            </div>
        </div>
    </div>
}

export function Education(){
    return <div className="flex flex-col items-center text-center my-8 w-full">
        <div className={`${excalibrawFont.className} text-3xl font-bold`}>
            Education
        </div>
        <div className="flex flex-col items-start w-full my-4 text-sm md:text-lg">
            <div className="flex flex-row justify-between w-full">
                <div className="flex flex-row">
                    <div className="font-bold">Universitas Gadjah Mada</div>
                    <div className="text-gray-500 font-bold">-</div>
                    <div className="text-gray-500 font-bold">Yogyakarta, Indonesia</div>
                </div>
                <div className="text-right">Oct 2021 - Mar 2022</div>
            </div>
            <div className="italic">Bachelor Degree in Computer Science, 3.69/4.00</div>
        </div>
    </div>
}

export function Skills(){
    const imageSpecList = [
        {
            key: 1,
            title: "Golang",
            path: "https://go.dev/blog/go-brand/Go-Logo/PNG/Go-Logo_Blue.png",
            alt: "golang image",
            href: "https://go.dev/doc/"
        },
        {
            key: 2,
            title: "Mongodb",
            path: "https://webimages.mongodb.com/_com_assets/cms/kuyjf3vea2hg34taa-horizontal_default_slate_blue.svg",
            alt: "mongodb image",
            href: "https://www.mongodb.com/docs/"
        },
        {
            key: 3,
            title: "Redis",
            path: "https://redis.io/wp-content/uploads/2024/04/Logotype.svg?auto=webp&quality=85,75&width=120",
            alt: "redis image",
            href: "https://redis.io/docs/latest/"
        },
        {
            key: 4,
            title: "Apache Kafka",
            path: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/Apache_Kafka_logo.svg/308px-Apache_Kafka_logo.svg.png",
            alt: "kafka image",
            href: "https://kafka.apache.org/documentation/"
        },
        {
            key: 5,
            title: "Google Cloud Pubsub",
            path: "/assets/images/google_cloud_pubsub_img.png",
            alt: "kafka image",
            href: "https://cloud.google.com/pubsub/docs"
        },
        {
            key: 6,
            title: "Google Cloud Storage",
            path: "/assets/images/google_cloud_storage_img.svg",
            alt: "kafka image",
            href: "https://cloud.google.com/storage/docs"
        },
    ]

    const imageList = imageSpecList.map(i => {
        return (
            i.path != "" && i.href != "" &&
            <a key={i.key} 
            href={i.href}
            target="_blank"
            className="basis-1/4 w-8 h-8 md:w-32 md:h-32 relative mx-2 my-2 group transition-transform transform hover:scale-120 drop-shadow-lg contrast-125 grayscale-25">
                <Image
                    title={i.title}
                    src={i.path}
                    alt={i.alt}
                    layout="fill"
                    objectFit="contain"
                />
            </a>
        )
    })

    return <div className="flex flex-col items-center text-center my-8 w-full">
        <div className={`${excalibrawFont.className} text-3xl font-bold`}>
            Skills
        </div>
        <div className="my-2">
            I&#39;ve been working as software engineer mostly on backend technologies
        </div>
        <div className='flex flex-wrap justify-center my-2 bg-emerald-100 rounded-3xl border-emerald-700 border-5 outline-emerald-100 outline-3'>
            {imageList}
        </div>
    </div>
}

export default function Home(){
    return <div className="w-full flex flex-col items-center">
            <div className="w-3/4 md:w-1/2 flex flex-col items-center">
            <About></About>
            <Experience></Experience>
            <Education></Education>
            <Skills></Skills>
            </div>
        </div>
}