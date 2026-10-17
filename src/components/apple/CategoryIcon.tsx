'use client';

import React from 'react';
import {
  Utensils,
  Coffee,
  Pizza,
  Apple,
  Car,
  Bike,
  Fuel,
  Plane,
  Bus,
  Home,
  Zap,
  Wifi,
  Phone,
  ShoppingBag,
  ShoppingCart,
  Gift,
  Shirt,
  Film,
  Gamepad2,
  Music,
  Camera,
  BookOpen,
  HeartPulse,
  Dumbbell,
  Briefcase,
  Laptop,
  Wallet,
  Coins,
  TrendingUp,
  PiggyBank,
  Sparkles,
  Star,
  Users,
  Tag,
  Building2,
  HelpCircle
} from 'lucide-react';

interface CategoryIconProps {
  name: string;
  className?: string;
  style?: React.CSSProperties;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ name, className = 'w-4 h-4', style }) => {
  const iconProps = { className, style };
  const n = (name || '').toLowerCase();

  switch (n) {
    case 'utensils':
    case 'food':
    case 'food & dining':
    case 'dining':
      return <Utensils {...iconProps} />;
    case 'coffee':
    case 'tea':
    case 'chai':
      return <Coffee {...iconProps} />;
    case 'pizza':
    case 'snack':
      return <Pizza {...iconProps} />;
    case 'apple':
    case 'grocery':
    case 'groceries':
      return <Apple {...iconProps} />;
    case 'car':
    case 'cab':
    case 'taxi':
    case 'transportation':
    case 'transport':
      return <Car {...iconProps} />;
    case 'bike':
    case 'motorcycle':
      return <Bike {...iconProps} />;
    case 'fuel':
    case 'petrol':
    case 'diesel':
      return <Fuel {...iconProps} />;
    case 'plane':
    case 'flight':
    case 'travel':
      return <Plane {...iconProps} />;
    case 'bus':
    case 'train':
    case 'metro':
      return <Bus {...iconProps} />;
    case 'home':
    case 'house':
    case 'rent':
    case 'housing':
      return <Home {...iconProps} />;
    case 'zap':
    case 'electricity':
    case 'power':
    case 'bills & utilities':
      return <Zap {...iconProps} />;
    case 'wifi':
    case 'internet':
      return <Wifi {...iconProps} />;
    case 'phone':
    case 'recharge':
    case 'mobile':
      return <Phone {...iconProps} />;
    case 'shoppingbag':
    case 'shopping':
    case 'clothes':
      return <ShoppingBag {...iconProps} />;
    case 'shoppingcart':
    case 'supermarket':
    case 'mart':
      return <ShoppingCart {...iconProps} />;
    case 'gift':
      return <Gift {...iconProps} />;
    case 'shirt':
      return <Shirt {...iconProps} />;
    case 'film':
    case 'movie':
    case 'cinema':
    case 'entertainment':
    case 'ott':
      return <Film {...iconProps} />;
    case 'gamepad2':
    case 'game':
    case 'gaming':
      return <Gamepad2 {...iconProps} />;
    case 'music':
    case 'spotify':
      return <Music {...iconProps} />;
    case 'camera':
      return <Camera {...iconProps} />;
    case 'bookopen':
    case 'book':
    case 'education':
      return <BookOpen {...iconProps} />;
    case 'heartpulse':
    case 'health':
    case 'medical':
    case 'health & fitness':
      return <HeartPulse {...iconProps} />;
    case 'dumbbell':
    case 'gym':
    case 'fitness':
      return <Dumbbell {...iconProps} />;
    case 'briefcase':
    case 'salary':
    case 'job':
      return <Briefcase {...iconProps} />;
    case 'laptop':
    case 'freelance':
    case 'tech':
      return <Laptop {...iconProps} />;
    case 'wallet':
      return <Wallet {...iconProps} />;
    case 'coins':
    case 'cash':
      return <Coins {...iconProps} />;
    case 'trendingup':
    case 'investment':
    case 'stocks':
    case 'crypto':
      return <TrendingUp {...iconProps} />;
    case 'piggybank':
    case 'savings':
      return <PiggyBank {...iconProps} />;
    case 'sparkles':
      return <Sparkles {...iconProps} />;
    case 'star':
      return <Star {...iconProps} />;
    case 'users':
    case 'family':
    case 'friends':
      return <Users {...iconProps} />;
    case 'building2':
    case 'bank':
      return <Building2 {...iconProps} />;
    default:
      return <Tag {...iconProps} />;
  }
};
