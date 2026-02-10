import { useState, useEffect } from 'react';
import { Search, MapPin, Youtube, Heart, Eye, X, Plus, Trash2, Copy, Check, ExternalLink, Settings, ArrowRight, ListPlus } from 'lucide-react';
import { ScrollArea } from './components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { searchVideos, type SearchParams, type VideoItem, formatDuration, formatViewCount } from './services/youtube';

type SortOption = 'relevance' | 'date' | 'viewCount' | 'rating';
type DurationOption = 'any' | 'long' | 'medium' | 'short';
type DateOption = 'any' | 'today' | 'week' | 'month' | 'year';

function App() {
    const [apiKey, setApiKey] = useState(() => localStorage.getItem('youtube_api_key') || '');
    const [showApiKeyModal, setShowApiKeyModal] = useState(false);

    const [query, setQuery] = useState('');
    const [results, setResults] = useState<VideoItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [nextPageToken, setNextPageToken] = useState<string | undefined>();

    // Filters
    const [sortBy, setSortBy] = useState<SortOption>('relevance');
    const [duration, setDuration] = useState<DurationOption>('any');
    const [uploadDate, setUploadDate] = useState<DateOption>('any');

    // Curated List
    const [curatedList, setCuratedList] = useState<VideoItem[]>([]);
    const [copied, setCopied] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    useEffect(() => {
        if (apiKey) localStorage.setItem('youtube_api_key', apiKey);
    }, [apiKey]);

    const handleSearch = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!query.trim()) return;
        if (!apiKey) {
            setShowApiKeyModal(true);
            return;
        }

        setLoading(true);
        setError('');

        try {
            let publishedAfter;
            const now = new Date();
            if (uploadDate === 'today') {
                publishedAfter = new Date(now.setDate(now.getDate() - 1)).toISOString();
            } else if (uploadDate === 'week') {
                publishedAfter = new Date(now.setDate(now.getDate() - 7)).toISOString();
            } else if (uploadDate === 'month') {
                publishedAfter = new Date(now.setMonth(now.getMonth() - 1)).toISOString();
            } else if (uploadDate === 'year') {
                publishedAfter = new Date(now.setFullYear(now.getFullYear() - 1)).toISOString();
            }

            const params: SearchParams = {
                q: query,
                apiKey,
                order: sortBy,
                videoDuration: duration === 'any' ? undefined : duration,
                publishedAfter,
                maxResults: 24,
            };

            const data = await searchVideos(params);
            setResults(data.items);
            setNextPageToken(data.nextPageToken);
        } catch (err) {
            setError('Failed to fetch videos. Check your API Key or try again.');
        } finally {
            setLoading(false);
            setHasSearched(true);
        }
    };

    const fetchMoreVideos = async (mode: 'append' | 'replace') => {
        if (!query.trim() || !apiKey || !nextPageToken) return;

        setLoading(true);
        setError('');

        try {
            let publishedAfter;
            const now = new Date();
            if (uploadDate === 'today') {
                publishedAfter = new Date(now.setDate(now.getDate() - 1)).toISOString();
            } else if (uploadDate === 'week') {
                publishedAfter = new Date(now.setDate(now.getDate() - 7)).toISOString();
            } else if (uploadDate === 'month') {
                publishedAfter = new Date(now.setMonth(now.getMonth() - 1)).toISOString();
            } else if (uploadDate === 'year') {
                publishedAfter = new Date(now.setFullYear(now.getFullYear() - 1)).toISOString();
            }

            const params: SearchParams = {
                q: query,
                apiKey,
                order: sortBy,
                videoDuration: duration === 'any' ? undefined : duration,
                publishedAfter,
                maxResults: 24,
                pageToken: nextPageToken,
            };

            const data = await searchVideos(params);

            if (mode === 'append') {
                setResults((prev) => [...prev, ...data.items]);
            } else {
                setResults(data.items);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }

            setNextPageToken(data.nextPageToken);
        } catch (err) {
            setError('Failed to fetch more videos.');
        } finally {
            setLoading(false);
        }
    };

    const handleLoadMore = () => fetchMoreVideos('append');
    const handleNextPage = () => fetchMoreVideos('replace');

    // Auto-search when filters change
    useEffect(() => {
        if (query.trim() && !loading && hasSearched) {
            handleSearch();
        }
    }, [sortBy, duration, uploadDate]);

    const addToCurated = (video: VideoItem) => {
        if (!curatedList.find(v => v.id === video.id)) {
            setCuratedList([...curatedList, video]);
        }
    };

    const removeFromCurated = (id: string) => {
        setCuratedList(curatedList.filter(v => v.id !== id));
    };

    const clearCuratedList = () => {
        if (window.confirm('목록을 정말 비우시겠습니까?')) {
            setCuratedList([]);
        }
    };

    const copyToClipboard = () => {
        const text = curatedList.map(v => v.url).join('\n');
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="min-h-screen bg-[#0f0f12] text-white font-sans selection:bg-indigo-500/30">

            {/* Header */}
            <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0f0f12]/80 backdrop-blur-xl">
                <div className="w-full max-w-[1800px] mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="bg-gradient-to-tr from-indigo-500 to-purple-500 p-2 rounded-lg">
                            <MapPin className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                            유튜브 큐레이터
                        </span>
                    </div>

                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowApiKeyModal(true)}
                            className={clsx("text-xs gap-2", !apiKey && "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20")}
                        >
                            <Settings className="w-4 h-4" />
                            {apiKey ? 'API 키 설정됨' : 'API 키 설정'}
                        </Button>
                        <a href="https://notebooklm.google.com/" target="_blank" rel="noreferrer">
                            <Button variant="outline" size="sm" className="gap-2 border-white/10 hover:bg-white/5">
                                <ExternalLink className="w-4 h-4" />
                                NotebookLM 열기
                            </Button>
                        </a>
                    </div>
                </div>
            </header>

            <main className="w-full max-w-[1800px] mx-auto px-6 py-8 flex gap-8">

                {/* Left Side: Search & Results */}
                <div className="flex-1 space-y-8">

                    {/* Search Bar */}
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                        <form onSubmit={handleSearch} className="relative flex gap-2 bg-[#18181b] p-2 rounded-xl border border-white/10 shadow-2xl">
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="여행지, 맛집, 브이로그 검색... (예: 도쿄 여행 2024)"
                                    className="w-full bg-transparent border-none text-white placeholder-gray-500 pl-12 pr-4 h-12 focus:ring-0 focus:outline-none"
                                />
                            </div>
                            <Button type="submit" size="lg" className="rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white px-8">
                                {loading ? '검색 중...' : '검색'}
                            </Button>
                        </form>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-wrap gap-4 p-4 bg-[#18181b]/50 rounded-xl border border-white/5 backdrop-blur-sm">
                        <div className="space-y-1">
                            <label className="text-xs text-gray-400 ml-1">정렬 기준</label>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as SortOption)}
                                className="block w-40 bg-[#0f0f12] border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 outline-none"
                            >
                                <option value="relevance">관련순</option>
                                <option value="date">최신순</option>
                                <option value="viewCount">조회수순</option>
                                <option value="rating">좋아요순</option>
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs text-gray-400 ml-1">영상 길이</label>
                            <select
                                value={duration}
                                onChange={(e) => setDuration(e.target.value as DurationOption)}
                                className="block w-40 bg-[#0f0f12] border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 outline-none"
                            >
                                <option value="any">모든 길이</option>
                                <option value="short">짧은 영상 (&lt; 4분)</option>
                                <option value="medium">중간 영상 (4-20분)</option>
                                <option value="long">긴 영상 (&gt; 20분)</option>
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs text-gray-400 ml-1">업로드 시기</label>
                            <select
                                value={uploadDate}
                                onChange={(e) => setUploadDate(e.target.value as DateOption)}
                                className="block w-40 bg-[#0f0f12] border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 outline-none"
                            >
                                <option value="any">전체</option>
                                <option value="today">오늘</option>
                                <option value="week">이번 주</option>
                                <option value="month">이번 달</option>
                                <option value="year">올해</option>
                            </select>
                        </div>
                    </div>

                    {/* Results Grid */}
                    {error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-center">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {results.map((video) => (
                            <motion.div
                                key={video.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="group relative bg-[#18181b] rounded-xl overflow-hidden border border-white/5 hover:border-indigo-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10"
                            >
                                <div className="aspect-video relative overflow-hidden">
                                    <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-xs font-medium">
                                        {formatDuration(video.duration || '')}
                                    </div>
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <a href={video.url} target="_blank" rel="noreferrer" className="p-2 bg-white/20 hover:bg-white/40 rounded-full backdrop-blur-md transition-colors">
                                            <ExternalLink className="w-5 h-5" />
                                        </a>
                                        <button onClick={() => addToCurated(video)} className="p-2 bg-indigo-600 hover:bg-indigo-700 rounded-full text-white shadow-lg transition-colors">
                                            <Plus className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                                <div className="p-4 space-y-3">
                                    <h3 className="font-semibold line-clamp-2 leading-tight group-hover:text-indigo-400 transition-colors">
                                        {video.title}
                                    </h3>
                                    <div className="flex items-center gap-2 text-xs text-gray-400">
                                        <span>{video.channelTitle}</span>
                                        <span>•</span>
                                        <span>{new Date(video.publishedAt).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                        <div className="flex items-center gap-1">
                                            <Eye className="w-3 h-3" />
                                            {formatViewCount(video.viewCount || '0')}
                                        </div>
                                        {video.likeCount && (
                                            <div className="flex items-center gap-1">
                                                <Heart className="w-3 h-3" />
                                                {formatViewCount(video.likeCount)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}

                        {!loading && results.length === 0 && !error && (
                            <div className="col-span-full h-64 flex flex-col items-center justify-center text-gray-500 border border-dashed border-white/10 rounded-xl">
                                <Youtube className="w-12 h-12 mb-4 opacity-20" />
                                <p>{hasSearched ? "검색 결과가 없습니다." : "검색어를 입력하여 여행 아이디어를 찾아보세요."}</p>
                            </div>
                        )}
                        {results.length > 0 && nextPageToken && (
                            <div className="col-span-full flex flex-col sm:flex-row justify-center gap-4 mt-8 pb-8">
                                <Button
                                    onClick={handleLoadMore}
                                    disabled={loading}
                                    variant="outline"
                                    className="gap-2 border-white/10 hover:bg-white/5 text-white px-8 py-6 text-lg hover:text-indigo-400 transition-colors flex-1 sm:flex-none"
                                >
                                    {loading ? (
                                        '로딩 중...'
                                    ) : (
                                        <>
                                            <ListPlus className="w-5 h-5" />
                                            더 보기 (현재 목록에 추가)
                                        </>
                                    )}
                                </Button>
                                <Button
                                    onClick={handleNextPage}
                                    disabled={loading}
                                    variant="outline"
                                    className="gap-2 border-white/10 hover:bg-white/5 text-white px-8 py-6 text-lg hover:text-indigo-400 transition-colors flex-1 sm:flex-none"
                                >
                                    {loading ? (
                                        '로딩 중...'
                                    ) : (
                                        <>
                                            <ArrowRight className="w-5 h-5" />
                                            다음 페이지 (새로 고침)
                                        </>
                                    )}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Sidebar: Curated List */}
                <div className="w-80 shrink-0">
                    <div className="sticky top-24 space-y-4">
                        <div className="bg-[#18181b] rounded-xl border border-white/10 overflow-hidden shadow-2xl flex flex-col h-[calc(100vh-120px)]">
                            <div className="p-4 border-b border-white/5 bg-gradient-to-br from-[#18181b] to-indigo-950/30 flex justify-between items-start shrink-0">
                                <div>
                                    <h2 className="font-semibold flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                                        큐레이션 목록 ({curatedList.length})
                                    </h2>
                                    <p className="text-xs text-gray-400 mt-1">NotebookLM에 추가할 영상들</p>
                                </div>
                                {curatedList.length > 0 && (
                                    <button
                                        onClick={clearCuratedList}
                                        className="text-xs text-gray-400 hover:text-red-400 flex items-center gap-1.5 transition-colors hover:bg-red-500/10 px-2 py-1 rounded-md border border-transparent hover:border-red-500/20"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        비우기
                                    </button>
                                )}
                            </div>

                            <ScrollArea className="flex-1 p-2">
                                <div className="space-y-2 pr-3">
                                    <AnimatePresence>
                                        {curatedList.map((video) => (
                                            <motion.div
                                                key={video.id}
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="flex gap-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 group"
                                            >
                                                <img src={video.thumbnail} alt="" className="w-20 h-12 object-cover rounded bg-black shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-xs font-medium line-clamp-2">{video.title}</h4>
                                                    <div className="flex justify-between items-center mt-1">
                                                        <span className="text-[10px] text-gray-500">{formatDuration(video.duration || '')}</span>
                                                        <button
                                                            onClick={() => removeFromCurated(video.id)}
                                                            className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>

                                    {curatedList.length === 0 && (
                                        <div className="py-8 text-center text-xs text-gray-500">
                                            여기에 영상을 추가하세요
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>

                            <div className="p-4 border-t border-white/5 bg-[#18181b] shrink-0 space-y-4">
                                <div>
                                    <Button
                                        onClick={copyToClipboard}
                                        disabled={curatedList.length === 0}
                                        className={clsx(
                                            "w-full gap-2 transition-all",
                                            copied ? "bg-green-500 hover:bg-green-600" : "bg-indigo-600 hover:bg-indigo-700"
                                        )}
                                    >
                                        {copied ? (
                                            <>
                                                <Check className="w-4 h-4" />
                                                복사 완료!
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="w-4 h-4" />
                                                모든 URL 복사
                                            </>
                                        )}
                                    </Button>
                                    <p className="text-[10px] text-gray-500 text-center mt-2">
                                        NotebookLM에 URL들을 붙여넣어<br />여행 일정을 계획하세요.
                                    </p>
                                </div>

                                {/* NotebookLM Instructions - Moving inside the sidebar footer area for better space usage */}
                                <div className="p-3 rounded-lg bg-indigo-500/5 border border-indigo-500/10">
                                    <h3 className="text-[10px] font-semibold text-indigo-300 mb-1.5 flex items-center gap-1.5">
                                        <ExternalLink className="w-3 h-3" /> NotebookLM 활용
                                    </h3>
                                    <ol className="text-[10px] text-gray-400 space-y-1 list-decimal list-inside leading-relaxed">
                                        <li>영상 추가 후 <span className="text-white">URL 복사</span></li>
                                        <li>NotebookLM <span className="text-white">소스 추가</span></li>
                                        <li><span className="text-white">여행 일정 요청</span>하기</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* API Key Modal */}
            {showApiKeyModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-[#18181b] w-full max-w-md rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
                    >
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-white">YouTube API 키 설정</h3>
                                <button onClick={() => setShowApiKeyModal(false)} className="text-gray-500 hover:text-white">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <p className="text-sm text-gray-400">
                                    YouTube 영상을 검색하려면 Google Cloud YouTube Data API v3 키가 필요합니다.
                                </p>
                                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                                    <p className="text-xs text-amber-500 mb-1 font-semibold">보안 안내</p>
                                    <p className="text-xs text-amber-200/70">
                                        이 키는 브라우저 메모리에만 저장되며 다른 서버로 전송되지 않습니다.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-gray-300">API 키</label>
                                    <Input
                                        value={apiKey}
                                        onChange={(e) => setApiKey(e.target.value)}
                                        placeholder="AIzaSy..."
                                        className="bg-black/50 border-white/10 text-white font-mono text-xs"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="p-6 pt-0 flex justify-end">
                            <Button onClick={() => setShowApiKeyModal(false)} className="bg-indigo-600 hover:bg-indigo-700">
                                저장 및 계속
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    )
}

export default App
