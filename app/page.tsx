'use client'

import { useEffect, useState } from 'react'
import ChessBoardWithAIFeedback from '../components/ChessBoardWithAIFeedback'

export default function Home() {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return null // or a loading spinner
  }

  return <ChessBoardWithAIFeedback />
}