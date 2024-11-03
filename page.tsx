'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Bell, LogOut, Settings, User } from 'lucide-react'

type ColorMode = 'classic' | 'blue' | 'green'
type Piece = '♜' | '♞' | '♝' | '♛' | '♚' | '♟' | '♖' | '♘' | '♗' | '♕' | '♔' | '♙' | ''
type Position = [number, number]

const colorModes: Record<ColorMode, { light: string; dark: string }> = {
  classic: { light: 'bg-amber-100', dark: 'bg-amber-800' },
  blue: { light: 'bg-blue-200', dark: 'bg-blue-800' },
  green: { light: 'bg-green-200', dark: 'bg-green-800' },
}

const initialBoard: Piece[][] = [
  ['♜', '♞', '♝', '♛', '♚', '♝', '♞', '♜'],
  ['♟', '♟', '♟', '♟', '♟', '♟', '♟', '♟'],
  ['', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', ''],
  ['♙', '♙', '♙', '♙', '♙', '♙', '♙', '♙'],
  ['♖', '♘', '♗', '♕', '♔', '♗', '♘', '♖'],
]

export default function ChessBoardWithAIFeedback() {
  const [colorMode, setColorMode] = useState<ColorMode>('classic')
  const [board, setBoard] = useState<Piece[][]>(initialBoard)
  const [selectedPiece, setSelectedPiece] = useState<Position | null>(null)
  const [currentPlayer, setCurrentPlayer] = useState<'white' | 'black'>('white')
  const [moveHistory, setMoveHistory] = useState<string[]>([])
  const [aiFeedback, setAIFeedback] = useState<string>('')

  const isWhitePiece = (piece: Piece) => '♙♖♘♗♕♔'.includes(piece)
  const isBlackPiece = (piece: Piece) => '♟♜♞♝♛♚'.includes(piece)

  const isValidMove = (start: Position, end: Position): boolean => {
    const [startRow, startCol] = start
    const [endRow, endCol] = end
    const piece = board[startRow][startCol]
    const dx = Math.abs(endCol - startCol)
    const dy = Math.abs(endRow - startRow)

    // Basic move validation for each piece type
    switch (piece) {
      case '♙': // White Pawn
        return (endCol === startCol && endRow === startRow - 1 && board[endRow][endCol] === '') ||
               (dx === 1 && endRow === startRow - 1 && isBlackPiece(board[endRow][endCol]))
      case '♟': // Black Pawn
        return (endCol === startCol && endRow === startRow + 1 && board[endRow][endCol] === '') ||
               (dx === 1 && endRow === startRow + 1 && isWhitePiece(board[endRow][endCol]))
      case '♖':
      case '♜': // Rook
        return (startRow === endRow || startCol === endCol) && !hasObstacles(start, end)
      case '♘':
      case '♞': // Knight
        return (dx === 1 && dy === 2) || (dx === 2 && dy === 1)
      case '♗':
      case '♝': // Bishop
        return dx === dy && !hasObstacles(start, end)
      case '♕':
      case '♛': // Queen
        return (startRow === endRow || startCol === endCol || dx === dy) && !hasObstacles(start, end)
      case '♔':
      case '♚': // King
        return dx <= 1 && dy <= 1
      default:
        return false
    }
  }

  const hasObstacles = (start: Position, end: Position): boolean => {
    const [startRow, startCol] = start
    const [endRow, endCol] = end
    const dx = Math.sign(endCol - startCol)
    const dy = Math.sign(endRow - startRow)
    let currentRow = startRow + dy
    let currentCol = startCol + dx

    while (currentRow !== endRow || currentCol !== endCol) {
      if (board[currentRow][currentCol] !== '') {
        return true
      }
      currentRow += dy
      currentCol += dx
    }

    return false
  }

  const handleSquareClick = (row: number, col: number) => {
    const piece = board[row][col]

    if (selectedPiece) {
      const [selectedRow, selectedCol] = selectedPiece
      const selectedPieceType = board[selectedRow][selectedCol]

      if (isValidMove(selectedPiece, [row, col]) &&
          ((currentPlayer === 'white' && isWhitePiece(selectedPieceType)) ||
           (currentPlayer === 'black' && isBlackPiece(selectedPieceType)))) {
        const newBoard = board.map(row => [...row])
        newBoard[row][col] = selectedPieceType
        newBoard[selectedRow][selectedCol] = ''
        setBoard(newBoard)
        setCurrentPlayer(currentPlayer === 'white' ? 'black' : 'white')
        
        // Record the move in algebraic notation
        const move = `${selectedPieceType}${String.fromCharCode(97 + selectedCol)}${8 - selectedRow} to ${String.fromCharCode(97 + col)}${8 - row}`
        setMoveHistory([...moveHistory, move])
      }
      setSelectedPiece(null)
    } else if (piece !== '') {
      setSelectedPiece([row, col])
    }
  }

  const renderSquare = (row: number, col: number) => {
    const isEven = (row + col) % 2 === 0
    const colorClass = isEven ? colorModes[colorMode].light : colorModes[colorMode].dark
    const piece = board[row][col]
    const isSelected = selectedPiece && selectedPiece[0] === row && selectedPiece[1] === col

    return (
      <div 
        key={`${row}-${col}`} 
        className={`w-12 h-12 ${colorClass} flex items-center justify-center text-3xl ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
        role="button"
        tabIndex={0}
        onClick={() => handleSquareClick(row, col)}
        onKeyPress={(e) => e.key === 'Enter' && handleSquareClick(row, col)}
        aria-label={`${piece ? piece + ' at ' : ''}${String.fromCharCode(97 + col)}${8 - row}`}
      >
        {piece}
      </div>
    )
  }

  const renderBoardWithLabels = () => {
    const boardJSX = []
    
    // Add file labels (a-h)
    boardJSX.push(
      <div key="top-left" className="w-6 h-6"></div>
    )
    for (let col = 0; col < 8; col++) {
      boardJSX.push(
        <div key={`top-${col}`} className="w-12 h-6 flex items-center justify-center text-sm font-bold">
          {String.fromCharCode(97 + col)}
        </div>
      )
    }
    boardJSX.push(
      <div key="top-right" className="w-6 h-6"></div>
    )

    for (let row = 0; row < 8; row++) {
      // Add rank label (8-1)
      boardJSX.push(
        <div key={`left-${row}`} className="w-6 h-12 flex items-center justify-center text-sm font-bold">
          {8 - row}
        </div>
      )
      
      // Add chess squares
      for (let col = 0; col < 8; col++) {
        boardJSX.push(renderSquare(row, col))
      }
      
      // Add rank label (8-1) on the right side
      boardJSX.push(
        <div key={`right-${row}`} className="w-6 h-12 flex items-center justify-center text-sm font-bold">
          {8 - row}
        </div>
      )
    }

    // Add file labels (a-h) at the bottom
    boardJSX.push(
      <div key="bottom-left" className="w-6 h-6"></div>
    )
    for (let col = 0; col < 8; col++) {
      boardJSX.push(
        <div key={`bottom-${col}`} className="w-12 h-6 flex items-center justify-center text-sm font-bold">
          {String.fromCharCode(97 + col)}
        </div>
      )
    }
    boardJSX.push(
      <div key="bottom-right" className="w-6 h-6"></div>
    )

    return boardJSX
  }

  const requestAIFeedback = () => {
    // This is a mock AI feedback function. In a real application, you would call an API or use a more sophisticated AI model.
    const feedbackOptions = [
      "White seems to have a slight advantage in piece development.",
      "Black's pawn structure looks solid, providing good control of the center.",
      "Both players should focus on developing their minor pieces and castling soon.",
      "The current position looks fairly balanced. Look for opportunities to create weaknesses in your opponent's position.",
      "Consider controlling the center with your pawns and pieces to gain more space on the board.",
    ]
    const randomFeedback = feedbackOptions[Math.floor(Math.random() * feedbackOptions.length)]
    setAIFeedback(randomFeedback)
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Chess Master</h1>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
                <span className="sr-only">Notifications</span>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="/placeholder.svg?height=32&width=32" alt="@johndoe" />
                      <AvatarFallback>JD</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">John Doe</p>
                      <p className="text-xs leading-none text-muted-foreground">john@example.com</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row items-start space-y-8 lg:space-y-0 lg:space-x-8">
          <div className="flex flex-col items-center space-y-8">
            <div className="grid grid-cols-10 border-2 border-gray-800">
              {renderBoardWithLabels()}
            </div>
            <div className="flex items-center space-x-4">
              <Select onValueChange={(value: ColorMode) => setColorMode(value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select color mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="classic">Classic</SelectItem>
                  <SelectItem value="blue">Blue</SelectItem>
                  <SelectItem value="green">Green</SelectItem>
                </SelectContent>
              </Select>
              <div className="text-lg font-semibold">
                Current Turn: {currentPlayer === 'white' ? 'White' : 'Black'}
              </div>
            </div>
          </div>
          <div className="w-full lg:w-64 space-y-4">
            <div className="bg-white p-4 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-2">Move History</h2>
              <ul className="space-y-1 max-h-40 overflow-y-auto">
                {moveHistory.map((move, index) => (
                  <li key={index} className="text-sm">{`${index + 1}. ${move}`}</li>
                ))}
              </ul>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h2  className="text-lg font-semibold mb-2">AI Feedback</h2>
              <Button onClick={requestAIFeedback} className="w-full mb-2">Request Feedback</Button>
              <p className="text-sm">{aiFeedback || "Click the button to get AI feedback on the current game state."}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}