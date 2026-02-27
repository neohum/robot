import { HumanoidJointKey } from '@/lib/types/robot'

// ===== Types =====

export interface BoneMappingResult {
  jointKey: HumanoidJointKey
  boneName: string
  confidence: number        // 0.0 ~ 1.0
  matchPass: 'exact' | 'prefix-stripped' | 'normalized' | 'word-boundary'
}

export interface AutoMappingResult {
  mappings: BoneMappingResult[]
  unmappedJoints: HumanoidJointKey[]
  unmappedBones: string[]
  overallConfidence: number
}

// ===== Unified Pattern Registry =====
// Merged from ExternalModel.tsx and bone-editor/page.tsx, deduplicated.
// Covers: Mixamo, VRM 1.0, UE5, Blender Rigify, Unity Mecanim, RPM, BVH

const BONE_PATTERNS: Record<HumanoidJointKey, string[]> = {
  torso: [
    'torso', 'Spine', 'spine', 'Spine1', 'spine1', 'Spine2', 'spine2',
    'mixamorig:Spine', 'mixamorigSpine', 'Torso', 'Chest', 'chest',
    'Hips', 'hips',
    // VRM
    'upperChest', 'UpperChest',
    // UE5
    'spine_01', 'spine_02', 'spine_03',
    // Rigify
    'DEF-spine.003', 'DEF-spine.004',
  ],
  neckYaw: [
    'neckYaw', 'Neck', 'neck',
    'mixamorig:Neck', 'mixamorigNeck',
    // UE5
    'neck_01',
    // Rigify
    'DEF-spine.006',
  ],
  neckPitch: [
    'neckPitch', 'Head', 'head',
    'mixamorig:Head', 'mixamorigHead',
    // UE5
    'head',
    // Rigify
    'DEF-spine.007',
  ],

  // === Left Arm ===
  leftShoulderPitch: [
    'leftShoulderPitch',
    'LeftArm', 'mixamorig:LeftArm', 'mixamorigLeftArm',
    'Left_Arm', 'L_Arm', 'Arm.L', 'shoulder.L',
    'LeftUpperArm', 'leftUpperArm',
    // UE5
    'upperarm_l',
    // Rigify
    'DEF-upper_arm.L',
    // BVH
    'LeftArm', 'lShldr',
  ],
  leftShoulderYaw: [
    'leftShoulderYaw',
    'LeftShoulder', 'mixamorig:LeftShoulder', 'mixamorigLeftShoulder',
    'Left_Shoulder', 'L_Shoulder',
    'leftShoulder',
    // UE5
    'clavicle_l',
    // Rigify
    'DEF-shoulder.L',
  ],
  leftElbow: [
    'leftElbow',
    'LeftForeArm', 'LeftElbow',
    'mixamorig:LeftForeArm', 'mixamorigLeftForeArm',
    'Left_ForeArm', 'L_ForeArm', 'forearm.L',
    'LeftLowerArm', 'leftLowerArm',
    'Left_Elbow', 'L_Elbow',
    // UE5
    'lowerarm_l',
    // Rigify
    'DEF-forearm.L',
    // BVH
    'LeftForeArm', 'lForeArm',
  ],
  leftWrist: [
    'leftWrist',
    'LeftHand', 'LeftWrist',
    'mixamorig:LeftHand', 'mixamorigLeftHand',
    'Left_Hand', 'L_Hand', 'hand.L',
    'leftHand',
    // UE5
    'hand_l',
    // Rigify
    'DEF-hand.L',
  ],
  leftGrip: [
    'leftGrip',
    'LeftHandIndex1', 'LeftHandThumb1',
    'mixamorig:LeftHandIndex1', 'mixamorigLeftHandIndex1',
    'Left_Finger', 'L_Finger', 'LeftGrip',
    'LeftHandIndex', 'LeftFinger',
    'leftIndexProximal',
    // UE5
    'index_01_l',
    // Rigify
    'DEF-f_index.01.L',
  ],

  // === Right Arm ===
  rightShoulderPitch: [
    'rightShoulderPitch',
    'RightArm', 'mixamorig:RightArm', 'mixamorigRightArm',
    'Right_Arm', 'R_Arm', 'Arm.R', 'shoulder.R',
    'RightUpperArm', 'rightUpperArm',
    // UE5
    'upperarm_r',
    // Rigify
    'DEF-upper_arm.R',
    // BVH
    'RightArm', 'rShldr',
  ],
  rightShoulderYaw: [
    'rightShoulderYaw',
    'RightShoulder', 'mixamorig:RightShoulder', 'mixamorigRightShoulder',
    'Right_Shoulder', 'R_Shoulder',
    'rightShoulder',
    // UE5
    'clavicle_r',
    // Rigify
    'DEF-shoulder.R',
  ],
  rightElbow: [
    'rightElbow',
    'RightForeArm', 'RightElbow',
    'mixamorig:RightForeArm', 'mixamorigRightForeArm',
    'Right_ForeArm', 'R_ForeArm', 'forearm.R',
    'RightLowerArm', 'rightLowerArm',
    'Right_Elbow', 'R_Elbow',
    // UE5
    'lowerarm_r',
    // Rigify
    'DEF-forearm.R',
    // BVH
    'RightForeArm', 'rForeArm',
  ],
  rightWrist: [
    'rightWrist',
    'RightHand', 'RightWrist',
    'mixamorig:RightHand', 'mixamorigRightHand',
    'Right_Hand', 'R_Hand', 'hand.R',
    'rightHand',
    // UE5
    'hand_r',
    // Rigify
    'DEF-hand.R',
  ],
  rightGrip: [
    'rightGrip',
    'RightHandIndex1', 'RightHandThumb1',
    'mixamorig:RightHandIndex1', 'mixamorigRightHandIndex1',
    'Right_Finger', 'R_Finger', 'RightGrip',
    'RightHandIndex', 'RightFinger',
    'rightIndexProximal',
    // UE5
    'index_01_r',
    // Rigify
    'DEF-f_index.01.R',
  ],

  // === Left Leg ===
  leftHipPitch: [
    'leftHipPitch',
    'LeftUpLeg', 'mixamorig:LeftUpLeg', 'mixamorigLeftUpLeg',
    'Left_UpLeg', 'L_UpLeg', 'thigh.L',
    'LeftUpperLeg', 'leftUpperLeg',
    'LeftHip',
    // UE5
    'thigh_l',
    // Rigify
    'DEF-thigh.L',
    // BVH
    'LeftUpLeg', 'lThigh',
  ],
  leftHipYaw: [
    'leftHipYaw',
    'LeftHip', 'mixamorig:LeftUpLeg', 'mixamorigLeftUpLeg',
    'Left_Hip', 'L_Hip',
    'leftHip',
  ],
  leftKnee: [
    'leftKnee',
    'LeftLeg', 'LeftKnee',
    'mixamorig:LeftLeg', 'mixamorigLeftLeg',
    'Left_Leg', 'L_Leg', 'shin.L',
    'LeftLowerLeg', 'leftLowerLeg',
    // UE5
    'calf_l',
    // Rigify
    'DEF-shin.L',
    // BVH
    'LeftLeg', 'lShin',
  ],
  leftAnkle: [
    'leftAnkle',
    'LeftFoot', 'LeftAnkle',
    'mixamorig:LeftFoot', 'mixamorigLeftFoot',
    'Left_Foot', 'L_Foot', 'foot.L',
    'LeftToeBase', 'leftFoot',
    // UE5
    'foot_l',
    // Rigify
    'DEF-foot.L',
  ],

  // === Right Leg ===
  rightHipPitch: [
    'rightHipPitch',
    'RightUpLeg', 'mixamorig:RightUpLeg', 'mixamorigRightUpLeg',
    'Right_UpLeg', 'R_UpLeg', 'thigh.R',
    'RightUpperLeg', 'rightUpperLeg',
    'RightHip',
    // UE5
    'thigh_r',
    // Rigify
    'DEF-thigh.R',
    // BVH
    'RightUpLeg', 'rThigh',
  ],
  rightHipYaw: [
    'rightHipYaw',
    'RightHip', 'mixamorig:RightUpLeg', 'mixamorigRightUpLeg',
    'Right_Hip', 'R_Hip',
    'rightHip',
  ],
  rightKnee: [
    'rightKnee',
    'RightLeg', 'RightKnee',
    'mixamorig:RightLeg', 'mixamorigRightLeg',
    'Right_Leg', 'R_Leg', 'shin.R',
    'RightLowerLeg', 'rightLowerLeg',
    // UE5
    'calf_r',
    // Rigify
    'DEF-shin.R',
    // BVH
    'RightLeg', 'rShin',
  ],
  rightAnkle: [
    'rightAnkle',
    'RightFoot', 'RightAnkle',
    'mixamorig:RightFoot', 'mixamorigRightFoot',
    'Right_Foot', 'R_Foot', 'foot.R',
    'RightToeBase', 'rightFoot',
    // UE5
    'foot_r',
    // Rigify
    'DEF-foot.R',
  ],
}

