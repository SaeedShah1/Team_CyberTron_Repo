import {
  Users, Package, LayoutDashboard, Activity, Wallet, Mail, Webhook,
  Code, FileBarChart, ScrollText, TrendingUp, Sparkles, Moon, Landmark,
  Layers, Box,
} from 'lucide-react';

const iconMap: Record<string, typeof Box> = {
  Users,
  Package,
  LayoutDashboard,
  Activity,
  Wallet,
  Mail,
  Webhook,
  Code,
  FileBarChart,
  ScrollText,
  TrendingUp,
  Sparkles,
  Moon,
  Landmark,
  Layers,
  Box,
};

interface FeatureIconProps {
  name: string;
  className?: string;
}

export function FeatureIcon({ name, className = 'w-5 h-5' }: FeatureIconProps) {
  const Icon = iconMap[name] ?? Box;
  return <Icon className={className} />;
}
