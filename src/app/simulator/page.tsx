'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import Blockly from 'blockly'
import { toast } from 'sonner'
import { HumanoidJointAngles, HumanoidJointKey, DEFAULT_HUMANOID_POSE, PRESET_POSES, PresetPoseName, Position3D } from '@/lib/types/robot'
import type { ModelType } from '@/components/Scene/RobotScene'
import { AnimationController } from '@/lib/animationController'
import { generateCode } from '@/lib/blockly/codeGenerator'
import { generatePythonCode } from '@/lib/blockly/pythonGenerator'
import { saveProject, loadProject, getAllProjects, deleteProject, saveCurrentWorkspace, loadCurrentWorkspace, SavedProject, saveExternalModel, getAllExternalModels, deleteExternalModel, loadCurrentExternalModel, saveCurrentExternalModel, testExternalModelSync, SavedExternalModel, saveBoneMapping, loadBoneMapping, SavedBoneMapping } from '@/lib/storage'
import type { BoneMapping } from '@/components/ExternalModel/ExternalModel'
import { EXAMPLE_PROGRAMS } from '@/lib/examples'
import ControlPanel from '@/components/Controls/ControlPanel'
import HumanoidJointControlPanel from '@/components/Controls/HumanoidJointControlPanel'
import SaveDialog, { LoadDialog, ExamplesDialog } from '@/components/Dialogs/Dialogs'

const RobotScene = dynamic(
  () => import('@/components/Scene/RobotScene'),
  { ssr: false }
)

const BlocklyWorkspace = dynamic(
  () => import('@/components/BlocklyWorkspace/BlocklyWorkspace'),
  { ssr: false }
)

const PythonEditor = dynamic(
  () => import('@/components/PythonEditor/PythonEditor'),
  { ssr: false }
)

type EditorMode = 'block' | 'python'

const DEFAULT_POSITION: Position3D = { x: 0, y: 0, z: 0 }

