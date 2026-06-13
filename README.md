# YummiGo

> 一言紹介: Spring Boot + Vue 3 + Expo / React Native で構築した、飲食店向けのオンライン注文・決済・店舗運用管理プラットフォームです。Stripe 決済、Google ログイン、リアルタイム注文通知に対応しています。

---

## 作者・連絡先

sy
メール: [kokomiorz@gmail.com](mailto:kokomiorz@gmail.com)

---

## オンラインデモ

- 管理画面: [http://13.113.53.71](http://13.113.53.71)
- モバイルアプリ: Expo Go でプロジェクトを起動し、表示された QR コードを読み取って確認できます。
- https://youtu.be/VBryEkeK5jM 主要機能デモ動画
- https://youtube.com/shorts/pFVWgGnJmyI?feature=share  Google認可ログイン機能の実装デモ
<img width="252" height="248" alt="image" src="https://github.com/user-attachments/assets/937b2950-ced9-467f-990f-06b3226c7658" />


- また、stripeはテスト環境のため、カードの番号が4242-4242-4242-4242のクレジットカードでお支払いできます。

デモアカウント:

- 管理者: `admin` / `123456`
- ユーザー: `2858273620@qq.com` / `123456`

---

## 技術スタック

### バックエンド

- Java 21
- Spring Boot 3.2.5
- Spring MVC / REST API
- Spring WebSocket + Jakarta WebSocket
- Spring Data Redis / Spring Cache
- MyBatis-Plus 3.5.12
- MySQL 8
- Druid Connection Pool
- JWT 認証
- Lombok
- Fastjson
- Knife4j / OpenAPI 3 API ドキュメント
- Stripe Java SDK 29.3.0
- Aliyun OSS SDK
- Apache POI
- Maven マルチモジュール構成

### 管理画面

- Vue 3.4
- TypeScript 5.4
- Vite 5
- Vue Router 4
- Pinia
- Pinia Persisted State
- Element Plus
- Axios
- ECharts
- Less
- ESLint / Prettier / vue-tsc

### モバイルアプリ

- Expo 54
- React 19
- React Native 0.81
- Expo Router 6
- React Navigation
- Axios
- AsyncStorage
- Expo Auth Session / Google OAuth
- Expo Web Browser
- Expo Image Picker
- Expo Location
- Expo Updates / EAS
- TypeScript

### デプロイ

- AWS EC2 Tokyo
- Nginx
- Spring Boot API
- Vite ビルド済み静的ファイル
- MySQL / Redis

---
## システム構成

```text
                    ┌────────────────────┐
                    │   Mobile App       │
                    │ Expo / ReactNative │
                    └─────────┬──────────┘
                              │ HTTPS / REST API
                              ▼
                    ┌────────────────────┐
                    │ Spring Boot API    │
                    │ JWT / WebSocket    │
                    └──────┬─────┬───────┘
                           │     │
              ┌────────────┘     └────────────┐
              ▼                               ▼
     ┌────────────────┐             ┌────────────────┐
     │     MySQL      │             │     Redis      │
     │ Order / User   │             │ Cache / Token  │
     └────────────────┘             └────────────────┘
                           │
                           ▼
                 ┌──────────────────┐
                 │   Stripe API     │
                 │ Payment /Webhook │
                 └──────────────────┘

                           │
                           ▼
                 ┌──────────────────┐
                 │   Aliyun OSS     │
                 │  Image Storage   │
                 └──────────────────┘


                    ┌────────────────────┐
                    │   Admin Panel      │
                    │   Vue3 + Vite      │
                    └────────────────────┘

Deployment:
AWS EC2 (Tokyo) + Nginx
```
---

## 主な機能

### ユーザー向けモバイルアプリ

- メールアドレス・パスワードログイン
- Google ログイン
- 商品カテゴリ、料理、セットメニューの閲覧
- カートへの追加、数量変更、カートクリア
- 配送先住所の登録・編集・デフォルト住所管理
- 注文作成
- Stripe Checkout によるオンライン決済
- 決済完了後の注文状態確認
- 注文一覧・注文詳細
- 注文キャンセル、催促
- プロフィール編集

### 店舗向け管理画面

- 管理者ログイン
- ダッシュボード表示
- 売上、注文、ユーザー、商品ランキングなどの統計表示
- 注文一覧、注文詳細、注文受付、配送、完了、キャンセル、返金対応
- WebSocket による新規注文・支払い完了・催促通知
- カテゴリ管理
- 料理管理
- セットメニュー管理
- 従業員管理
- 店舗営業状態の切り替え
- 商品画像アップロード

### バックエンド API

- 管理者 API とユーザー API の分離
- JWT によるログイン状態管理
- MySQL による永続化
- Redis キャッシュ
- Stripe 決済セッション作成
- Stripe Webhook 署名検証
- 支払い成功後の注文状態更新
- WebSocket ブロードキャスト
- Aliyun OSS 画像アップロード
- グローバル例外処理
- Knife4j による API ドキュメント

---

## 担当範囲

- 要件整理・システム設計
- Spring Boot を用いたバックエンドAPI開発
- MySQL によるDB設計およびデータ管理
- Redis を利用したキャッシュ・ログイン状態管理
- JWT 認証機能実装
- Stripe Checkout / Webhook を利用した決済機能実装
- WebSocket によるリアルタイム通知機能実装
- Vue3 + TypeScript による管理画面開発
- Expo / React Native によるモバイルアプリ開発
- AWS EC2 + Nginx を利用したデプロイ環境構築
- Google OAuth を利用したログイン機能実装
- 開発環境・本番環境を考慮した設定管理
- Knife4j / OpenAPI によるAPIドキュメント整備
- GitHub を用いたソースコード管理

---

## API Documentation

Knife4j / OpenAPI を利用して
API ドキュメントを自動生成しています。

### Online Documentation

- http://13.113.53.71/doc.html

---

## プロジェクト構成

```text
YummiGo-All/
├── README.md
├── package.json
├── YummiGo-Backend/
│   └── YummiGo/
│       ├── pom.xml
│       ├── YummiGo-common/      # 共通定数、例外、ユーティリティ、設定プロパティ
│       ├── YummiGo-pojo/        # Entity、DTO、VO
│       ├── YummiGo-server/      # Controller、Service、Mapper、WebSocket、設定
│       └── YummiGo-sql/
│           └── init.sql         # MySQL 初期化 SQL
├── YummiGo-fronted/             # Vue 3 管理画面
│   ├── src/
│   │   ├── api/
│   │   ├── views/
│   │   ├── stores/
│   │   └── router.ts
│   └── vite.config.ts
└── YummiGo-user/
    └── YummiGoMobile/           # Expo / React Native モバイルアプリ
        ├── app/                 # Expo Router の画面
        └── src/
            ├── api/
            ├── config/
            ├── lib/
            ├── state/
            └── types/
```

---

## ローカル起動

### 必要環境

- JDK 21
- Maven 3.x
- Node.js 20 
- npm
- MySQL 8.x
- Redis
- Stripe アカウント、Stripe CLI
- Aliyun OSS の Access Key / Bucket
- Google OAuth Client ID

### 1. データベース初期化

```bash
mysql -u root -p < YummiGo-Backend/YummiGo/YummiGo-sql/init.sql
```

デフォルトのデータベース名は `yummigo` です。必要に応じて `init.sql` や `application-dev.yml` の接続先を調整してください。

### 2. バックエンド設定

```bash
cd YummiGo-Backend/YummiGo/YummiGo-server/src/main/resources
cp application-dev.example.yml application-dev.yml
```

`application-dev.yml` に MySQL、Redis、Stripe、Aliyun OSS、Google OAuth の値を設定します。

主な設定項目:

- `sy.datasource.*`
- `sy.redis.*`
- `sy.alioss.*`
- `sy.stripe.apiKey`
- `sy.stripe.webhookSecret`
- `sy.google.client-id`

### 3. バックエンド起動

```bash
cd YummiGo-Backend/YummiGo
mvn -pl YummiGo-server -am spring-boot:run
```

API は標準で `http://localhost:8080` で起動します。  
API ドキュメントは `http://localhost:8080/doc.html` から確認できます。

### 4. 管理画面起動

```bash
cd YummiGo-fronted
npm install
npm run dev
```

開発時は `vite.config.ts` の設定により、`/api` は `http://localhost:8080/admin`、`/ws` は `ws://localhost:8080` にプロキシされます。

### 5. モバイルアプリ起動

```bash
cd YummiGo-user/YummiGoMobile
npm install
npm run start
```

実機で確認する場合、API の向き先は `localhost` ではなく PC の LAN IP またはデプロイ済み API を指定してください。

```bash
export EXPO_PUBLIC_API_BASE_URL="http://YOUR_LAN_IP:8080"
export EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID="YOUR_GOOGLE_WEB_CLIENT_ID.apps.googleusercontent.com"
npm run start
```

サーバー環境に接続する場合は以下でも起動できます。

```bash
npm run start:server-dev
```

---

## Stripe Webhook

ローカル開発では Stripe CLI で Webhook を転送します。

```bash
stripe listen --forward-to http://localhost:8080/user/stripe/webhook
```

CLI に表示される `whsec_...` を `application-dev.yml` の `sy.stripe.webhookSecret` に設定してください。  
Webhook エンドポイントは `POST /user/stripe/webhook` または `POST /notify/stripe/webhook` を利用できます。

---
