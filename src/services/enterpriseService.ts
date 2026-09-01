import { 
  EnterpriseOrganization, 
  EnterpriseMember, 
  EnterpriseBroadcastChannel, 
  EnterpriseBroadcastApprovalItem, 
  EnterpriseAnalyticsMetrics,
  EnterpriseRole,
  ApprovalStatus 
} from "../types";

const STORAGE_KEYS = {
  ACTIVE_ORG_ID: "commutecast_enterprise_active_org_id",
  ORGS: "commutecast_enterprise_orgs",
  MEMBERS: "commutecast_enterprise_members",
  CHANNELS: "commutecast_enterprise_channels",
  APPROVAL_ITEMS: "commutecast_enterprise_approvals",
};

const DEFAULT_ORGS: EnterpriseOrganization[] = [
  {
    id: "org-vingroup",
    name: "VinGroup Media Network",
    slug: "vingroup-media",
    tier: "enterprise",
    memberCount: 42,
    departments: ["Ban Điều Hành (Executive)", "Khối Kỹ Thuật (R&D)", "Khối Kinh Doanh (Sales)", "Marketing & Truyền Thông"],
    sharedStorageQuotaMb: 10240,
    sharedStorageUsedMb: 3420,
    customVoices: ["Hoài My (Executive News)", "Nam Minh (Daily Tech)"],
    activeChannelCount: 4
  },
  {
    id: "org-fpt",
    name: "FPT Digital Broadcast Hub",
    slug: "fpt-digital",
    tier: "enterprise",
    memberCount: 28,
    departments: ["Software Engineering", "AI Labs", "Operations", "Product Management"],
    sharedStorageQuotaMb: 5120,
    sharedStorageUsedMb: 1250,
    customVoices: ["An Nhiên (Tech Podcaster)"],
    activeChannelCount: 3
  },
  {
    id: "org-techcommute",
    name: "TechCommute Innovators",
    slug: "techcommute-global",
    tier: "pro",
    memberCount: 15,
    departments: ["Founders", "Engineering", "Design", "Growth"],
    sharedStorageQuotaMb: 2048,
    sharedStorageUsedMb: 680,
    customVoices: ["Minh Quân (Fast Brief)"],
    activeChannelCount: 2
  }
];

const DEFAULT_MEMBERS: Record<string, EnterpriseMember[]> = {
  "org-vingroup": [
    {
      id: "mem-1",
      name: "Nguyễn Văn Hùng",
      email: "hung.nv@vingroup.vn",
      role: "station_lead",
      department: "Ban Điều Hành (Executive)",
      lastActiveAt: new Date().toISOString(),
      status: "active",
      permissions: ["all_access", "approve_broadcast", "publish_live", "manage_members", "export_telemetry"]
    },
    {
      id: "mem-2",
      name: "Lê Thu Hà",
      email: "ha.lt@vingroup.vn",
      role: "producer",
      department: "Marketing & Truyền Thông",
      lastActiveAt: new Date(Date.now() - 3600000).toISOString(),
      status: "active",
      permissions: ["create_script", "synthesize_audio", "submit_approval"]
    },
    {
      id: "mem-3",
      name: "Trần Minh Quang",
      email: "quang.tm@vingroup.vn",
      role: "audio_engineer",
      department: "Khối Kỹ Thuật (R&D)",
      lastActiveAt: new Date(Date.now() - 7200000).toISOString(),
      status: "active",
      permissions: ["audio_processing", "sound_mastering", "voice_tuning"]
    },
    {
      id: "mem-4",
      name: "Phạm Quốc Tuấn",
      email: "tuan.pq@vingroup.vn",
      role: "listener",
      department: "Khối Kinh Doanh (Sales)",
      lastActiveAt: new Date(Date.now() - 86400000).toISOString(),
      status: "active",
      permissions: ["stream_broadcast", "submit_feedback"]
    }
  ]
};

