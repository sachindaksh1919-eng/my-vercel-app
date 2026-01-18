
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
    // Check if API key is present in the environment
    if (!process.env.API_KEY || process.env.API_KEY === "Aapki Gemini Key") {
      setIsApiConfigured(false);
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
      setError("Download failed. Take a screenshot.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleGenerate = useCallback(async () => {
    if (!isApiConfigured) {
      return setError("Vercel Settings mein 'API_KEY' set karein tabhi AI chalega!");
    }
    if (!topic.trim()) return setError("Kuch likhein tabhi AI banayega!");
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
      setError("AI Generation failed. Check your API Key and Network.");
      setStatus(AppStatus.ERROR);
    }
  }, [topic, isApiConfigured]);

  const updateField = (field: keyof NewsPostData, value: string) => {
    setNewsData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white selection:bg-pink-500/30 font-['Inter'] pb-20">
      {/* System Status Bar */}
      <div className="bg-slate-900/80 border-b border-white/5 px-6 py-3 flex justify-between items-center backdrop-blur-md">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isApiConfigured ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-red-500 animate-pulse'}`}></span>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              {isApiConfigured ? 'AI Engine: Active' : 'AI Engine: Setup Required'}
            </span>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Environment: Production</span>
          </div>
        </div>
        <div className="text-[10px] font-black text-pink-500 uppercase tracking-widest">Version 1.0.2 Pro</div>
      </div>

      {/* Header */}
      <header className="w-full py-8 px-6 md:px-12 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl">
             <span className="font-black text-white text-2xl">NI</span>
          </div>
          <div>
            <h1 className="text-2xl font-black italic tracking-tighter uppercase leading-none">News<span className="text-pink-500">Insight</span></h1>
            <p className="text-[10px] font-bold text-slate-500 tracking-[0.2em] mt-1">AI-POWERED HINDI NEWS EDITOR</p>
          </div>
        </div>

        {!isApiConfigured && (
          <a 
            href="https://vercel.com/dashboard" 
            target="_blank" 
            className="bg-red-600/10 border border-red-500/30 text-red-500 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all"
          >
            Fix API Key In Vercel
          </a>
        )}
      </header>

      {/* Main UI */}
      <main className="max-w-7xl mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Control Panel */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900/50 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl backdrop-blur-xl">
            <div className="flex border-b border-white/10">
              <button onClick={() => setActiveTab('ai')} className={`flex-1 py-6 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'ai' ? 'text-pink-500 bg-white/5' : 'text-slate-500 hover:text-white'}`}>AI Generate</button>
              <button onClick={() => setActiveTab('edit')} className={`flex-1 py-6 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'edit' ? 'text-pink-500 bg-white/5' : 'text-slate-500 hover:text-white'}`}>Manual Edit</button>
            </div>
            
            <div className="p-8">
              {activeTab === 'ai' ? (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Viral Topic</label>
                    <textarea 
                      className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-sm focus:ring-2 focus:ring-pink-500 outline-none min-h-[140px] transition-all resize-none"
                      placeholder="E.g. India's Mars Mission Success..."
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
                    ) : "Generate Post"}
                  </button>
                </div>
              ) : (
                <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                  <InputField label="Hindi Headline" value={newsData.headline} onChange={(v: string) => updateField('headline', v)} />
                  <InputField label="News Summary" value={newsData.description} isTextarea onChange={(v: string) => updateField('description', v)} />
                  <InputField label="Social Handle" value={newsData.username} onChange={(v: string) => updateField('username', v)} />
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
          {error && <div className="p-5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl text-[10px] font-black text-center uppercase tracking-widest">{error}</div>}
        </div>

        {/* Preview Area */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="w-full bg-[#000] border border-white/10 rounded-[3rem] p-5 shadow-3xl hover:border-pink-500/30 transition-all group">
             <div className="relative">
                <InstagramPreview ref={previewRef} data={newsData} />
                <div className="absolute inset-0 pointer-events-none border-[12px] border-black/5 rounded-lg"></div>
             </div>
          </div>
          
          <button 
            onClick={handleDownload}
            disabled={isDownloading}
            className="mt-10 group relative px-16 py-6 overflow-hidden rounded-2xl transition-all active:scale-95"
          >
            <div className="absolute inset-0 bg-white group-hover:bg-slate-200 transition-colors"></div>
            <span className="relative text-black font-black uppercase tracking-[0.4em] flex items-center gap-4">
              {isDownloading ? <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></span> : null}
              {isDownloading ? "Processing..." : "Export as PNG"}
            </span>
          </button>
          <p className="mt-4 text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">High Resolution 3x Export</p>
        </div>

        {/* Analytics & Stats */}
        <div className="lg:col-span-3 space-y-8">
          <div className="bg-slate-900/50 border border-white/10 p-10 rounded-[3rem] relative overflow-hidden group">
            <h2 className="text-[10px] font-black mb-10 uppercase tracking-[0.4em] text-slate-500 flex items-center gap-2">
               Intelligence Report
            </h2>
            {analysis ? (
              <div className="space-y-10">
                <div className="relative">
                  <div className="text-7xl font-black text-white leading-none tracking-tighter mb-2">{analysis.engagementScore}%</div>
                  <div className="text-[10px] font-black uppercase text-pink-500 tracking-widest">Engagement Potential</div>
                </div>
                
                <div className="space-y-4">
                  <div className="text-[10px] font-black uppercase text-slate-600 tracking-widest">Trending Tags</div>
                  <div className="flex flex-wrap gap-2">
                    {analysis.hashtags.map((h, i) => (
                      <span key={i} className="text-[10px] px-3 py-2 bg-slate-800/80 rounded-xl border border-white/5 text-pink-400 font-black">#{h}</span>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                   <p className="text-[10px] text-slate-400 italic">"{analysis.summary}"</p>
                </div>
              </div>
            ) : (
              <div className="py-20 flex flex-col items-center opacity-20">
                <div className="w-16 h-16 rounded-full border-2 border-dashed border-slate-500 flex items-center justify-center mb-4">
                   <span className="text-2xl">✨</span>
                </div>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-center">AI analysis will appear here after generation</p>
              </div>
            )}
          </div>

          <div className="p-8 bg-gradient-to-br from-indigo-600/10 to-transparent border border-white/5 rounded-[2.5rem]">
             <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4">Quick Tip</h4>
             <p className="text-[10px] text-slate-500 leading-relaxed">
               For better engagement, use strong emotional keywords in Hindi like 'अतुलनीय', 'सावधान' or 'खुशखबरी'.
             </p>
          </div>
        </div>
      </main>

      {/* Footer Branding */}
      <footer className="mt-20 border-t border-white/5 py-10 text-center">
         <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.5em]">Sachin Kumar • 2024</p>
      </footer>
    </div>
  );
}

const InputField = ({ label, value, onChange, isTextarea = false }: any) => (
  <div className="space-y-1.5">
    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">{label}</label>
    {isTextarea ? (
      <textarea className="w-full bg-black/30 border border-white/10 rounded-2xl p-4 text-xs focus:ring-1 focus:ring-pink-500 outline-none min-h-[100px] transition-all" value={value} onChange={(e) => onChange(e.target.value)} />
    ) : (
      <input className="w-full bg-black/30 border border-white/10 rounded-2xl p-4 text-xs focus:ring-1 focus:ring-pink-500 outline-none transition-all" value={value} onChange={(e) => onChange(e.target.value)} />
    )}
  </div>
);

export default App;
