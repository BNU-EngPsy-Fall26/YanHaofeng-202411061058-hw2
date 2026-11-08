/* 公开配置：只填写项目码。禁止将下载密钥写入本仓库。 */
window.LAB_CONFIG = Object.freeze({
  PROJECT: '758X3E',  // 公开项目码；下载密钥严禁写入本项目
  API_BASE: 'https://attention-lab-production.up.railway.app',
  APP_VERSION: '1.0.0-rc1',
  EXPERIMENT_TRIALS: 20,
  GAZE_VALIDATION_LIMIT_PX: 200,
  GAZE_SAMPLE_MS: 250,
  WEBGAZER_URL: 'https://cdn.jsdelivr.net/npm/webgazer@3.5.3/dist/webgazer.js',
  // WebGazer 3.5.3 默认找 ./mediapipe/face_mesh，静态仓库没有该目录。
  // 固定官方 MediaPipe npm 发行版的完整模型/WASM 根路径（必须在 wg.begin() 前赋值）。
  MEDIAPIPE_FACE_MESH_URL: 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619',
  // 可在 assets/ 中放置合法获得的 webgazer.js 以支持离线资源，但摄像头仍需许可。
  LOCAL_WEBGAZER_URL: './assets/webgazer.js'
});
