export default function mainLayout({
    children
} : {
    children: React.ReactNode
}) {
    return (
        <div className= "min-h-screen bg-background">
            <main className="container mx-auto px-4">{children}</main>
        </div>
    )
}