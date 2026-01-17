
import React, { useState, useCallback, useRef, useEffect } from 'react';
import InstagramPreview from './components/InstagramPreview';
import { generateNewsContent, generatePostImage } from './services/geminiService';
import { NewsPostData, AIAnalysis, AppStatus } from './types';
import * as htmlToImage from 'html-to-image';

function App() {
  const [topic, setTopic] = useState('');
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'ai' | 'edit'>('ai');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showInstallHelp, setShowInstallHelp] = useState(false);
  
  const [newsData, setNewsData] = useState<NewsPostData>({
    headline: "भारत की बड़ी जीत: नई तकनीक से बदलेगा देश का भविष्य!",
    description: "वैज्ञानिकों ने एक ऐसा आविष्कार किया है जिससे आने वाले समय में ऊर्जा की समस्या पूरी तरह खत्म हो जाएगी।",
    badge: "बड़ी खबर",
    username: "news_insight",
    date: new Date().toLocaleDateString('hi-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
    themeColor: 'gold',
    layoutType: 'modern',
    contentType: 'image',
    imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=800',
    logoText: 'NI',
    logoUrl: ''
  });
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);

  const previewRef = useRef<HTMLDivElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });

    window.addEventListener('appinstalled', () => {
      setDeferredPrompt(null);
      alert("App kamyabi se install ho gaya hai! Ab aap ise Desktop icon se chala sakte hain.");
    });
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setDeferredPrompt(null);
    } else {
      setShowInstallHelp(true);
    }
  };

  const handleDownload = async () => {
    if (previewRef.current === null) return;
    setIsDownloading(true);
    try {
      const dataUrl = await htmlToImage.toPng(previewRef.current, {
        cacheBust: true,
        quality: 1,
        pixelRatio: 3,
        backgroundColor: '#000000',
      });
      const link = document.createElement('a');
      link.download = `NewsInsight_${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err: any) {
      setError("Download error! Screenshot le lein.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleGenerate = useCallback(async () => {
    if (!topic.trim()) {
      setError("Kripya topic likhein!");
      return;
    }
    setStatus(AppStatus.LOADING);
    setError(null);
    try {
      const { newsData: generatedMeta, analysis: generatedAnalysis } = await generateNewsContent(topic);
      const imageUrl = await generatePostImage(topic);
      setNewsData(prev => ({
        ...prev,
        ...generatedMeta,
        imageUrl,
        date: new Date().toLocaleDateString('hi-IN', { day: 'numeric', month: 'long', year: 'numeric' })
      }));
      setAnalysis(generatedAnalysis);
      setStatus(AppStatus.SUCCESS);
      setActiveTab('edit');
    } catch (err: any) {
      setError("AI Error! Manually edit karein.");
      setStatus(AppStatus.ERROR);
    }
  }, [topic]);

  const updateField = (field: keyof NewsPostData, value: string) => {
    setNewsData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white selection:bg-pink-500/30 font-['Inter']">
      {/* Header */}
      <header className="w-full py-4 px-6 md:px-12 flex justify-between items-center border-b border-white/5 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 instagram-gradient rounded-xl flex items-center justify-center">
             <span className="font-black text-white text-xl">NI</span>
          </div>
          <h1 className="text-xl font-black italic hidden sm:block">NEWS<span className="text-pink-500">INSIGHT</span></h1>
        </div>

        <button 
          onClick={handleInstall}
          className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-pink-600 to-rose-500 rounded-full hover:scale-105 transition-all shadow-lg shadow-pink-500/20"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          <span className="text-xs font-black uppercase tracking-widest">Add to Desktop</span>
        </button>
      </header>

      {/* Install Instructions Modal */}
      {showInstallHelp && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 p-8 rounded-3xl max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-black mb-4 text-pink-500 uppercase tracking-tight">Desktop par kaise layein?</h3>
            <ul className="space-y-4 text-sm text-slate-300">
              <li className="flex gap-3"><span className="text-pink-500 font-bold">1.</span> Browser ke address bar mein right side par <span className="text-white font-bold">Install Icon</span> dhoondein.</li>
              <li className="flex gap-3"><span className="text-pink-500 font-bold">2.</span> Agar icon nahi hai, toh 3-dots menu par click karke <span className="text-white font-bold">'Install App'</span> ya <span className="text-white font-bold">'Save & Share'</span> chunein.</li>
              <li className="flex gap-3"><span className="text-pink-500 font-bold">3.</span> Iske baad ye ek Software ki tarah aapke desktop par hamesha rahega!</li>
            </ul>
            <button 
              onClick={() => setShowInstallHelp(false)}
              className="w-full mt-8 py-3 bg-white/5 border border-white/10 rounded-xl font-bold uppercase tracking-widest hover:bg-white/10 transition-all"
            >
              Samajh Gaya
            </button>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Editor */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900/80 border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
            <div className="flex border-b border-white/10">
              <button onClick={() => setActiveTab('ai')} className={`flex-1 py-4 text-xs font-black uppercase transition-all ${activeTab === 'ai' ? 'bg-white/5 text-pink-500' : 'text-slate-500'}`}>AI Editor</button>
              <button onClick={() => setActiveTab('edit')} className={`flex-1 py-4 text-xs font-black uppercase transition-all ${activeTab === 'edit' ? 'bg-white/5 text-pink-500' : 'text-slate-500'}`}>Custom Edit</button>
            </div>
            <div className="p-6">
              {activeTab === 'ai' ? (
                <div className="space-y-4">
                  <textarea 
                    className="w-full bg-slate-800/50 border border-white/10 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-pink-500 outline-none min-h-[100px] resize-none"
                    placeholder="Topic likhein: India wins Gold medal..."
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                  />
                  <button onClick={handleGenerate} disabled={status === AppStatus.LOADING} className="w-full py-4 bg-pink-600 rounded-2xl font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all">
                    {status === AppStatus.LOADING ? "Generating..." : "AI Generate Karein"}
                  </button>
                </div>
              ) : (
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                  <InputField label="Headline" value={newsData.headline} onChange={(v: string) => updateField('headline', v)} />
                  <InputField label="Description" value={newsData.description} isTextarea onChange={(v: string) => updateField('description', v)} />
                  <div className="grid grid-cols-2 gap-3">
                    <InputField label="Badge" value={newsData.badge} onChange={(v: string) => updateField('badge', v)} />
                    <InputField label="Username" value={newsData.username} onChange={(v: string) => updateField('username', v)} />
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/5">
                    <button onClick={() => bgInputRef.current?.click()} className="p-3 bg-slate-800 border border-white/10 rounded-xl text-[10px] font-bold uppercase">Change Photo</button>
                    <input type="file" hidden ref={bgInputRef} accept="image/*" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if(file) {
                        const reader = new FileReader();
                        reader.onload = () => updateField('imageUrl', reader.result as string);
                        reader.readAsDataURL(file);
                      }
                    }} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="w-full bg-black border border-white/10 rounded-[2rem] p-4 shadow-3xl overflow-hidden">
             <InstagramPreview ref={previewRef} data={newsData} />
          </div>
          <button 
            onClick={handleDownload}
            disabled={isDownloading}
            className="mt-8 flex items-center gap-3 px-12 py-5 bg-pink-600 hover:bg-pink-700 rounded-2xl font-black uppercase tracking-widest shadow-2xl transition-all"
          >
            {isDownloading ? "SAVING..." : "Download Post"}
          </button>
        </div>

        {/* Analytics */}
        <div className="lg:col-span-3">
          <div className="bg-slate-900/50 border border-white/10 p-8 rounded-3xl">
            <h2 className="text-xs font-black mb-6 uppercase tracking-widest text-slate-400">Post Insights</h2>
            {analysis ? (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="text-4xl font-black text-pink-500">{analysis.engagementScore}%</div>
                  <div className="text-[10px] font-black uppercase text-slate-500">Viral Score</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {analysis.hashtags.map((h, i) => (
                    <span key={i} className="text-[10px] px-2 py-1 bg-slate-800 rounded text-pink-400 font-bold">#{h}</span>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-[10px] opacity-30 font-black uppercase">Generate for data</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

const InputField = ({ label, value, onChange, isTextarea = false }: any) => (
  <div className="space-y-1">
    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">{label}</label>
    {isTextarea ? (
      <textarea className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs focus:ring-1 focus:ring-pink-500 outline-none min-h-[80px]" value={value} onChange={(e) => onChange(e.target.value)} />
    ) : (
      <input className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs focus:ring-1 focus:ring-pink-500 outline-none" value={value} onChange={(e) => onChange(e.target.value)} />
    )}
  </div>
);

export default App;
