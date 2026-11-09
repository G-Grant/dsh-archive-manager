# dsh-archive-manager

DeepSeek Harness 插件：集中查看归档会话，取消归档，或在安全校验后批量永久删除归档会话日志和归档记录。

## 功能

- 列出全部归档会话，显示标题、消息预览、创建时间、最近更新时间、项目名和路径。
- 单个会话取消归档，恢复到工作区列表。
- 全选、刷新并批量永久删除归档会话；删除结果会逐项说明成功或失败原因。
- 仅处理归档集合中的会话；打开或运行中的会话会被拒绝。

## 安全边界

删除由 host service 执行，不经过会话 API：

- 只接受 JSONL 会话存储，并校验会话目录、父目录、文件名和 `realpath`，拒绝符号链接及越界路径。
- 单批最多 500 个会话，只递归删除目标会话自己的目录。
- 日志已不存在时，仅清理归档状态、工作区分账和投影缓存，并将结果计为已删除。
- 删除后广播 `api-session/removed`；清理附属记录产生的告警会随结果返回。

## 兼容性

支持 DeepSeek Harness `>= 0.2.1-rc.2` 和 Node.js 22。宿主提供的 `@deepseek-ai/cordis`、`@deepseek-ai/dsh-session`、`@deepseek-ai/dsh-typert-protocol` 通过 `peerDependencies` 声明。

`package.json` 保留 DSH bundle 的 `dsh.bundle.patch`、`dsh.client` 和 `./client` 导出入口。TypeScript 源码位于 `src/`，构建后由 `dist/index.js` 提供 host service、由 `dist/client.js` 提供浏览器端 bundle；因此安装发布包时仍加载兼容的 JavaScript 入口。

## 开发

```sh
pnpm install
pnpm typecheck
pnpm build
pnpm check
```

`pnpm check` 会执行类型检查、构建和两个 bundle 入口的 Node.js 语法检查。源码改动后，使用 `pnpm build` 更新 `dist/`。

本地链接插件时先构建，再执行：

```sh
dsh plugin --profile desktop add "link:$(pwd)"
```

## 发布

在 `main` 分支修改 `package.json` 的 `version` 并提交后，`.github/workflows/release.yml` 会校验 semver、安装依赖、运行检查、打包并创建对应的 GitHub Release，随后上传 `dsh-archive-manager.tgz`。预发布版本（例如 `0.2.0-beta.1`）会自动标记为 prerelease。
