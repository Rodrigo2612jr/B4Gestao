import Link from "next/link";
import { HiOutlineHome } from "react-icons/hi";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-light px-4 text-center">
      <h1 className="text-8xl font-extrabold text-primary">404</h1>
      <h2 className="mt-4 text-2xl font-bold text-secondary">
        Página não encontrada
      </h2>
      <p className="mt-2 max-w-md text-gray">
        A página que você procura não existe ou foi movida. Volte para a
        página inicial e descubra como a B4 pode proteger sua empresa.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-primary-dark hover:shadow-lg"
      >
        <HiOutlineHome className="text-lg" />
        Voltar ao início
      </Link>
    </div>
  );
}
