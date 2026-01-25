import { JointAngles, HumanoidJointKey } from './types/robot';

export interface SavedProject {
  name: string;
  timestamp: number;
  workspace: string;
  initialJointAngles?: JointAngles;
}

export interface SavedBoneMapping {
  modelName: string;
  timestamp: number;
  mappings: Record<HumanoidJointKey, string>;
  scale?: number;
}

const STORAGE_KEY = 'robot-blockly-projects';
const CURRENT_PROJECT_KEY = 'robot-blockly-current';
const BONE_MAPPING_KEY = 'robot-bone-mappings';
const EXTERNAL_MODEL_KEY = 'robot-external-model';

export interface SavedExternalModel {
  name: string;
  url: string;
  timestamp: number;
  scale?: number;
  source: 'file' | 'url';
}

// 프로젝트 저장
export const saveProject = (name: string, workspaceXml: string, jointAngles?: JointAngles): void => {
  const projects = getAllProjects();
  const project: SavedProject = {
    name,
    timestamp: Date.now(),
    workspace: workspaceXml,
    initialJointAngles: jointAngles,
  };

  const existingIndex = projects.findIndex(p => p.name === name);
  if (existingIndex >= 0) {
    projects[existingIndex] = project;
  } else {
    projects.push(project);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
};

// 모든 프로젝트 불러오기
export const getAllProjects = (): SavedProject[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

// 특정 프로젝트 불러오기
export const loadProject = (name: string): SavedProject | null => {
  const projects = getAllProjects();
  return projects.find(p => p.name === name) || null;
};

// 프로젝트 삭제
export const deleteProject = (name: string): void => {
  const projects = getAllProjects().filter(p => p.name !== name);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
};

// 현재 작업 중인 워크스페이스 자동 저장
export const saveCurrentWorkspace = (workspaceXml: string): void => {
  localStorage.setItem(CURRENT_PROJECT_KEY, workspaceXml);
};

// 현재 작업 중인 워크스페이스 불러오기
export const loadCurrentWorkspace = (): string | null => {
  return localStorage.getItem(CURRENT_PROJECT_KEY);
};

// 본 매핑 저장
export const saveBoneMapping = (
  modelName: string,
  mappings: Record<HumanoidJointKey, string>,
  scale?: number
): void => {
  const allMappings = getAllBoneMappings();
  const mapping: SavedBoneMapping = {
    modelName,
    timestamp: Date.now(),
    mappings,
    scale,
  };

  const existingIndex = allMappings.findIndex(m => m.modelName === modelName);
  if (existingIndex >= 0) {
    allMappings[existingIndex] = mapping;
  } else {
    allMappings.push(mapping);
  }

  localStorage.setItem(BONE_MAPPING_KEY, JSON.stringify(allMappings));
};

// 모든 본 매핑 불러오기
export const getAllBoneMappings = (): SavedBoneMapping[] => {
  const data = localStorage.getItem(BONE_MAPPING_KEY);
  return data ? JSON.parse(data) : [];
};

// 특정 모델의 본 매핑 불러오기
export const loadBoneMapping = (modelName: string): SavedBoneMapping | null => {
  const allMappings = getAllBoneMappings();
  return allMappings.find(m => m.modelName === modelName) || null;
};

// 본 매핑 삭제
export const deleteBoneMapping = (modelName: string): void => {
  const allMappings = getAllBoneMappings().filter(m => m.modelName !== modelName);
  localStorage.setItem(BONE_MAPPING_KEY, JSON.stringify(allMappings));
};

// ============================================
// 서버 API 기반 본 매핑 함수들
// ============================================

const API_BASE = '/api/bone-mappings';

// 서버에 본 매핑 저장
export const saveBoneMappingToServer = async (
  modelName: string,
  mappings: Record<HumanoidJointKey, string>,
  scale?: number
): Promise<boolean> => {
  try {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ modelName, mappings, scale }),
    });

    if (!response.ok) {
      throw new Error('서버 저장 실패');
    }

    // 로컬에도 동시 저장 (백업)
    saveBoneMapping(modelName, mappings, scale);

    return true;
  } catch (error) {
    console.error('서버 저장 오류:', error);
    // 서버 실패 시 로컬에만 저장
    saveBoneMapping(modelName, mappings, scale);
    return false;
  }
};

// 서버에서 모든 본 매핑 불러오기
export const getAllBoneMappingsFromServer = async (): Promise<SavedBoneMapping[]> => {
  try {
    const response = await fetch(API_BASE);

    if (!response.ok) {
      throw new Error('서버 조회 실패');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('서버 조회 오류:', error);
    // 서버 실패 시 로컬에서 불러오기
    return getAllBoneMappings();
  }
};

// 서버에서 특정 모델의 본 매핑 불러오기
export const loadBoneMappingFromServer = async (modelName: string): Promise<SavedBoneMapping | null> => {
  try {
    const response = await fetch(`${API_BASE}?modelName=${encodeURIComponent(modelName)}`);

    if (!response.ok) {
      throw new Error('서버 조회 실패');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('서버 조회 오류:', error);
    // 서버 실패 시 로컬에서 불러오기
    return loadBoneMapping(modelName);
  }
};

// 서버에서 본 매핑 삭제
export const deleteBoneMappingFromServer = async (modelName: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE}?modelName=${encodeURIComponent(modelName)}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('서버 삭제 실패');
    }

    // 로컬에서도 삭제
    deleteBoneMapping(modelName);

    return true;
  } catch (error) {
    console.error('서버 삭제 오류:', error);
    // 서버 실패 시 로컬에서만 삭제
    deleteBoneMapping(modelName);
    return false;
  }
};

// ============================================
// 외부 모델 저장 함수들
// ============================================

