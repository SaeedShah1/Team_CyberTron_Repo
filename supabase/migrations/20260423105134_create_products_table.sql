/*
  # Create Products Table

  1. New Tables
    - `products`
      - `id` (uuid, primary key) - unique identifier
      - `name` (text, not null) - product name
      - `description` (text, default '') - product description
      - `category` (text, not null) - product category
      - `price` (numeric, not null, default 0) - product price
      - `currency` (text, not null, default 'USD') - price currency
      - `status` (text, not null, default 'active') - active or inactive
      - `sku` (text, unique) - stock keeping unit
      - `stock` (integer, not null, default 0) - available inventory
      - `image_url` (text) - product image URL
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `products` table
    - Add anon CRUD policies (generic platform, no auth)

  3. Indexes
    - Index on category for filter queries
    - Index on status for filter queries
    - Index on name for search queries
    - Index on price for sort/filter queries
*/

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  category text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'active',
  sku text UNIQUE,
  stock integer NOT NULL DEFAULT 0,
  image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon select products"
  ON products FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon insert products"
  ON products FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon update products"
  ON products FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anon delete products"
  ON products FOR DELETE
  TO anon
  USING (true);

CREATE INDEX IF NOT EXISTS idx_products_category ON products (category);
CREATE INDEX IF NOT EXISTS idx_products_status ON products (status);
CREATE INDEX IF NOT EXISTS idx_products_name ON products (name);
CREATE INDEX IF NOT EXISTS idx_products_price ON products (price);