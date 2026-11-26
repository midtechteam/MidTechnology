export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white">
      {/* Animated purple spinner */}
      <div className="relative h-12 w-12">
        <div className="absolute inset-0 animate-spin rounded-full border-4 border-purple-100 border-t-purple-600" />
      </div>

      {/* Brand text */}
      <p className="mt-4 text-sm font-medium text-gray-400 tracking-wide">
        Scafbind
      </p>
    </div>
  );
}