// ===== Structural Bone Detection =====

const STRUCTURAL_NAMES = new Set([
  'scene', 'auxscene', 'root', 'armature', 'rootnode',
  'sketchfab_model', 'skeleton', 'rig', 'metarig',
  'object', 'gltf_sceneroottransform',
])

export function isStructuralBone(name: string): boolean {
  return STRUCTURAL_NAMES.has(name.toLowerCase())
}

// ===== Utility Functions =====

const PREFIX_REGEX = /^(mixamorig[_:]?|DEF-|ORG-|MCH-)/

export function stripPrefix(name: string): string {
  return name.replace(PREFIX_REGEX, '')
}

export function normalizeBoneName(name: string): string {
  return stripPrefix(name).toLowerCase().replace(/[_.\-: ]/g, '')
}

export function tokenize(name: string): string[] {
  const stripped = stripPrefix(name)
  // Split on separators first
  const parts = stripped.split(/[_.\-: ]+/)
  // Then split camelCase/PascalCase within each part
  const tokens: string[] = []
  for (const part of parts) {
    if (!part) continue
    // Split camelCase: "LeftUpperArm" -> ["Left", "Upper", "Arm"]
    const camelParts = part.replace(/([a-z])([A-Z])/g, '$1\0$2')
      .replace(/([A-Z]+)([A-Z][a-z])/g, '$1\0$2')
      .split('\0')
    for (const cp of camelParts) {
      if (cp) tokens.push(cp.toLowerCase())
    }
  }
  return tokens
}

