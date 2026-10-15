import React from 'react';
import {
  Utensils,
  Car,
  ShoppingBag,
  Zap,
  BookOpen,
  HeartPulse,
  Film,
  MoreHorizontal,
  Briefcase,
  Laptop,
  TrendingUp,
  ArrowDownLeft,
  Tag,
  Coffee,
  Home,
  Gift,
  Dumbbell,
  Plane,
} from 'lucide-react';

const ICON_MAP = {
  utensils: Utensils,
  car: Car,
  'shopping-bag': ShoppingBag,
  zap: Zap,
  'book-open': BookOpen,
  'heart-pulse': HeartPulse,
  film: Film,
  'more-horizontal': MoreHorizontal,
  briefcase: Briefcase,
  laptop: Laptop,
  'trending-up': TrendingUp,
  'arrow-down-left': ArrowDownLeft,
  tag: Tag,
  coffee: Coffee,
  home: Home,
  gift: Gift,
  dumbbell: Dumbbell,
  plane: Plane,
};

export const CategoryIcon = ({ iconName, className = 'w-4 h-4', color }) => {
  const IconComponent = ICON_MAP[iconName] || Tag;
  return <IconComponent className={className} style={color ? { color } : undefined} />;
};
