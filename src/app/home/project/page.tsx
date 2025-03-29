import Header from "@/app/ui/dashboard/header";
import { inter } from "@/app/ui/fonts/fonts";
import Project from "@/app/ui/project/project";

export default function Page(){
    return <div>
    <Header></Header>
    <div className={inter.className}>
        <Project></Project>
    </div>
</div>
}