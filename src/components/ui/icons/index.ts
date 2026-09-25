import * as Lucide from 'lucide-react';
import { createMotionIcon } from './create-motion-icon';

export { createMotionIcon } from './create-motion-icon';
export type { MotionIconProps } from './create-motion-icon';

// Re-export all standard Lucide icons as fallback
export * from 'lucide-react';

// ── 100% Vector-Sharp, High-Definition Motion Animated Icons ──────────────

// Navigation & Core Actions
export const Search = createMotionIcon(Lucide.Search, 'pop');
export const SearchIcon = Search;

export const Bell = createMotionIcon(Lucide.Bell, 'wiggle');
export const BellIcon = Bell;

export const Sun = createMotionIcon(Lucide.Sun, 'spin');
export const SunIcon = Sun;

export const Moon = createMotionIcon(Lucide.Moon, 'pop');
export const MoonIcon = Moon;

export const Target = createMotionIcon(Lucide.Target, 'pulse');
export const TargetIcon = Target;

export const ChartPie = createMotionIcon(Lucide.ChartPie || Lucide.PieChart, 'pop');
export const PieChart = ChartPie;
export const ChartPieIcon = ChartPie;

export const LayoutDashboard = createMotionIcon(Lucide.LayoutDashboard, 'pop');
export const LayoutDashboardIcon = LayoutDashboard;

// Financial & System
export const Wallet = createMotionIcon(Lucide.Wallet, 'bounce');
export const WalletIcon = Wallet;

export const CreditCard = createMotionIcon(Lucide.CreditCard, 'pop');
export const CreditCardIcon = CreditCard;

export const TrendingUp = createMotionIcon(Lucide.TrendingUp, 'bounce');
export const TrendingUpIcon = TrendingUp;

export const TrendingDown = createMotionIcon(Lucide.TrendingDown, 'bounce');
export const TrendingDownIcon = TrendingDown;

export const DollarSign = createMotionIcon(Lucide.DollarSign, 'pop');
export const DollarSignIcon = DollarSign;

export const Coins = createMotionIcon(Lucide.Coins, 'pop');
export const CoinsIcon = Coins;

export const Calculator = createMotionIcon(Lucide.Calculator, 'pop');
export const CalculatorIcon = Calculator;

// Security & Auth
export const Shield = createMotionIcon(Lucide.Shield, 'pop');
export const ShieldIcon = Shield;

export const ShieldCheck = createMotionIcon(Lucide.ShieldCheck, 'pop');
export const ShieldCheckIcon = ShieldCheck;

export const AlertTriangle = createMotionIcon(Lucide.TriangleAlert || Lucide.AlertTriangle, 'pulse');
export const AlertTriangleIcon = AlertTriangle;

export const Eye = createMotionIcon(Lucide.Eye, 'pop');
export const EyeIcon = Eye;

export const EyeOff = createMotionIcon(Lucide.EyeOff, 'pop');
export const EyeOffIcon = EyeOff;

export const Lock = createMotionIcon(Lucide.Lock, 'pop');
export const LockIcon = Lock;

export const Key = createMotionIcon(Lucide.Key, 'wiggle');
export const KeyIcon = Key;

export const LogOut = createMotionIcon(Lucide.LogOut, 'bounce');
export const LogOutIcon = LogOut;

// Actions & Feedback
export const Trash2 = createMotionIcon(Lucide.Trash2, 'wiggle');
export const Trash2Icon = Trash2;

export const Plus = createMotionIcon(Lucide.Plus, 'pop');
export const PlusIcon = Plus;

export const Copy = createMotionIcon(Lucide.Copy, 'pop');
export const CopyIcon = Copy;

export const Check = createMotionIcon(Lucide.Check, 'pop');
export const CheckIcon = Check;

export const CircleCheck = createMotionIcon(Lucide.CircleCheck || Lucide.CheckCircle2 || Lucide.CheckCircle, 'pop');
export const CheckCircle = CircleCheck;
export const CheckCircle2 = CircleCheck;
export const CheckCircleIcon = CircleCheck;
export const CheckCircle2Icon = CircleCheck;

export const CircleX = createMotionIcon(Lucide.CircleX || Lucide.XCircle, 'pop');
export const XCircle = CircleX;
export const XCircleIcon = CircleX;

export const X = createMotionIcon(Lucide.X, 'pop');
export const XIcon = X;

export const RefreshCw = createMotionIcon(Lucide.RefreshCw, 'spin');
export const RefreshCwIcon = RefreshCw;

export const RotateCcw = createMotionIcon(Lucide.RotateCcw, 'spin');
export const RotateCcwIcon = RotateCcw;

export const RefreshCcw = createMotionIcon(Lucide.RefreshCcw, 'spin');
export const RefreshCcwIcon = RefreshCcw;

