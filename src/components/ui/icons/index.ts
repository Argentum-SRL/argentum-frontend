// Base wrapper components from Animate UI
export {
  AnimateIcon,
  IconWrapper,
  useAnimateIconContext,
  getVariants,
  type IconProps,
  type IconWrapperProps,
  type AnimateIconProps,
} from '@/components/animate-ui/icons/icon';

export { createMotionIcon } from './create-motion-icon';
import { createMotionIcon } from './create-motion-icon';
import * as Lucide from 'lucide-react';

// Re-export all standard Lucide icons as fallback
export * from 'lucide-react';

// ── Handcrafted & Specialized Animated Icons ─────────────────────────────
// Navigation & Core Actions
export { Search, SearchIcon } from '@/components/animate-ui/icons/search';
export { Bell, BellIcon } from '@/components/animate-ui/icons/bell';
export { Sun, SunIcon } from '@/components/animate-ui/icons/sun';
export { Moon, MoonIcon } from '@/components/animate-ui/icons/moon';
export { Target, TargetIcon } from '@/components/animate-ui/icons/target';
export { ChartPie, ChartPie as PieChart, ChartPieIcon } from '@/components/animate-ui/icons/chart-pie';
export { LayoutDashboard, LayoutDashboard as LayoutDashboardIcon } from '@/components/animate-ui/icons/layout-dashboard';

// Financial & System
export { Wallet, WalletIcon } from '@/components/animate-ui/icons/wallet';
export { CreditCard, CreditCardIcon } from '@/components/animate-ui/icons/credit-card';
export { TrendingUp, TrendingUpIcon } from '@/components/animate-ui/icons/trending-up';
export { TrendingDown, TrendingDownIcon } from '@/components/animate-ui/icons/trending-down';
export { DollarSign, DollarSignIcon } from '@/components/animate-ui/icons/dollar-sign';
export { Coins, CoinsIcon } from '@/components/animate-ui/icons/coins';
export { Calculator, CalculatorIcon } from '@/components/animate-ui/icons/calculator';

// Security & Auth
export { Shield, ShieldIcon } from '@/components/animate-ui/icons/shield';
export { ShieldCheck, ShieldCheckIcon } from '@/components/animate-ui/icons/shield-check';
export { AlertTriangle, AlertTriangleIcon } from '@/components/animate-ui/icons/alert-triangle';
export { Eye, EyeIcon } from '@/components/animate-ui/icons/eye';
export { EyeOff, EyeOffIcon } from '@/components/animate-ui/icons/eye-off';
export { Lock, Lock as LockIcon } from '@/components/animate-ui/icons/lock';
export { Key, Key as KeyIcon } from '@/components/animate-ui/icons/key';
export { LogOut, LogOut as LogOutIcon } from '@/components/animate-ui/icons/log-out';

// Actions & Feedback
export { Trash2, Trash2 as Trash2Icon } from '@/components/animate-ui/icons/trash-2';
export { Plus, Plus as PlusIcon } from '@/components/animate-ui/icons/plus';
export { Copy, Copy as CopyIcon } from '@/components/animate-ui/icons/copy';
export { Check, Check as CheckIcon } from '@/components/animate-ui/icons/check';
export {
  CircleCheck,
  CircleCheck as CheckCircle,
  CircleCheck as CheckCircle2,
  CircleCheck as CheckCircleIcon,
  CircleCheck as CheckCircle2Icon,
} from '@/components/animate-ui/icons/circle-check';
export {
  CircleX,
  CircleX as XCircle,
  CircleX as XCircleIcon,
} from '@/components/animate-ui/icons/circle-x';
export { X, X as XIcon } from '@/components/animate-ui/icons/x';
export { RefreshCw, RefreshCw as RefreshCwIcon } from '@/components/animate-ui/icons/refresh-cw';
export { RotateCcw, RotateCcw as RotateCcwIcon } from '@/components/animate-ui/icons/rotate-ccw';
export { RefreshCcw, RefreshCcw as RefreshCcwIcon } from '@/components/animate-ui/icons/refresh-ccw';
export { History, HistoryIcon } from '@/components/animate-ui/icons/history';
export { Archive, ArchiveIcon } from '@/components/animate-ui/icons/archive';

// Directional & Navigation
export { ArrowRight, ArrowRight as ArrowRightIcon } from '@/components/animate-ui/icons/arrow-right';
export { ArrowLeft, ArrowLeft as ArrowLeftIcon } from '@/components/animate-ui/icons/arrow-left';
export { ArrowUpDown, ArrowUpDown as ArrowUpDownIcon } from '@/components/animate-ui/icons/arrow-up-down';
export { ArrowDownLeft, ArrowDownLeft as ArrowDownLeftIcon } from '@/components/animate-ui/icons/arrow-down-left';
export { ArrowUpRight, ArrowUpRight as ArrowUpRightIcon } from '@/components/animate-ui/icons/arrow-up-right';
export { ChevronDown, ChevronDown as ChevronDownIcon } from '@/components/animate-ui/icons/chevron-down';
export { ChevronUp, ChevronUp as ChevronUpIcon } from '@/components/animate-ui/icons/chevron-up';
export { ChevronLeft, ChevronLeft as ChevronLeftIcon } from '@/components/animate-ui/icons/chevron-left';
export { ChevronRight, ChevronRight as ChevronRightIcon } from '@/components/animate-ui/icons/chevron-right';

