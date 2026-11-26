import { useNavigate } from "react-router-dom";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4">
      {/* 404 number */}
      <h1 className="bg-gradient-to-r from-purple-500 to-violet-600 bg-clip-text text-9xl font-extrabold text-transparent select-none">
        404
      </h1>

      {/* Heading */}
      <h2 className="mt-4 text-2xl font-semibold text-gray-800">
        Page not found
      </h2>

      {/* Description */}
      <p className="mt-2 text-center text-gray-500 max-w-sm">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>

      {/* Back button */}
      <button
        onClick={() => navigate("/dashboard")}
        className="mt-8 rounded-lg bg-gradient-to-r from-purple-600 to-violet-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:from-purple-700 hover:to-violet-700 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
      >
        Back to Dashboard
      </button>
    </div>
  );
}
