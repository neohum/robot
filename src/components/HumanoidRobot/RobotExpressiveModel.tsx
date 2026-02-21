'use client'

import React, { useRef, useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { SkeletonUtils } from 'three-stdlib'
import { degToRad } from '@/lib/constants'
import { HumanoidJointAngles, Position3D } from '@/lib/types/robot'

interface RobotExpressiveModelProps {
  jointAngles: HumanoidJointAngles
  position?: Position3D
}

interface BoneData {
  bone: THREE.Bone
  initialRotation: THREE.Euler
}

export default function RobotExpressiveModel({ jointAngles, position = { x: 0, y: 0, z: 0 } }: RobotExpressiveModelProps) {
  const group = useRef<THREE.Group>(null)
  const { scene } = useGLTF('/models/RobotExpressive.glb')

  // 모델 복제 및 본 초기화
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

  // 본 이름 찾기 헬퍼 (부분 일치)
  const findBone = (partialName: string): BoneData | undefined => {
    const key = Object.keys(bones).find(k =>
      k.toLowerCase().includes(partialName.toLowerCase())
    )
    return key ? bones[key] : undefined
  }

  // 매 프레임마다 관절 각도 적용
  useFrame(() => {
    if (!bones || Object.keys(bones).length === 0) return

    // 몸통
    const spine = findBone('spine')
    if (spine) {
      spine.bone.rotation.y = spine.initialRotation.y + degToRad(jointAngles.torso)
    }

    // 머리
    const neck = findBone('neck')
    if (neck) {
      neck.bone.rotation.y = neck.initialRotation.y + degToRad(jointAngles.neckYaw)
    }
    const head = findBone('head')
    if (head) {
      head.bone.rotation.x = head.initialRotation.x + degToRad(jointAngles.neckPitch)
    }

    // 왼팔 - ArmL, LeftArm 등 다양한 이름 지원
    const leftArm = findBone('arml') || findBone('leftarm') || findBone('arm_l')
    if (leftArm) {
      leftArm.bone.rotation.x = leftArm.initialRotation.x + degToRad(-jointAngles.leftShoulderPitch)
      leftArm.bone.rotation.z = leftArm.initialRotation.z + degToRad(jointAngles.leftShoulderYaw)
    }
    const leftForeArm = findBone('forearml') || findBone('leftforearm') || findBone('forearm_l')
    if (leftForeArm) {
      leftForeArm.bone.rotation.y = leftForeArm.initialRotation.y + degToRad(jointAngles.leftElbow)
    }
    const leftHand = findBone('handl') || findBone('lefthand') || findBone('hand_l')
    if (leftHand) {
      leftHand.bone.rotation.z = leftHand.initialRotation.z + degToRad(jointAngles.leftWrist)
    }

    // 오른팔
    const rightArm = findBone('armr') || findBone('rightarm') || findBone('arm_r')
    if (rightArm) {
      rightArm.bone.rotation.x = rightArm.initialRotation.x + degToRad(-jointAngles.rightShoulderPitch)
      rightArm.bone.rotation.z = rightArm.initialRotation.z + degToRad(-jointAngles.rightShoulderYaw)
    }
    const rightForeArm = findBone('forearmr') || findBone('rightforearm') || findBone('forearm_r')
    if (rightForeArm) {
      rightForeArm.bone.rotation.y = rightForeArm.initialRotation.y + degToRad(-jointAngles.rightElbow)
    }
    const rightHand = findBone('handr') || findBone('righthand') || findBone('hand_r')
    if (rightHand) {
      rightHand.bone.rotation.z = rightHand.initialRotation.z + degToRad(-jointAngles.rightWrist)
    }

    // 왼다리
    const leftUpLeg = findBone('uplegl') || findBone('leftupleg') || findBone('thighl') || findBone('thigh_l')
    if (leftUpLeg) {
      leftUpLeg.bone.rotation.x = leftUpLeg.initialRotation.x + degToRad(jointAngles.leftHipPitch)
      leftUpLeg.bone.rotation.y = leftUpLeg.initialRotation.y + degToRad(jointAngles.leftHipYaw)
    }
    const leftLeg = findBone('legl') || findBone('leftleg') || findBone('shinl') || findBone('shin_l')
    if (leftLeg) {
      leftLeg.bone.rotation.x = leftLeg.initialRotation.x + degToRad(jointAngles.leftKnee)
    }
    const leftFoot = findBone('footl') || findBone('leftfoot') || findBone('foot_l')
    if (leftFoot) {
      leftFoot.bone.rotation.x = leftFoot.initialRotation.x + degToRad(jointAngles.leftAnkle)
    }

    // 오른다리
    const rightUpLeg = findBone('uplegr') || findBone('rightupleg') || findBone('thighr') || findBone('thigh_r')
    if (rightUpLeg) {
      rightUpLeg.bone.rotation.x = rightUpLeg.initialRotation.x + degToRad(jointAngles.rightHipPitch)
      rightUpLeg.bone.rotation.y = rightUpLeg.initialRotation.y + degToRad(-jointAngles.rightHipYaw)
    }
    const rightLeg = findBone('legr') || findBone('rightleg') || findBone('shinr') || findBone('shin_r')
    if (rightLeg) {
      rightLeg.bone.rotation.x = rightLeg.initialRotation.x + degToRad(jointAngles.rightKnee)
    }
    const rightFoot = findBone('footr') || findBone('rightfoot') || findBone('foot_r')
    if (rightFoot) {
      rightFoot.bone.rotation.x = rightFoot.initialRotation.x + degToRad(jointAngles.rightAnkle)
    }

    // 관절 업데이트 후 매트릭스 수동 갱신
    Object.values(bones).forEach((data: any) => {
      data.bone.updateMatrix()
      data.bone.updateMatrixWorld(true)
    })
  })


  return (
    <group ref={group} position={[position.x, position.y, position.z]} scale={[1.5, 1.5, 1.5]}>
      <primitive object={clone} />
    </group>
  )
}