const DEFAULT_CHANNELS: Record<string, EnterpriseBroadcastChannel[]> = {
  "org-vingroup": [
    {
      id: "chan-morning-exec",
      orgId: "org-vingroup",
      name: "🌅 Bản Tin Điều Hành Sáng (Executive Morning Digest)",
      description: "Tóm lược 5 phút tình hình thị trường, chỉ số kinh tế và tin vắn nội bộ tập đoàn trước 07:30 sáng.",
      frequency: "daily_morning",
      targetDepartments: ["Ban Điều Hành (Executive)", "Khối Kinh Doanh (Sales)"],
      assignedProducerIds: ["mem-1", "mem-2"],
      activeListenersCount: 38,
      autoPublishEnabled: true,
      currentEpisodeTitle: "Số #142: Phân tích tăng trưởng Q3 và định hướng thị trường công nghệ",
      scheduleTime: "07:15 AM",
      lastAiredAt: new Date().toISOString(),
      bannerGradient: "from-blue-600 to-indigo-900"
    },
    {
      id: "chan-tech-pulse",
      orgId: "org-vingroup",
      name: "⚡ VinGroup Tech & AI Pulse",
      description: "Cập nhật đột phá công nghệ, tự động hóa và các dự án kỹ thuật mũi nhọn.",
      frequency: "daily_evening",
      targetDepartments: ["Khối Kỹ Thuật (R&D)", "Marketing & Truyền Thông"],
      assignedProducerIds: ["mem-2", "mem-3"],
      activeListenersCount: 29,
      autoPublishEnabled: true,
      currentEpisodeTitle: "Số #89: Tích hợp mô hình AI Generative vào quy trình vận hành chuỗi cung ứng",
      scheduleTime: "17:45 PM",
      lastAiredAt: new Date(Date.now() - 86400000).toISOString(),
      bannerGradient: "from-emerald-600 to-teal-900"
    },
    {
      id: "chan-flash-alert",
      orgId: "org-vingroup",
      name: "🚨 Kênh Thông Báo Nóng & Khẩn Cấp Toàn Tập Đoàn",
      description: "Bản tin phát thanh ngắn dưới 2 phút phát ngay lập tức khi có sự kiện quan trọng.",
      frequency: "instant_alert",
      targetDepartments: ["Tất cả phòng ban"],
      assignedProducerIds: ["mem-1"],
      activeListenersCount: 42,
      autoPublishEnabled: false,
      currentEpisodeTitle: "Thông báo diễn tập phòng cháy và cập nhật lộ trình giao thông tòa nhà Landmark",
      scheduleTime: "On-demand",
      lastAiredAt: new Date(Date.now() - 172800000).toISOString(),
      bannerGradient: "from-red-600 to-rose-950"
    }
  ]
};

