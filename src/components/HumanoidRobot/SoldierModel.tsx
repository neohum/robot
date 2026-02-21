'use client'

import React, { useRef, useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { SkeletonUtils } from 'three-stdlib'
import { degToRad } from '@/lib/constants'
import { HumanoidJointAngles, Position3D } from '@/lib/types/robot'

interface SoldierModelProps {
  jointAngles: HumanoidJointAngles
  position?: Position3D
}

interface BoneData {
  bone: THREE.Bone
  initialRotation: THREE.Euler
}

export default function SoldierModel({ jointAngles, position = { x: 0, y: 0, z: 0 } }: SoldierModelProps) {
  const group = useRef<THREE.Group>(null)
  const { scene } = useGLTF('/models/Soldier.glb')

  // 모델 복제 및 본 초기화 (스켈레톤 공유 문제 방지 및 동기 처리)
  const { clone, bones } = useMemo(() => {
    const clonedScene = SkeletonUtils.clone(scene)
    const bonesMap: Record<string, BoneData> = {}

    clonedScene.traverse((object: any) => {
      if (object.isBone) {
        const bone = object as THREE.Bone
        bonesMap[bone.name] = {
          bone,
          initialRotation: bone.rotation.clone()
        }
      }
    })

    return { clone: clonedScene, bones: bonesMap }
  }, [scene])

  // 매 프레임마다 관절 각도 적용 (초기값 + 델타)
  useFrame(() => {
    if (!bones || Object.keys(bones).length === 0) return

    // 몸통 (Spine1)
    if (bones['mixamorigSpine1']) {
      const { bone, initialRotation } = bones['mixamorigSpine1']
      bone.rotation.y = initialRotation.y + degToRad(jointAngles.torso)
    }

    // 목/머리
    if (bones['mixamorigNeck']) {
      const { bone, initialRotation } = bones['mixamorigNeck']
      bone.rotation.y = initialRotation.y + degToRad(jointAngles.neckYaw)
    }
    if (bones['mixamorigHead']) {
      const { bone, initialRotation } = bones['mixamorigHead']
      bone.rotation.x = initialRotation.x + degToRad(jointAngles.neckPitch)
    }

    // 왼팔
    if (bones['mixamorigLeftArm']) {
      const { bone, initialRotation } = bones['mixamorigLeftArm']
      bone.rotation.x = initialRotation.x + degToRad(-jointAngles.leftShoulderPitch)
      bone.rotation.z = initialRotation.z + degToRad(jointAngles.leftShoulderYaw)
    }
    if (bones['mixamorigLeftForeArm']) {
      const { bone, initialRotation } = bones['mixamorigLeftForeArm']
      bone.rotation.y = initialRotation.y + degToRad(jointAngles.leftElbow)
    }
    if (bones['mixamorigLeftHand']) {
      const { bone, initialRotation } = bones['mixamorigLeftHand']
      bone.rotation.z = initialRotation.z + degToRad(jointAngles.leftWrist)
    }

    // 오른팔
    if (bones['mixamorigRightArm']) {
      const { bone, initialRotation } = bones['mixamorigRightArm']
      bone.rotation.x = initialRotation.x + degToRad(-jointAngles.rightShoulderPitch)
      bone.rotation.z = initialRotation.z + degToRad(-jointAngles.rightShoulderYaw)
    }
    if (bones['mixamorigRightForeArm']) {
      const { bone, initialRotation } = bones['mixamorigRightForeArm']
      bone.rotation.y = initialRotation.y + degToRad(-jointAngles.rightElbow)
    }
    if (bones['mixamorigRightHand']) {
      const { bone, initialRotation } = bones['mixamorigRightHand']
      bone.rotation.z = initialRotation.z + degToRad(-jointAngles.rightWrist)
    }

    // 왼다리
    if (bones['mixamorigLeftUpLeg']) {
      const { bone, initialRotation } = bones['mixamorigLeftUpLeg']
      bone.rotation.x = initialRotation.x + degToRad(jointAngles.leftHipPitch)
      bone.rotation.y = initialRotation.y + degToRad(jointAngles.leftHipYaw)
    }
    if (bones['mixamorigLeftLeg']) {
      const { bone, initialRotation } = bones['mixamorigLeftLeg']
      bone.rotation.x = initialRotation.x + degToRad(jointAngles.leftKnee)
    }
    if (bones['mixamorigLeftFoot']) {
      const { bone, initialRotation } = bones['mixamorigLeftFoot']
      bone.rotation.x = initialRotation.x + degToRad(jointAngles.leftAnkle)
    }

    // 오른다리
    if (bones['mixamorigRightUpLeg']) {
      const { bone, initialRotation } = bones['mixamorigRightUpLeg']
      bone.rotation.x = initialRotation.x + degToRad(jointAngles.rightHipPitch)
      bone.rotation.y = initialRotation.y + degToRad(-jointAngles.rightHipYaw)
    }
    if (bones['mixamorigRightLeg']) {
      const { bone, initialRotation } = bones['mixamorigRightLeg']
      bone.rotation.x = initialRotation.x + degToRad(jointAngles.rightKnee)
    }
    if (bones['mixamorigRightFoot']) {
      const { bone, initialRotation } = bones['mixamorigRightFoot']
      bone.rotation.x = initialRotation.x + degToRad(jointAngles.rightAnkle)
    }

    // 관절 업데이트 후 매트릭스 수동 갱신
    Object.values(bones).forEach((data: any) => {
      data.bone.updateMatrix()
      data.bone.updateMatrixWorld(true)
    })
  })

  return (
    <group ref={group} position={[position.x, position.y, position.z]} scale={[2, 2, 2]}>
      <primitive object={clone} />
    </group>
  )
}