// General UI & Social
export { Settings, Settings as SettingsIcon } from '@/components/animate-ui/icons/settings';
export { User, User as UserIcon } from '@/components/animate-ui/icons/user';
export { Users, Users as UsersIcon } from '@/components/animate-ui/icons/users';
export { UserCheck, UserCheck as UserCheckIcon } from '@/components/animate-ui/icons/user-check';
export { Clock, Clock as ClockIcon } from '@/components/animate-ui/icons/clock';
export { Upload, Upload as UploadIcon } from '@/components/animate-ui/icons/upload';
export { Download, Download as DownloadIcon } from '@/components/animate-ui/icons/download';
export { Sparkles, Sparkles as SparklesIcon } from '@/components/animate-ui/icons/sparkles';
export { Star, Star as StarIcon } from '@/components/animate-ui/icons/star';
export { Activity, Activity as ActivityIcon } from '@/components/animate-ui/icons/activity';
export { Lightbulb, Lightbulb as LightbulbIcon } from '@/components/animate-ui/icons/lightbulb';
export { Layers, Layers as LayersIcon } from '@/components/animate-ui/icons/layers';
export { MessageSquare, MessageSquare as MessageSquareIcon } from '@/components/animate-ui/icons/message-square';
export { MessageCircle, MessageCircle as MessageCircleIcon } from '@/components/animate-ui/icons/message-circle';
export { MessageSquareOff, MessageSquareOff as MessageSquareOffIcon } from '@/components/animate-ui/icons/message-square-off';
export { Play, Play as PlayIcon } from '@/components/animate-ui/icons/play';
export { Pause, Pause as PauseIcon } from '@/components/animate-ui/icons/pause';
export {
  LoaderCircle,
  LoaderCircle as Loader2,
  LoaderCircle as Loader2Icon,
} from '@/components/animate-ui/icons/loader-circle';
export { FileText, FileText as FileTextIcon } from '@/components/animate-ui/icons/file-text';
export { GripHorizontal, GripHorizontal as GripHorizontalIcon } from '@/components/animate-ui/icons/grip-horizontal';
export const CircleHelp = createMotionIcon(Lucide.CircleHelp, 'pulse');
export const HelpCircle = CircleHelp;
export const HelpCircleIcon = CircleHelp;
export const CircleHelpIcon = CircleHelp;
export { Home, Home as HomeIcon } from '@/components/animate-ui/icons/home';
export { Keyboard, Keyboard as KeyboardIcon } from '@/components/animate-ui/icons/keyboard';
export { Phone, Phone as PhoneIcon } from '@/components/animate-ui/icons/phone';
export { Smile, Smile as SmileIcon } from '@/components/animate-ui/icons/smile';

// ── Additional Animated Icons with Spring & Micro-Physics ────────────────
export const AlertCircle = createMotionIcon(Lucide.AlertCircle, 'pulse');
export const ArrowDownUp = createMotionIcon(Lucide.ArrowDownUp, 'spin');
export const ArrowLeftRight = createMotionIcon(Lucide.ArrowLeftRight, 'bounce');
export const ArrowRightLeft = createMotionIcon(Lucide.ArrowRightLeft, 'bounce');
export const Banknote = createMotionIcon(Lucide.Banknote, 'wiggle');
export const Calendar = createMotionIcon(Lucide.Calendar, 'bounce');
export const Camera = createMotionIcon(Lucide.Camera, 'pop');
export const Edit = createMotionIcon(Lucide.Edit, 'wiggle');
export const Edit2 = createMotionIcon(Lucide.Edit2, 'wiggle');
export const Edit3 = createMotionIcon(Lucide.Edit3, 'wiggle');
export const FileSpreadsheet = createMotionIcon(Lucide.FileSpreadsheet, 'pop');
export const Filter = createMotionIcon(Lucide.Filter, 'wiggle');
export const Globe = createMotionIcon(Lucide.Globe, 'spin');
export const Hash = createMotionIcon(Lucide.Hash, 'pop');
export const Info = createMotionIcon(Lucide.Info, 'pulse');
export const KeyRound = createMotionIcon(Lucide.KeyRound, 'wiggle');
export const Mail = createMotionIcon(Lucide.Mail, 'bounce');
export const MoreHorizontal = createMotionIcon(Lucide.MoreHorizontal, 'pop');
export const MoreVertical = createMotionIcon(Lucide.MoreVertical, 'pop');
export const PauseCircle = createMotionIcon(Lucide.PauseCircle, 'pop');
export const Pencil = createMotionIcon(Lucide.Pencil, 'wiggle');
export const Percent = createMotionIcon(Lucide.Percent, 'pop');
export const PlayCircle = createMotionIcon(Lucide.PlayCircle, 'pop');
export const Repeat = createMotionIcon(Lucide.Repeat, 'spin');
export const Save = createMotionIcon(Lucide.Save, 'bounce');
export const Scale = createMotionIcon(Lucide.Scale, 'wiggle');
export const ShieldAlert = createMotionIcon(Lucide.ShieldAlert, 'pulse');
export const StickyNote = createMotionIcon(Lucide.StickyNote, 'wiggle');
export const Trophy = createMotionIcon(Lucide.Trophy, 'bounce');
export const Unlink = createMotionIcon(Lucide.Unlink, 'pop');
export const UserX = createMotionIcon(Lucide.UserX, 'wiggle');
