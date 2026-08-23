import React, { useState } from "react";
import { X, BookOpen, Mic, Rss, Cloud, Sparkles } from "lucide-react";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";

interface HelpCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  uiLanguage: "vi" | "en";
}

export default function HelpCenterModal({ isOpen, onClose, uiLanguage }: HelpCenterModalProps) {
  if (!isOpen) return null;

  const t = uiLanguage === "vi" ? {
    title: "Trung tâm Hỗ trợ",
    faq: [
      { q: "Làm thế nào để tạo bản tin mới?", a: "Sử dụng bảng điều khiển chính, chọn nguồn tin RSS, sau đó nhấn 'Tổng hợp' để AI tạo bản tin dựa trên nội dung mới nhất." },
      { q: "Cách sử dụng micro để tìm kiếm?", a: "Nhấn vào biểu tượng micro ở góc màn hình, cấp quyền truy cập và đặt câu hỏi trực tiếp cho trợ lý AI." },
      { q: "Làm thế nào để thêm nguồn tin RSS?", a: "Truy cập tab RSS, dán đường dẫn RSS feed vào ô nhập liệu và nhấn 'Thêm nguồn'." },
      { q: "Làm sao để đồng bộ dữ liệu?", a: "Trong phần Cài đặt > Đồng bộ, bạn có thể nhấn 'Bắt đầu đồng bộ' để lưu trữ dữ liệu lên đám mây." },
      { q: "Làm sao để xóa dữ liệu cũ?", a: "Trong phần Cài đặt > Hệ thống, nhấn 'Dọn dẹp hệ thống' để xóa lịch sử và dữ liệu tạm." },
    ]
  } : {
    title: "Help Center",
    faq: [
      { q: "How do I create a new briefing?", a: "In the main dashboard, select your RSS sources and click 'Synthesize' to let AI generate a briefing based on the latest content." },
      { q: "How to use the microphone for search?", a: "Click the microphone icon in the corner, grant permissions, and ask your question directly to the AI assistant." },
      { q: "How do I add RSS sources?", a: "Go to the RSS tab, paste your RSS feed URL in the input field, and click 'Add Source'." },
      { q: "How can I sync my data?", a: "In Settings > Sync, click 'Start Sync' to securely backup your data to the cloud." },
      { q: "How do I clear old data?", a: "In Settings > System, click 'Purge System' to clear your history and temporary data." },
    ]
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col border-border-subtle shadow-2xl">
        <div className="p-6 flex items-center justify-between border-b border-border-subtle bg-surface-subtle">
          <h2 className="text-lg font-black uppercase tracking-widest flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-brand-accent" />
            {t.title}
          </h2>
          <Button variant="outline" size="sm" onClick={onClose} className="rounded-full w-8 h-8 p-0">
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="p-6 overflow-y-auto space-y-6">
          {t.faq.map((item, idx) => (
            <div key={idx} className="space-y-2">
              <h3 className="text-sm font-black text-text-main">{item.q}</h3>
              <p className="text-xs text-text-muted leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
