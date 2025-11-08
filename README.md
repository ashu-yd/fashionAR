# Fashion TryOn Store

A modern fashion e-commerce web application with integrated WebAR try-on capabilities. Built with React, TypeScript, Vite, and Supabase.

## Features

- **Authentication**: Email/password authentication with Supabase Auth
- **Product Catalog**: Browse products with category filtering
- **AR Try-On**: View products in augmented reality using model-viewer
- **Shopping Cart**: Add items, adjust quantities, and manage cart
- **Checkout**: Mock checkout flow with order placement
- **Responsive Design**: Works seamlessly on desktop and mobile

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase (Database + Authentication + Storage)
- **AR**: Google model-viewer web component
- **Icons**: Lucide React

## Setup Instructions

### 1. Prerequisites

- Node.js 18+ installed
- A Supabase account and project

### 2. Environment Configuration

Copy the `.env.example` file to `.env`:

```bash
cp .env.example .env
```

Update the `.env` file with your Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Database Setup

The database schema has already been applied via migrations. You should see these tables in your Supabase project:

- `profiles` - User profiles with admin flag
- `products` - Product catalog with AR model URLs
- `cart` - User shopping carts
- `orders` - Order history

### 5. Run the Application

```bash
npm run dev
```

The application will start at `http://localhost:5173`

## Project Structure

```
src/
├── components/
│   ├── AuthPage.tsx         # Login/signup page
│   ├── HomePage.tsx         # Product listing page
│   ├── ProductCard.tsx      # Individual product card component
│   ├── TryOnPage.tsx        # AR try-on experience
│   ├── CartPage.tsx         # Shopping cart
│   ├── CheckoutPage.tsx     # Checkout flow
│   └── Router.tsx           # Simple client-side router
├── contexts/
│   └── AuthContext.tsx      # Authentication context and hooks
├── lib/
│   └── supabase.ts          # Supabase client and type definitions
├── App.tsx                  # Main app component
└── main.tsx                 # Application entry point
```

## Database Schema

### profiles
- `id` (uuid, FK to auth.users) - User ID
- `name` (text) - Display name
- `email` (text) - Email address
- `is_admin` (boolean) - Admin access flag
- `created_at` (timestamptz) - Account creation timestamp

### products
- `id` (uuid, PK) - Product ID
- `name` (text) - Product name
- `description` (text) - Product description
- `price` (numeric) - Product price
- `image_url` (text) - Product thumbnail URL
- `model_url` (text) - 3D model URL (GLB/GLTF)
- `category` (text) - Product category
- `created_at` (timestamptz) - Product creation timestamp

### cart
- `id` (uuid, PK) - Cart item ID
- `user_id` (uuid, FK to profiles) - User reference
- `product_id` (uuid, FK to products) - Product reference
- `quantity` (int) - Quantity selected
- `added_at` (timestamptz) - Item addition timestamp

### orders
- `id` (uuid, PK) - Order ID
- `user_id` (uuid, FK to profiles) - Buyer reference
- `total_amount` (numeric) - Total price
- `created_at` (timestamptz) - Order placement timestamp

## Security

All tables have Row Level Security (RLS) enabled:

- Users can only view/edit their own profile, cart, and orders
- All users can view products
- Only admin users can manage products
- Strict ownership checks on all operations

## WebAR Try-On

The AR feature uses Google's `model-viewer` web component:

- Works on both Android (Chrome) and iOS (Safari)
- Supports WebXR, Scene Viewer, and Quick Look AR modes
- Users can view products in 3D and place them in real-world space
- Supports GLB, GLTF, and USDZ model formats

## Demo Data

The application comes with 6 sample products across different categories:
- Jackets
- Accessories (sunglasses, watches)
- Bags
- Shoes
- Shirts

## Future Enhancements

To extend this application, consider adding:

1. **Admin Panel**: Upload new products with images and 3D models
2. **Supabase Storage**: Store product images and models in Supabase buckets
3. **Payment Integration**: Add Stripe or other payment gateway
4. **Order History**: View past orders and tracking
5. **Product Reviews**: User ratings and reviews
6. **Search**: Full-text search for products
7. **Wishlist**: Save favorite items
8. **Social Sharing**: Share AR try-ons on social media

## License

MIT
