
import Image from 'next/image'
import { excalibrawFont } from '../fonts/fonts'
import { publicAsset } from "../../_lib/assetPath";


export function About(){
    return <div className="flex flex-col items-center text-center my-8">
        <div className={`${excalibrawFont.className} text-4xl font-bold`}>
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
        <div className={`${excalibrawFont.className} text-4xl font-bold`}>
            Experience
        </div>
        <div className="flex flex-col items-start w-full my-4 text-base md:text-lg">
            <div className="w-full my-4">
                <div className="flex flex-row gap-2 text-2xl font-bold">
                    <div>Tiket.com</div> 
                    <div className="text-gray-500">- Jakarta, Indonesia</div>
                </div>
                <div className="text-gray-500">Online Travel Agent (OTA) and lifestyle app</div>
                <div>
                    <div className="flex flex-row justify-between w-full">
                        <div className="italic">Software Engineer II</div>
                        <div className="text-right">Sep 2025 - Present</div>
                    </div>
                </div>
                <ul className="pl-5 text-gray-400 list-disc marker:text-green-400 text-sm md:text-base">
                    <li><b>Saving ~1 million IDR per month</b> that caused by <b>memory leak</b> by isolating the PDF engine from main service using <b>Gotenberg</b> (Golang based)</li>
                    <li><b>Prevent forex loss by ~175 million IDR in one month, projected to be ~2 billion IDR annually</b> by enabling multi currency for B2B Affiliate hotels, collaborate with Demand, Data, Refund, and Pricing team</li>
                    <li><b>Contribute on API migration from XML into JSON contract</b> with improvement feature for maintainability and readability both for us and partner</li>
                </ul>
                <div>
                    <div className="flex flex-row justify-between w-full">
                        <div className="italic">Software Engineer I</div>
                        <div className="text-right">Oct 2022 - Aug 2025</div>
                    </div>
                </div>
                <ul className="pl-5 text-gray-400 list-disc marker:text-green-400 text-sm md:text-base">
                    <li><b>Refactoring layered into hexagonal architecture</b> on <b>Golang</b> service</li>
                    <li><b>Reducing network cost by 75% (or ~5 million per month)</b> by sanitizing unnecessary payload and <b>GCP Pubsub</b> encoding compression</li>
                    <li><b>Reducing latency by 98%, (from 125ms to 2ms)</b> by optimizing MongoDB database index and caching</li>
                    <li><b>Lead restructuring system design project</b> from blacklist into whitelist that <b>reducing the database storage by approximately 99% (from 200 GB to 2 GB)</b></li>
                    <li><b>Enhancing user observability</b> by integrating our services into meaningful custom <b>Grafana</b> metrics</li>
                    <li>Involved in library creation to <b>solving fan-out fan-in problem</b> which used for several product requirement using <b>MongoDB</b> and <b>GCP Pubsub</b></li>
                    <li>Maintain a scalable discovery service with <b>~120k concurrent traffic/minute</b> (potentially growing along the year)</li>
                </ul>
                <div>
                    <div className="flex flex-row justify-between w-full">
                        <div className="italic">Backend Engineer Internship</div>
                        <div className="text-right">Apr 2022 - Sep 2022</div>
                    </div>
                </div>
                <ul className="pl-5 text-gray-400 list-disc marker:text-green-400 text-sm md:text-base">
                    <li>Develop B2B Affiliate hotel backend service using <b>Golang</b></li>
                    <li>Migrate legacy <b>Java</b> based service into <b>Golang</b></li>
                </ul>
            </div>
            <div className="w-full my-4">
                <div className="flex flex-row gap-2 text-2xl font-bold">
                    <div>Bukit Vista</div>
                    <div className="text-gray-500">- Bali, Indonesia</div>
                </div>
                <div className="text-gray-500">Property management company in Bali and Yogyakarta</div>
                <div>
                <div className="flex flex-row justify-between w-full">
                        <div className="italic">Backend Engineer Internship</div>
                        <div className="text-right">Oct 2021 - Mar 2022</div>
                    </div>
                </div>
                <ul className="pl-5 text-gray-400 list-disc marker:text-green-400 text-sm md:text-base">
                    <li>Develop CRUD API using <b>Node.js</b> with framework <b>Axios</b> and <b>Sequalize</b></li>
                    <li>Create automation scraping tools using <b>Puppeteer</b></li>
                </ul>
            </div>
        </div>
    </div>
}

export function Education(){
    return <div className="flex flex-col items-center text-center my-8 w-full">
        <div className={`${excalibrawFont.className} text-4xl font-bold`}>
            Education
        </div>
        <div className="flex flex-col items-start w-full my-4 text-sm md:text-lg">
            <div className="flex flex-row justify-between w-full">
                <div className="flex flex-row">
                    <div className="font-bold">Universitas Gadjah Mada</div>
                    <div className="text-gray-500 font-bold">-</div>
                    <div className="text-gray-500 font-bold">Yogyakarta, Indonesia</div>
                </div>
                <div className="text-right">Aug 2018 - Aug 2022</div>
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
            path: publicAsset("/assets/images/Go-Logo_Blue.png"),
            alt: "golang image",
            href: "https://go.dev/doc/"
        },
        {
            key: 2,
            title: "Mongodb",
            path: publicAsset("/assets/images/mongodb.svg"),
            alt: "mongodb image",
            href: "https://www.mongodb.com/docs/"
        },
        {
            key: 3,
            title: "Redis",
            path: publicAsset("/assets/images/redis.svg"),
            alt: "redis image",
            href: "https://redis.io/docs/latest/"
        },
        {
            key: 4,
            title: "Apache Kafka",
            path: publicAsset("/assets/images/kafka-logo-tall.png"),
            alt: "kafka image",
            href: "https://kafka.apache.org/documentation/"
        },
        {
            key: 5,
            title: "Google Cloud Pubsub",
            path: publicAsset("/assets/images/google_cloud_pubsub_img.png"),
            alt: "kafka image",
            href: "https://cloud.google.com/pubsub/docs"
        },
        {
            key: 6,
            title: "Google Cloud Storage",
            path: publicAsset("/assets/images/google_cloud_storage_img.svg"),
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
                    fill={true}
                    className="object-contain"
                />
            </a>
        )
    })

    return <div className="flex flex-col items-center text-center my-8 w-full">
        <div className={`${excalibrawFont.className} text-4xl font-bold`}>
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