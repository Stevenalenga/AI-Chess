'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Bell, LogOut, Settings, User, Sun, Moon, Palette } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

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
  const [userFeedbackRequest, setUserFeedbackRequest] = useState<string>('')
  const [enPassantTarget, setEnPassantTarget] = useState<Position | null>(null)
  const [castlingRights, setCastlingRights] = useState({
    whiteKingSide: true,
    whiteQueenSide: true,
    blackKingSide: true,
    blackQueenSide: true,
  })
  const [isCheck, setIsCheck] = useState(false)
  const [isCheckmated, setIsCheckmated] = useState(false)
  const { theme, setTheme } = useTheme()

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
        if (startRow === 6 && endRow === 4 && startCol === endCol && board[5][startCol] === '' && board[4][startCol] === '') {
          return true // First move can be 2 squares
        }
        if (endCol === startCol && endRow === startRow - 1 && board[endRow][endCol] === '') {
          return true // Regular move
        }
        if (dx === 1 && endRow === startRow - 1 && isBlackPiece(board[endRow][endCol])) {
          return true // Capture
        }
        if (dx === 1 && endRow === startRow - 1 && enPassantTarget && enPassantTarget[0] === endRow && enPassantTarget[1] === endCol) {
          return true // En passant
        }
        return false
      case '♟': // Black Pawn
        if (startRow === 1 && endRow === 3 && startCol === endCol && board[2][startCol] === '' && board[3][startCol] === '') {
          return true // First move can be 2 squares
        }
        if (endCol === startCol && endRow === startRow + 1 && board[endRow][endCol] === '') {
          return true // Regular move
        }
        if (dx === 1 && endRow === startRow + 1 && isWhitePiece(board[endRow][endCol])) {
          return true // Capture
        }
        if (dx === 1 && endRow === startRow + 1 && enPassantTarget && enPassantTarget[0] === endRow && enPassantTarget[1] === endCol) {
          return true // En passant
        }
        return false
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
        if (dx <= 1 && dy <= 1) {
          return true // Regular move
        }
        // Castling
        if (dy === 0 && dx === 2) {
          if (currentPlayer === 'white' && startRow === 7) {
            if (endCol === 6 && castlingRights.whiteKingSide) {
              return board[7][5] === '' && board[7][6] === '' && !isUnderAttack(7, 4, 'black') && !isUnderAttack(7, 5, 'black') && !isUnderAttack(7, 6, 'black')
            }
            if (endCol === 2 && castlingRights.whiteQueenSide) {
              return board[7][1] === '' && board[7][2] === '' && board[7][3] === '' && !isUnderAttack(7, 4, 'black') && !isUnderAttack(7, 3, 'black') && !isUnderAttack(7, 2, 'black')
            }
          }
          if (currentPlayer === 'black' && startRow === 0) {
            if (endCol === 6 && castlingRights.blackKingSide) {
              return board[0][5] === '' && board[0][6] === '' && !isUnderAttack(0, 4, 'white') && !isUnderAttack(0, 5, 'white') && !isUnderAttack(0, 6, 'white')
            }
            if (endCol === 2 && castlingRights.blackQueenSide) {
              return board[0][1] === '' && board[0][2] === '' && board[0][3] === '' && !isUnderAttack(0, 4, 'white') && !isUnderAttack(0, 3, 'white') && !isUnderAttack(0, 2, 'white')
            }
          }
        }
        return false
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

  const isUnderAttack = (row: number, col: number, attackingColor: 'white' | 'black'): boolean => {
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const piece = board[i][j]
        if ((attackingColor === 'white' && isWhitePiece(piece)) || (attackingColor === 'black' && isBlackPiece(piece))) {
          if (isValidMove([i, j], [row, col])) {
            return true
          }
        }
      }
    }
    return false
  }

  const findKing = (color: 'white' | 'black'): Position => {
    const kingSymbol = color === 'white' ? '♔' : '♚'
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        if (board[i][j] === kingSymbol) {
          return [i, j]
        }
      }
    }
    throw new Error('King not found')
  }

  const isKingInCheck = (color: 'white' | 'black'): boolean => {
    const [kingRow, kingCol] = findKing(color)
    return isUnderAttack(kingRow, kingCol, color === 'white' ? 'black' : 'white')
  }

  const isCheckmateCondition = (color: 'white' | 'black'): boolean => {
    if (!isKingInCheck(color)) return false

    for (let startRow = 0; startRow < 8; startRow++) {
      for (let startCol = 0; startCol < 8; startCol++) {
        const piece = board[startRow][startCol]
        if ((color === 'white' && isWhitePiece(piece)) || (color === 'black' && isBlackPiece(piece))) {
          for (let endRow = 0; endRow < 8; endRow++) {
            for (let endCol = 0; endCol < 8; endCol++) {
              if (isValidMove([startRow, startCol], [endRow, endCol])) {
                const tempBoard = board.map(row => [...row])
                tempBoard[endRow][endCol] = tempBoard[startRow][startCol]
                tempBoard[startRow][startCol] = ''
                if (!isKingInCheck(color)) {
                  return false
                }
              }
            }
          }
        }
      }
    }
    return true
  }

  const handleSquareClick = (row: number, col: number) => {
    if (isCheckmated) return // Prevent moves if the game is over

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

        // Handle en passant capture
        if ((selectedPieceType === '♙' || selectedPieceType === '♟') && col === enPassantTarget?.[1] && row === enPassantTarget?.[0]) {
          newBoard[selectedRow][col] = '' // Remove the captured pawn
        }

        // Set en passant target for double pawn move
        if ((selectedPieceType === '♙' && selectedRow === 6 && row === 4) ||
            (selectedPieceType === '♟' && selectedRow === 1 && row === 3)) {
          setEnPassantTarget([selectedRow === 6 ? 5 : 2, col])
        } else {
          setEnPassantTarget(null)
        }

        // Handle castling
        if (selectedPieceType === '♔' || selectedPieceType === '♚') {
          if (Math.abs(col - selectedCol) === 2) {
            if (col === 6) { // King-side castling
              newBoard[row][5] = newBoard[row][7]
              newBoard[row][7] = ''
            } else if (col === 2) { // Queen-side castling
              newBoard[row][3] = newBoard[row][0]
              newBoard[row][0] = ''
            }
          }
          // Update castling rights
          if (currentPlayer === 'white') {
            setCastlingRights(prev => ({ ...prev, whiteKingSide: false, whiteQueenSide: false }))
          } else {
            setCastlingRights(prev => ({ ...prev, blackKingSide: false, blackQueenSide: false }))
          }
        }

        // Update castling rights for rook moves
        if (selectedPieceType === '♖') {
          if (selectedRow === 7 && selectedCol === 0) setCastlingRights(prev => ({ ...prev, whiteQueenSide: false }))
          if (selectedRow === 7 && selectedCol === 7) setCastlingRights(prev => ({ ...prev, whiteKingSide: false }))
        }
        if (selectedPieceType === '♜') {
          if (selectedRow === 0 && selectedCol === 0) setCastlingRights(prev => ({ ...prev, blackQueenSide: false }))
          if (selectedRow === 0 && selectedCol === 7) setCastlingRights(prev => ({ ...prev, blackKingSide: false }))
        }

        setBoard(newBoard)

        // Check if the move puts the opponent in check or checkmate
        const nextPlayer = currentPlayer ===     'white' ? 'black' : 'white'
        const isInCheck = isKingInCheck(nextPlayer)
        setIsCheck(isInCheck)
        
        if (isInCheck) {
          const isCheckmated = isCheckmateCondition(nextPlayer)
          setIsCheckmated(isCheckmated)
          if (isCheckmated) {
            setAIFeedback(`Checkmate! ${currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1)} wins!`)
          } else {
            setAIFeedback(`${nextPlayer.charAt(0).toUpperCase() + nextPlayer.slice(1)} is in check!`)
          }
        } else {
          setAIFeedback('')
        }

        setCurrentPlayer(nextPlayer)
        
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
        <span className={theme === 'dark' ? 'text-white' : 'text-black'}>{piece}</span>
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

  const toggleTheme = () => {
    if (theme === 'dark') {
      setTheme('light-blue')
    } else if (theme === 'light-blue') {
      setTheme('light')
    } else {
      setTheme('dark')
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="bg-background shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Chess Master</h1>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="icon" onClick={toggleTheme}>
                {theme === 'dark' ? (
                  <Moon className="h-5 w-5" />
                ) : theme === 'light-blue' ? (
                  <Palette className="h-5 w-5" />
                ) : (
                  <Sun className="h-5 w-5" />
                )}
                <span className="sr-only">Toggle theme</span>
              </Button>
              <Button variant="outline" size="icon">
                <Bell className="h-5 w-5" />
                <span className="sr-only">Notifications</span>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="relative h-8 w-8 rounded-full">
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
            <div className="grid grid-cols-10 border-2 border-foreground">
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
            {isCheck && !isCheckmated && (
              <Alert>
                <AlertTitle>Check!</AlertTitle>
                <AlertDescription>
                  {currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1)} is in check.
                </AlertDescription>
              </Alert>
            )}
            {isCheckmated && (
              <Alert>
                <AlertTitle>Checkmate!</AlertTitle>
                <AlertDescription>
                  {currentPlayer === 'white' ? 'Black' : 'White'} wins the game.
                </AlertDescription>
              </Alert>
            )}
          </div>
          <div className="w-full lg:w-80 space-y-4">
            <div className="bg-card text-card-foreground p-4 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-2">Move History</h2>
              <ul className="space-y-1 max-h-40 overflow-y-auto">
                {moveHistory.map((move, index) => (
                  <li key={index} className="text-sm">{`${index + 1}. ${move}`}</li>
                ))}
              </ul>
            </div>
            <div className="bg-card text-card-foreground p-4 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-2">Request AI Feedback</h2>
              <Textarea
                placeholder="Ask for specific feedback or leave blank for general advice"
                value={userFeedbackRequest}
                onChange={(e) => setUserFeedbackRequest(e.target.value)}
                className="w-full mb-2"
                rows={3}
              />
              <Button
  onClick={requestAIFeedback}
  className="w-full mb-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
>
  Request Feedback
</Button>
              <h3 className="text-md font-semibold mb-2">AI Feedback</h3>
              <p className="text-sm bg-muted p-3 rounded-md min-h-[100px]">
                {aiFeedback || "AI feedback will appear here after you request it."}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}