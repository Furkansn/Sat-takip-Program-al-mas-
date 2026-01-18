export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-background p-4 md:p-8">
            {children}
        </div>
    )
}
