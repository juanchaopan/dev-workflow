# 部署、环境和 PR 预览

/architect 按本文和用户一起选部署方式，/scaffold 按选定的方式配好部署流水线。目标：

- 代码合并后自动部署到测试环境；打版本标签后部署到生产环境，生产部署要人工批准。
- 每个 PR 有一个临时的预览地址，用户点开就能看到改动的效果，PR 关闭后自动销毁。/spike 的草稿 PR 也用它给用户验证。
- 出了问题能一步回滚：重新部署上一个版本标签。

## 环境

| 环境 | 什么时候部署 | 用途 |
|---|---|---|
| 本地 | 开发时 `docker compose -f infra/docker-compose.yml up` | 开发和调试，多实例效果也在这里看 |
| PR 预览 | 每个 PR 自动部署，PR 关闭后销毁 | 看改动的效果、验证探针 |
| 测试（staging） | 合并到集成分支后自动部署：Git Flow 是 develop，GitHub Flow 是 main | 发布前的整体验证 |
| 生产 | 推送版本标签 `v*` 后部署，需要人工批准 | 给用户用 |

生产部署的人工批准用 GitHub Environments：建一个名为 `production` 的环境，设置 Required reviewers 为维护者，部署 job 写 `environment: production`。部署平台的令牌存成这个环境的 secret，只有批准后的 job 拿得到。私有仓库在 GitHub 免费版上不能设 Required reviewers，这时改为生产部署用 `workflow_dispatch` 手动触发。

## 选平台

| 应用类型 | 常见平台 | PR 预览 | 怎么接 |
|---|---|---|---|
| 纯前端（构建后是静态文件） | Vercel、Netlify、Cloudflare Pages、Azure Static Web Apps | 平台自带，每个 PR 自动一个地址，并在 PR 里评论地址 | 在平台网站上连接 GitHub 仓库，指定组件目录、构建命令和输出目录；不用写工作流 |
| 容器化的后端或全栈 | Render、Railway、Fly.io、Google Cloud Run、Azure Container Apps、AWS App Runner | Render 和 Railway 自带；其他平台在 PR 工作流里部署一个以 PR 编号命名的临时实例，PR 关闭时删除 | 工作流构建镜像推到 GitHub Container Registry（GHCR），再调用平台的部署命令 |
| 自己的服务器 | 一台云主机加 docker compose | 一般不做每个 PR 的预览，用测试环境代替 | 工作流构建镜像推到 GHCR，再通过 SSH 在服务器上拉取新镜像、重启 |
| Kubernetes | 云厂商的托管集群 | 每个 PR 一个命名空间 | 一个人维护时通常不划算，除非已经有现成的集群 |

一个人维护时的推荐：前端用自带 PR 预览的静态托管平台；后端用支持容器、按用量计费、带 PR 预览的平台（例如 Render、Railway），或者 Cloud Run 这类缩到零就不收费的服务。数据库用平台托管的版本，备份交给平台。

## 部署流水线

/scaffold 按 `shared/deploy.yml` 写 `.github/workflows/deploy.yml`：构建每个容器化组件的镜像，按触发方式部署到测试或生产环境。镜像以提交号和版本号打标签，回滚就是重新部署旧标签的镜像。平台自带 Git 集成的（例如静态托管平台），可以不写这个工作流，在平台上配好"哪个分支部署到哪个环境"即可。

数据库结构变更随应用一起部署：迁移脚本在新版本启动前执行，并且必须兼容旧版本的代码（先加字段、再迁数据、最后删旧字段，分几次发布完成），这样回滚应用时不用回滚数据库。

## 需要用户做的

部署平台的账号、付款方式、域名都要用户自己注册和配置。/scaffold 只生成工作流和配置文件，告诉用户需要在平台上做什么、需要把哪些令牌存进 GitHub 的哪个 environment。