const DEFAULT_APPROVALS: Record<string, EnterpriseBroadcastApprovalItem[]> = {
  "org-vingroup": [
    {
      id: "appr-01",
      orgId: "org-vingroup",
      channelId: "chan-morning-exec",
      channelName: "🌅 Bản Tin Điều Hành Sáng",
      title: "Bản Tin Đầu Ngày: Điểm tin tài chính & Tiến độ mở rộng thị trường Quốc tế",
      summary: "Tổng hợp chỉ số chứng khoán, biến động tỷ giá USD/VND và tóm tắt biên bản cuộc họp giao ban đầu tuần.",
      scriptContent: `Kính chào Ban Lãnh Đạo và toàn thể Cán Bộ Nhân Viên VinGroup. Sau đây là bản tin phát thanh tổng hợp đầu ngày 01 tháng 09.\n\nThị trường tài chính quốc tế ghi nhận tín hiệu khả quan với chỉ số công nghệ tăng 1.2%. Trong nước, tiến độ dự án nhà máy thông minh tại Hải Phòng đã hoàn thành 95% giai đoạn chạy thử, sẵn sàng cho lễ khánh thành cuối tháng.\n\nVề lưu lượng giao thông: Cầu Nhật Tân và đường vành đai 3 trên cao đang thông thoáng, thời gian di chuyển dự kiến từ Trung Tâm đến Khu Công Nghệ Cao là 22 phút.\n\nChúc quý vị một ngày làm việc tràn đầy năng lượng và hiệu quả.`,
      authorName: "Lê Thu Hà",
      authorRole: "producer",
      status: "under_review",
      durationSec: 215,
      wordCount: 380,
      targetAudience: "Toàn bộ nhân sự cấp quản lý",
      submittedAt: new Date(Date.now() - 1800000).toISOString(),
      audioReady: true
    },
    {
      id: "appr-02",
      orgId: "org-vingroup",
      channelId: "chan-tech-pulse",
      channelName: "⚡ VinGroup Tech & AI Pulse",
      title: "Chuyên đề AI & Tối ưu hóa năng lượng cho hạ tầng Data Center",
      summary: "Phỏng vấn nhanh nhóm Kỹ sư R&D về việc ứng dụng giải thuật làm mát bằng chất lỏng kết hợp AI Controller.",
      scriptContent: `Chào các kỹ sư và chuyên gia công nghệ VinGroup. Trong số phát thanh hôm nay, chúng ta cùng lắng nghe nhóm nghiên cứu R&D chia sẻ về giải pháp tối ưu chỉ số PUE của trung tâm dữ liệu xuống dưới 1.15.`,
      authorName: "Trần Minh Quang",
      authorRole: "audio_engineer",
      status: "approved",
      durationSec: 320,
      wordCount: 520,
      targetAudience: "Khối Kỹ Thuật & Nghiên cứu",
      submittedAt: new Date(Date.now() - 7200000).toISOString(),
      reviewedBy: "Nguyễn Văn Hùng",
      reviewedAt: new Date(Date.now() - 3600000).toISOString(),
      audioReady: true
    },
    {
      id: "appr-03",
      orgId: "org-vingroup",
      channelId: "chan-morning-exec",
      channelName: "🌅 Bản Tin Điều Hành Sáng",
      title: "Số phát sóng hôm qua: Báo cáo an toàn thông tin & Kế hoạch tuyển dụng Quý 4",
      summary: "Tổng hợp chỉ số tuân thủ an toàn mạng và kế hoạch bổ sung 150 kỹ sư phần mềm cao cấp.",
      scriptContent: `Bản tin nội bộ đã phát sóng thành công tới 38 thính giả điều hành vào lúc 07:15 sáng hôm qua.`,
      authorName: "Lê Thu Hà",
      authorRole: "producer",
      status: "live_on_air",
      durationSec: 180,
      wordCount: 310,
      targetAudience: "Ban Giám Đốc",
      submittedAt: new Date(Date.now() - 86400000).toISOString(),
      reviewedBy: "Nguyễn Văn Hùng",
      reviewedAt: new Date(Date.now() - 82800000).toISOString(),
      audioReady: true
    }
  ]
};

class EnterpriseService {
  private activeOrgId: string = "org-vingroup";

  constructor() {
    if (typeof window !== "undefined") {
      const savedOrgId = localStorage.getItem(STORAGE_KEYS.ACTIVE_ORG_ID);
      if (savedOrgId) {
        this.activeOrgId = savedOrgId;
      }
    }
  }

  public getActiveOrgId(): string {
    return this.activeOrgId;
  }

