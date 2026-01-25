'use client'

interface ControlPanelProps {
  isRunning: boolean;
  onRun: () => void;
  onStop: () => void;
  onReset: () => void;
  onExamples: () => void;
  onClearWorkspace: () => void;
  executionSpeed: number;
  onSpeedChange: (speed: number) => void;
}

// 속도 레이블 생성
const getSpeedLabel = (speed: number): string => {
  if (speed < 1) {
    return `${speed.toFixed(2)}x`
  }
  return `${speed}x`
}

export default function ControlPanel({
  isRunning,
  onRun,
  onStop,
  onReset,
  onExamples,
  onClearWorkspace,
  executionSpeed,
  onSpeedChange,
}: ControlPanelProps) {
  const handleRun = () => {
    console.log('[ControlPanel] Run button clicked')
    onRun()
  }

  const handleStop = () => {
    console.log('[ControlPanel] Stop button clicked')
    onStop()
  }

  const handleReset = () => {
    console.log('[ControlPanel] Reset button clicked')
    onReset()
  }

  const handleExamples = () => {
    console.log('[ControlPanel] Examples button clicked')
    onExamples()
  }

  const handleClearWorkspace = () => {
    console.log('[ControlPanel] Clear workspace button clicked')
    onClearWorkspace()
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleClearWorkspace}
        className="bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M9 19c0 .552-.448 1-1 1s-1-.448-1-1v-10c0-.552.448-1 1-1s1 .448 1 1v10zm4 0c0 .552-.448 1-1 1s-1-.448-1-1v-10c0-.552.448-1 1-1s1 .448 1 1v10zm4 0c0 .552-.448 1-1 1s-1-.448-1-1v-10c0-.552.448-1 1-1s1 .448 1 1v10zm5-17v2h-20v-2h5.711c.9 0 1.631-1.099 1.631-2h5.315c0 .901.73 2 1.631 2h5.712zm-3 4v16h-14v-16h-2v18h18v-18h-2z"/>
        </svg>
        블록 초기화
      </button>

      <button
        onClick={handleRun}
        disabled={isRunning}
        className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-medium py-2 px-6 rounded-lg transition-colors flex items-center gap-2"
      >
        {isRunning ? (
          <>
            <span className="animate-pulse">●</span> 실행 중...
          </>
        ) : (
          <>▶ 실행</>
        )}
      </button>

      <button
        onClick={handleStop}
        disabled={!isRunning}
        className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:text-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
      >
        ■ 중지
      </button>

      <button
        onClick={handleReset}
        className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M13.5 2c-5.621 0-10.211 4.443-10.475 10h-3.025l5 6.625 5-6.625h-2.975c.257-3.351 3.06-6 6.475-6 3.584 0 6.5 2.916 6.5 6.5s-2.916 6.5-6.5 6.5c-1.863 0-3.542-.793-4.728-2.053l-2.427 3.216c1.877 1.754 4.389 2.837 7.155 2.837 5.79 0 10.5-4.71 10.5-10.5s-4.71-10.5-10.5-10.5z"/>
        </svg>
        리셋
      </button>

      <div className="w-px h-8 bg-gray-600 mx-2" />

      {/* 속도 조절 슬라이더 */}
      <div className="flex items-center gap-2 bg-gray-700 px-3 py-1.5 rounded-lg">
        <span className="text-gray-300 text-sm whitespace-nowrap">속도:</span>
        <input
          type="range"
          min="0.25"
          max="4"
          step="0.25"
          value={executionSpeed}
          onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
          className="w-20 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-cyan-500"
        />
        <span className="text-cyan-400 text-sm font-mono w-12 text-right">
          {getSpeedLabel(executionSpeed)}
        </span>
      </div>

      <div className="w-px h-8 bg-gray-600 mx-2" />

      <button
        onClick={handleExamples}
        className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 4.706c-2.938-1.83-7.416-2.566-12-2.706v17.714c3.937.12 7.795.681 10.667 1.995.846.388 1.817.388 2.667 0 2.872-1.314 6.729-1.875 10.666-1.995v-17.714c-4.584.14-9.062.876-12 2.706zm-10 13.104v-13.704c5.157.389 7.527 1.463 9 2.334v13.168c-1.525-.921-4.097-1.639-9-1.798zm20-13.704v13.704c-4.903.159-7.475.877-9 1.798v-13.168c1.473-.871 3.843-1.945 9-2.334zm-10 3.894c-2.344-1.205-5.291-1.588-8-1.716v1.716c2.694.131 5.664.519 8 1.716v-1.716zm0 3c-2.344-1.205-5.291-1.588-8-1.716v1.716c2.694.131 5.664.519 8 1.716v-1.716zm0 3c-2.344-1.205-5.291-1.588-8-1.716v1.716c2.694.131 5.664.519 8 1.716v-1.716zm2-5.284v1.716c2.336-1.197 5.306-1.585 8-1.716v-1.716c-2.709.128-5.656.511-8 1.716zm0 3v1.716c2.336-1.197 5.306-1.585 8-1.716v-1.716c-2.709.128-5.656.511-8 1.716zm0 3v1.716c2.336-1.197 5.306-1.585 8-1.716v-1.716c-2.709.128-5.656.511-8 1.716z"/>
        </svg>
        예제
      </button>
    </div>
  )
}
