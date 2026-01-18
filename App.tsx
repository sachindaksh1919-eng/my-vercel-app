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
  const [isDownloading, setIsDownloading] = useState(false);
  const [isApiConfigured, setIsApiConfigured] = useState(true);
  
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
    // Check if API_KEY is set in process.env (passed via Vite define)
    const key = process.env.API_KEY;
    if (!key || key === "" || key === "undefined") {
      setIsApiConfigured(false);
    } else {
      setIsApiConfigured(true);
    }
  }, []);

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
      setError("Download failed. Please try a manual screenshot.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleGenerate = useCallback(async () => {
    if (!isApiConfigured) {
      setError("Vercel Settings mein 'API_KEY' add karna zaroori hai!");
      return;
    }
    if (!topic.trim()) {
      setError("Kuch topic likhein!");
      return;
    }

    setStatus(AppStatus.LOADING);
    setError(null);
    try {
      const result = await generateNewsContent(topic);
      const imageUrl = await generatePostImage(topic);
      
      setNewsData(prev => ({
        ...prev,
        ...result.newsData,
        imageUrl,
        date: new Date().toLocaleDateString('hi-IN', { day: 'numeric', month: 'long', year: 'numeric' })
      }));
      setAnalysis(result.analysis);
      setStatus(AppStatus.SUCCESS);
      setActiveTab('edit');
    } catch (err: any) {
      console.error(err);
      setError("AI failed to generate. Check your API Key in Vercel.");
      setStatus(AppStatus.ERROR);
    }
  }, [topic, isApiConfigured]);

  const updateField = (field: keyof NewsPostData, value: string) => {
    setNewsData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white selection:bg-pink-500/30 font-['Inter'] pb-20">
      {/* System Status Bar */}
      <div className="bg-slate-900/80 border-b border-white/5 px-6 py-3 flex justify-between items-center backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isApiConfigured ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]' : 'bg-red-500 animate-pulse'}`}></span>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">
              {isApiConfigured ? 'AI Engine: Online' : 'AI Engine: Offline (Check Key)'}
            </span>
          </div>
        </div>
        {!isApiConfigured && (
           <span className="text-[9px] bg-red-500/20 text-red-400 px-3 py-1 rounded-full border border-red-500/30 animate-pulse font-bold">
             SETUP API_KEY IN VERCEL SETTINGS
           </span>
        )}
      </div>

      {/* Header */}
      <header className="w-full py-8 px-6 md:px-12 flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl rotate-3">
             <span className="font-black text-white text-2xl -rotate-3">NI</span>
          </div>
          <div>
            <h1 className="text-2xl font-black italic tracking-tighter uppercase leading-none">News<span className="text-pink-500">Insight</span></h1>
            <p className="text-[10px] font-bold text-slate-500 tracking-[0.2em] mt-1 uppercase">Professional AI News Editor</p>
          </div>
        </div>
      </header>

      {/* Main UI */}
      <main className="max-w-7xl mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Control Panel */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900/50 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl backdrop-blur-xl">
            <div className="flex border-b border-white/10">
              <button 
                onClick={() => setActiveTab('ai')} 
                className={`flex-1 py-6 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'ai' ? 'text-pink-500 bg-white/5 border-b-2 border-pink-500' : 'text-slate-500 hover:text-white'}`}
              >
                AI Generator
              </button>
              <button 
                onClick={() => setActiveTab('edit')} 
                className={`flex-1 py-6 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'edit' ? 'text-pink-500 bg-white/5 border-b-2 border-pink-500' : 'text-slate-500 hover:text-white'}`}
              >
                Manual Edit
              </button>
            </div>
            
            <div className="p-8">
              {activeTab === 'ai' ? (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Viral Topic / News Story</label>
                    <textarea 
                      className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-sm focus:ring-2 focus:ring-pink-500 outline-none min-h-[140px] transition-all resize-none"
                      placeholder="E.g. India makes history at the Olympics with 3 Gold Medals..."
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
                      <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Generating...</>
                    ) : "Generate AI Post"}
                  </button>
                </div>
              ) : (
                <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                  <InputField label="Hindi Headline" value={newsData.headline} onChange={(v: string) => updateField('headline', v)} />
                  <InputField label="News Summary (Hindi)" value={newsData.description} isTextarea onChange={(v: string) => updateField('description', v)} />
                  <InputField label="Username / Handle" value={newsData.username} onChange={(v: string) => updateField('username', v)} />
                  <InputField label="Badge Text" value={newsData.badge} onChange={(v: string) => updateField('badge', v)} />
                  <div className="pt-4">
                    <button onClick={() => bgInputRef.current?.click()} className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">Upload Custom Image</button>
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
          {error && (
            <div className="p-5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl text-[10px] font-black text-center uppercase tracking-widest animate-shake">
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* Preview Area */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="w-full bg-[#000] border border-white/10 rounded-[3rem] p-5 shadow-3xl hover:border-pink-500/30 transition-all group relative">
             <InstagramPreview ref={previewRef} data={newsData} />
             <div className="absolute top-8 left-8 w-4 h-4 bg-red-500 rounded-full animate-pulse border-2 border-black z-20"></div>
          </div>
          
          <button 
            onClick={handleDownload}
            disabled={isDownloading}
            className="mt-10 group relative px-16 py-6 overflow-hidden rounded-2xl transition-all active:scale-95 shadow-xl hover:shadow-pink-500/20"
          >
            <div className="absolute inset-0 bg-white group-hover:bg-slate-200 transition-colors"></div>
            <span className="relative text-black font-black uppercase tracking-[0.4em] flex items-center gap-4">
              {isDownloading ? <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></span> : null}
              {isDownloading ? "Capturing..." : "Save Post (PNG)"}
            </span>
          </button>
          <p className="mt-4 text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">Ready for Instagram / WhatsApp</p>
        </div>

        {/* Analytics & Stats */}
        <div className="lg:col-span-3 space-y-8">
          <div className="bg-slate-900/50 border border-white/10 p-10 rounded-[3rem] relative overflow-hidden group min-h-[300px]">
            <h2 className="text-[10px] font-black mb-10 uppercase tracking-[0.4em] text-slate-500 flex items-center gap-2">
               Content Analysis
            </h2>
            {analysis ? (
              <div className="space-y-10">
                <div className="relative">
                  <div className="text-7xl font-black text-white leading-none tracking-tighter mb-2">{analysis.engagementScore}%</div>
                  <div className="text-[10px] font-black uppercase text-pink-500 tracking-widest">Viral Probability</div>
                </div>
                
                <div className="space-y-4">
                  <div className="text-[10px] font-black uppercase text-slate-600 tracking-widest">Auto Hashtags</div>
                  <div className="flex flex-wrap gap-2">
                    {analysis.hashtags.map((h, i) => (
                      <span key={i} className="text-[10px] px-3 py-2 bg-slate-800/80 rounded-xl border border-white/5 text-pink-400 font-black">#{h}</span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-20 flex flex-col items-center opacity-20">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-center">Waiting for AI generation...</p>
              </div>
            )}
          </div>

          <div className="p-8 bg-gradient-to-br from-pink-600/10 to-transparent border border-white/5 rounded-[2.5rem]">
             <h4 className="text-[10px] font-black text-pink-400 uppercase tracking-widest mb-4">Pro Insight</h4>
             <p className="text-[10px] text-slate-400 leading-relaxed">
               Always use "ब्रेकिंग न्यूज़" for urgent updates to increase user click-through rate.
             </p>
          </div>
        </div>
      </main>

      {/* Footer Branding */}
      <footer className="mt-20 border-t border-white/5 py-10 text-center">
         <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.5em]">Developed by Sachin Kumar • Pro v1.0</p>
      </footer>
    </div>
  );
}

const InputField = ({ label, value, onChange, isTextarea = false }: any) => (
  <div className="space-y-1.5">
    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">{label}</label>
    {isTextarea ? (
      <textarea 
        className="w-full bg-black/30 border border-white/10 rounded-2xl p-4 text-xs focus:ring-1 focus:ring-pink-500 outline-none min-h-[100px] transition-all" 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
      />
    ) : (
      <input 
        className="w-full bg-black/30 border border-white/10 rounded-2xl p-4 text-xs focus:ring-1 focus:ring-pink-500 outline-none transition-all" 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
      />
    )}
  </div>
);

export default App;