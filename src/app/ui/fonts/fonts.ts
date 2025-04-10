import { Inter,Lusitana,Roboto } from 'next/font/google';
import localFont from 'next/font/local'
 
export const inter = Inter({ subsets: ['latin'] })

export const lusitana = Lusitana({
    weight: ['400', '700'],
    subsets: ['latin'],
  })

export const roboto = Roboto({
    weight: ['400', '700'],
    style: ['normal', 'italic'],
    subsets: ['latin'],
    display: 'swap',
  })

export const excalibrawFont = localFont({ src: './Excalifont-Regular.woff2' })