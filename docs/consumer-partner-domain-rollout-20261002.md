# C 端与伙伴入口域名发布（2026-10-02）

本变更将新生成的 C 端邀请、Linky 绑定和收益入口指向 `https://app.bandeira.fandodo.online`，并为 `https://partner.bandeira.fandodo.online` 提供密码登录后的空白工作台。旧 `https://bandeira.fandodo.online` 暂时继续提供原有运营后台及 C 端页面，不强制跳转。**不包含应用工作区切换、业务数据展示、新的奖励或提现开关。**

## 发布前提

1. 代码 PR 合并到 `main`，CI 通过；按 [生产发布 Runbook](production-deployment-runbook.md) 记录 SHA、备份校验和回滚入口。不能从未合并分支发布。
2. 两条新 A 记录均指向当前生产主机，并从服务器与公网分别核对解析。DNS 正确不代表 HTTPS 已可用。
3. 复核线上现有 Nginx 站点文件路径、证书名称、Certbot 安装方式和证书到期时间，备份实际生效的 Nginx 配置；若与仓库模板不一致，应先修订方案，不直接覆盖。

## HTTPS 与反向代理顺序

1. 将 `deploy/ops/bandeira-acme-bootstrap.nginx.conf` 用于短暂的证书扩展阶段。其 HTTP 端口为三个主机提供 ACME webroot，HTTPS 仅保留旧主机。创建 `/var/www/letsencrypt`，并确认 Nginx 对该目录可读取。先 `nginx -t`，再平滑 reload；旧站 HTTPS 应维持可用。
2. 用当前 Certbot 发行版的 webroot 模式扩展**既有证书名称**，包含旧域名和两个新域名；示例：`certbot certonly --webroot -w /var/www/letsencrypt --cert-name bandeira.fandodo.online --expand -d bandeira.fandodo.online -d app.bandeira.fandodo.online -d partner.bandeira.fandodo.online`。以实际证书名称为准，勿创建导致续期混乱的重复证书。检查 SAN 均包含三个域名，并用 `certbot renew --dry-run` 核对续期。
3. 安装 `deploy/ops/bandeira.nginx.conf` 最终模板，先 `nginx -t`，再 reload。它保留旧站全部路径，C 端新站拒绝 `/admin`，伙伴站只允许密码登录、会话刷新和退出这三个 API，其他 `/api` 与 `/admin` 均返回 404。若生产还有其他 Nginx 规则，应逐项合并而非直接覆盖。
4. 发布已合并的应用版本。仅 DNS/证书/Nginx 就绪还不算完成；若先安装新域名路由而旧应用尚未发布，新域名根路径可能显示旧后台，因此应尽量在同一受控发布窗口执行并立即验收。

## 最低验收

- 三域名 HTTPS 证书校验通过。旧域名 `/admin` 和 `/invite` 仍可访问；旧浏览器登录状态不因配置更新而被主动注销。
- 新 C 域名 `/`、`/invite`、`/bind`、`/earnings`、`/account` 进入客户端；`/admin` 返回 404。后台“渠道入口管理”的“入口域名”及三条链接、新客户端分享邀请链接均使用新 C 域名，保留原查询参数。
- 伙伴域名 `/` 为密码登录；仅运营已开通密码登录的现有 C 端账户可通过，登录后只有空白占位页，可退出。伙伴域名 `/admin`、`/api/distribution/home/...` 等非许可路径返回 404。请勿以有一张空白页面替代真正的授权与数据范围控制；开放业务数据前须另做伙伴权限设计。
- 新旧域名浏览器本地存储相互隔离；新域名首次访问可能要求重新登录，此后仍遵循既有 C 端会话策略。旧站继续运营的期限另行决定。
- 容器健康、readiness、关键资金与奖励安全开关沿用生产 Runbook。失败时先回滚 Nginx 到备份配置，再按发布 Runbook 回滚应用；不要删除证书或生产数据。
