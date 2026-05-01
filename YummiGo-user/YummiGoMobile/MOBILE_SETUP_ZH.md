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

## 4. Stripe 沙盒联调（核心流程）

### 4.1 后端配置

你已配置：

- `sy.stripe.apiKey=sk_test_xxx`
- `sy.stripe.webhookSecret=whsec_xxx`

### 4.2 本地 Webhook 转发

```bash
stripe listen --forward-to localhost:8080/user/stripe/webhook
```

将 CLI 输出的 `whsec_xxx` 填到后端配置后重启。

### 4.3 移动端支付流程

1. 在卡ート页点击 `支払う`。
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

