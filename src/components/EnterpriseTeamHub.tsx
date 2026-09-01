import React, { useState, useEffect, useMemo } from "react";
import { 
  Building2, 
  Radio, 
  CheckCircle2, 
  Clock, 
  Users, 
  BarChart3, 
  ShieldCheck, 
  Plus, 
  Send, 
  Play, 
  Pause, 
  Sparkles, 
  Volume2, 
  ChevronRight, 
  AlertCircle, 
  UserCheck, 
  UserX, 
  FileText, 
  TrendingUp, 
  Share2, 
  RefreshCw,
  Layers,
  Award,
  Check,
  X,
  Eye,
  Sliders,
  Settings
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  BarChart, 
  Bar, 
  CartesianGrid 
} from "recharts";
import { 
  EnterpriseOrganization, 
  EnterpriseMember, 
  EnterpriseBroadcastChannel, 
  EnterpriseBroadcastApprovalItem, 
  EnterpriseAnalyticsMetrics,
  EnterpriseRole,
  ApprovalStatus,
  EnterpriseSubTab 
} from "../types";
import { enterpriseService } from "../services/enterpriseService";
import { cn } from "../lib/utils";

interface EnterpriseTeamHubProps {
  uiLanguage: "vi" | "en";
  onSendToStudio?: (script: string, title: string) => void;
  onPlayBroadcastAudio?: (title: string) => void;
}

