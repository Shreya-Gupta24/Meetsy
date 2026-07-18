"use client"
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

//provider for tanstack query

const QueryProvider = ({children}: {children: React.ReactNode}) => {
    const [queryClient] = React.useState(
        () =>
            new QueryClient({
                defaultOptions: {
                queries: {
                    refetchOnWindowFocus: false,
                    staleTime: 1000*60, //1 minute
                    retry: false,
                },
                },
            }),
    )   
    return (
    <QueryClientProvider client={queryClient}>
        {children}
    </QueryClientProvider>
  )
}

export default QueryProvider