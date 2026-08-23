import re

with open("src/components/views/MissionTabView.tsx", "r") as f:
    content = f.read()

old_draft = """      {activePayload ? (
        <div className="space-y-6">
          <div className="bg-surface-bg border border-border-subtle rounded-2xl p-6 shadow-sm space-y-4">
             <label className="text-xs font-black uppercase tracking-widest text-text-muted">Title</label>"""

new_draft = """      {isProcessing ? (
        <div className="p-12 bg-surface-bg border border-border-subtle rounded-2xl">
           <ProgressiveFeedback progress={generationProgress} uiLanguage={uiLanguage} />
        </div>
      ) : activePayload ? (
        <div className="space-y-6">
          <div className="bg-surface-bg border border-border-subtle rounded-2xl p-6 shadow-sm space-y-4">
             <label className="text-xs font-black uppercase tracking-widest text-text-muted">Title</label>"""

content = content.replace(old_draft, new_draft)

with open("src/components/views/MissionTabView.tsx", "w") as f:
    f.write(content)