  public setActiveOrgId(orgId: string): void {
    this.activeOrgId = orgId;
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_ORG_ID, orgId);
    }
  }

  public getOrganizations(): EnterpriseOrganization[] {
    if (typeof window === "undefined") return DEFAULT_ORGS;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ORGS);
      if (data) {
        return JSON.parse(data);
      }
      localStorage.setItem(STORAGE_KEYS.ORGS, JSON.stringify(DEFAULT_ORGS));
      return DEFAULT_ORGS;
    } catch {
      return DEFAULT_ORGS;
    }
  }

  public getActiveOrganization(): EnterpriseOrganization {
    const orgs = this.getOrganizations();
    return orgs.find(o => o.id === this.activeOrgId) || orgs[0] || DEFAULT_ORGS[0];
  }

  public getMembers(orgId?: string): EnterpriseMember[] {
    const targetOrgId = orgId || this.activeOrgId;
    if (typeof window === "undefined") return DEFAULT_MEMBERS[targetOrgId] || [];
    try {
      const allMembers = JSON.parse(localStorage.getItem(STORAGE_KEYS.MEMBERS) || "{}");
      if (allMembers[targetOrgId]) {
        return allMembers[targetOrgId];
      }
      const initial = DEFAULT_MEMBERS[targetOrgId] || [
        {
          id: `mem-${Date.now()}`,
          name: "Admin User",
          email: "admin@enterprise.com",
          role: "station_lead",
          department: "Executive",
          lastActiveAt: new Date().toISOString(),
          status: "active",
          permissions: ["all_access"]
        }
      ];
      allMembers[targetOrgId] = initial;
      localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(allMembers));
      return initial;
    } catch {
      return DEFAULT_MEMBERS[targetOrgId] || [];
    }
  }

  public addMember(member: Omit<EnterpriseMember, "id" | "lastActiveAt">): EnterpriseMember {
    const newMember: EnterpriseMember = {
      ...member,
      id: `mem-${Date.now()}`,
      lastActiveAt: new Date().toISOString()
    };
    const members = this.getMembers();
    members.push(newMember);
    this.saveMembers(this.activeOrgId, members);
    return newMember;
  }

  public updateMemberRole(memberId: string, newRole: EnterpriseRole): void {
    const members = this.getMembers();
    const target = members.find(m => m.id === memberId);
    if (target) {
      target.role = newRole;
      this.saveMembers(this.activeOrgId, members);
    }
  }

  private saveMembers(orgId: string, members: EnterpriseMember[]): void {
    if (typeof window === "undefined") return;
    try {
      const allMembers = JSON.parse(localStorage.getItem(STORAGE_KEYS.MEMBERS) || "{}");
      allMembers[orgId] = members;
      localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(allMembers));
    } catch (e) {
      console.warn("Failed to save members:", e);
    }
  }

  public getChannels(orgId?: string): EnterpriseBroadcastChannel[] {
    const targetOrgId = orgId || this.activeOrgId;
    if (typeof window === "undefined") return DEFAULT_CHANNELS[targetOrgId] || [];
    try {
      const allChannels = JSON.parse(localStorage.getItem(STORAGE_KEYS.CHANNELS) || "{}");
      if (allChannels[targetOrgId]) {
        return allChannels[targetOrgId];
      }
      const initial = DEFAULT_CHANNELS[targetOrgId] || [];
      allChannels[targetOrgId] = initial;
      localStorage.setItem(STORAGE_KEYS.CHANNELS, JSON.stringify(allChannels));
      return initial;
    } catch {
      return DEFAULT_CHANNELS[targetOrgId] || [];
    }
  }

  public addChannel(channel: Omit<EnterpriseBroadcastChannel, "id" | "orgId">): EnterpriseBroadcastChannel {
    const newChannel: EnterpriseBroadcastChannel = {
      ...channel,
      id: `chan-${Date.now()}`,
      orgId: this.activeOrgId
    };
    const channels = this.getChannels();
    channels.push(newChannel);
    this.saveChannels(this.activeOrgId, channels);
    return newChannel;
  }

  public toggleChannelAutoPublish(channelId: string): void {
    const channels = this.getChannels();
    const chan = channels.find(c => c.id === channelId);
    if (chan) {
      chan.autoPublishEnabled = !chan.autoPublishEnabled;
      this.saveChannels(this.activeOrgId, channels);
    }
  }

  private saveChannels(orgId: string, channels: EnterpriseBroadcastChannel[]): void {
    if (typeof window === "undefined") return;
    try {
      const allChannels = JSON.parse(localStorage.getItem(STORAGE_KEYS.CHANNELS) || "{}");
      allChannels[orgId] = channels;
      localStorage.setItem(STORAGE_KEYS.CHANNELS, JSON.stringify(allChannels));
    } catch (e) {
      console.warn("Failed to save channels:", e);
    }
  }

  public getApprovalQueue(orgId?: string): EnterpriseBroadcastApprovalItem[] {
    const targetOrgId = orgId || this.activeOrgId;
    if (typeof window === "undefined") return DEFAULT_APPROVALS[targetOrgId] || [];
    try {
      const allApprovals = JSON.parse(localStorage.getItem(STORAGE_KEYS.APPROVAL_ITEMS) || "{}");
      if (allApprovals[targetOrgId]) {
        return allApprovals[targetOrgId];
      }
      const initial = DEFAULT_APPROVALS[targetOrgId] || [];
      allApprovals[targetOrgId] = initial;
      localStorage.setItem(STORAGE_KEYS.APPROVAL_ITEMS, JSON.stringify(allApprovals));
      return initial;
    } catch {
      return DEFAULT_APPROVALS[targetOrgId] || [];
    }
  }

  public updateApprovalStatus(itemId: string, status: ApprovalStatus, reviewerName?: string, rejectionReason?: string): void {
    const items = this.getApprovalQueue();
    const item = items.find(i => i.id === itemId);
    if (item) {
      item.status = status;
      if (status === "approved" || status === "rejected" || status === "live_on_air") {
        item.reviewedBy = reviewerName || "Nguyễn Văn Hùng (Station Lead)";
        item.reviewedAt = new Date().toISOString();
      }
      if (status === "rejected") {
        item.rejectionReason = rejectionReason || "Cần điều chỉnh lại thông tin số liệu.";
      }
      this.saveApprovals(this.activeOrgId, items);
    }
  }

  public submitNewBriefingForApproval(briefing: {
    channelId: string;
    channelName: string;
    title: string;
    summary: string;
    scriptContent: string;
    authorName: string;
    authorRole: EnterpriseRole;
    durationSec: number;
    wordCount: number;
    targetAudience: string;
  }): EnterpriseBroadcastApprovalItem {
    const newItem: EnterpriseBroadcastApprovalItem = {
      ...briefing,
      id: `appr-${Date.now()}`,
      orgId: this.activeOrgId,
      status: "under_review",
      submittedAt: new Date().toISOString(),
      audioReady: true
    };
    const items = this.getApprovalQueue();
    items.unshift(newItem);
    this.saveApprovals(this.activeOrgId, items);
    return newItem;
  }

  private saveApprovals(orgId: string, items: EnterpriseBroadcastApprovalItem[]): void {
    if (typeof window === "undefined") return;
    try {
      const allApprovals = JSON.parse(localStorage.getItem(STORAGE_KEYS.APPROVAL_ITEMS) || "{}");
      allApprovals[orgId] = items;
      localStorage.setItem(STORAGE_KEYS.APPROVAL_ITEMS, JSON.stringify(allApprovals));
    } catch (e) {
      console.warn("Failed to save approvals:", e);
    }
  }

  public getAnalyticsMetrics(orgId?: string): EnterpriseAnalyticsMetrics {
    const targetOrg = this.getActiveOrganization();
    return {
      totalTeamHoursSaved: 142.5,
      activeCommuterCount: targetOrg.memberCount,
      totalEpisodesAired: 89,
      averageCompletionRate: 94.2,
      departmentBreakdown: [
        { department: "Ban Điều Hành (Executive)", engagement: 98, listenerCount: 8, hoursSaved: 34.0 },
        { department: "Khối Kỹ Thuật (R&D)", engagement: 92, listenerCount: 16, hoursSaved: 52.5 },
        { department: "Khối Kinh Doanh (Sales)", engagement: 88, listenerCount: 12, hoursSaved: 38.0 },
        { department: "Marketing & Truyền Thông", engagement: 95, listenerCount: 6, hoursSaved: 18.0 }
      ],
      dailyEngagementTrend: [
        { date: "26/08", listeners: 32, completionPct: 91 },
        { date: "27/08", listeners: 35, completionPct: 93 },
        { date: "28/08", listeners: 38, completionPct: 94 },
        { date: "29/08", listeners: 39, completionPct: 95 },
        { date: "30/08", listeners: 41, completionPct: 96 },
        { date: "31/08", listeners: 40, completionPct: 94 },
        { date: "01/09", listeners: 42, completionPct: 98 }
      ]
    };
  }
}

export const enterpriseService = new EnterpriseService();
