'use client'

import React, { Suspense, useMemo, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Grid, PerspectiveCamera, useGLTF } from '@react-three/drei'
import HumanoidRobot from '../HumanoidRobot/HumanoidRobot'
import SoldierModel from '../HumanoidRobot/SoldierModel'
import RobotExpressiveModel from '../HumanoidRobot/RobotExpressiveModel'
import ExternalModel, { BoneMapping } from '../ExternalModel/ExternalModel'
import { HumanoidJointAngles, HumanoidJointKey, Position3D } from '@/lib/types/robot'

export type ModelType = 'gundam' | 'soldier' | 'robot' | 'external'

interface RobotSceneProps {
  jointAngles: HumanoidJointAngles;
  modelType?: ModelType;
  position?: Position3D;
  brightness?: number; // 0.0 ~ 2.0, 기본값 1.0
  externalModelUrl?: string;
  externalModelScale?: number;
  onBonesFound?: (bones: string[], mappings: BoneMapping[]) => void;
  customBoneMapping?: Record<HumanoidJointKey, string>;
  backgroundModelUrl?: string;
}

function BackgroundModel({ url }: { url: string }) {
  const { scene } = useGLTF(url)
  const cloned = useMemo(() => scene.clone(), [scene])

  useEffect(() => {
    cloned.traverse((child) => {
      if ((child as any).isMesh) {
        child.receiveShadow = true
        child.castShadow = true
      }
    })
  }, [cloned])

  return <primitive object={cloned} />
}

function Scene({ jointAngles, modelType = 'gundam', position = { x: 0, y: 0, z: 0 }, brightness = 1.0, externalModelUrl, externalModelScale = 1, onBonesFound, customBoneMapping, backgroundModelUrl }: RobotSceneProps) {
  return (
    <>
      {/* 카메라 설정 */}
      <PerspectiveCamera makeDefault position={[6, 5, 8]} fov={50} />

      {/* 컨트롤 */}
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={3}
        maxDistance={20}
        target={[position.x, 1.5 + position.y, position.z]}
      />

      {/* 조명 - brightness로 강도 조절 */}
      <ambientLight intensity={0.5 * brightness} />
      <directionalLight
        position={[10, 15, 5]}
        intensity={1.2 * brightness}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <directionalLight
        position={[-5, 10, -5]}
        intensity={0.4 * brightness}
        color="#b3d9ff"
      />
      <pointLight position={[0, 8, 5]} intensity={0.3 * brightness} />

      {/* 모델 선택 */}
      {modelType === 'gundam' && <HumanoidRobot jointAngles={jointAngles} position={position} />}
      {modelType === 'soldier' && <SoldierModel jointAngles={jointAngles} position={position} />}
      {modelType === 'robot' && <RobotExpressiveModel jointAngles={jointAngles} position={position} />}
      {modelType === 'external' && externalModelUrl && (
        <ExternalModel
          url={externalModelUrl}
          scale={externalModelScale}
          position={position}
          jointAngles={jointAngles}
          onBonesFound={onBonesFound}
          customBoneMapping={customBoneMapping}
        />
      )}

      {/* 배경 모델 */}
      {backgroundModelUrl && <BackgroundModel url={backgroundModelUrl} />}

      {/* 그리드 */}
      <Grid
        args={[20, 20]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#6b7280"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#4b5563"
        fadeDistance={25}
        fadeStrength={1}
        followCamera={false}
        infiniteGrid={true}
      />

      {/* 좌표축 헬퍼 */}
      <axesHelper args={[5]} />
    </>
  )
}

export default function RobotScene({ jointAngles, modelType = 'gundam', position = { x: 0, y: 0, z: 0 }, brightness = 1.0, externalModelUrl, externalModelScale = 1, onBonesFound, customBoneMapping, backgroundModelUrl }: RobotSceneProps) {
  return (
    <div className="w-full h-full">
      <Canvas shadows>
        <Suspense fallback={null}>
          <Scene
            jointAngles={jointAngles}
            modelType={modelType}
            position={position}
            brightness={brightness}
            externalModelUrl={externalModelUrl}
            externalModelScale={externalModelScale}
            onBonesFound={onBonesFound}
            customBoneMapping={customBoneMapping}
            backgroundModelUrl={backgroundModelUrl}
          />
        </Suspense>
      </Canvas>
    </div>
  )
}
