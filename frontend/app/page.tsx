import RequestList from "@/components/features/request-list"; // Import the RequestList component

export default function Home() {
    return (
        <div className="flex min-h-screen font-[family-name:var(--font-geist-sans)]">
            {/* Sidebar */}
            <aside className="w-1/4 bg-gray-100 p-4 border-r border-gray-300">
                <RequestList/>
            </aside>

            {/* Main Content */}
            <div
                className="flex-1 grid grid-rows-[20px_1fr_20px] items-center justify-items-center p-8 pb-20 gap-16 sm:p-20">
                PAGE
            </div>
            </div>
    );
}