// 외부 모델 목록 저장
export const saveExternalModel = (
  name: string,
  url: string,
  source: 'file' | 'url',
  scale?: number
): void => {
  const models = getAllExternalModels();
  const model: SavedExternalModel = {
    name,
    url,
    timestamp: Date.now(),
    scale,
    source,
  };

  const existingIndex = models.findIndex(m => m.name === name);
  if (existingIndex >= 0) {
    models[existingIndex] = model;
  } else {
    models.push(model);
  }

  localStorage.setItem(EXTERNAL_MODEL_KEY, JSON.stringify(models));
};

// 모든 외부 모델 불러오기
export const getAllExternalModels = (): SavedExternalModel[] => {
  const data = localStorage.getItem(EXTERNAL_MODEL_KEY);
  return data ? JSON.parse(data) : [];
};

// 특정 외부 모델 불러오기
export const loadExternalModel = (name: string): SavedExternalModel | null => {
  const models = getAllExternalModels();
  return models.find(m => m.name === name) || null;
};

// 외부 모델 삭제
export const deleteExternalModel = (name: string): void => {
  const models = getAllExternalModels().filter(m => m.name !== name);
  localStorage.setItem(EXTERNAL_MODEL_KEY, JSON.stringify(models));
};

// 현재 선택된 외부 모델 URL 저장
export const saveCurrentExternalModel = (url: string, name?: string): void => {
  localStorage.setItem(EXTERNAL_MODEL_KEY + '-current', JSON.stringify({ url, name, timestamp: Date.now() }));
};

// 현재 선택된 외부 모델 URL 불러오기
export const loadCurrentExternalModel = (): { url: string; name?: string } | null => {
  const data = localStorage.getItem(EXTERNAL_MODEL_KEY + '-current');
  return data ? JSON.parse(data) : null;
};

// 외부 모델 동기화 테스트
export const testExternalModelSync = async (): Promise<{
  success: boolean;
  localCount: number;
  message: string;
}> => {
  try {
    const localModels = getAllExternalModels();

    // 로컬 스토리지 테스트
    const testModel: SavedExternalModel = {
      name: '__sync_test__',
      url: 'https://test.example.com/test.glb',
      timestamp: Date.now(),
      source: 'url',
    };

    // 저장 테스트
    saveExternalModel(testModel.name, testModel.url, testModel.source);

    // 불러오기 테스트
    const loaded = loadExternalModel(testModel.name);

    // 삭제 테스트
    deleteExternalModel(testModel.name);

    if (loaded && loaded.url === testModel.url) {
      return {
        success: true,
        localCount: localModels.length,
        message: `동기화 테스트 성공! 저장된 모델: ${localModels.length}개`,
      };
    } else {
      return {
        success: false,
        localCount: localModels.length,
        message: '동기화 테스트 실패: 데이터 불일치',
      };
    }
  } catch (error) {
    return {
      success: false,
      localCount: 0,
      message: `동기화 테스트 오류: ${error}`,
    };
  }
};

// ============================================
// Wasabi 서버 기반 외부 모델 함수들
// ============================================

export interface WasabiExternalModel {
  id: string
  name: string
  timestamp: number
  size: number
  boneMapping?: Record<string, string>
  scale?: number
}

// Wasabi에 모델 업로드
export const uploadModelToWasabi = async (
  file: File,
  boneMapping?: Record<string, string>,
  scale?: number
): Promise<{ success: boolean; id?: string; url?: string; error?: string }> => {
  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('name', file.name)
    if (boneMapping) {
      formData.append('boneMapping', JSON.stringify(boneMapping))
    }
    if (scale) {
      formData.append('scale', scale.toString())
    }

    const response = await fetch('/api/external-models', {
      method: 'POST',
      body: formData,
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Upload failed')
    }

    // 로컬에도 저장 (URL과 ID)
    saveExternalModel(data.metadata.name, data.url, 'url', scale)

    return {
      success: true,
      id: data.id,
      url: data.url,
    }
  } catch (error: any) {
    console.error('Wasabi upload error:', error)
    return {
      success: false,
      error: error.message,
    }
  }
}

// Wasabi에서 모델 목록 가져오기
export const getModelsFromWasabi = async (): Promise<WasabiExternalModel[]> => {
  try {
    const response = await fetch('/api/external-models')
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Failed to get models')
    }

    return data.models || []
  } catch (error: any) {
    console.error('Wasabi get models error:', error)
    return []
  }
}

// Wasabi에서 특정 모델의 URL 가져오기
export const getModelUrlFromWasabi = async (id: string): Promise<{ success: boolean; url?: string; metadata?: WasabiExternalModel; error?: string }> => {
  try {
    const response = await fetch(`/api/external-models?id=${encodeURIComponent(id)}`)
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Failed to get model URL')
    }

    return {
      success: true,
      url: data.url,
      metadata: data.metadata,
    }
  } catch (error: any) {
    console.error('Wasabi get URL error:', error)
    return {
      success: false,
      error: error.message,
    }
  }
}

// Wasabi에서 모델 삭제
export const deleteModelFromWasabi = async (id: string): Promise<boolean> => {
  try {
    const response = await fetch(`/api/external-models?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Failed to delete model')
    }

    return true
  } catch (error: any) {
    console.error('Wasabi delete error:', error)
    return false
  }
}

// Wasabi에 메타데이터 업데이트 (본 매핑, 스케일)
export const updateModelMetadataInWasabi = async (
  id: string,
  boneMapping?: Record<string, string>,
  scale?: number
): Promise<boolean> => {
  try {
    const response = await fetch('/api/external-models', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id, boneMapping, scale }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Failed to update metadata')
    }

    return true
  } catch (error: any) {
    console.error('Wasabi update metadata error:', error)
    return false
  }
}
