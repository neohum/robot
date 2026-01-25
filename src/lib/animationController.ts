import { JointAngles, HumanoidJointAngles, HumanoidJointKey, Position3D } from './types/robot';

// 애니메이션을 위한 Tween 함수
export class AnimationController {
  private animationQueue: Array<() => Promise<void>> = [];
  private isRunning = false;
  private isPaused = false;
  private isStopped = false;
  private currentAnimationId: number | null = null;

  // 부드러운 애니메이션으로 관절 각도 변경 (레거시)
  async animateJointAngles(
    currentAngles: JointAngles,
    targetAngles: JointAngles,
    duration: number,
    onUpdate: (angles: JointAngles) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const startAngles = { ...currentAngles };

      const animate = () => {
        // 중지 체크
        if (this.isStopped) {
          this.currentAnimationId = null;
          reject(new Error('STOP_REQUESTED'));
          return;
        }

        if (this.isPaused) {
          this.currentAnimationId = requestAnimationFrame(animate);
          return;
        }

        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease-in-out 함수
        const easeProgress = progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;

        const newAngles: JointAngles = {
          base: startAngles.base + (targetAngles.base - startAngles.base) * easeProgress,
          shoulder: startAngles.shoulder + (targetAngles.shoulder - startAngles.shoulder) * easeProgress,
          elbow: startAngles.elbow + (targetAngles.elbow - startAngles.elbow) * easeProgress,
          gripper: startAngles.gripper + (targetAngles.gripper - startAngles.gripper) * easeProgress,
        };

        onUpdate(newAngles);

        if (progress < 1) {
          this.currentAnimationId = requestAnimationFrame(animate);
        } else {
          this.currentAnimationId = null;
          resolve();
        }
      };

      animate();
    });
  }

  // 휴머노이드 관절 애니메이션
  async animateHumanoidJoints(
    currentAngles: HumanoidJointAngles,
    targetAngles: HumanoidJointAngles,
    duration: number,
    onUpdate: (angles: HumanoidJointAngles) => void
  ): Promise<void> {
    console.log('[AnimationController] Starting animation, duration:', duration)
    console.log('[AnimationController] Current:', currentAngles)
    console.log('[AnimationController] Target:', targetAngles)
    
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const startAngles = { ...currentAngles };
      const jointKeys = Object.keys(currentAngles) as HumanoidJointKey[];
      let frameCount = 0;

      const animate = () => {
        // 중지 체크
        if (this.isStopped) {
          this.currentAnimationId = null;
          console.log('[AnimationController] Animation stopped')
          reject(new Error('STOP_REQUESTED'));
          return;
        }

        if (this.isPaused) {
          this.currentAnimationId = requestAnimationFrame(animate);
          return;
        }

        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease-in-out 함수
        const easeProgress = progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;

        const newAngles = {} as HumanoidJointAngles;
        for (const key of jointKeys) {
          newAngles[key] = startAngles[key] + (targetAngles[key] - startAngles[key]) * easeProgress;
        }

        frameCount++;
        if (frameCount % 30 === 0 || progress === 1) {
          console.log(`[AnimationController] Frame ${frameCount}, progress: ${(progress * 100).toFixed(1)}%`)
        }

        onUpdate(newAngles);

        if (progress < 1) {
          this.currentAnimationId = requestAnimationFrame(animate);
        } else {
          this.currentAnimationId = null;
          console.log('[AnimationController] Animation completed, frames:', frameCount)
          resolve();
        }
      };

      animate();
    });
  }

  // 단일 관절 애니메이션
  async animateSingleJoint(
    currentAngles: HumanoidJointAngles,
    joint: HumanoidJointKey,
    targetValue: number,
    duration: number,
    onUpdate: (angles: HumanoidJointAngles) => void
  ): Promise<void> {
    const targetAngles = { ...currentAngles, [joint]: targetValue };
    return this.animateHumanoidJoints(currentAngles, targetAngles, duration, onUpdate);
  }

  // 위치 애니메이션 (이동)
  async animatePosition(
    currentPosition: Position3D,
    targetPosition: Position3D,
    duration: number,
    onUpdate: (position: Position3D) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const startPosition = { ...currentPosition };

      const animate = () => {
        // 중지 체크
        if (this.isStopped) {
          this.currentAnimationId = null;
          reject(new Error('STOP_REQUESTED'));
          return;
        }

        if (this.isPaused) {
          this.currentAnimationId = requestAnimationFrame(animate);
          return;
        }

        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease-in-out 함수
        const easeProgress = progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;

        const newPosition: Position3D = {
          x: startPosition.x + (targetPosition.x - startPosition.x) * easeProgress,
          y: startPosition.y + (targetPosition.y - startPosition.y) * easeProgress,
          z: startPosition.z + (targetPosition.z - startPosition.z) * easeProgress,
        };

        onUpdate(newPosition);

        if (progress < 1) {
          this.currentAnimationId = requestAnimationFrame(animate);
        } else {
          this.currentAnimationId = null;
          resolve();
        }
      };

      animate();
    });
  }

  // 점프 애니메이션 (포물선 운동)
  async animateJump(
    currentPosition: Position3D,
    jumpHeight: number,
    duration: number,
    onUpdate: (position: Position3D) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const startPosition = { ...currentPosition };

      const animate = () => {
        // 중지 체크
        if (this.isStopped) {
          this.currentAnimationId = null;
          reject(new Error('STOP_REQUESTED'));
          return;
        }

        if (this.isPaused) {
          this.currentAnimationId = requestAnimationFrame(animate);
          return;
        }

        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // 포물선 운동: y = 4h * t * (1 - t) (t가 0.5일 때 최대 높이 h)
        const yOffset = 4 * jumpHeight * progress * (1 - progress);

        const newPosition: Position3D = {
          x: startPosition.x,
          y: startPosition.y + yOffset,
          z: startPosition.z,
        };

        onUpdate(newPosition);

        if (progress < 1) {
          this.currentAnimationId = requestAnimationFrame(animate);
        } else {
          this.currentAnimationId = null;
          resolve();
        }
      };

      animate();
    });
  }

  // 명령 큐에 추가
  addToQueue(command: () => Promise<void>) {
    this.animationQueue.push(command);
  }

  // 큐 실행
  async executeQueue(onComplete?: () => void) {
    if (this.isRunning) return;

    this.isRunning = true;
    this.isPaused = false;
    this.isStopped = false;

    while (this.animationQueue.length > 0 && !this.isStopped) {
      const command = this.animationQueue.shift();
      if (command) {
        try {
          await command();
        } catch (e) {
          if ((e as Error).message === 'STOP_REQUESTED') {
            break;
          }
          throw e;
        }
      }
    }

    this.isRunning = false;
    if (onComplete) onComplete();
  }

  // 일시정지
  pause() {
    this.isPaused = true;
  }

  // 재개
  resume() {
    this.isPaused = false;
    if (this.isRunning && this.animationQueue.length > 0) {
      this.executeQueue();
    }
  }

  // 정지 및 큐 초기화
  stop() {
    this.isStopped = true;
    this.isPaused = false;
    this.isRunning = false;
    this.animationQueue = [];
    if (this.currentAnimationId !== null) {
      cancelAnimationFrame(this.currentAnimationId);
      this.currentAnimationId = null;
    }
  }

  // 실행 준비 (stop 후 다시 실행하기 전 호출)
  reset() {
    this.isStopped = false;
    this.isPaused = false;
    this.isRunning = false;
    this.animationQueue = [];
    this.currentAnimationId = null;
  }

  // 상태 확인
  getStatus() {
    return {
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      isStopped: this.isStopped,
      queueLength: this.animationQueue.length,
    };
  }
}
