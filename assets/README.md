# 第三方眼动依赖目录

当前版本**不包含**第三方WebGazer发行文件。`js/gaze.js`启动时首先尝试`./assets/webgazer.js`，缺失则向jsDelivr请求官方`webgazer@3.5.3/dist/webgazer.js`。

如果计划自行托管发行版以免依赖CDN，应从官方项目或对应npm发行包获取构建产物，并确认关联的TensorFlow/MediaPipe模型及WASM资产的资源路径都能在本地正确解析；**仅复制一个JavaScript文件未必足够**。WebGazer采用GPL-3.0-or-later许可证，请保留所需许可证和来源声明。

https://github.com/brownhci/WebGazer
