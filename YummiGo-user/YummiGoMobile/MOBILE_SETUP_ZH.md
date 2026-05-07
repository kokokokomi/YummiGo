# YummiGoMobile 重建与后端联动指南

## 1. 已实现内容

- React Native (Expo Router) 用户端基础功能：
  - ログイン（メール/パスワード）
  - Googleでログイン
  - メニュー（カテゴリ + 商品一覧）
  - カート（加减商品、清空）
  - 注文作成 + Stripe Checkout 支払い遷移
  - 支払い結果確認（session_id 回调确认）
  - 注文一覧
  - マイページ（用户信息 + 环境配置展示）

- 后端新增 Google 登录接口：
  - `POST /user/user/google-login`
  - 前端传 `idToken`，后端校验后签发系统 JWT

## 2. 关键接口对应

- 用户登录：
  - `POST /user/user/login`
  - `POST /user/user/google-login`
  - `GET /user/user/info`

- 菜单与分类：
  - `GET /user/category/list?type=1`
  - `GET /user/dish/list?categoryId=xxx`

- 购物车：
  - `POST /user/shoppingCart/add`
  - `POST /user/shoppingCart/sub`
  - `GET /user/shoppingCart/list`
  - `DELETE /user/shoppingCart/clean`

- 地址：
  - `GET /user/address/default`
  - （其余地址增删改接口已封装）

- 下单与支付：
  - `POST /user/order/submit`
  - `POST /user/order/payment`
  - `GET /user/order/payment/complete?session_id=...`
  - `GET /user/order/page`
  - `GET /user/order/{id}`

## 3. Google 登录配置（必须）

### 3.1 Google Cloud 配置

1. 打开 Google Cloud Console。
2. 创建 OAuth Client（Web）。
3. 记下 Web Client ID（形如 `xxxx.apps.googleusercontent.com`）。

### 3.2 后端配置

在 `application-dev.yml` 中配置：

```yaml
sy:
  google:
    client-id: "你的GoogleWebClientID"
```

### 3.3 移动端配置

在运行前设置环境变量（macOS/zsh）：

```bash
export EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID="你的GoogleWebClientID"
```

### 3.4 授权错误（invalid_request / redirect_uri）排查

- 代码里使用 `AuthSession.makeRedirectUri({ useProxy: true })` 作为 **redirect_uri**（Expo Go 为代理域名）。
- 在 Google Cloud Console → OAuth 客户端（**Web 类型**）→「已获授权的重定向 URI」中，**必须添加与运行时完全一致的 redirect_uri**（可在 App 里用登录失败弹窗中打印的 `redirect_uri` 复制粘贴）。
- iOS 真机/独立客户端还需配置 **iOS Client ID**（`EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`），并在 Google Console 为 iOS 类型客户端配置 Bundle ID。

## 4. Stripe 沙盒联调（核心流程）

### 4.1 后端配置

你已配置：

- `sy.stripe.apiKey=sk_test_xxx`
- `sy.stripe.webhookSecret=whsec_xxx`

### 4.2 本地 Webhook 转发（不要用「本机局域网 IP」填 Stripe Dashboard）

**Stripe 云端无法访问你家里的 `http://192.168.x.x:8080`**，所以在 Dashboard 里填内网地址，Webhook **永远不会成功**。本地开发请二选一：

- **推荐**：Stripe CLI 转发（不依赖公网）：

```bash
stripe listen --forward-to http://localhost:8080/user/stripe/webhook
```

将 CLI 打印的 **`whsec_...`** 写入后端 `sy.stripe.webhookSecret`，与 Dashboard 里手动创建的 Endpoint **无关**（CLI 自带签名密钥）。

- **或**：用 ngrok / cloudflared 暴露 `https://xxx.ngrok.io` → 再填 `https://xxx.ngrok.io/user/stripe/webhook`，并在 Dashboard 复制对应 `whsec`。

### 4.3 移动端支付流程

1. メニューでカートに追加し、注文確認から決済へ。
2. 前端先调 `/order/submit` 创建订单。
3. 再调 `/order/payment` 获取 `checkoutUrl`。
4. `WebBrowser.openBrowserAsync(checkoutUrl)` 拉起 Stripe Checkout。
5. 支付完成后 Stripe 回跳 `yummigomobile://payment/success?...&session_id=...`。
6. 成功页调用 `/order/payment/complete` 确认支付并刷新订单状态。

## 5. 运行步骤

### 5.1 后端

```bash
cd YummiGo-Backend/YummiGo
mvn -pl YummiGo-server -am spring-boot:run
```

### 5.2 移动端

```bash
cd YummiGo-user/YummiGoMobile
npm install
export EXPO_PUBLIC_API_BASE_URL="http://你的局域网IP:8080"
export EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID="你的GoogleWebClientID"
npm run start
```

> 真机调试不要用 `localhost`，请用你的电脑局域网 IP。

## 6. 常见问题

- Google 登录点击无反应：
  - 检查 `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` 是否为空。
- 支付后状态没更新：
  - 检查 Stripe CLI 转发是否运行、`webhookSecret` 是否一致。
- 401 未授权：
  - 检查 `Authorization: Bearer <token>` 是否正常注入。