export function wordBoundaryMatch(patternTokens: string[], boneTokens: string[]): boolean {
  if (patternTokens.length === 0 || boneTokens.length === 0) return false
  if (patternTokens.length > boneTokens.length) return false

  // Check if pattern tokens appear as a contiguous subsequence in bone tokens
  for (let start = 0; start <= boneTokens.length - patternTokens.length; start++) {
    let match = true
    for (let i = 0; i < patternTokens.length; i++) {
      if (boneTokens[start + i] !== patternTokens[i]) {
        match = false
        break
      }
    }
    if (match) return true
  }
  return false
}

// ===== Pre-processed Pattern Data =====

interface PreprocessedPattern {
  original: string
  stripped: string
  normalized: string
  tokens: string[]
}

interface PreprocessedBone {
  original: string
  stripped: string
  normalized: string
  tokens: string[]
}

// Build preprocessed patterns once (module-level cache)
const preprocessedPatterns: Record<HumanoidJointKey, PreprocessedPattern[]> = {} as Record<HumanoidJointKey, PreprocessedPattern[]>

for (const jointKey of Object.keys(BONE_PATTERNS) as HumanoidJointKey[]) {
  const seen = new Set<string>()
  preprocessedPatterns[jointKey] = []
  for (const pattern of BONE_PATTERNS[jointKey]) {
    if (seen.has(pattern)) continue
    seen.add(pattern)
    preprocessedPatterns[jointKey].push({
      original: pattern,
      stripped: stripPrefix(pattern),
      normalized: normalizeBoneName(pattern),
      tokens: tokenize(pattern),
    })
  }
}

function preprocessBones(boneNames: string[]): PreprocessedBone[] {
  return boneNames.map(name => ({
    original: name,
    stripped: stripPrefix(name),
    normalized: normalizeBoneName(name),
    tokens: tokenize(name),
  }))
}

// ===== Core: 4-Pass Matching Algorithm =====

const ALL_JOINT_KEYS = Object.keys(BONE_PATTERNS) as HumanoidJointKey[]