export const History = createMotionIcon(Lucide.History, 'spin');
export const HistoryIcon = History;

export const Archive = createMotionIcon(Lucide.Archive, 'bounce');
export const ArchiveIcon = Archive;

// Directional & Navigation
export const ArrowRight = createMotionIcon(Lucide.ArrowRight, 'bounce');
export const ArrowRightIcon = ArrowRight;

export const ArrowLeft = createMotionIcon(Lucide.ArrowLeft, 'bounce');
export const ArrowLeftIcon = ArrowLeft;

export const ArrowUpDown = createMotionIcon(Lucide.ArrowUpDown, 'bounce');
export const ArrowUpDownIcon = ArrowUpDown;

export const ArrowDownLeft = createMotionIcon(Lucide.ArrowDownLeft, 'bounce');
export const ArrowDownLeftIcon = ArrowDownLeft;

export const ArrowUpRight = createMotionIcon(Lucide.ArrowUpRight, 'bounce');
export const ArrowUpRightIcon = ArrowUpRight;

export const ChevronDown = createMotionIcon(Lucide.ChevronDown, 'bounce');
export const ChevronDownIcon = ChevronDown;

export const ChevronUp = createMotionIcon(Lucide.ChevronUp, 'bounce');
export const ChevronUpIcon = ChevronUp;

export const ChevronLeft = createMotionIcon(Lucide.ChevronLeft, 'bounce');
export const ChevronLeftIcon = ChevronLeft;

export const ChevronRight = createMotionIcon(Lucide.ChevronRight, 'bounce');
export const ChevronRightIcon = ChevronRight;

// General UI & Social
export const Settings = createMotionIcon(Lucide.Settings, 'spin');
export const SettingsIcon = Settings;

export const User = createMotionIcon(Lucide.User, 'pop');
export const UserIcon = User;

export const Users = createMotionIcon(Lucide.Users, 'pop');
export const UsersIcon = Users;

export const UserCheck = createMotionIcon(Lucide.UserCheck, 'pop');
export const UserCheckIcon = UserCheck;

export const Clock = createMotionIcon(Lucide.Clock, 'spin');
export const ClockIcon = Clock;

export const Upload = createMotionIcon(Lucide.Upload, 'bounce');
export const UploadIcon = Upload;

export const Download = createMotionIcon(Lucide.Download, 'bounce');
export const DownloadIcon = Download;

export const Sparkles = createMotionIcon(Lucide.Sparkles, 'pulse');
export const SparklesIcon = Sparkles;

export const Star = createMotionIcon(Lucide.Star, 'pulse');
export const StarIcon = Star;

export const Activity = createMotionIcon(Lucide.Activity, 'pulse');
export const ActivityIcon = Activity;

export const Lightbulb = createMotionIcon(Lucide.Lightbulb, 'pulse');
export const LightbulbIcon = Lightbulb;

export const Layers = createMotionIcon(Lucide.Layers, 'pop');
export const LayersIcon = Layers;

export const MessageSquare = createMotionIcon(Lucide.MessageSquare, 'pop');
export const MessageSquareIcon = MessageSquare;

export const MessageCircle = createMotionIcon(Lucide.MessageCircle, 'pop');
export const MessageCircleIcon = MessageCircle;

export const MessageSquareOff = createMotionIcon(Lucide.MessageSquareOff, 'pop');
export const MessageSquareOffIcon = MessageSquareOff;

export const Play = createMotionIcon(Lucide.Play, 'pop');
export const PlayIcon = Play;

export const Pause = createMotionIcon(Lucide.Pause, 'pop');
export const PauseIcon = Pause;

export const LoaderCircle = createMotionIcon(Lucide.LoaderCircle || Lucide.Loader2, 'spin');
export const Loader2 = LoaderCircle;
export const Loader2Icon = LoaderCircle;

export const FileText = createMotionIcon(Lucide.FileText, 'pop');
export const FileTextIcon = FileText;

export const GripHorizontal = createMotionIcon(Lucide.GripHorizontal, 'pop');
export const GripHorizontalIcon = GripHorizontal;

export const CircleHelp = createMotionIcon(Lucide.CircleHelp || Lucide.HelpCircle, 'pulse');
export const HelpCircle = CircleHelp;
export const HelpCircleIcon = CircleHelp;
export const CircleHelpIcon = CircleHelp;

export const Home = createMotionIcon(Lucide.Home, 'bounce');
export const HomeIcon = Home;

export const Keyboard = createMotionIcon(Lucide.Keyboard, 'pop');
export const KeyboardIcon = Keyboard;

export const Phone = createMotionIcon(Lucide.Phone, 'wiggle');
export const PhoneIcon = Phone;

export const Smile = createMotionIcon(Lucide.Smile, 'pop');
export const SmileIcon = Smile;

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
