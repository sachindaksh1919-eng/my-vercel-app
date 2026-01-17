
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
  const [showVercelGuide, setShowVercelGuide] = useState(false);
  const [isLocalFile, setIsLocalFile] = useState(false);
  
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
  const bgInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (window.location.protocol === 'file:') {
      setIsLocalFile(true);
    }

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
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
      setError("Download failed. Take a screenshot.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleGenerate = useCallback(async () => {
    if (!topic.trim()) return setError("Topic likhein!");
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
      setError("AI Generation failed. Check API Key in Vercel.");
      setStatus(AppStatus.ERROR);
    }
  }, [topic]);

  const updateField = (field: keyof NewsPostData, value: string) => {
    setNewsData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white selection:bg-pink-500/30 font-['Inter'] pb-20">
      {/* Vercel Error Alert Bar */}
      {isLocalFile && (
        <div className="bg-red-600 text-white px-6 py-4 flex flex-wrap justify-between items-center text-sm font-bold sticky top-0 z-[100] shadow-2xl">
          <div className="flex items-center gap-3">
             <span className="bg-white/20 p-2 rounded-lg">⚠️</span>
             <span>Deployment Error? Framework ko "Other" set karein!</span>
          </div>
          <button onClick={() => setShowVercelGuide(true)} className="bg-white text-red-700 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:scale-105 transition-all">Fix Error (Hindi Guide)</button>
        </div>
      )}

      {/* Header */}
      <header className="w-full py-6 px-6 md:px-12 flex justify-between items-center border-b border-white/5 bg-slate-900/50 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 instagram-gradient rounded-2xl flex items-center justify-center shadow-xl shadow-pink-500/10">
             <span className="font-black text-white text-2xl">NI</span>
          </div>
          <h1 className="text-2xl font-black italic tracking-tighter">NEWS<span className="text-pink-500">INSIGHT</span></h1>
        </div>

        <button 
          onClick={handleInstall}
          className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all"
        >
          <svg className="w-5 h-5 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
          <span className="text-xs font-black uppercase tracking-widest hidden md:inline">Install App</span>
        </button>
      </header>

      {/* Vercel Visual Guide Modal (UPDATED WITH ERROR FIX) */}
      {showVercelGuide && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl">
          <div className="bg-slate-900 border border-white/10 p-8 md:p-12 rounded-[3.5rem] max-w-4xl w-full shadow-3xl relative overflow-y-auto max-h-[95vh] custom-scrollbar">
            <button onClick={() => setShowVercelGuide(false)} className="absolute top-8 right-8 text-slate-500 hover:text-white transition-colors">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            <h2 className="text-3xl md:text-5xl font-black mb-6 text-white uppercase tracking-tighter">Vercel Error Solution 🛠️</h2>
            
            <div className="space-y-12">
              {/* Fix 1: Framework Preset */}
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-black">1</div>
                   <h3 className="text-xl font-bold italic">Framework ko "Other" select karein</h3>
                </div>
                <div className="bg-black border border-white/20 rounded-2xl p-6 relative">
                   <div className="absolute top-4 right-6 text-[10px] font-black text-red-500 animate-pulse">DHUAND SE DEKHEIN!</div>
                   <div className="flex flex-col gap-4">
                      <div className="flex justify-between items-center text-sm border-b border-white/10 pb-4">
                         <span className="text-slate-400">Framework Preset</span>
                         <span className="bg-indigo-600 text-white px-4 py-1 rounded border border-indigo-400 font-bold">Other</span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed italic">
                        Aapke log mein "Vite" dikh raha tha, isliye error aaya. Use <span className="text-white">"Other"</span> kar dein toh error nahi aayega.
                      </p>
                   </div>
                </div>
              </div>

              {/* Fix 2: API KEY */}
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-black">2</div>
                   <h3 className="text-xl font-bold italic">Environment Variables Jodein</h3>
                </div>
                <div className="bg-black border border-white/20 rounded-2xl p-6 space-y-4">
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] text-slate-500 uppercase font-black">Key</label>
                        <div className="bg-white/5 p-3 rounded border border-white/10 text-xs font-mono">API_KEY</div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] text-slate-500 uppercase font-black">Value</label>
                        <div className="bg-white/5 p-3 rounded border border-white/10 text-xs font-mono">Aapki_Gemini_Key</div>
                      </div>
                   </div>
                   <p className="text-xs text-slate-500">Isko 'Environment Variables' section mein save karein tabhi AI kaam karega.</p>
                </div>
              </div>

              {/* Success Visual */}
              <div className="p-8 bg-green-500/10 border border-green-500/20 rounded-3xl text-center">
                 <div className="text-4xl mb-2">🎉</div>
                 <h4 className="font-bold text-green-400 uppercase tracking-widest text-sm mb-2">Build Successful</h4>
                 <p className="text-slate-400 text-xs">Ye settings karne ke baad aapka app live ho jayega!</p>
              </div>
            </div>

            <button 
              onClick={() => setShowVercelGuide(false)}
              className="w-full mt-10 py-6 bg-white text-black rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-3xl hover:bg-slate-200 transition-all"
            >
              Theek hai, Dubara Try Karta Hoon!
            </button>
          </div>
        </div>
      )}

      {/* Main App Content */}
      <main className="max-w-7xl mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Editor Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900/80 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl backdrop-blur-xl">
            <div className="flex border-b border-white/10">
              <button onClick={() => setActiveTab('ai')} className={`flex-1 py-6 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'ai' ? 'text-pink-500 bg-white/5' : 'text-slate-500 hover:text-white'}`}>AI Generator</button>
              <button onClick={() => setActiveTab('edit')} className={`flex-1 py-6 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'edit' ? 'text-pink-500 bg-white/5' : 'text-slate-500 hover:text-white'}`}>Manual Edit</button>
            </div>
            
            <div className="p-8">
              {activeTab === 'ai' ? (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Topic ya News Headline</label>
                    <textarea 
                      className="w-full bg-slate-800/50 border border-white/10 rounded-2xl p-5 text-sm focus:ring-2 focus:ring-pink-500 outline-none min-h-[140px] transition-all resize-none shadow-inner"
                      placeholder="E.g. India wins Olympics Gold..."
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                    />
                  </div>
                  <button 
                    onClick={handleGenerate} 
                    disabled={status === AppStatus.LOADING}
                    className="w-full py-5 bg-pink-600 hover:bg-pink-500 rounded-2xl font-black uppercase tracking-[0.2em] shadow-2xl shadow-pink-600/30 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {status === AppStatus.LOADING ? (
                      <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Processing...</>
                    ) : "AI Create Post"}
                  </button>
                </div>
              ) : (
                <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-2 custom-scrollbar">
                  <InputField label="Main Headline" value={newsData.headline} onChange={(v: string) => updateField('headline', v)} />
                  <InputField label="Short Story" value={newsData.description} isTextarea onChange={(v: string) => updateField('description', v)} />
                  <InputField label="Logo Text" value={newsData.logoText} onChange={(v: string) => updateField('logoText', v)} />
                  <div className="pt-4">
                    <button onClick={() => bgInputRef.current?.click()} className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">Upload BG Photo</button>
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
          {error && <div className="p-5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl text-[10px] font-black text-center uppercase tracking-widest animate-shake">{error}</div>}
        </div>

        {/* Center: Preview */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="w-full bg-[#000] border border-white/10 rounded-[3rem] p-5 shadow-3xl hover:shadow-pink-500/5 transition-all">
             <InstagramPreview ref={previewRef} data={newsData} />
          </div>
          <button 
            onClick={handleDownload}
            disabled={isDownloading}
            className="mt-10 px-16 py-6 bg-white text-black hover:bg-slate-200 rounded-2xl font-black uppercase tracking-[0.4em] shadow-3xl active:scale-95 transition-all flex items-center gap-4"
          >
            {isDownloading ? <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></span> : null}
            {isDownloading ? "SAVING..." : "Download JPEG"}
          </button>
        </div>

        {/* Right: Analytics */}
        <div className="lg:col-span-3 space-y-8">
          <div className="bg-slate-900/50 border border-white/10 p-10 rounded-[3rem] relative overflow-hidden group">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-pink-500/10 rounded-full blur-3xl group-hover:bg-pink-500/20 transition-all"></div>
            <h2 className="text-[10px] font-black mb-10 uppercase tracking-[0.4em] text-slate-500 flex items-center gap-2">
               <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
               Viral Analysis
            </h2>
            {analysis ? (
              <div className="space-y-10">
                <div className="relative">
                  <div className="text-7xl font-black text-white leading-none tracking-tighter mb-2">{analysis.engagementScore}%</div>
                  <div className="text-[10px] font-black uppercase text-pink-500 tracking-widest">Viral Probability</div>
                </div>
                
                <div className="space-y-4">
                  <div className="text-[10px] font-black uppercase text-slate-600 tracking-widest">Top Hashtags</div>
                  <div className="flex flex-wrap gap-2">
                    {analysis.hashtags.map((h, i) => (
                      <span key={i} className="text-[10px] px-3 py-2 bg-slate-800 rounded-xl border border-white/5 text-pink-400 font-black hover:scale-110 transition-transform cursor-default">#{h}</span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-20 flex flex-col items-center opacity-10">
                <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                <p className="text-[10px] font-black uppercase tracking-widest">Generate to see stats</p>
              </div>
            )}
          </div>

          {/* Quick Help Links */}
          <div className="p-8 bg-indigo-600/5 border border-indigo-500/10 rounded-[2.5rem] space-y-4">
             <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                Deploy Center
             </h4>
             <button onClick={() => setShowVercelGuide(true)} className="w-full flex items-center justify-between text-[11px] font-bold text-slate-400 hover:text-white group">
                <span>See Dashboard Image</span>
                <span className="group-hover:translate-x-1 transition-all">→</span>
             </button>
             <div className="h-[1px] bg-white/5"></div>
             <a href="https://vercel.com/dashboard" target="_blank" className="w-full flex items-center justify-between text-[11px] font-bold text-slate-400 hover:text-white group">
                <span>Open Vercel Site</span>
                <span className="opacity-40">↗</span>
             </a>
          </div>
        </div>
      </main>
    </div>
  );
}

const InputField = ({ label, value, onChange, isTextarea = false }: any) => (
  <div className="space-y-1.5">
    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">{label}</label>
    {isTextarea ? (
      <textarea className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs focus:ring-1 focus:ring-pink-500 outline-none min-h-[100px] transition-all" value={value} onChange={(e) => onChange(e.target.value)} />
    ) : (
      <input className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs focus:ring-1 focus:ring-pink-500 outline-none transition-all" value={value} onChange={(e) => onChange(e.target.value)} />
    )}
  </div>
);

export default App;
