import Image from "next/image";
import Link from "next/link";

export default function Header() {
  return (
    <header className="relative mx-auto mt-5 flex w-full items-center justify-center px-2 pb-7 sm:px-4">
      <Link href="/" className="absolute flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 to-orange-500">
          <span className="text-lg font-bold text-white">A</span>
        </div>
        <h1 className="text-xl font-medium tracking-tight">
          <span className="bg-gradient-to-r from-purple-600 to-orange-500 bg-clip-text text-transparent">Appschemist</span>
        </h1>
      </Link>
    </header>
  );
}