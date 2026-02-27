// 로봇 팔의 관절 상태를 나타내는 타입 (레거시)
export interface JointAngles {
  base: number;      // Y축 회전 (Yaw) - 도 단위
  shoulder: number;  // X축 회전 (Pitch) - 도 단위
  elbow: number;     // X축 회전 (Pitch) - 도 단위
  gripper: number;   // 그립퍼 개폐 상태 (0: 닫힘, 1: 열림)
}

// 휴머노이드 로봇 관절 상태 (22 joints)
export interface HumanoidJointAngles {
  // 몸통 (1 joint)
  torso: number;             // Y축 회전 (Yaw)

  // 머리 (2 joints)
  neckYaw: number;           // 목 좌우 회전
  neckPitch: number;         // 목 상하 회전

  // 왼팔 (5 joints)
  leftShoulderPitch: number; // 어깨 상하
  leftShoulderYaw: number;   // 어깨 좌우
  leftElbow: number;         // 팔꿈치
  leftWrist: number;         // 손목
  leftGrip: number;          // 그리퍼 (0: 닫힘, 1: 열림)

  // 오른팔 (5 joints)
  rightShoulderPitch: number;
  rightShoulderYaw: number;
  rightElbow: number;
  rightWrist: number;
  rightGrip: number;

  // 왼다리 (4 joints)
  leftHipPitch: number;      // 엉덩이 상하
  leftHipYaw: number;        // 엉덩이 좌우
  leftKnee: number;          // 무릎
  leftAnkle: number;         // 발목

  // 오른다리 (4 joints)
  rightHipPitch: number;
  rightHipYaw: number;
  rightKnee: number;
  rightAnkle: number;
}

// 휴머노이드 관절 키 타입
export type HumanoidJointKey = keyof HumanoidJointAngles;

// 관절 제한값 정의
export interface JointLimit {
  min: number;
  max: number;
}

// 휴머노이드 관절 제한값
export const HUMANOID_JOINT_LIMITS: Record<HumanoidJointKey, JointLimit> = {
  // 몸통
  torso: { min: -45, max: 45 },

  // 머리
  neckYaw: { min: -90, max: 90 },
  neckPitch: { min: -45, max: 45 },

  // 왼팔
  leftShoulderPitch: { min: -180, max: 60 },
  leftShoulderYaw: { min: -30, max: 180 },
  leftElbow: { min: -135, max: 0 },
  leftWrist: { min: -90, max: 90 },
  leftGrip: { min: 0, max: 1 },

  // 오른팔
  rightShoulderPitch: { min: -180, max: 60 },
  rightShoulderYaw: { min: -180, max: 30 },
  rightElbow: { min: -135, max: 0 },
  rightWrist: { min: -90, max: 90 },
  rightGrip: { min: 0, max: 1 },

  // 왼다리
  leftHipPitch: { min: -90, max: 45 },
  leftHipYaw: { min: -45, max: 45 },
  leftKnee: { min: 0, max: 135 },
  leftAnkle: { min: -45, max: 45 },

  // 오른다리
  rightHipPitch: { min: -90, max: 45 },
  rightHipYaw: { min: -45, max: 45 },
  rightKnee: { min: 0, max: 135 },
  rightAnkle: { min: -45, max: 45 },
};

// 기본 휴머노이드 자세 (T-pose)
export const DEFAULT_HUMANOID_POSE: HumanoidJointAngles = {
  torso: 0,
  neckYaw: 0,
  neckPitch: 0,
  leftShoulderPitch: 0,
  leftShoulderYaw: 10,
  leftElbow: 0,
  leftWrist: 0,
  leftGrip: 0,
  rightShoulderPitch: 0,
  rightShoulderYaw: -10,
  rightElbow: 0,
  rightWrist: 0,
  rightGrip: 0,
  leftHipPitch: 0,
  leftHipYaw: 0,
  leftKnee: 0,
  leftAnkle: 0,
  rightHipPitch: 0,
  rightHipYaw: 0,
  rightKnee: 0,
  rightAnkle: 0,
};

// 미리 정의된 자세들
export type PresetPoseName = 'tpose' | 'stand' | 'wave' | 'clap' | 'walk_ready' | 'bow';

export const PRESET_POSES: Record<PresetPoseName, HumanoidJointAngles> = {
  tpose: { ...DEFAULT_HUMANOID_POSE },
  stand: {
    ...DEFAULT_HUMANOID_POSE,
  },
  wave: {
    ...DEFAULT_HUMANOID_POSE,
    rightShoulderPitch: -20,
    rightShoulderYaw: -80,
    rightElbow: -90,
    rightWrist: 20,
  },
  clap: {
    ...DEFAULT_HUMANOID_POSE,
    leftShoulderPitch: -90,
    leftShoulderYaw: 20,
    rightShoulderPitch: -90,
    rightShoulderYaw: -20,
  },
  walk_ready: {
    ...DEFAULT_HUMANOID_POSE,
    leftShoulderYaw: 10,
    rightShoulderYaw: -10,
    leftKnee: 15,
    rightKnee: 15,
  },
  bow: {
    ...DEFAULT_HUMANOID_POSE,
    torso: 0,
    neckPitch: 30,
    leftShoulderYaw: 10,
    rightShoulderYaw: -10,
    leftHipPitch: -45,
    rightHipPitch: -45,
    leftKnee: 45,
    rightKnee: 45,
  },
};

// 3D 위치 좌표
export interface Position3D {
  x: number;
  y: number;
  z: number;
}

// 로봇 명령 타입
export interface RobotCommand {
  type: 'rotate' | 'move' | 'grip' | 'wait';
  jointAngles?: Partial<JointAngles>;
  position?: Position3D;
  duration?: number; // 밀리초
  gripperState?: number;
}

// 로봇 팔 설정
export interface RobotConfig {
  baseDimensions: { width: number; height: number; depth: number };
  armSegments: {
    upperArm: number;
    forearm: number;
  };
  colors: {
    base: string;
    joint: string;
    arm: string;
    gripper: string;
  };
}
