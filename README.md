# 🎨 Pixel Mint - NFT Marketplace

<div align="center">

![Pixel Mint](https://img.shields.io/badge/NFT-Marketplace-blue?style=for-the-badge)
![Blockchain](https://img.shields.io/badge/Blockchain-Polygon-purple?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?style=for-the-badge)

A modern, decentralized NFT marketplace built with blockchain security at its core. Mint, buy, sell, and trade NFTs with complete transparency and immutability powered by Polygon blockchain and IPFS storage.

[Features](#-features) • [Tech Stack](#-tech-stack) • [Installation](#-installation) • [Environment Variables](#-environment-variables) • [Smart Contracts](#-smart-contracts) • [Documentation](#-documentation)

</div>

---

## ✨ Features

### 🎨 NFT Management
- **Create & Mint NFTs** - Upload artwork to IPFS and mint NFTs on Polygon Amoy testnet
- **Batch Minting** - Mint multiple NFTs in a single transaction
- **NFT Collections** - Organize NFTs into custom collections with categories
- **Rich Metadata** - Store complete NFT metadata (name, description, attributes) on IPFS
- **Image Storage** - Decentralized image storage via IPFS/Pinata gateway

### 💰 Marketplace Features
- **Buy & Sell NFTs** - Seamless peer-to-peer NFT trading
- **Lazy Listing** - Gas-efficient listing (NFT stays with seller until sold)
- **Atomic Swaps** - Payment and NFT transfer in a single transaction
- **Dynamic Pricing** - Set and update NFT prices
- **Price History** - Interactive charts showing complete price history with sales data
- **0% Marketplace Fee** - No platform fees on transactions
- **List/Delist NFTs** - Full control over marketplace listings

### 🔐 Authentication & Security
- **Email Authentication** - Passwordless login via email verification codes
- **Google OAuth** - Sign in with Google
- **MetaMask Integration** - Connect crypto wallets securely
- **Session Management** - Secure session handling with NextAuth.js
- **Wallet Address Privacy** - Users can only see their own wallet addresses
- **Blockchain Verification** - On-chain ownership verification for all transactions

### 👤 User Profiles
- **Custom Profiles** - Personalized user profiles with avatars
- **NFT Gallery** - Display owned NFTs and collections
- **Wallet Connection** - Link MetaMask wallet to profile
- **Activity Tracking** - View transaction history and blockchain events
- **Popularity Score** - Track total likes across all NFTs
- **Privacy Controls** - Context-aware UI (My NFTs vs NFTs for other profiles)

### 🎯 Advanced Features
- **Search & Filter** - Find NFTs by category, collection, or creator
- **Like System** - Like and favorite NFTs
- **Real-time Updates** - Server-side rendering with automatic revalidation
- **Responsive Design** - Mobile-first, works on all devices
- **Dark/Light Mode** - Theme switching support
- **Network Switching** - Automatic Polygon Amoy network detection and switching
- **Transaction Monitoring** - Real-time transaction status tracking
- **Error Handling** - Comprehensive error handling with user-friendly messages

### 📊 Analytics & Visualization
- **Price History Charts** - Beautiful, animated line charts showing NFT price trends
- **Transaction Timeline** - Chronological view of all NFT sales and listings
- **Blockchain Explorer Links** - Direct links to PolygonScan for transaction verification
- **Gas Optimization** - Detailed gas cost tracking and optimization

---

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Shadcn/ui** - Beautiful, accessible component library
- **Recharts** - Interactive data visualization
- **React Hook Form** - Form validation with Zod
- **Sonner** - Toast notifications

### Backend & Database
- **PostgreSQL** - Primary database
- **Drizzle ORM** - Type-safe database queries
- **NextAuth.js** - Authentication framework
- **Server Actions** - Type-safe API endpoints

### Blockchain & Web3
- **Viem** - Modern TypeScript library for Ethereum
- **Wagmi** - React hooks for Ethereum
- **Polygon Amoy Testnet** - Layer 2 scaling solution
- **Alchemy RPC** - Reliable blockchain infrastructure
- **MetaMask** - Wallet integration
- **Hardhat** - Smart contract development

### Storage & IPFS
- **Pinata** - IPFS pinning service
- **IPFS Gateway** - Decentralized file storage
- **Supabase Storage** - Backup image storage

### Smart Contracts
- **Solidity ^0.8.24** - Smart contract language
- **OpenZeppelin** - Secure contract libraries
- **ERC-721** - NFT standard implementation
- **Custom Marketplace** - Optimized trading contract

### DevOps & Tooling
- **Turborepo** - Monorepo build system
- **pnpm** - Fast, efficient package manager
- **ESLint** - Code linting
- **Prettier** - Code formatting

---

## 📦 Installation

### Prerequisites

- **Node.js** >= 18.0.0
- **pnpm** >= 9.0.0
- **PostgreSQL** database
- **MetaMask** browser extension
- **Git**

### Step 1: Clone the Repository

```bash
git clone https://github.com/MuhammadAbyaz/pixel-mint.git
cd pixel-mint
```

### Step 2: Install Dependencies

```bash
pnpm install
```

### Step 3: Set Up Environment Variables

Create a `.env` file in the `apps/web` directory:

```bash
cp apps/web/.env.example apps/web/.env
```

Then fill in the required environment variables (see [Environment Variables](#-environment-variables) section below).

### Step 4: Set Up Database

Run the database migrations:

```bash
cd apps/web
pnpm db:push
```

If you need to generate migrations:

```bash
pnpm db:generate
```

### Step 5: Deploy Smart Contracts (Optional)

If you want to deploy your own contracts:

```bash
cd contracts
npm install
npx hardhat compile
npx hardhat run scripts/deploy.ts --network polygonAmoy
```

Update the contract addresses in your `.env` file.

### Step 6: Start Development Server

```bash
# From the root directory
pnpm dev
```

The app will be available at `http://localhost:3000`

---

## 🔑 Environment Variables

### Required Variables

Create a `.env` file in `apps/web/` with the following variables:

#### Database Configuration
```env
# PostgreSQL Database URL
DATABASE_URL="postgresql://user:password@localhost:5432/pixel_mint"
```

#### Authentication (NextAuth.js)
```env
# Generate with: openssl rand -base64 32
AUTH_SECRET="your-secret-key-here"

# Google OAuth (Get from Google Cloud Console)
AUTH_GOOGLE_ID="your-google-client-id"
AUTH_GOOGLE_SECRET="your-google-client-secret"

# Loops.so Email Service (Get from loops.so)
AUTH_LOOPS_KEY="your-loops-api-key"
AUTH_LOOPS_TRANSACTIONAL_ID="your-transactional-id"
LOOPS_TRANSACTION_ENDPOINT="https://app.loops.so/api/v1/transactional"

# Token expiry (in seconds, default: 20 minutes)
MAX_TOKEN_AGE=1200
```

#### Supabase Storage
```env
# Get from Supabase Dashboard
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_BUCKET_NAME="pixel-mint-bucket"
```

#### IPFS Storage (Pinata)
```env
# Get from pinata.cloud
PINATA_API_KEY="your-pinata-api-key"
PINATA_SECRET_KEY="your-pinata-secret-key"
PINATA_GATEWAY="https://gateway.pinata.cloud"
```

#### Blockchain Configuration
```env
# Smart Contract Addresses (Deploy your own or use existing)
NEXT_PUBLIC_NFT_CONTRACT_ADDRESS="0xYourNFTContractAddress"
NEXT_PUBLIC_MARKETPLACE_CONTRACT_ADDRESS="0xYourMarketplaceContractAddress"

# Alchemy RPC (Get from alchemy.com)
NEXT_PUBLIC_ALCHEMY_API_KEY="your-alchemy-api-key"
NEXT_PUBLIC_ALCHEMY_RPC_URL="https://polygon-amoy.g.alchemy.com/v2/your-api-key"
```

### Getting API Keys

#### 1. **Google OAuth**
- Go to [Google Cloud Console](https://console.cloud.google.com/)
- Create a new project or select existing
- Enable Google+ API
- Create OAuth 2.0 credentials
- Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`

#### 2. **Loops.so (Email)**
- Sign up at [loops.so](https://loops.so)
- Get your API key from Settings
- Create a transactional email template
- Copy the template ID

#### 3. **Supabase**
- Create account at [supabase.com](https://supabase.com)
- Create a new project
- Go to Settings > API to get URL and anon key
- Create a storage bucket named `pixel-mint-bucket`
- Set bucket to public

#### 4. **Pinata (IPFS)**
- Sign up at [pinata.cloud](https://pinata.cloud)
- Go to API Keys
- Create new key with admin access
- Copy API Key and Secret Key

#### 5. **Alchemy (Blockchain RPC)**
- Create account at [alchemy.com](https://alchemy.com)
- Create a new app
- Select "Polygon Amoy" as network
- Copy the API key and RPC URL

#### 6. **Database (PostgreSQL)**
- Local: Install PostgreSQL and create database
- Or use [Neon](https://neon.tech), [Supabase](https://supabase.com), or [Railway](https://railway.app)
- Get connection string in format: `postgresql://user:password@host:port/database`

---

## 🔗 Smart Contracts

### PixelMintNFT Contract (ERC-721)

**Features:**
- ERC-721 compliant NFT contract
- Mint single or batch NFTs
- Creator tracking for each token
- Timestamp tracking
- Maximum supply: 1,000,000 NFTs
- URI storage for metadata

**Key Functions:**
```solidity
mint(address to, string tokenURI) → uint256 tokenId
batchMint(address to, string[] tokenURIs) → uint256[] tokenIds
getCreator(uint256 tokenId) → address
getMintTimestamp(uint256 tokenId) → uint256
```

### PixelMintMarketplace Contract

**Features:**
- Lazy listing (gas efficient)
- Atomic swaps (payment + transfer in one transaction)
- 0% default marketplace fee
- Emergency withdraw functions
- Non-reentrant security

**Key Functions:**
```solidity
listNFT(address nftContract, uint256 tokenId, uint256 price)
delistNFT(address nftContract, uint256 tokenId)
buyNFT(address nftContract, uint256 tokenId) payable
getListing(address nftContract, uint256 tokenId)
```

### Gas Costs (Approximate)

| Operation | Cost (POL) |
|-----------|------------|
| Mint NFT | 0.02-0.05 |
| Approve Marketplace | 0.01 (one-time) |
| List NFT | 0.01-0.02 |
| Buy NFT (Atomic) | 0.05-0.1 |
| Delist NFT | 0.01 |

---

## 📚 Documentation

### Additional Documentation

- **[Blockchain Flow Documentation](./BLOCKCHAIN_FLOW.md)** - Complete guide to blockchain integration, minting, buying, selling, and all blockchain operations with code examples

### Project Structure

```
pixel-mint/
├── apps/
│   └── web/                    # Main Next.js application
│       ├── actions/            # Server actions
│       ├── app/                # App router pages
│       ├── components/         # React components
│       ├── db/                 # Database schema & client
│       ├── lib/                # Utility functions
│       ├── public/             # Static assets
│       └── constants/          # App constants
├── contracts/                  # Smart contracts
│   ├── contracts/              # Solidity files
│   ├── scripts/                # Deployment scripts
│   └── test/                   # Contract tests
├── packages/
│   ├── eslint-config/          # Shared ESLint config
│   ├── typescript-config/      # Shared TypeScript config
│   └── ui/                     # Shared UI components
└── turbo.json                  # Turborepo config
```

### Key Directories

- **`apps/web/actions/`** - Server-side functions (NFT operations, user management, collections)
- **`apps/web/components/`** - Reusable React components (auth, NFT cards, modals, navigation)
- **`apps/web/lib/blockchain.ts`** - Blockchain integration (minting, buying, selling)
- **`apps/web/db/schema.ts`** - Database schema with Drizzle ORM
- **`contracts/contracts/`** - Smart contracts (NFT & Marketplace)

---

## 🚀 Usage

### For Users

1. **Sign Up / Login**
   - Click "Sign In" button
   - Choose email or Google authentication
   - Enter email and verification code

2. **Connect Wallet**
   - Go to your profile
   - Click "Connect MetaMask"
   - Approve network switch to Polygon Amoy
   - Connect your wallet

3. **Create NFT**
   - Click "Create NFT"
   - Upload artwork (max 100MB)
   - Add name, description, price
   - Select or create collection
   - Mint on blockchain
   - Auto-list on marketplace

4. **Buy NFT**
   - Browse marketplace or collections
   - Click on NFT to view details
   - Click "Buy Now"
   - Confirm MetaMask transaction
   - NFT transfers to your wallet

5. **Sell NFT**
   - Go to your profile
   - Click on owned NFT
   - Set price and list
   - Approve marketplace (one-time)
   - NFT appears on marketplace

### For Developers

#### Running Tests
```bash
# Smart contract tests
cd contracts
npm test

# Frontend tests (if added)
cd apps/web
pnpm test
```

#### Database Management
```bash
# Generate migrations
pnpm db:generate

# Push schema to database
pnpm db:push

# Open Drizzle Studio (visual database editor)
pnpm db:studio
```

#### Linting & Formatting
```bash
# Lint all packages
pnpm lint

# Format code
pnpm format

# Type checking
pnpm check-types
```

#### Building for Production
```bash
# Build all packages
pnpm build

# Build specific package
pnpm build --filter=web
```

---

## 🌐 Deployment

### Frontend (Vercel)

1. Push code to GitHub
2. Import project on [Vercel](https://vercel.com)
3. Add environment variables
4. Deploy

### Database (Neon/Supabase)

1. Create production database
2. Run migrations: `pnpm db:push`
3. Update `DATABASE_URL` in production env

### Smart Contracts

```bash
cd contracts
npx hardhat run scripts/deploy.ts --network polygonAmoy
```

Update contract addresses in production environment variables.

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Next.js** - The React Framework
- **Polygon** - Layer 2 Blockchain
- **OpenZeppelin** - Secure Smart Contracts
- **Shadcn/ui** - Beautiful Components
- **Pinata** - IPFS Storage
- **Alchemy** - Blockchain Infrastructure

---

## 📧 Support

For support, email support@pixelmint.com or open an issue on GitHub.

---

<div align="center">

**Built with ❤️ by the Pixel Mint Team**

[![GitHub](https://img.shields.io/badge/GitHub-MuhammadAbyaz-black?style=flat-square&logo=github)](https://github.com/MuhammadAbyaz)

</div>


To build all apps and packages, run the following command:

```
cd my-turborepo

# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)
turbo build

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
npx turbo build
yarn dlx turbo build
pnpm exec turbo build
```

You can build a specific package by using a [filter](https://turborepo.com/docs/crafting-your-repository/running-tasks#using-filters):

```
# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)
turbo build --filter=docs

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
npx turbo build --filter=docs
yarn exec turbo build --filter=docs
pnpm exec turbo build --filter=docs
```

### Develop

To develop all apps and packages, run the following command:

```
cd my-turborepo

# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)
turbo dev

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
npx turbo dev
yarn exec turbo dev
pnpm exec turbo dev
```

You can develop a specific package by using a [filter](https://turborepo.com/docs/crafting-your-repository/running-tasks#using-filters):

```
# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)
turbo dev --filter=web

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
npx turbo dev --filter=web
yarn exec turbo dev --filter=web
pnpm exec turbo dev --filter=web
```

### Remote Caching

> [!TIP]
> Vercel Remote Cache is free for all plans. Get started today at [vercel.com](https://vercel.com/signup?/signup?utm_source=remote-cache-sdk&utm_campaign=free_remote_cache).

Turborepo can use a technique known as [Remote Caching](https://turborepo.com/docs/core-concepts/remote-caching) to share cache artifacts across machines, enabling you to share build caches with your team and CI/CD pipelines.

By default, Turborepo will cache locally. To enable Remote Caching you will need an account with Vercel. If you don't have an account you can [create one](https://vercel.com/signup?utm_source=turborepo-examples), then enter the following commands:

```
cd my-turborepo

# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)
turbo login

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
npx turbo login
yarn exec turbo login
pnpm exec turbo login
```

This will authenticate the Turborepo CLI with your [Vercel account](https://vercel.com/docs/concepts/personal-accounts/overview).

Next, you can link your Turborepo to your Remote Cache by running the following command from the root of your Turborepo:

```
# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)
turbo link

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
npx turbo link
yarn exec turbo link
pnpm exec turbo link
```

## Useful Links

Learn more about the power of Turborepo:

- [Tasks](https://turborepo.com/docs/crafting-your-repository/running-tasks)
- [Caching](https://turborepo.com/docs/crafting-your-repository/caching)
- [Remote Caching](https://turborepo.com/docs/core-concepts/remote-caching)
- [Filtering](https://turborepo.com/docs/crafting-your-repository/running-tasks#using-filters)
- [Configuration Options](https://turborepo.com/docs/reference/configuration)
- [CLI Usage](https://turborepo.com/docs/reference/command-line-reference)
