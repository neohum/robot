import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    const catalogPath = path.join(process.cwd(), 'public', 'models', 'catalog.json')

    if (!fs.existsSync(catalogPath)) {
      return NextResponse.json({
        outfits: [],
        accessories: [],
        sources: [],
        instructions: {}
      })
    }

    const catalogData = fs.readFileSync(catalogPath, 'utf-8')
    const catalog = JSON.parse(catalogData)

    // 실제 파일이 있는지 확인하고 목록에 추가
    const outfitsDir = path.join(process.cwd(), 'public', 'models', 'outfits')
    const accessoriesDir = path.join(process.cwd(), 'public', 'models', 'accessories')

    // outfits 폴더의 GLB 파일 스캔
    if (fs.existsSync(outfitsDir)) {
      const outfitFiles = fs.readdirSync(outfitsDir).filter(f => f.endsWith('.glb'))
      for (const file of outfitFiles) {
        const id = file.replace('.glb', '')
        if (!catalog.outfits.find((o: { id: string }) => o.id === id)) {
          catalog.outfits.push({
            id,
            name: id.replace(/_/g, ' '),
            file: `/models/outfits/${file}`,
            preview: null,
            color: '#888888',
            description: '외부 의상 모델'
          })
        }
      }
    }

    // accessories 폴더의 GLB 파일 스캔
    if (fs.existsSync(accessoriesDir)) {
      const accessoryFiles = fs.readdirSync(accessoriesDir).filter(f => f.endsWith('.glb'))
      for (const file of accessoryFiles) {
        const id = file.replace('.glb', '')
        if (!catalog.accessories.find((a: { id: string }) => a.id === id)) {
          catalog.accessories.push({
            id,
            name: id.replace(/_/g, ' '),
            file: `/models/accessories/${file}`,
            preview: null,
            type: 'custom',
            position: [0, 0, 0],
            scale: 1
          })
        }
      }
    }

    return NextResponse.json(catalog)
  } catch (error) {
    console.error('모델 카탈로그 로드 오류:', error)
    return NextResponse.json(
      { error: '모델 카탈로그를 로드할 수 없습니다' },
      { status: 500 }
    )
  }
}
