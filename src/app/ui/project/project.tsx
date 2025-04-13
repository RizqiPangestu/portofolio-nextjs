import { excalibrawFont } from "../fonts/fonts"
import Image from 'next/image'

type GithubProject = {
    id: number,
    title: string,
    description: string,
    repoUrl: string,
}

const githubProjects: GithubProject[] = [
    {
        id: 1,
        title: "Portfolio",
        description: "The project to create this portfolio page",
        repoUrl: "https://github.com/RizqiPangestu/portofolio-nextjs"
    },
    {
        id: 2,
        title: "Arc Welding Defect Segmentation",
        description: "Final thesis project for my bachelor degree about arc welding defect segmentation using real-time video",
        repoUrl: "https://github.com/RizqiPangestu/Skripsi-Computer-Vision"
    }
];

function Title({ title }: { title: string }){
    return <div className="">
        <div className="text-xl font-bold">
            {title}
        </div>
    </div>
}

function Description({description}:{description:string}){
    return <div>
        {description}
    </div>
}

function RepoUrl({link}:{link: string}){
    return <div>
        <a href={link} target="_blank">
            <Image
                src={"/assets/images/github-mark-white.svg"}
                alt=""
                width={25}
                height={25}
            />
        </a>
    </div>
}

function Card({githubProjects}:{githubProjects: GithubProject[]}){
    return <div className="flex flex-col gap-8">
        {githubProjects.map((project) => (
            <div key={project.id} className="bg-gray-800 flex flex-col rounded-xl border border-black hover:border-white hover:scale-102 transition-all duration-150 p-4">
                <div key={project.id}>
                    <Title title={project.title}></Title>
                    <Description description={project.description}></Description>
                    <RepoUrl link={project.repoUrl}></RepoUrl>
                </div>
            </div>
            ))}
    </div>
}

function GithubProjects(){
    return <div className="flex flex-col items-center my-8 gap-8">
        <div className={`${excalibrawFont.className} text-3xl font-bold`}>
            Github Projects
        </div>
        <div>
            <Card githubProjects={githubProjects}></Card>
        </div>
    </div>
}

export default function Project(){
    return <div className="w-full flex flex-col items-center">
        <div className="w-1/2 flex flex-col items-center">
            <GithubProjects></GithubProjects>
        </div>
    </div>
}