export function autoMapBones(
  boneNames: string[],
  allowedJoints?: HumanoidJointKey[]
): AutoMappingResult {
  const jointsToMap = allowedJoints || ALL_JOINT_KEYS
  const bones = preprocessBones(boneNames)
  const usedBones = new Set<string>()
  const mappings: BoneMappingResult[] = []

  // Build lookup maps from bones for fast access
  const boneByName = new Map<string, PreprocessedBone>()
  const boneByStripped = new Map<string, PreprocessedBone>()
  const boneByNormalized = new Map<string, PreprocessedBone[]>()

  for (const bone of bones) {
    boneByName.set(bone.original, bone)

    // For stripped, only store first occurrence to avoid ambiguity
    if (!boneByStripped.has(bone.stripped)) {
      boneByStripped.set(bone.stripped, bone)
    }

    const existing = boneByNormalized.get(bone.normalized)
    if (existing) {
      existing.push(bone)
    } else {
      boneByNormalized.set(bone.normalized, [bone])
    }
  }

  // Pass 1: Exact match (case-sensitive), confidence 1.0
  for (const jointKey of jointsToMap) {
    const patterns = preprocessedPatterns[jointKey]
    let matched = false
    for (const pattern of patterns) {
      if (matched) break
      const bone = boneByName.get(pattern.original)
      if (bone && !usedBones.has(bone.original)) {
        mappings.push({
          jointKey,
          boneName: bone.original,
          confidence: 1.0,
          matchPass: 'exact',
        })
        usedBones.add(bone.original)
        matched = true
      }
    }
  }

  // Pass 2: Prefix-stripped exact match, confidence 0.9
  const mappedJoints = new Set(mappings.map(m => m.jointKey))
  for (const jointKey of jointsToMap) {
    if (mappedJoints.has(jointKey)) continue
    const patterns = preprocessedPatterns[jointKey]
    let matched = false
    for (const pattern of patterns) {
      if (matched) break
      // Search all bones for stripped match
      for (const bone of bones) {
        if (usedBones.has(bone.original)) continue
        if (bone.stripped === pattern.stripped && bone.original !== pattern.original) {
          mappings.push({
            jointKey,
            boneName: bone.original,
            confidence: 0.9,
            matchPass: 'prefix-stripped',
          })
          usedBones.add(bone.original)
          mappedJoints.add(jointKey)
          matched = true
          break
        }
      }
    }
  }

  // Pass 3: Normalized match (lowercase + separators removed), confidence 0.8
  for (const jointKey of jointsToMap) {
    if (mappedJoints.has(jointKey)) continue
    const patterns = preprocessedPatterns[jointKey]
    let matched = false
    for (const pattern of patterns) {
      if (matched) break
      const candidates = boneByNormalized.get(pattern.normalized)
      if (candidates) {
        for (const bone of candidates) {
          if (!usedBones.has(bone.original)) {
            mappings.push({
              jointKey,
              boneName: bone.original,
              confidence: 0.8,
              matchPass: 'normalized',
            })
            usedBones.add(bone.original)
            mappedJoints.add(jointKey)
            matched = true
            break
          }
        }
      }
    }
  }

  // Pass 4: Word-boundary match (token-based), confidence 0.6
  for (const jointKey of jointsToMap) {
    if (mappedJoints.has(jointKey)) continue
    const patterns = preprocessedPatterns[jointKey]
    let matched = false
    for (const pattern of patterns) {
      if (matched) break
      if (pattern.tokens.length === 0) continue
      for (const bone of bones) {
        if (usedBones.has(bone.original)) continue
        if (bone.tokens.length === 0) continue
        if (wordBoundaryMatch(pattern.tokens, bone.tokens)) {
          mappings.push({
            jointKey,
            boneName: bone.original,
            confidence: 0.6,
            matchPass: 'word-boundary',
          })
          usedBones.add(bone.original)
          mappedJoints.add(jointKey)
          matched = true
          break
        }
      }
    }
  }

  const unmappedJoints = jointsToMap.filter(j => !mappedJoints.has(j))
  const unmappedBones = boneNames.filter(b => !usedBones.has(b))
  const overallConfidence = mappings.length > 0
    ? mappings.reduce((sum, m) => sum + m.confidence, 0) / jointsToMap.length
    : 0

  return { mappings, unmappedJoints, unmappedBones, overallConfidence }
}

// ===== Convenience Functions =====

export function toMappingRecord(result: AutoMappingResult): Partial<Record<HumanoidJointKey, string>> {
  const record: Partial<Record<HumanoidJointKey, string>> = {}
  for (const m of result.mappings) {
    record[m.jointKey] = m.boneName
  }
  return record
}

export interface ConfidenceLabel {
  text: string
  color: string
}

export function getConfidenceLabel(confidence: number): ConfidenceLabel {
  if (confidence >= 1.0) return { text: 'Exact', color: 'text-green-400' }
  if (confidence >= 0.9) return { text: 'High', color: 'text-blue-400' }
  if (confidence >= 0.8) return { text: 'Medium', color: 'text-yellow-400' }
  return { text: 'Low', color: 'text-orange-400' }
}
