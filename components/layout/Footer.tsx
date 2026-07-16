import React from 'react'

const Footer = () => {
    return (
        <footer className="border-t py-12">
        <div className="text-center">
            <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Meetsy. All rights reserved.
            </p>
        </div>
        </footer>
    )
}

export default Footer