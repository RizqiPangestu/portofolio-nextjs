import Footer from "../ui/dashboard/footer"
import Header from "../ui/dashboard/header"
import { inter } from "../ui/fonts/fonts"
import Home from "../ui/home/home"

export default function Page(){
    return <div>
        <Header></Header>
        <div className={inter.className}>
            <Home></Home>
        </div>
        <Footer></Footer>
    </div>
}