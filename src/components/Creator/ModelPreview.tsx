'use client'

import React from 'react'

interface ModelPreviewProps {
  url: string
  size?: number
  isSelected?: boolean
}

// 간단한 3D 박스 아이콘으로 미리보기 대체 (WebGL Context Lost 방지)
export default function ModelPreview({ url, size = 80, isSelected = false }: ModelPreviewProps) {
  return (
    <div
      style={{ width: size, height: size }}
      className={`rounded-lg overflow-hidden flex items-center justify-center ${
        isSelected ? 'bg-gray-600' : 'bg-gray-700'
      }`}
    >
      <svg
        width={size * 0.5}
        height={size * 0.5}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={isSelected ? 'text-white' : 'text-gray-400'}
      >
        {/* 3D 박스 아이콘 */}
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    </div>
  )
}