export default function Home() {
  const [jointAngles, setJointAngles] = useState<HumanoidJointAngles>({
    ...DEFAULT_HUMANOID_POSE
  })
  const [robotPosition, setRobotPosition] = useState<Position3D>({ ...DEFAULT_POSITION })

  const [isRunning, setIsRunning] = useState(false)
  const [generatedCode, setGeneratedCode] = useState('')
  const [workspaceXml, setWorkspaceXml] = useState('')

  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [showLoadDialog, setShowLoadDialog] = useState(false)
  const [showExamplesDialog, setShowExamplesDialog] = useState(false)
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([])
  const [isWorkspaceMinimized, setIsWorkspaceMinimized] = useState(false)
  const [modelType, setModelType] = useState<ModelType>('gundam')
  const [executionSpeed, setExecutionSpeed] = useState(1) // 0.25 ~ 4x 속도
  const [editorMode, setEditorMode] = useState<EditorMode>('block')
  const [pythonCode, setPythonCode] = useState('')
  const [externalModelUrl, setExternalModelUrl] = useState<string>('')
  const [externalModelName, setExternalModelName] = useState<string>('')
  const [showExternalModelDialog, setShowExternalModelDialog] = useState(false)
  const [savedExternalModels, setSavedExternalModels] = useState<SavedExternalModel[]>([])
  const [syncTestResult, setSyncTestResult] = useState<string>('')
  const [showBoneMappingPanel, setShowBoneMappingPanel] = useState(false)
  const [availableBones, setAvailableBones] = useState<string[]>([])
  const [currentBoneMappings, setCurrentBoneMappings] = useState<BoneMapping[]>([])
  const [customBoneMapping, setCustomBoneMapping] = useState<Record<HumanoidJointKey, string>>({} as Record<HumanoidJointKey, string>)
  const [mappingTestResult, setMappingTestResult] = useState<string>('')
  const [isMappingTesting, setIsMappingTesting] = useState(false)
  const [showPythonHelp, setShowPythonHelp] = useState(false)

  const animationController = useRef(new AnimationController())
  const executionSpeedRef = useRef(executionSpeed)
  const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null)
  const jointAnglesRef = useRef(jointAngles)
  const robotPositionRef = useRef(robotPosition)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const stopRequestedRef = useRef(false)

  // jointAnglesRef를 항상 최신 상태로 유지
  useEffect(() => {
    jointAnglesRef.current = jointAngles
  }, [jointAngles])

  // robotPositionRef를 항상 최신 상태로 유지
  useEffect(() => {
    robotPositionRef.current = robotPosition
  }, [robotPosition])

  // executionSpeedRef를 항상 최신 상태로 유지
  useEffect(() => {
    executionSpeedRef.current = executionSpeed
  }, [executionSpeed])

  // 속도에 따른 duration 계산
  const getAdjustedDuration = (baseDuration: number) => {
    return baseDuration / executionSpeedRef.current
  }

  useEffect(() => {
    const saved = loadCurrentWorkspace()
    if (saved) {
      setWorkspaceXml(saved)
    }

    // 저장된 외부 모델 목록 불러오기
    setSavedExternalModels(getAllExternalModels())

    // 마지막으로 사용한 외부 모델 불러오기 (blob URL은 만료되므로 건너뛰기)
    const currentExternal = loadCurrentExternalModel()
    if (currentExternal && !currentExternal.url.startsWith('blob:')) {
      setExternalModelUrl(currentExternal.url)
      setExternalModelName(currentExternal.name || '')
    } else if (currentExternal?.url.startsWith('blob:')) {
      console.log('[Simulator] Blob URL 만료됨, 모델 초기화')
      // 만료된 blob URL은 저장소에서도 제거
      localStorage.removeItem('robot-external-model-current')
    }
  }, [])

  // 단일 관절 회전
  const rotateJoint = async (joint: HumanoidJointKey, angle: number) => {
    const currentAngles = jointAnglesRef.current
    const targetAngles = { ...currentAngles, [joint]: angle }
    await animationController.current.animateHumanoidJoints(
      currentAngles,
      targetAngles,
      getAdjustedDuration(1000),
      setJointAngles
    )
  }

  // 그리퍼 설정
  const setGripper = async (hand: 'left' | 'right', value: number) => {
    const currentAngles = jointAnglesRef.current
    const jointKey = hand === 'left' ? 'leftGrip' : 'rightGrip'
    const targetAngles = { ...currentAngles, [jointKey]: value }
    await animationController.current.animateHumanoidJoints(
      currentAngles,
      targetAngles,
      getAdjustedDuration(500),
      setJointAngles
    )
  }

  // 머리 자세 설정
  const setHeadPose = async (yaw: number, pitch: number) => {
    const currentAngles = jointAnglesRef.current
    const targetAngles = {
      ...currentAngles,
      neckYaw: yaw,
      neckPitch: pitch,
    }
    await animationController.current.animateHumanoidJoints(
      currentAngles,
      targetAngles,
      getAdjustedDuration(1000),
      setJointAngles
    )
  }

  // 팔 자세 설정
  const setArmPose = async (
    arm: 'left' | 'right',
    shoulderPitch: number,
    shoulderYaw: number,
    elbow: number,
    wrist: number
  ) => {
    const currentAngles = jointAnglesRef.current
    const prefix = arm === 'left' ? 'left' : 'right'
    const targetAngles = {
      ...currentAngles,
      [`${prefix}ShoulderPitch`]: shoulderPitch,
      [`${prefix}ShoulderYaw`]: shoulderYaw,
      [`${prefix}Elbow`]: elbow,
      [`${prefix}Wrist`]: wrist,
    } as HumanoidJointAngles
    await animationController.current.animateHumanoidJoints(
      currentAngles,
      targetAngles,
      getAdjustedDuration(1000),
      setJointAngles
    )
  }

  // 다리 자세 설정
  const setLegPose = async (
    leg: 'left' | 'right',
    hipPitch: number,
    hipYaw: number,
    knee: number,
    ankle: number
  ) => {
    const currentAngles = jointAnglesRef.current
    const prefix = leg === 'left' ? 'left' : 'right'
    const targetAngles = {
      ...currentAngles,
      [`${prefix}HipPitch`]: hipPitch,
      [`${prefix}HipYaw`]: hipYaw,
      [`${prefix}Knee`]: knee,
      [`${prefix}Ankle`]: ankle,
    } as HumanoidJointAngles
    await animationController.current.animateHumanoidJoints(
      currentAngles,
      targetAngles,
      getAdjustedDuration(1000),
      setJointAngles
    )
  }

  // 프리셋 자세 설정
  const setPresetPose = async (poseName: PresetPoseName) => {
    const currentAngles = jointAnglesRef.current
    const targetAngles = PRESET_POSES[poseName]
    await animationController.current.animateHumanoidJoints(
      currentAngles,
      targetAngles,
      getAdjustedDuration(1000),
      setJointAngles
    )
  }

  // 대기 (중지 가능)
  const wait = async (duration: number) => {
    const adjustedDuration = duration * 1000 / executionSpeedRef.current
    const endTime = Date.now() + adjustedDuration
    return new Promise<void>((resolve, reject) => {
      const check = () => {
        if (stopRequestedRef.current) {
          reject(new Error('STOP_REQUESTED'))
          return
        }
        if (Date.now() >= endTime) {
          resolve()
          return
        }
        requestAnimationFrame(check)
      }
      check()
    })
  }

  // 초기화
  const resetRobot = async () => {
    const currentAngles = jointAnglesRef.current
    await animationController.current.animateHumanoidJoints(
      currentAngles,
      DEFAULT_HUMANOID_POSE,
      getAdjustedDuration(1000),
      setJointAngles
    )
  }

  // 걷기 한 스텝 (왼발 또는 오른발)
  const walkStep = async (isLeftStep: boolean, stepDuration: number) => {
    const currentAngles = jointAnglesRef.current

    if (isLeftStep) {
      // 왼발 앞으로
      const stepPose: HumanoidJointAngles = {
        ...currentAngles,
        leftHipPitch: 25,
        leftKnee: 35,
        leftAnkle: -10,
        rightHipPitch: -15,
        rightKnee: 5,
        rightAnkle: 5,
        leftShoulderPitch: -20,
        rightShoulderPitch: 20,
        leftShoulderYaw: 10,
        rightShoulderYaw: -10,
      }
      await animationController.current.animateHumanoidJoints(
        currentAngles,
        stepPose,
        stepDuration,
        setJointAngles
      )
    } else {
      // 오른발 앞으로
      const stepPose: HumanoidJointAngles = {
        ...currentAngles,
        rightHipPitch: 25,
        rightKnee: 35,
        rightAnkle: -10,
        leftHipPitch: -15,
        leftKnee: 5,
        leftAnkle: 5,
        rightShoulderPitch: -20,
        leftShoulderPitch: 20,
        leftShoulderYaw: 10,
        rightShoulderYaw: -10,
      }
      await animationController.current.animateHumanoidJoints(
        currentAngles,
        stepPose,
        stepDuration,
        setJointAngles
      )
    }
  }

  // 걷기 이동 (공통 함수)
  const walkMove = async (deltaX: number, deltaZ: number, distance: number) => {
    const stepDistance = 0.5 // 한 걸음당 이동 거리
    const steps = Math.ceil(distance / stepDistance)
    const actualStepDistance = distance / steps
    const stepDuration = getAdjustedDuration(300) // 한 스텝 시간

    const dirX = deltaX !== 0 ? deltaX / Math.abs(deltaX) : 0
    const dirZ = deltaZ !== 0 ? deltaZ / Math.abs(deltaZ) : 0

    for (let i = 0; i < steps; i++) {
      if (stopRequestedRef.current) {
        throw new Error('STOP_REQUESTED')
      }

      const isLeftStep = i % 2 === 0

      // 걷기 동작과 이동을 동시에 실행
      const currentPos = robotPositionRef.current
      const stepTargetPos = {
        x: currentPos.x + dirX * actualStepDistance * (Math.abs(deltaX) / distance || 0),
        y: currentPos.y,
        z: currentPos.z + dirZ * actualStepDistance * (Math.abs(deltaZ) / distance || 0),
      }

      await Promise.all([
        walkStep(isLeftStep, stepDuration),
        animationController.current.animatePosition(
          currentPos,
          stepTargetPos,
          stepDuration,
          setRobotPosition
        )
      ])
    }

    // 걷기 종료 후 기본 자세로
    const currentAngles = jointAnglesRef.current
    const standPose: HumanoidJointAngles = {
      ...currentAngles,
      leftHipPitch: 0,
      leftKnee: 0,
      leftAnkle: 0,
      rightHipPitch: 0,
      rightKnee: 0,
      rightAnkle: 0,
      leftShoulderPitch: 0,
      rightShoulderPitch: 0,
      leftShoulderYaw: 10,
      rightShoulderYaw: -10,
    }
    await animationController.current.animateHumanoidJoints(
      currentAngles,
      standPose,
      getAdjustedDuration(200),
      setJointAngles
    )
  }

  // 앞으로 이동 (걷기)
  const moveForward = async (distance: number) => {
    await walkMove(0, -distance, distance)
  }

  // 뒤로 이동 (걷기)
  const moveBackward = async (distance: number) => {
    await walkMove(0, distance, distance)
  }

  // 왼쪽으로 이동 (걷기)
  const moveLeft = async (distance: number) => {
    await walkMove(-distance, 0, distance)
  }

  // 오른쪽으로 이동 (걷기)
  const moveRight = async (distance: number) => {
    await walkMove(distance, 0, distance)
  }

  // 점프
  const jump = async (height: number) => {
    const currentPos = robotPositionRef.current
    await animationController.current.animateJump(
      currentPos,
      height,
      getAdjustedDuration(800),
      setRobotPosition
    )
  }

  // 위치 초기화
  const resetPosition = async () => {
    const currentPos = robotPositionRef.current
    await animationController.current.animatePosition(
      currentPos,
      DEFAULT_POSITION,
      getAdjustedDuration(1000),
      setRobotPosition
    )
  }

  // 관절 직접 변경 (컨트롤 패널용)
  const handleJointChange = (joint: HumanoidJointKey, value: number) => {
    setJointAngles(prev => ({ ...prev, [joint]: value }))
  }

  // 프리셋 자세 직접 적용 (컨트롤 패널용)
  const handlePresetPose = (poseName: PresetPoseName) => {
    setPresetPose(poseName)
  }

  // 중지 체크 함수
  const checkStop = () => {
    if (stopRequestedRef.current) {
      throw new Error('STOP_REQUESTED')
    }
  }

  // 중지 기능이 있는 래퍼 함수들
  const wrappedRotateJoint = async (joint: HumanoidJointKey, angle: number) => {
    checkStop()
    await rotateJoint(joint, angle)
  }

  const wrappedSetGripper = async (hand: 'left' | 'right', value: number) => {
    checkStop()
    await setGripper(hand, value)
  }

  const wrappedSetHeadPose = async (yaw: number, pitch: number) => {
    checkStop()
    await setHeadPose(yaw, pitch)
  }

  const wrappedSetArmPose = async (arm: 'left' | 'right', sp: number, sy: number, e: number, w: number) => {
    checkStop()
    await setArmPose(arm, sp, sy, e, w)
  }

  const wrappedSetLegPose = async (leg: 'left' | 'right', hp: number, hy: number, k: number, a: number) => {
    checkStop()
    await setLegPose(leg, hp, hy, k, a)
  }

  const wrappedSetPresetPose = async (poseName: PresetPoseName) => {
    checkStop()
    await setPresetPose(poseName)
  }

  const wrappedWait = async (duration: number) => {
    checkStop()
    await wait(duration)
  }

  const wrappedResetRobot = async () => {
    checkStop()
    await resetRobot()
  }

  const wrappedMoveForward = async (distance: number) => {
    checkStop()
    await moveForward(distance)
  }

  const wrappedMoveBackward = async (distance: number) => {
    checkStop()
    await moveBackward(distance)
  }

  const wrappedMoveLeft = async (distance: number) => {
    checkStop()
    await moveLeft(distance)
  }

  const wrappedMoveRight = async (distance: number) => {
    checkStop()
    await moveRight(distance)
  }

  const wrappedJump = async (height: number) => {
    checkStop()
    await jump(height)
  }

  const wrappedResetPosition = async () => {
    checkStop()
    await resetPosition()
  }

  const executeBlockCode = async () => {
    if (!workspaceRef.current) return

    stopRequestedRef.current = false
    animationController.current.reset()
    setIsRunning(true)
    const code = generateCode(workspaceRef.current)
    setGeneratedCode(code)

    try {
      const asyncFunction = new Function(
        'rotateJoint',
        'setGripper',
        'setHeadPose',
        'setArmPose',
        'setLegPose',
        'setPresetPose',
        'wait',
        'resetRobot',
        'moveForward',
        'moveBackward',
        'moveLeft',
        'moveRight',
        'jump',
        'resetPosition',
        `return (async () => { ${code} })()`
      )

      await asyncFunction(
        wrappedRotateJoint,
        wrappedSetGripper,
        wrappedSetHeadPose,
        wrappedSetArmPose,
        wrappedSetLegPose,
        wrappedSetPresetPose,
        wrappedWait,
        wrappedResetRobot,
        wrappedMoveForward,
        wrappedMoveBackward,
        wrappedMoveLeft,
        wrappedMoveRight,
        wrappedJump,
        wrappedResetPosition
      )
    } catch (error) {
      if ((error as Error).message !== 'STOP_REQUESTED') {
        console.error('코드 실행 오류:', error)
        toast.error('코드 실행 중 오류가 발생했습니다.')
      }
    }

    setIsRunning(false)
  }

  // Python 코드 실행 (Python 문법을 JavaScript로 변환하여 실행)
  // Python 코드를 JavaScript로 변환하는 함수
  const convertPythonToJS = (pythonCode: string): string => {
    let lines = pythonCode.split('\n')
    let jsLines: string[] = []
    let indentStack: number[] = [0] // 들여쓰기 스택

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i]

      // 빈 줄 처리
      if (line.trim() === '') {
        jsLines.push('')
        continue
      }

      // 현재 줄의 들여쓰기 레벨 계산
      const currentIndent = line.search(/\S/)
      if (currentIndent === -1) continue

      // 들여쓰기가 줄어들면 중괄호 닫기
      while (indentStack.length > 1 && currentIndent <= indentStack[indentStack.length - 1]) {
        indentStack.pop()
        jsLines.push(' '.repeat(indentStack[indentStack.length - 1]) + '}')
      }

      // 주석 변환 (# → //)
      line = line.replace(/#(.*)$/, '//$1')

      // True/False → true/false
      line = line.replace(/\bTrue\b/g, 'true')
      line = line.replace(/\bFalse\b/g, 'false')
      line = line.replace(/\bNone\b/g, 'null')

      // for i in range(n): → for (let i = 0; i < n; i++) {
      const forRangeMatch = line.match(/^(\s*)for\s+(\w+)\s+in\s+range\(([^,)]+)(?:,\s*([^)]+))?\)\s*:?\s*$/)
      if (forRangeMatch) {
        const [, indent, varName, startOrEnd, maybeEnd] = forRangeMatch
        if (maybeEnd) {
          // range(start, end)
          jsLines.push(`${indent}for (let ${varName} = ${startOrEnd}; ${varName} < ${maybeEnd}; ${varName}++) {`)
        } else {
          // range(end)
          jsLines.push(`${indent}for (let ${varName} = 0; ${varName} < ${startOrEnd}; ${varName}++) {`)
        }
        indentStack.push(currentIndent + 2)
        continue
      }

      // while condition: → while (condition) {
      const whileMatch = line.match(/^(\s*)while\s+(.+?)\s*:\s*$/)
      if (whileMatch) {
        const [, indent, condition] = whileMatch
        const jsCondition = condition.replace(/\band\b/g, '&&').replace(/\bor\b/g, '||').replace(/\bnot\b/g, '!')
        jsLines.push(`${indent}while (${jsCondition}) {`)
        indentStack.push(currentIndent + 2)
        continue
      }

      // if condition: → if (condition) {
      const ifMatch = line.match(/^(\s*)if\s+(.+?)\s*:\s*$/)
      if (ifMatch) {
        const [, indent, condition] = ifMatch
        const jsCondition = condition.replace(/\band\b/g, '&&').replace(/\bor\b/g, '||').replace(/\bnot\b/g, '!')
        jsLines.push(`${indent}if (${jsCondition}) {`)
        indentStack.push(currentIndent + 2)
        continue
      }

      // elif condition: → } else if (condition) {
      const elifMatch = line.match(/^(\s*)elif\s+(.+?)\s*:\s*$/)
      if (elifMatch) {
        const [, indent, condition] = elifMatch
        const jsCondition = condition.replace(/\band\b/g, '&&').replace(/\bor\b/g, '||').replace(/\bnot\b/g, '!')
        // 이전 블록 닫기
        if (indentStack.length > 1) {
          indentStack.pop()
          jsLines.push(`${indent}} else if (${jsCondition}) {`)
          indentStack.push(currentIndent + 2)
        }
        continue
      }

      // else: → } else {
      const elseMatch = line.match(/^(\s*)else\s*:\s*$/)
      if (elseMatch) {
        const [, indent] = elseMatch
        if (indentStack.length > 1) {
          indentStack.pop()
          jsLines.push(`${indent}} else {`)
          indentStack.push(currentIndent + 2)
        }
        continue
      }

      // 함수 이름 변환
      line = line.replace(/rotate_joint/g, 'rotateJoint')
      line = line.replace(/set_gripper/g, 'setGripper')
      line = line.replace(/set_head_pose/g, 'setHeadPose')
      line = line.replace(/set_arm_pose/g, 'setArmPose')
      line = line.replace(/set_leg_pose/g, 'setLegPose')
      line = line.replace(/set_preset_pose/g, 'setPresetPose')
      line = line.replace(/reset_robot/g, 'resetRobot')
      line = line.replace(/move_forward/g, 'moveForward')
      line = line.replace(/move_backward/g, 'moveBackward')
      line = line.replace(/move_left/g, 'moveLeft')
      line = line.replace(/move_right/g, 'moveRight')
      line = line.replace(/reset_position/g, 'resetPosition')

      // 변수 선언 변환: count = 5 → let count = 5 (함수 호출이 아닌 경우)
      const assignMatch = line.match(/^(\s*)(\w+)\s*=\s*(.+)$/)
      if (assignMatch && !line.includes('await') && !line.includes('(')) {
        const [, indent, varName, value] = assignMatch
        jsLines.push(`${indent}let ${varName} = ${value}`)
        continue
      }

      jsLines.push(line)
    }

    // 남은 블록 모두 닫기
    while (indentStack.length > 1) {
      indentStack.pop()
      jsLines.push('}')
    }

    return jsLines.join('\n')
  }

  const executePythonCode = async (code: string): Promise<void> => {
    stopRequestedRef.current = false
    animationController.current.reset()
    setIsRunning(true)

    try {
      // Python 코드를 JavaScript로 변환
      const jsCode = convertPythonToJS(code)
      console.log('변환된 JS 코드:', jsCode)

      const asyncFunction = new Function(
        'rotateJoint',
        'setGripper',
        'setHeadPose',
        'setArmPose',
        'setLegPose',
        'setPresetPose',
        'wait',
        'resetRobot',
        'moveForward',
        'moveBackward',
        'moveLeft',
        'moveRight',
        'jump',
        'resetPosition',
        `return (async () => { ${jsCode} })()`
      )

      await asyncFunction(
        wrappedRotateJoint,
        wrappedSetGripper,
        wrappedSetHeadPose,
        wrappedSetArmPose,
        wrappedSetLegPose,
        wrappedSetPresetPose,
        wrappedWait,
        wrappedResetRobot,
        wrappedMoveForward,
        wrappedMoveBackward,
        wrappedMoveLeft,
        wrappedMoveRight,
        wrappedJump,
        wrappedResetPosition
      )
    } catch (error) {
      if ((error as Error).message !== 'STOP_REQUESTED') {
        console.error('Python 코드 실행 오류:', error)
        throw error
      }
    }

    setIsRunning(false)
  }

  const stopExecution = () => {
    stopRequestedRef.current = true
    animationController.current.stop()
    setIsRunning(false)
  }

  const handleWorkspaceChange = useCallback((workspace: Blockly.WorkspaceSvg) => {
    workspaceRef.current = workspace

    // 디바운싱: 블록 이동 중 너무 잦은 업데이트 방지
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      const code = generateCode(workspace)
      setGeneratedCode(code)

      const pyCode = generatePythonCode(workspace)
      setPythonCode(pyCode)

      const xml = Blockly.Xml.workspaceToDom(workspace)
      const xmlText = Blockly.Xml.domToText(xml)
      saveCurrentWorkspace(xmlText)
    }, 150)
  }, [])

  const handleSaveProject = (name: string) => {
    if (workspaceRef.current) {
      const xml = Blockly.Xml.workspaceToDom(workspaceRef.current)
      const xmlText = Blockly.Xml.domToText(xml)
      saveProject(name, xmlText, jointAngles as any)
      toast.success(`"${name}" 프로젝트가 저장되었습니다!`)
    }
  }

  const handleLoadProject = (project: SavedProject) => {
    setWorkspaceXml(project.workspace)
    if (project.initialJointAngles) {
      // 레거시 프로젝트 호환성 처리
      const loaded = project.initialJointAngles as any
      if ('base' in loaded) {
        // 레거시 포맷인 경우 기본 자세로
        setJointAngles({ ...DEFAULT_HUMANOID_POSE })
      } else {
        setJointAngles(loaded as HumanoidJointAngles)
      }
    }
  }

  const handleDeleteProject = (name: string) => {
    deleteProject(name)
    setSavedProjects(getAllProjects())
  }

  const handleLoadExample = (xml: string) => {
    setWorkspaceXml(xml)
  }

  const handleClearWorkspace = () => {
    if (confirm('블록 코딩 영역을 초기화하시겠습니까?\n모든 블록이 삭제됩니다.')) {
      if (workspaceRef.current) {
        workspaceRef.current.clear()
        setGeneratedCode('')
        saveCurrentWorkspace('')
      }
    }
  }

  // 외부 GLB 파일 로드
  const handleExternalModelLoad = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      const name = file.name.replace(/\.(glb|gltf)$/i, '')
      boneMappingLoadedRef.current = false // 새 모델이므로 리셋
      setCustomBoneMapping({} as Record<HumanoidJointKey, string>)
      setExternalModelUrl(url)
      setExternalModelName(name)
      setModelType('external')
      saveCurrentExternalModel(url, name)
      saveExternalModel(name, url, 'file')
      setSavedExternalModels(getAllExternalModels())
      setShowExternalModelDialog(false)
      toast.success(`"${file.name}" 모델을 불러왔습니다!`)
    }
  }

  // URL로 외부 모델 로드
  const handleExternalModelUrlLoad = (url: string, name?: string) => {
    if (url) {
      const modelName = name || url.split('/').pop()?.replace(/\.(glb|gltf)$/i, '') || 'external-model'
      boneMappingLoadedRef.current = false // 새 모델이므로 리셋
      setCustomBoneMapping({} as Record<HumanoidJointKey, string>)
      setExternalModelUrl(url)
      setExternalModelName(modelName)
      setModelType('external')
      saveCurrentExternalModel(url, modelName)
      saveExternalModel(modelName, url, 'url')
      setSavedExternalModels(getAllExternalModels())
      setShowExternalModelDialog(false)
      toast.success('외부 모델을 불러왔습니다!')
    }
  }

  // 저장된 외부 모델 불러오기
  const handleLoadSavedExternalModel = (model: SavedExternalModel) => {
    boneMappingLoadedRef.current = false // 새 모델이므로 리셋
    setCustomBoneMapping({} as Record<HumanoidJointKey, string>)
    setExternalModelUrl(model.url)
    setExternalModelName(model.name)
    setModelType('external')
    saveCurrentExternalModel(model.url, model.name)
    setShowExternalModelDialog(false)
    toast.success(`"${model.name}" 모델을 불러왔습니다!`)
  }

  // 저장된 외부 모델 삭제
  const handleDeleteSavedExternalModel = (name: string) => {
    deleteExternalModel(name)
    setSavedExternalModels(getAllExternalModels())
    toast.success('모델이 삭제되었습니다')
  }

  // 동기화 테스트
  const handleSyncTest = async () => {
    setSyncTestResult('테스트 중...')
    const result = await testExternalModelSync()
    setSyncTestResult(result.message)
    if (result.success) {
      toast.success(result.message)
    } else {
      toast.error(result.message)
    }
  }

  // 본 발견 콜백 - 첫 로드 시에만 저장된 매핑 불러오기
  const boneMappingLoadedRef = useRef(false)
  const handleBonesFound = useCallback((bones: string[], mappings: BoneMapping[]) => {
    setAvailableBones(bones)
    setCurrentBoneMappings(mappings)

    // 저장된 매핑은 첫 로드 시에만 불러오기 (무한 루프 방지)
    if (externalModelName && !boneMappingLoadedRef.current) {
      boneMappingLoadedRef.current = true
      const savedMapping = loadBoneMapping(externalModelName)
      if (savedMapping) {
        setCustomBoneMapping(savedMapping.mappings)
        toast.success('저장된 본 매핑을 불러왔습니다')
      }
    }
  }, [externalModelName])

  // 본 매핑 변경
  const handleBoneMappingChange = (jointKey: HumanoidJointKey, boneName: string) => {
    setCustomBoneMapping(prev => ({
      ...prev,
      [jointKey]: boneName
    }))
  }

  // 본 매핑 저장 (동기화)
  const handleSaveBoneMapping = () => {
    if (!externalModelName) {
      toast.error('모델 이름이 없습니다')
      return
    }
    saveBoneMapping(externalModelName, customBoneMapping)
    toast.success('본 매핑이 저장되었습니다!')
  }

  // 전체 자동 매핑
  const handleAutoMapAll = () => {
    if (currentBoneMappings.length === 0) {
      if (availableBones.length === 0) {
        toast.error('모델에서 본을 찾을 수 없습니다')
      } else {
        toast.error(`자동 매핑할 수 없습니다. 사용 가능한 본 ${availableBones.length}개가 있으니 수동으로 매핑하세요.`)
        setShowBoneMappingPanel(true)
      }
      return
    }

    const newMapping: Record<HumanoidJointKey, string> = {} as Record<HumanoidJointKey, string>
    for (const mapping of currentBoneMappings) {
      newMapping[mapping.jointKey] = mapping.boneName
    }
    setCustomBoneMapping(newMapping)
    toast.success(`${currentBoneMappings.length}개 관절이 자동 매핑되었습니다`)
  }

  // 본 매핑 테스트
  const handleTestBoneMapping = async () => {
    // 모델 URL 확인
    if (!externalModelUrl) {
      toast.error('외부 모델이 로드되지 않았습니다')
      setMappingTestResult('오류: 모델 없음')
      return
    }

    // Blob URL 만료 확인
    if (externalModelUrl.startsWith('blob:')) {
      toast.error('파일 모델은 세션 종료 후 만료됩니다. 다시 로드해주세요.')
      setMappingTestResult('오류: Blob URL 만료됨')
      return
    }

    // 본 매핑 확인
    if (currentBoneMappings.length === 0 && Object.keys(customBoneMapping).length === 0) {
      toast.error('매핑된 본이 없습니다. 먼저 본 매핑을 설정해주세요.')
      setMappingTestResult('오류: 본 매핑 없음')
      return
    }

    setIsMappingTesting(true)
    setMappingTestResult('테스트 중...')

    try {
      // 매핑된 관절만 테스트
      const mappedJoints = customBoneMapping && Object.keys(customBoneMapping).length > 0
        ? Object.keys(customBoneMapping) as HumanoidJointKey[]
        : currentBoneMappings.map(m => m.jointKey)

      // 테스트할 관절 (매핑된 것 중 주요 관절만)
      const primaryJoints: HumanoidJointKey[] = [
        'neckYaw', 'leftShoulderPitch', 'rightShoulderPitch',
        'leftElbow', 'rightElbow', 'leftHipPitch', 'rightHipPitch'
      ]
      const testJoints = primaryJoints.filter(joint => mappedJoints.includes(joint))

      if (testJoints.length === 0) {
        toast.warning('테스트 가능한 관절이 없습니다')
        setMappingTestResult('테스트할 관절 없음')
        setIsMappingTesting(false)
        return
      }

      console.log('[테스트] 매핑된 관절:', mappedJoints.length, '개, 테스트할 관절:', testJoints.length, '개')

      for (const joint of testJoints) {
        if (stopRequestedRef.current) break

        setMappingTestResult(`테스트 중: ${joint}`)
        console.log('[테스트] 관절 테스트:', joint)

        // 관절을 30도로 움직임
        await rotateJoint(joint, 30)
        await wait(0.3)
        // 원위치
        await rotateJoint(joint, 0)
        await wait(0.2)
      }

      setMappingTestResult(`테스트 완료! 테스트된 관절: ${testJoints.length}개 / 총 매핑: ${mappedJoints.length}개`)
      toast.success('본 매핑 테스트 완료!')
    } catch (error) {
      if ((error as Error).message !== 'STOP_REQUESTED') {
        console.error('[테스트] 오류:', error)
        setMappingTestResult('테스트 실패: ' + (error as Error).message)
        toast.error('테스트 중 오류 발생')
      }
    }

    setIsMappingTesting(false)
  }

  return (
    <main className="flex h-screen flex-col bg-gray-900">
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white"
            title="홈으로"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 13v10h-6v-6h-6v6h-6v-10h-3l12-12 12 12h-3zm-1-5.907v-5.093h-3v2.093l3 3z"/>
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">
              로봇 블록 코딩 시뮬레이터
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              블록을 조립해서 22관절 휴머노이드 로봇을 제어하세요
            </p>
          </div>
        </div>

        <ControlPanel
          isRunning={isRunning}
          onRun={editorMode === 'block' ? executeBlockCode : () => executePythonCode(pythonCode)}
          onStop={stopExecution}
          onReset={() => {
            stopRequestedRef.current = true
            animationController.current.stop()
            setIsRunning(false)
            setJointAngles({ ...DEFAULT_HUMANOID_POSE })
            setRobotPosition({ ...DEFAULT_POSITION })
          }}
          onExamples={() => setShowExamplesDialog(true)}
          onClearWorkspace={handleClearWorkspace}
          executionSpeed={executionSpeed}
          onSpeedChange={setExecutionSpeed}
        />
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* 블록 코딩 / Python 에디터 영역 */}
        <div
          className={`border-r border-gray-700 flex flex-col transition-all duration-300 ${
            isWorkspaceMinimized ? 'w-12' : 'w-1/2'
          }`}
        >
          <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 flex items-center justify-between">
            {!isWorkspaceMinimized && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setEditorMode('block')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-t transition-colors ${
                    editorMode === 'block'
                      ? 'bg-gray-700 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                  }`}
                >
                  블록 코딩
                </button>
                <button
                  onClick={() => setEditorMode('python')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-t transition-colors ${
                    editorMode === 'python'
                      ? 'bg-gray-700 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                  }`}
                >
                  Python
                </button>
                {editorMode === 'python' && (
                  <button
                    onClick={() => setShowPythonHelp(true)}
                    className="ml-2 px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                  >
                    명령어 보기
                  </button>
                )}
              </div>
            )}
            <button
              onClick={() => setIsWorkspaceMinimized(!isWorkspaceMinimized)}
              className="p-1.5 hover:bg-gray-700 rounded transition-colors text-gray-400 hover:text-white"
              title={isWorkspaceMinimized ? '에디터 창 펼치기' : '에디터 창 최소화'}
            >
              {isWorkspaceMinimized ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              )}
            </button>
          </div>
          <div className="flex-1 relative overflow-hidden">
            {/* Blockly 워크스페이스 */}
            <div
              className={`absolute inset-0 transition-opacity duration-300 ${
                isWorkspaceMinimized || editorMode !== 'block' ? 'opacity-0 pointer-events-none' : 'opacity-100'
              }`}
              key={workspaceXml}
            >
              <BlocklyWorkspace
                onWorkspaceChange={handleWorkspaceChange}
                initialXml={workspaceXml}
              />
            </div>
            {/* Python 에디터 */}
            <div
              className={`absolute inset-0 flex transition-opacity duration-300 ${
                isWorkspaceMinimized || editorMode !== 'python' ? 'opacity-0 pointer-events-none' : 'opacity-100'
              }`}
            >
              <div className={`transition-all duration-300 ${showPythonHelp ? 'w-1/2' : 'w-full'}`}>
                <PythonEditor
                  initialCode=""
                  generatedCode={pythonCode}
                  onRunCode={executePythonCode}
                  isRunning={isRunning}
                  onCodeChange={(code) => setPythonCode(code)}
                />
              </div>
              {/* Python 명령어 사이드 패널 */}
              {showPythonHelp && (
                <div className="w-1/2 bg-gray-800 border-l border-gray-700 overflow-y-auto">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-bold text-white">Python 명령어</h3>
                      <button
                        onClick={() => setShowPythonHelp(false)}
                        className="text-gray-400 hover:text-white text-lg"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="space-y-3 text-xs">
                      {/* 관절 제어 */}
                      <div>
                        <h4 className="text-cyan-400 font-semibold mb-1">관절 제어</h4>
                        <div className="bg-gray-900 rounded p-2 font-mono text-green-400">
                          <div>await rotate_joint(<span className="text-yellow-400">'관절명'</span>, <span className="text-purple-400">각도</span>)</div>
                          <div className="text-gray-500 text-[10px] mt-1">torso, neckYaw, neckPitch, leftShoulderPitch, leftElbow, rightElbow...</div>
                        </div>
                      </div>

                      {/* 그리퍼 */}
                      <div>
                        <h4 className="text-cyan-400 font-semibold mb-1">그리퍼</h4>
                        <div className="bg-gray-900 rounded p-2 font-mono text-green-400">
                          <div>await set_gripper(<span className="text-yellow-400">'left'</span>|<span className="text-yellow-400">'right'</span>, <span className="text-purple-400">0~1</span>)</div>
                        </div>
                      </div>

                      {/* 머리 */}
                      <div>
                        <h4 className="text-cyan-400 font-semibold mb-1">머리</h4>
                        <div className="bg-gray-900 rounded p-2 font-mono text-green-400">
                          <div>await set_head_pose(<span className="text-purple-400">yaw</span>, <span className="text-purple-400">pitch</span>)</div>
                        </div>
                      </div>

                      {/* 팔/다리 */}
                      <div>
                        <h4 className="text-cyan-400 font-semibold mb-1">팔/다리 자세</h4>
                        <div className="bg-gray-900 rounded p-2 font-mono text-green-400 space-y-1">
                          <div>await set_arm_pose(<span className="text-yellow-400">'left'</span>, <span className="text-purple-400">어깨P, 어깨Y, 팔꿈치, 손목</span>)</div>
                          <div>await set_leg_pose(<span className="text-yellow-400">'left'</span>, <span className="text-purple-400">힙P, 힙Y, 무릎, 발목</span>)</div>
                        </div>
                      </div>

                      {/* 프리셋 */}
                      <div>
                        <h4 className="text-cyan-400 font-semibold mb-1">프리셋 자세</h4>
                        <div className="bg-gray-900 rounded p-2 font-mono text-green-400 space-y-1">
                          <div>await set_preset_pose(<span className="text-yellow-400">'tpose'</span>|<span className="text-yellow-400">'wave'</span>|<span className="text-yellow-400">'bow'</span>|<span className="text-yellow-400">'fighting'</span>)</div>
                        </div>
                      </div>

                      {/* 이동 */}
                      <div>
                        <h4 className="text-cyan-400 font-semibold mb-1">이동</h4>
                        <div className="bg-gray-900 rounded p-2 font-mono text-green-400 space-y-1">
                          <div>await move_forward/backward/left/right(<span className="text-purple-400">거리</span>)</div>
                          <div>await jump(<span className="text-purple-400">높이</span>)</div>
                        </div>
                      </div>

                      {/* 기타 */}
                      <div>
                        <h4 className="text-cyan-400 font-semibold mb-1">기타</h4>
                        <div className="bg-gray-900 rounded p-2 font-mono text-green-400 space-y-1">
                          <div>await wait(<span className="text-purple-400">초</span>)</div>
                          <div>await reset_robot()</div>
                          <div>await reset_position()</div>
                        </div>
                      </div>

                      {/* 예제 */}
                      <div>
                        <h4 className="text-cyan-400 font-semibold mb-1">예제</h4>
                        <div className="bg-gray-900 rounded p-2 font-mono text-green-400 text-[10px] space-y-0.5">
                          <div className="text-gray-500"># 손 흔들기</div>
                          <div>await set_arm_pose('right', -90, 0, 0, 0)</div>
                          <div>await wait(0.5)</div>
                          <div>await rotate_joint('rightWrist', 30)</div>
                          <div>await reset_robot()</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            {/* 최소화 시 세로 텍스트 */}
            {isWorkspaceMinimized && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span
                  className="text-gray-500 text-sm cursor-pointer hover:text-gray-300"
                  style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
                  onClick={() => setIsWorkspaceMinimized(false)}
                >
                  {editorMode === 'block' ? '블록 코딩' : 'Python'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 3D 뷰 영역 */}
        <div className={`flex flex-col transition-all duration-300 ${
          isWorkspaceMinimized ? 'flex-1' : 'w-1/2'
        }`}>
          <div className="flex-1 relative">
            <RobotScene
              jointAngles={jointAngles}
              modelType={modelType}
              position={robotPosition}
              externalModelUrl={externalModelUrl}
              onBonesFound={handleBonesFound}
              customBoneMapping={Object.keys(customBoneMapping).length > 0 ? customBoneMapping : undefined}
            />

            <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-lg">
              <p className="text-white text-sm font-medium">3D 시뮬레이션</p>
              <p className="text-gray-300 text-xs">마우스로 회전/확대</p>
              <div className="flex flex-wrap gap-1 mt-2">
                <button
                  onClick={() => setModelType('gundam')}
                  className={`px-2 py-1 text-xs rounded ${
                    modelType === 'gundam'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Mech
                </button>
                <button
                  onClick={() => setModelType('soldier')}
                  className={`px-2 py-1 text-xs rounded ${
                    modelType === 'soldier'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Soldier
                </button>
                <button
                  onClick={() => setModelType('robot')}
                  className={`px-2 py-1 text-xs rounded ${
                    modelType === 'robot'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Robot
                </button>
                <button
                  onClick={() => setShowExternalModelDialog(true)}
                  className={`px-2 py-1 text-xs rounded ${
                    modelType === 'external'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  외부 모델
                </button>
              </div>
              {/* 외부 모델일 때 본 매핑 버튼들 */}
              {modelType === 'external' && externalModelUrl && (
                <div className="flex flex-wrap gap-1 mt-2">
                  <button
                    onClick={() => setShowBoneMappingPanel(!showBoneMappingPanel)}
                    className="px-2 py-1 text-xs rounded bg-cyan-600 hover:bg-cyan-700 text-white"
                  >
                    본 매핑 ({currentBoneMappings.length})
                  </button>
                  <button
                    onClick={handleAutoMapAll}
                    className="px-2 py-1 text-xs rounded bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    전체 매핑
                  </button>
                  <button
                    onClick={handleSaveBoneMapping}
                    className="px-2 py-1 text-xs rounded bg-green-600 hover:bg-green-700 text-white"
                  >
                    동기화
                  </button>
                  <button
                    onClick={handleTestBoneMapping}
                    disabled={isMappingTesting}
                    className="px-2 py-1 text-xs rounded bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 text-white"
                  >
                    {isMappingTesting ? '테스트중...' : '테스트'}
                  </button>
                </div>
              )}
            </div>

            {isRunning && (
              <div className="absolute top-4 right-4 bg-green-600/80 backdrop-blur-sm px-4 py-2 rounded-lg z-10">
                <p className="text-white text-sm font-medium flex items-center gap-2">
                  <span className="animate-pulse">●</span> 실행 중
                </p>
              </div>
            )}

            <div className="absolute top-4 right-4 w-64" style={{ top: isRunning ? '60px' : '16px' }}>
              <HumanoidJointControlPanel
                jointAngles={jointAngles}
                onJointChange={handleJointChange}
                onPresetPose={handlePresetPose}
                position={robotPosition}
                onPositionChange={setRobotPosition}
                disabled={isRunning}
              />
            </div>

            {/* 본 매핑 패널 */}
            {showBoneMappingPanel && modelType === 'external' && (
              <div className="absolute top-4 left-4 w-80 max-h-[60vh] overflow-y-auto bg-gray-800/95 backdrop-blur-sm rounded-lg border border-gray-700 p-4" style={{ left: '200px' }}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-semibold">본 매핑 설정</h3>
                  <button
                    onClick={() => setShowBoneMappingPanel(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                <div className="text-xs text-gray-400 mb-3">
                  모델: {externalModelName || '알 수 없음'}<br />
                  발견된 본: {availableBones.length}개 | 자동 매핑: {currentBoneMappings.length}개
                  {availableBones.length > 0 && currentBoneMappings.length === 0 && (
                    <div className="text-yellow-400 mt-1">
                      자동 매핑되지 않았습니다. 수동으로 본을 선택하세요.
                    </div>
                  )}
                  {availableBones.length === 0 && (
                    <div className="text-red-400 mt-1">
                      모델에서 본/노드를 찾을 수 없습니다.
                    </div>
                  )}
                </div>

                {mappingTestResult && (
                  <div className={`text-xs mb-3 p-2 rounded ${mappingTestResult.includes('완료') ? 'bg-green-900/50 text-green-400' : 'bg-yellow-900/50 text-yellow-400'}`}>
                    {mappingTestResult}
                  </div>
                )}

                <div className="space-y-2">
                  {/* 관절 그룹별로 표시 */}
                  {[
                    { label: '머리/몸통', joints: ['torso', 'neckYaw', 'neckPitch'] as HumanoidJointKey[] },
                    { label: '왼팔', joints: ['leftShoulderPitch', 'leftShoulderYaw', 'leftElbow', 'leftWrist', 'leftGrip'] as HumanoidJointKey[] },
                    { label: '오른팔', joints: ['rightShoulderPitch', 'rightShoulderYaw', 'rightElbow', 'rightWrist', 'rightGrip'] as HumanoidJointKey[] },
                    { label: '왼다리', joints: ['leftHipPitch', 'leftHipYaw', 'leftKnee', 'leftAnkle'] as HumanoidJointKey[] },
                    { label: '오른다리', joints: ['rightHipPitch', 'rightHipYaw', 'rightKnee', 'rightAnkle'] as HumanoidJointKey[] },
                  ].map(group => (
                    <div key={group.label} className="border-b border-gray-700 pb-2">
                      <div className="text-xs text-cyan-400 font-medium mb-1">{group.label}</div>
                      {group.joints.map(jointKey => {
                        const currentMapping = currentBoneMappings.find(m => m.jointKey === jointKey)
                        const selectedBone = customBoneMapping[jointKey] || currentMapping?.boneName || ''

                        return (
                          <div key={jointKey} className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-gray-400 w-24 truncate" title={jointKey}>
                              {jointKey}
                            </span>
                            <select
                              value={selectedBone}
                              onChange={(e) => handleBoneMappingChange(jointKey, e.target.value)}
                              className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-cyan-500"
                            >
                              <option value="">-- 선택 안함 --</option>
                              {availableBones.map(bone => (
                                <option key={bone} value={bone}>{bone}</option>
                              ))}
                            </select>
                            {selectedBone && (
                              <span className="text-green-400 text-xs">✓</span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={handleAutoMapAll}
                    className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded"
                  >
                    전체 매핑
                  </button>
                  <button
                    onClick={handleSaveBoneMapping}
                    className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded"
                  >
                    동기화
                  </button>
                  <button
                    onClick={handleTestBoneMapping}
                    disabled={isMappingTesting}
                    className="flex-1 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 text-white text-sm rounded"
                  >
                    {isMappingTesting ? '테스트중...' : '테스트'}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="h-48 bg-gray-800 border-t border-gray-700 p-4 overflow-auto">
            <h3 className="text-sm font-semibold text-white mb-2">생성된 코드</h3>
            <pre className="text-xs text-green-400 font-mono bg-gray-900 p-3 rounded overflow-x-auto">
              {generatedCode || '// 블록을 추가하면 코드가 여기에 표시됩니다'}
            </pre>
          </div>
        </div>
      </div>

      <SaveDialog
        isOpen={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        onSave={handleSaveProject}
      />

      <LoadDialog
        isOpen={showLoadDialog}
        onClose={() => setShowLoadDialog(false)}
        projects={savedProjects}
        onLoad={handleLoadProject}
        onDelete={handleDeleteProject}
      />

      <ExamplesDialog
        isOpen={showExamplesDialog}
        onClose={() => setShowExamplesDialog(false)}
        examples={EXAMPLE_PROGRAMS}
        onLoad={handleLoadExample}
      />

      {/* 외부 모델 불러오기 다이얼로그 */}
      {showExternalModelDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-[500px] max-h-[80vh] overflow-y-auto border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4">외부 모델 불러오기</h2>

            <div className="space-y-4">
              {/* 저장된 모델 목록 */}
              {savedExternalModels.length > 0 && (
                <div>
                  <label className="block text-sm text-gray-400 mb-2">저장된 모델 ({savedExternalModels.length}개)</label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {savedExternalModels.map((model) => (
                      <div
                        key={model.name}
                        className="flex items-center justify-between bg-gray-700 rounded-lg px-3 py-2"
                      >
                        <div className="flex-1">
                          <div className="text-white text-sm font-medium">{model.name}</div>
                          <div className="text-gray-400 text-xs">
                            {model.source === 'file' ? '파일' : 'URL'} • {new Date(model.timestamp).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleLoadSavedExternalModel(model)}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded"
                          >
                            불러오기
                          </button>
                          <button
                            onClick={() => handleDeleteSavedExternalModel(model.name)}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded"
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-600" />
                <span className="text-gray-500 text-sm">새 모델 추가</span>
                <div className="flex-1 h-px bg-gray-600" />
              </div>

              {/* 파일 업로드 */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">GLB 파일 선택</label>
                <input
                  type="file"
                  accept=".glb,.gltf"
                  onChange={handleExternalModelLoad}
                  className="w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-purple-600 file:text-white hover:file:bg-purple-700 file:cursor-pointer"
                />
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-600" />
                <span className="text-gray-500 text-sm">또는</span>
                <div className="flex-1 h-px bg-gray-600" />
              </div>

              {/* URL 입력 */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">URL로 불러오기</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="https://example.com/model.glb"
                    className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleExternalModelUrlLoad((e.target as HTMLInputElement).value)
                      }
                    }}
                  />
                  <button
                    onClick={(e) => {
                      const input = (e.target as HTMLElement).parentElement?.querySelector('input')
                      if (input) handleExternalModelUrlLoad(input.value)
                    }}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm"
                  >
                    불러오기
                  </button>
                </div>
              </div>

              {externalModelUrl && (
                <div className="text-sm text-green-400">
                  현재 로드된 모델: {externalModelName || '알 수 없음'}
                </div>
              )}

              {/* 동기화 테스트 */}
              <div className="border-t border-gray-600 pt-4 mt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">저장소 동기화 테스트</span>
                  <button
                    onClick={handleSyncTest}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg"
                  >
                    테스트 실행
                  </button>
                </div>
                {syncTestResult && (
                  <div className={`mt-2 text-sm ${syncTestResult.includes('성공') ? 'text-green-400' : 'text-yellow-400'}`}>
                    {syncTestResult}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowExternalModelDialog(false)}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
