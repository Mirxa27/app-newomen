import React, { useState } from 'react';
import { BookOpenText, Sparkles, Moon, Stars } from 'lucide-react';

const ANSWERS = [
  "命中注定如此。",
  "耐心等待时机。",
  "相信你的直觉。",
  "答案就在眼前。",
  "需要重新思考。",
  "时机尚未成熟。",
  "全力以赴。",
  "保持开放心态。",
  "不要犹豫。",
  "静观其变。",
  "机会即将到来。",
  "放下执念。",
  "继续前行。",
  "改变方向。",
  "答案在你心中。",
  "等待更好时机。",
  "勇敢尝试。",
  "相信缘分。",
  "随心而行。",
  "保持希望。"
];

function App() {
  const [answer, setAnswer] = useState<string>("");
  const [isAnimating, setIsAnimating] = useState(false);

  const getAnswer = () => {
    setIsAnimating(true);
    setAnswer("");
    
    setTimeout(() => {
      const randomAnswer = ANSWERS[Math.floor(Math.random() * ANSWERS.length)];
      setAnswer(randomAnswer);
      setIsAnimating(false);
    }, 1000 + Math.random() * 1000);
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* 背景图层 */}
      <div 
        className="absolute inset-0 bg-gradient-to-b from-[#0f172a] via-[#1e1b4b] to-[#3b0764]"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=2400&q=80')`,
          backgroundBlendMode: 'soft-light',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      
      {/* 星星装饰 */}
      <div className="absolute inset-0">
        <Stars className="absolute top-20 left-[20%] w-6 h-6 text-amber-200/30 animate-pulse" />
        <Stars className="absolute top-40 right-[30%] w-4 h-4 text-amber-200/20 animate-pulse delay-300" />
        <Moon className="absolute bottom-32 left-[15%] w-8 h-8 text-amber-200/20 animate-pulse delay-500" />
        <Stars className="absolute bottom-20 right-[25%] w-5 h-5 text-amber-200/30 animate-pulse delay-700" />
      </div>

      {/* 主要内容 */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          {/* 标题区域 */}
          <div className="text-center mb-16">
            <div className="flex justify-center mb-8 relative">
              <div className="absolute inset-0 animate-spin-slow opacity-30 blur-sm">
                <BookOpenText className="w-24 h-24 text-amber-300" />
              </div>
              <BookOpenText className="w-24 h-24 text-amber-300 relative z-10" />
            </div>
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/30 to-purple-500/30 blur-xl"></div>
              <h1 className="relative text-6xl font-bold mb-4 font-serif">
                <span className="absolute -inset-2 bg-gradient-to-r from-amber-500/20 to-purple-500/20 blur-lg"></span>
                <span className="relative text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-300 to-amber-200 animate-shimmer">
                  答案之书
                </span>
              </h1>
            </div>
            <p className="text-amber-100/80 text-xl tracking-[0.2em] mt-6 animate-float">
              静心凝思，寻求启示
            </p>
          </div>

          {/* 主卡片 */}
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/20 to-purple-500/20 rounded-lg blur-sm"></div>
            <div className="relative bg-black/30 backdrop-blur-xl rounded-lg p-8 shadow-2xl border border-amber-200/20">
              <div className="text-center mb-8">
                <p className="text-amber-100/90 mb-4 tracking-wide leading-relaxed">
                  在心中默想你的问题，点击下方按钮寻求答案
                </p>
              </div>

              {/* 按钮区域 */}
              <div className="flex justify-center mb-8">
                <button
                  onClick={getAnswer}
                  disabled={isAnimating}
                  className={`
                    group relative flex items-center gap-3 px-8 py-4
                    bg-gradient-to-r from-amber-500/80 to-amber-600/80
                    hover:from-amber-400 hover:to-amber-500
                    text-white rounded-full font-medium tracking-wide
                    transform transition-all duration-300
                    ${isAnimating ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 hover:shadow-amber-500/25 hover:shadow-lg'}
                  `}
                >
                  <Sparkles className="w-5 h-5 transition-transform group-hover:scale-110" />
                  <span className="relative">
                    探寻命定之言
                    <span className="absolute inset-x-0 bottom-0 h-px bg-white/40 transform scale-x-0 group-hover:scale-x-100 transition-transform"></span>
                  </span>
                </button>
              </div>

              {/* 答案区域 */}
              <div className={`
                min-h-[120px] flex items-center justify-center
                text-2xl font-medium text-center
                transition-all duration-500 ease-out
                ${isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}
              `}>
                {answer && (
                  <p className="animate-fade-in">
                    <span className="block text-amber-200/40 text-lg mb-2">✧</span>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-400">
                      『{answer}』
                    </span>
                    <span className="block text-amber-200/40 text-lg mt-2">✧</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 底部文字 */}
          <div className="text-center mt-8">
            <p className="text-amber-200/40 text-sm tracking-widest">
              聆听内心，寻求真知
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;