export const EnterpriseTeamHub: React.FC<EnterpriseTeamHubProps> = ({
  uiLanguage,
  onSendToStudio,
  onPlayBroadcastAudio
}) => {
  const [activeSubTab, setActiveSubTab] = useState<EnterpriseSubTab>("channels");
  const [organizations, setOrganizations] = useState<EnterpriseOrganization[]>([]);
  const [activeOrg, setActiveOrg] = useState<EnterpriseOrganization | null>(null);
  const [currentRole, setCurrentRole] = useState<EnterpriseRole>("station_lead");
  const [channels, setChannels] = useState<EnterpriseBroadcastChannel[]>([]);
  const [approvals, setApprovals] = useState<EnterpriseBroadcastApprovalItem[]>([]);
  const [members, setMembers] = useState<EnterpriseMember[]>([]);
  const [metrics, setMetrics] = useState<EnterpriseAnalyticsMetrics | null>(null);

  // Modals & Inspection states
  const [selectedApproval, setSelectedApproval] = useState<EnterpriseBroadcastApprovalItem | null>(null);
  const [isScriptModalOpen, setIsScriptModalOpen] = useState(false);
  const [isNewChannelModalOpen, setIsNewChannelModalOpen] = useState(false);
  const [isInviteMemberModalOpen, setIsInviteMemberModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Channel Form State
  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelDesc, setNewChannelDesc] = useState("");
  const [newChannelFreq, setNewChannelFreq] = useState<"daily_morning" | "daily_evening" | "instant_alert">("daily_morning");
  const [newChannelDept, setNewChannelDept] = useState("Tất cả phòng ban");

  // New Member Form State
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<EnterpriseRole>("producer");
  const [newMemberDept, setNewMemberDept] = useState("Marketing & Truyền Thông");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadData = () => {
    const orgs = enterpriseService.getOrganizations();
    const active = enterpriseService.getActiveOrganization();
    setOrganizations(orgs);
    setActiveOrg(active);
    if (active) {
      setChannels(enterpriseService.getChannels(active.id));
      setApprovals(enterpriseService.getApprovalQueue(active.id));
      setMembers(enterpriseService.getMembers(active.id));
      setMetrics(enterpriseService.getAnalyticsMetrics(active.id));
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSwitchOrg = (orgId: string) => {
    enterpriseService.setActiveOrgId(orgId);
    loadData();
    showToast(
      uiLanguage === "vi" 
        ? `Đã chuyển sang tổ chức: ${organizations.find(o => o.id === orgId)?.name}` 
        : `Switched to organization: ${organizations.find(o => o.id === orgId)?.name}`
    );
  };

  const handleApproveAndAir = (item: EnterpriseBroadcastApprovalItem) => {
    enterpriseService.updateApprovalStatus(item.id, "live_on_air");
    loadData();
    showToast(
      uiLanguage === "vi" 
        ? `📻 Đã duyệt & phát sóng trực tiếp bản tin "${item.title}" tới thính giả doanh nghiệp!` 
        : `📻 Approved & Aired broadcast "${item.title}" to enterprise listeners!`
    );
  };

  const handleReject = (item: EnterpriseBroadcastApprovalItem) => {
    enterpriseService.updateApprovalStatus(item.id, "rejected", undefined, "Cần bổ sung dữ liệu và kiểm tra lại nguồn tin.");
    loadData();
    showToast(
      uiLanguage === "vi" 
        ? `Đã từ chối bản tin "${item.title}". Đã gửi phản hồi cho người soạn.` 
        : `Rejected "${item.title}". Feedback sent to author.`
    );
  };

  const handleToggleAutoPublish = (channelId: string) => {
    enterpriseService.toggleChannelAutoPublish(channelId);
    loadData();
    showToast(
      uiLanguage === "vi" 
        ? "Đã cập nhật trạng thái tự động phát sóng!" 
        : "Auto-publish schedule updated!"
    );
  };

  const handleCreateChannel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;

    enterpriseService.addChannel({
      name: newChannelName,
      description: newChannelDesc || (uiLanguage === "vi" ? "Kênh phát thanh chuyên đề doanh nghiệp" : "Enterprise broadcast channel"),
      frequency: newChannelFreq,
      targetDepartments: [newChannelDept],
      assignedProducerIds: ["mem-1"],
      activeListenersCount: activeOrg?.memberCount || 20,
      autoPublishEnabled: true,
      currentEpisodeTitle: uiLanguage === "vi" ? "Chưa có số phát sóng" : "No episodes aired yet",
      scheduleTime: newChannelFreq === "daily_morning" ? "07:30 AM" : "17:30 PM",
      bannerGradient: "from-indigo-600 to-purple-900"
    });

    setIsNewChannelModalOpen(false);
    setNewChannelName("");
    setNewChannelDesc("");
    loadData();
    showToast(
      uiLanguage === "vi" 
        ? "🎉 Đã tạo kênh phát thanh mới thành công!" 
        : "🎉 New broadcast channel created successfully!"
    );
  };

  const handleInviteMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim() || !newMemberEmail.trim()) return;

    enterpriseService.addMember({
      name: newMemberName,
      email: newMemberEmail,
      role: newMemberRole,
      department: newMemberDept,
      status: "active",
      permissions: newMemberRole === "station_lead" 
        ? ["all_access", "approve_broadcast", "publish_live"] 
        : ["create_script", "synthesize_audio"]
    });

    setIsInviteMemberModalOpen(false);
    setNewMemberName("");
    setNewMemberEmail("");
    loadData();
    showToast(
      uiLanguage === "vi" 
        ? `Đã thêm thành viên ${newMemberName} vào đội ngũ!` 
        : `Added member ${newMemberName} to the team!`
    );
  };

  const getRoleLabel = (role: EnterpriseRole) => {
    if (uiLanguage === "vi") {
      switch (role) {
        case "station_lead": return "Tổng Biên Tập (Station Lead)";
        case "producer": return "Biên Tập Viên (Producer)";
        case "audio_engineer": return "Kỹ Thuật Viên (Audio Eng)";
        case "listener": return "Thính Giả Doanh Nghiệp (Listener)";
      }
    }
    switch (role) {
      case "station_lead": return "Station Lead";
      case "producer": return "Editorial Producer";
      case "audio_engineer": return "Sound Engineer";
      case "listener": return "Enterprise Listener";
    }
  };

  const getStatusBadge = (status: ApprovalStatus) => {
    switch (status) {
      case "live_on_air":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse">
            <Radio className="w-3 h-3 text-emerald-400" />
            {uiLanguage === "vi" ? "Đang Phát Sóng" : "Live On Air"}
          </span>
        );
      case "approved":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30">
            <CheckCircle2 className="w-3 h-3 text-blue-400" />
            {uiLanguage === "vi" ? "Đã Duyệt" : "Approved"}
          </span>
        );
      case "under_review":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <Clock className="w-3 h-3 text-amber-400" />
            {uiLanguage === "vi" ? "Chờ Tổng Biên Tập Duyệt" : "Pending Review"}
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
            <X className="w-3 h-3 text-rose-400" />
            {uiLanguage === "vi" ? "Yêu Cầu Sửa" : "Needs Revision"}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-zinc-700/50 text-zinc-300 border border-zinc-600">
            {uiLanguage === "vi" ? "Bản Nháp" : "Draft"}
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* TOAST ALERT */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-6 z-50 px-4 py-3 bg-zinc-900/95 border border-indigo-500/50 text-indigo-200 text-xs font-semibold rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-indigo-400" />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOP HERO / ENTERPRISE ORG SWITCHER BAR */}
      <div className="relative overflow-hidden rounded-3xl border border-border-primary bg-gradient-to-br from-surface-overlay via-surface-card to-surface-card p-6 md:p-8 shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] bg-indigo-600 text-white shadow-md shadow-indigo-600/30 flex items-center gap-1.5">
                <Building2 className="w-3 h-3" />
                COMMUTECAST ENTERPRISE
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Tier: {activeOrg?.tier.toUpperCase()}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                {activeOrg?.memberCount} {uiLanguage === "vi" ? "Thành Viên" : "Members"}
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-text-primary flex items-center gap-3">
              {activeOrg?.name || "Enterprise Station"}
            </h2>

            <p className="text-sm text-text-secondary max-w-2xl">
              {uiLanguage === "vi"
                ? "Không gian cộng tác sản xuất bản tin phát thanh doanh nghiệp, quản lý kênh truyền thông nội bộ, phân quyền biên tập và kiểm soát phê duyệt phát sóng tập trung."
                : "Collaborative enterprise podcast & briefing co-production workspace, internal broadcast channels, RBAC editorial workflows and centralized broadcast approval."}
            </p>
          </div>

          {/* Org Selector & Role Switcher */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-surface-subtle/80 p-2 rounded-2xl border border-border-subtle">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-text-muted px-2 block">
                {uiLanguage === "vi" ? "Tổ Chức Doanh Nghiệp" : "Active Organization"}
              </label>
              <select
                value={activeOrg?.id || ""}
                onChange={(e) => handleSwitchOrg(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 bg-surface-card border border-border-primary rounded-xl text-xs font-bold text-text-primary focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {organizations.map(org => (
                  <option key={org.id} value={org.id}>
                    🏢 {org.name} ({org.memberCount} p)
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-text-muted px-2 block">
                {uiLanguage === "vi" ? "Vai Trò Của Bạn" : "Testing Persona"}
              </label>
              <select
                value={currentRole}
                onChange={(e) => {
                  const r = e.target.value as EnterpriseRole;
                  setCurrentRole(r);
                  showToast(uiLanguage === "vi" ? `Đã chuyển vai trò: ${getRoleLabel(r)}` : `Role switched to: ${getRoleLabel(r)}`);
                }}
                className="w-full sm:w-auto px-3 py-2 bg-indigo-950/60 border border-indigo-500/40 rounded-xl text-xs font-bold text-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="station_lead">👑 {getRoleLabel("station_lead")}</option>
                <option value="producer">✍️ {getRoleLabel("producer")}</option>
                <option value="audio_engineer">🎛️ {getRoleLabel("audio_engineer")}</option>
                <option value="listener">🎧 {getRoleLabel("listener")}</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* SUB-TAB WORKSTATIONS NAVIGATION */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border-primary pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveSubTab("channels")}
            className={cn(
              "px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2",
              activeSubTab === "channels"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                : "text-text-secondary hover:text-text-primary hover:bg-surface-subtle"
            )}
          >
            <Radio className="w-4 h-4" />
            {uiLanguage === "vi" ? "Kênh Phát Thanh" : "Broadcast Channels"}
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-white/20">
              {channels.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab("approval")}
            className={cn(
              "px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2",
              activeSubTab === "approval"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                : "text-text-secondary hover:text-text-primary hover:bg-surface-subtle"
            )}
          >
            <CheckCircle2 className="w-4 h-4" />
            {uiLanguage === "vi" ? "Hàng Đợi Duyệt Tin" : "Approval Queue"}
            {approvals.filter(a => a.status === "under_review").length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-amber-400 text-black font-extrabold animate-pulse">
                {approvals.filter(a => a.status === "under_review").length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab("team")}
            className={cn(
              "px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2",
              activeSubTab === "team"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                : "text-text-secondary hover:text-text-primary hover:bg-surface-subtle"
            )}
          >
            <Users className="w-4 h-4" />
            {uiLanguage === "vi" ? "Đội Ngũ & Phân Quyền" : "Team & RBAC"}
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-white/20">
              {members.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab("analytics")}
            className={cn(
              "px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2",
              activeSubTab === "analytics"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                : "text-text-secondary hover:text-text-primary hover:bg-surface-subtle"
            )}
          >
            <BarChart3 className="w-4 h-4" />
            {uiLanguage === "vi" ? "Phân Tích Hiệu Quả" : "Analytics & Reach"}
          </button>
        </div>

        {/* Action button based on active subtab */}
        <div className="flex items-center gap-2">
          {activeSubTab === "channels" && (
            <button
              onClick={() => setIsNewChannelModalOpen(true)}
              className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              {uiLanguage === "vi" ? "Tạo Kênh Mới" : "New Channel"}
            </button>
          )}

          {activeSubTab === "team" && (
            <button
              onClick={() => setIsInviteMemberModalOpen(true)}
              className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              {uiLanguage === "vi" ? "Mời Thành Viên" : "Invite Member"}
            </button>
          )}
        </div>
      </div>

      {/* SUBTAB 1: CHANNELS & BROADCAST STATIONS */}
      {activeSubTab === "channels" && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {channels.map((chan) => (
              <div
                key={chan.id}
                className="group relative overflow-hidden rounded-2xl border border-border-primary bg-surface-card hover:border-indigo-500/50 transition-all duration-300 p-6 flex flex-col justify-between shadow-lg"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        {chan.frequency === "daily_morning" ? "🌅 Sáng Hàng Ngày" : chan.frequency === "daily_evening" ? "⚡ Chiều Tối" : "🚨 Khẩn Cấp"}
                      </span>
                      <h3 className="text-base font-black text-text-primary group-hover:text-indigo-400 transition-colors">
                        {chan.name}
                      </h3>
                    </div>
                    
                    <button
                      onClick={() => handleToggleAutoPublish(chan.id)}
                      title={chan.autoPublishEnabled ? "Đang bật phát tự động" : "Đang tắt phát tự động"}
                      className={cn(
                        "p-2 rounded-xl text-xs font-bold border transition-all",
                        chan.autoPublishEnabled 
                          ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" 
                          : "bg-zinc-800 text-zinc-500 border-zinc-700"
                      )}
                    >
                      {chan.autoPublishEnabled ? <Radio className="w-4 h-4 animate-pulse" /> : <Pause className="w-4 h-4" />}
                    </button>
                  </div>

                  <p className="text-xs text-text-secondary line-clamp-2">
                    {chan.description}
                  </p>

                  <div className="p-3 bg-surface-subtle/80 rounded-xl border border-border-subtle space-y-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-text-muted block">
                      {uiLanguage === "vi" ? "Số phát sóng hiện tại" : "Current Broadcast"}
                    </span>
                    <p className="text-xs font-bold text-text-primary line-clamp-1">
                      {chan.currentEpisodeTitle || "Bản tin đang chuẩn bị..."}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-text-muted font-mono pt-1 border-t border-border-subtle">
                      <span>⏰ {chan.scheduleTime}</span>
                      <span>👥 {chan.activeListenersCount} {uiLanguage === "vi" ? "thính giả" : "listeners"}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-border-subtle flex items-center justify-between gap-2">
                  <div className="flex -space-x-2">
                    <div className="w-6 h-6 rounded-full bg-blue-600 border-2 border-surface-card flex items-center justify-center text-[9px] font-bold text-white">H</div>
                    <div className="w-6 h-6 rounded-full bg-purple-600 border-2 border-surface-card flex items-center justify-center text-[9px] font-bold text-white">Q</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        if (onPlayBroadcastAudio) {
                          onPlayBroadcastAudio(chan.name);
                        } else {
                          showToast(uiLanguage === "vi" ? `Đang kết nối luồng phát thanh "${chan.name}"` : `Streaming channel "${chan.name}"`);
                        }
                      }}
                      className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600 hover:text-white text-indigo-300 text-xs font-bold rounded-lg border border-indigo-500/30 transition-all flex items-center gap-1.5"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      {uiLanguage === "vi" ? "Nghe Thử" : "Listen"}
                    </button>

                    <button
                      onClick={() => {
                        if (onSendToStudio) {
                          onSendToStudio(`Bản tin phát thanh cho kênh ${chan.name}...`, chan.name);
                        }
                        showToast(uiLanguage === "vi" ? "Đã chuyển kịch bản vào Studio!" : "Sent channel draft to Studio!");
                      }}
                      className="px-3 py-1.5 bg-surface-subtle hover:bg-surface-hover text-text-primary text-xs font-bold rounded-lg border border-border-primary transition-all flex items-center gap-1"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                      {uiLanguage === "vi" ? "Soạn Tin" : "Draft"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 2: APPROVAL & EDITORIAL QUEUE */}
      {activeSubTab === "approval" && (
        <div className="space-y-6 animate-fade-in">
          <div className="p-4 bg-surface-subtle rounded-2xl border border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-text-primary">
                  {uiLanguage === "vi" ? "Quy Trình Phê Duyệt Phát Sóng (Editorial Gate)" : "Broadcast Approval Gate"}
                </h4>
                <p className="text-xs text-text-muted">
                  {uiLanguage === "vi" 
                    ? "Tổng Biên Tập kiểm tra kịch bản AI, rà soát tính xác thực và kích hoạt phát sóng trực tiếp tới doanh nghiệp." 
                    : "Station Lead inspects AI drafts, verifies corporate compliance and unlocks live broadcast airing."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-text-secondary">
                {uiLanguage === "vi" ? "Quyền hạn của bạn:" : "Your permission:"}
              </span>
              <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {getRoleLabel(currentRole)}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {approvals.map((item) => (
              <div
                key={item.id}
                className="p-6 bg-surface-card rounded-2xl border border-border-primary hover:border-border-hover transition-all flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 shadow-md"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {getStatusBadge(item.status)}
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface-subtle text-text-muted border border-border-subtle">
                      {item.channelName}
                    </span>
                    <span className="text-[10px] text-text-muted font-mono">
                      ⏱️ {Math.floor(item.durationSec / 60)}m{item.durationSec % 60}s ({item.wordCount} {uiLanguage === "vi" ? "từ" : "words"})
                    </span>
                  </div>

                  <h3 className="text-base font-black text-text-primary">
                    {item.title}
                  </h3>

                  <p className="text-xs text-text-secondary max-w-3xl line-clamp-2">
                    {item.summary}
                  </p>

                  <div className="flex items-center gap-4 text-[10px] text-text-muted">
                    <span>✍️ Người soạn: <strong className="text-text-secondary">{item.authorName}</strong> ({getRoleLabel(item.authorRole)})</span>
                    <span>📅 Gửi lúc: {new Date(item.submittedAt).toLocaleTimeString()}</span>
                    {item.reviewedBy && (
                      <span className="text-emerald-400">✓ Duyệt bởi: {item.reviewedBy}</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2 self-stretch lg:self-center">
                  <button
                    onClick={() => {
                      setSelectedApproval(item);
                      setIsScriptModalOpen(true);
                    }}
                    className="px-3 py-2 bg-surface-subtle hover:bg-surface-hover text-text-primary text-xs font-bold rounded-xl border border-border-primary transition-all flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5 text-text-muted" />
                    {uiLanguage === "vi" ? "Đọc Kịch Bản" : "Read Script"}
                  </button>

                  {/* Actions for Station Lead / Lead Approval */}
                  {currentRole === "station_lead" && item.status === "under_review" && (
                    <>
                      <button
                        onClick={() => handleApproveAndAir(item)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-1.5"
                      >
                        <Radio className="w-3.5 h-3.5 animate-pulse" />
                        {uiLanguage === "vi" ? "DUYỆT & PHÁT SÓNG" : "APPROVE & AIR"}
                      </button>

                      <button
                        onClick={() => handleReject(item)}
                        className="px-3 py-2 bg-rose-600/20 hover:bg-rose-600 hover:text-white text-rose-300 text-xs font-bold rounded-xl border border-rose-500/30 transition-all flex items-center gap-1"
                      >
                        <X className="w-3.5 h-3.5" />
                        {uiLanguage === "vi" ? "Yêu Cầu Sửa" : "Reject"}
                      </button>
                    </>
                  )}

                  {item.status === "live_on_air" && (
                    <button
                      onClick={() => {
                        if (onPlayBroadcastAudio) {
                          onPlayBroadcastAudio(item.title);
                        }
                        showToast(uiLanguage === "vi" ? "Đang kết nối luồng phát sóng..." : "Connecting to live air stream...");
                      }}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-1.5"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      {uiLanguage === "vi" ? "NGHE TRÊN XE" : "LISTEN IN CAR"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 3: TEAM MEMBERS & RBAC */}
      {activeSubTab === "team" && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-surface-card rounded-2xl border border-border-primary space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-text-muted">Tổng Nhân Sự</span>
              <p className="text-2xl font-black text-text-primary">{members.length}</p>
            </div>
            <div className="p-4 bg-surface-card rounded-2xl border border-border-primary space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400">Tổng Biên Tập (Station Leads)</span>
              <p className="text-2xl font-black text-indigo-300">{members.filter(m => m.role === "station_lead").length}</p>
            </div>
            <div className="p-4 bg-surface-card rounded-2xl border border-border-primary space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">Biên Tập Viên (Producers)</span>
              <p className="text-2xl font-black text-emerald-300">{members.filter(m => m.role === "producer").length}</p>
            </div>
            <div className="p-4 bg-surface-card rounded-2xl border border-border-primary space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400">Kỹ Thuật Âm Thanh</span>
              <p className="text-2xl font-black text-cyan-300">{members.filter(m => m.role === "audio_engineer").length}</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-border-primary bg-surface-card shadow-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-subtle text-[10px] font-black uppercase tracking-wider text-text-muted border-b border-border-subtle">
                <tr>
                  <th className="px-6 py-4">{uiLanguage === "vi" ? "Thành Viên" : "Member"}</th>
                  <th className="px-6 py-4">{uiLanguage === "vi" ? "Phòng Ban" : "Department"}</th>
                  <th className="px-6 py-4">{uiLanguage === "vi" ? "Vai Trò & Phân Quyền" : "Role & RBAC"}</th>
                  <th className="px-6 py-4">{uiLanguage === "vi" ? "Trạng Thái" : "Status"}</th>
                  <th className="px-6 py-4 text-right">{uiLanguage === "vi" ? "Thao Tác" : "Actions"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {members.map((mem) => (
                  <tr key={mem.id} className="hover:bg-surface-subtle/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center font-black text-indigo-300 text-xs">
                          {mem.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-text-primary">{mem.name}</p>
                          <p className="text-[10px] text-text-muted">{mem.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-text-secondary font-medium">
                      {mem.department}
                    </td>

                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1",
                        mem.role === "station_lead" ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" :
                        mem.role === "producer" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" :
                        mem.role === "audio_engineer" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" :
                        "bg-zinc-800 text-zinc-400 border border-zinc-700"
                      )}>
                        {getRoleLabel(mem.role)}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-400">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        Active
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      {currentRole === "station_lead" && mem.role !== "station_lead" && (
                        <button
                          onClick={() => {
                            enterpriseService.updateMemberRole(mem.id, "station_lead");
                            loadData();
                            showToast(uiLanguage === "vi" ? `Đã thăng cấp ${mem.name} thành Station Lead!` : `Promoted ${mem.name} to Station Lead!`);
                          }}
                          className="px-2.5 py-1 bg-surface-subtle hover:bg-surface-hover text-text-primary text-[10px] font-bold rounded-lg border border-border-primary transition-all"
                        >
                          {uiLanguage === "vi" ? "Thăng Cấp" : "Promote"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 4: ANALYTICS & REACH */}
      {activeSubTab === "analytics" && metrics && (
        <div className="space-y-8 animate-fade-in">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 bg-surface-card rounded-2xl border border-border-primary space-y-2 shadow-md">
              <span className="text-xs font-black uppercase tracking-wider text-indigo-400">
                {uiLanguage === "vi" ? "Thời Gian Di Chuyển Tiết Kiệm" : "Total Commute Hours Saved"}
              </span>
              <p className="text-3xl font-black text-text-primary">
                {metrics.totalTeamHoursSaved} <span className="text-sm font-normal text-text-muted">giờ / tháng</span>
              </p>
              <p className="text-[10px] text-emerald-400 font-bold">↑ +14.2% so với tháng trước</p>
            </div>

            <div className="p-6 bg-surface-card rounded-2xl border border-border-primary space-y-2 shadow-md">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                {uiLanguage === "vi" ? "Thính Giả Doanh Nghiệp" : "Active Commuter Reach"}
              </span>
              <p className="text-3xl font-black text-emerald-300">
                {metrics.activeCommuterCount} <span className="text-sm font-normal text-text-muted">người</span>
              </p>
              <p className="text-[10px] text-text-muted">Tỷ lệ bao phủ 98% nhân sự mục tiêu</p>
            </div>

            <div className="p-6 bg-surface-card rounded-2xl border border-border-primary space-y-2 shadow-md">
              <span className="text-xs font-black uppercase tracking-wider text-cyan-400">
                {uiLanguage === "vi" ? "Tỷ Lệ Nghe Trọn Vẹn" : "Average Completion Rate"}
              </span>
              <p className="text-3xl font-black text-cyan-300">
                {metrics.averageCompletionRate}%
              </p>
              <p className="text-[10px] text-cyan-400 font-bold">Chuẩn phát thanh Spotify AI DJ</p>
            </div>

            <div className="p-6 bg-surface-card rounded-2xl border border-border-primary space-y-2 shadow-md">
              <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                {uiLanguage === "vi" ? "Số Bản Tin Đã Phát" : "Total Episodes Aired"}
              </span>
              <p className="text-3xl font-black text-amber-300">
                {metrics.totalEpisodesAired}
              </p>
              <p className="text-[10px] text-text-muted">Tự động hóa 100% qua Edge TTS & Gemini</p>
            </div>
          </div>

          {/* Recharts Analytics Graphs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Daily Trend Chart */}
            <div className="p-6 bg-surface-card rounded-2xl border border-border-primary space-y-4 shadow-lg">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-text-primary uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-400" />
                  {uiLanguage === "vi" ? "Xu Hướng Lắng Nghe 7 Ngày Gần Nhất" : "7-Day Listening Trend"}
                </h3>
                <span className="text-[10px] text-text-muted font-mono">Dữ liệu thính giả thực tế</span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={metrics.dailyEngagementTrend}>
                    <defs>
                      <linearGradient id="colorListeners" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="date" stroke="#888" fontSize={11} />
                    <YAxis stroke="#888" fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: "#18181b", borderColor: "#3f3f46", borderRadius: "8px", fontSize: "12px" }} />
                    <Area type="monotone" dataKey="listeners" name="Thính giả" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorListeners)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Department Breakdown Bar Chart */}
            <div className="p-6 bg-surface-card rounded-2xl border border-border-primary space-y-4 shadow-lg">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-text-primary uppercase tracking-wider flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-400" />
                  {uiLanguage === "vi" ? "Tương Tác Theo Phòng Ban (%)" : "Department Engagement (%)"}
                </h3>
                <span className="text-[10px] text-text-muted font-mono">Theo khối nghiệp vụ</span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics.departmentBreakdown} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis type="number" domain={[0, 100]} stroke="#888" fontSize={11} />
                    <YAxis dataKey="department" type="category" stroke="#888" fontSize={9} width={130} />
                    <Tooltip contentStyle={{ backgroundColor: "#18181b", borderColor: "#3f3f46", borderRadius: "8px", fontSize: "12px" }} />
                    <Bar dataKey="engagement" name="Tỷ lệ tương tác %" fill="#10b981" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SCRIPT DETAIL INSPECTION MODAL */}
      <AnimatePresence>
        {isScriptModalOpen && selectedApproval && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface-card border border-border-primary rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="p-6 border-b border-border-subtle flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400">
                    {selectedApproval.channelName}
                  </span>
                  <h3 className="text-lg font-black text-text-primary">
                    {selectedApproval.title}
                  </h3>
                </div>
                <button
                  onClick={() => setIsScriptModalOpen(false)}
                  className="p-2 text-text-muted hover:text-text-primary rounded-xl hover:bg-surface-subtle transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-4 text-sm text-text-secondary leading-relaxed">
                <div className="p-4 bg-surface-subtle rounded-2xl border border-border-subtle">
                  <span className="text-[10px] font-black uppercase tracking-wider text-text-muted block mb-1">
                    {uiLanguage === "vi" ? "Tóm tắt bản tin:" : "Briefing Summary:"}
                  </span>
                  <p className="text-xs text-text-primary font-medium">{selectedApproval.summary}</p>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-text-muted block">
                    {uiLanguage === "vi" ? "Toàn văn kịch bản phát thanh AI:" : "Full AI Broadcast Script:"}
                  </span>
                  <div className="p-4 bg-zinc-950/80 rounded-2xl border border-zinc-800 font-mono text-xs text-zinc-200 whitespace-pre-wrap leading-loose">
                    {selectedApproval.scriptContent}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-border-subtle flex items-center justify-end gap-3 bg-surface-subtle">
                <button
                  onClick={() => setIsScriptModalOpen(false)}
                  className="px-4 py-2 bg-surface-card hover:bg-surface-hover text-text-secondary text-xs font-bold rounded-xl border border-border-primary"
                >
                  {uiLanguage === "vi" ? "Đóng" : "Close"}
                </button>

                {currentRole === "station_lead" && selectedApproval.status === "under_review" && (
                  <button
                    onClick={() => {
                      handleApproveAndAir(selectedApproval);
                      setIsScriptModalOpen(false);
                    }}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl shadow-lg shadow-emerald-600/30 flex items-center gap-1.5"
                  >
                    <Radio className="w-4 h-4 animate-pulse" />
                    {uiLanguage === "vi" ? "DUYỆT & PHÁT SÓNG NGAY" : "APPROVE & AIR NOW"}
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CREATE NEW CHANNEL MODAL */}
      <AnimatePresence>
        {isNewChannelModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface-card border border-border-primary rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-text-primary flex items-center gap-2">
                  <Radio className="w-5 h-5 text-indigo-400" />
                  {uiLanguage === "vi" ? "Tạo Kênh Phát Thanh Doanh Nghiệp" : "Create Enterprise Broadcast Channel"}
                </h3>
                <button
                  onClick={() => setIsNewChannelModalOpen(false)}
                  className="p-1.5 text-text-muted hover:text-text-primary rounded-xl"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateChannel} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-secondary">
                    {uiLanguage === "vi" ? "Tên Kênh Phát Thanh" : "Channel Name"}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="vd: 🌅 Bản Tin Điều Hành Sáng"
                    value={newChannelName}
                    onChange={(e) => setNewChannelName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-surface-subtle border border-border-primary rounded-xl text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-secondary">
                    {uiLanguage === "vi" ? "Mô Tả Mục Tiêu Kênh" : "Channel Description"}
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Mô tả nội dung định kỳ và đối tượng người nghe..."
                    value={newChannelDesc}
                    onChange={(e) => setNewChannelDesc(e.target.value)}
                    className="w-full px-4 py-2.5 bg-surface-subtle border border-border-primary rounded-xl text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-text-secondary">
                      {uiLanguage === "vi" ? "Tần Suất Phát" : "Frequency"}
                    </label>
                    <select
                      value={newChannelFreq}
                      onChange={(e) => setNewChannelFreq(e.target.value as any)}
                      className="w-full px-3 py-2 bg-surface-subtle border border-border-primary rounded-xl text-xs text-text-primary"
                    >
                      <option value="daily_morning">🌅 Sáng (07:15 AM)</option>
                      <option value="daily_evening">⚡ Chiều (17:45 PM)</option>
                      <option value="instant_alert">🚨 Cảnh Báo Khẩn Cấp</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-text-secondary">
                      {uiLanguage === "vi" ? "Phòng Ban Mục Tiêu" : "Target Department"}
                    </label>
                    <select
                      value={newChannelDept}
                      onChange={(e) => setNewChannelDept(e.target.value)}
                      className="w-full px-3 py-2 bg-surface-subtle border border-border-primary rounded-xl text-xs text-text-primary"
                    >
                      <option value="Tất cả phòng ban">Toàn bộ tập đoàn</option>
                      {activeOrg?.departments.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsNewChannelModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-text-muted hover:text-text-primary"
                  >
                    {uiLanguage === "vi" ? "Hủy" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-lg shadow-indigo-600/30"
                  >
                    {uiLanguage === "vi" ? "Hoàn Tất Tạo Kênh" : "Create Channel"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* INVITE MEMBER MODAL */}
      <AnimatePresence>
        {isInviteMemberModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface-card border border-border-primary rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-text-primary flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-400" />
                  {uiLanguage === "vi" ? "Mời Nhân Sự Vào Đài Phát" : "Invite Team Member"}
                </h3>
                <button
                  onClick={() => setIsInviteMemberModalOpen(false)}
                  className="p-1.5 text-text-muted hover:text-text-primary rounded-xl"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleInviteMember} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-secondary">
                    {uiLanguage === "vi" ? "Họ và Tên" : "Full Name"}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nguyễn Văn A"
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-surface-subtle border border-border-primary rounded-xl text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-secondary">
                    {uiLanguage === "vi" ? "Email Doanh Nghiệp" : "Work Email"}
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="user@enterprise.com"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-surface-subtle border border-border-primary rounded-xl text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-text-secondary">
                      {uiLanguage === "vi" ? "Vai Trò (Role)" : "Role"}
                    </label>
                    <select
                      value={newMemberRole}
                      onChange={(e) => setNewMemberRole(e.target.value as any)}
                      className="w-full px-3 py-2 bg-surface-subtle border border-border-primary rounded-xl text-xs text-text-primary"
                    >
                      <option value="producer">✍️ Producer</option>
                      <option value="station_lead">👑 Station Lead</option>
                      <option value="audio_engineer">🎛️ Sound Engineer</option>
                      <option value="listener">🎧 Listener</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-text-secondary">
                      {uiLanguage === "vi" ? "Phòng Ban" : "Department"}
                    </label>
                    <select
                      value={newMemberDept}
                      onChange={(e) => setNewMemberDept(e.target.value)}
                      className="w-full px-3 py-2 bg-surface-subtle border border-border-primary rounded-xl text-xs text-text-primary"
                    >
                      {activeOrg?.departments.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsInviteMemberModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-text-muted hover:text-text-primary"
                  >
                    {uiLanguage === "vi" ? "Hủy" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-lg shadow-indigo-600/30"
                  >
                    {uiLanguage === "vi" ? "Gửi Lời Mời" : "Send Invite"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
