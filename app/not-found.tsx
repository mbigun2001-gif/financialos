import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-950">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-100 mb-4">404 - Сторінку не знайдено</h2>
        <p className="text-slate-400 mb-4">Сторінка, яку ви шукаєте, не існує.</p>
        <Link
          href="/dashboard"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-block"
        >
          Перейти до дашборду
        </Link>
      </div>
    </div>
  );
}
