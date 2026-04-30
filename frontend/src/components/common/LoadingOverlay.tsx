import { Loader2 } from 'lucide-react';

interface LoadingOverlayProps {
    text?: string;
}

export default function LoadingOverlay({ text = "데이터를 불러오는 중입니다..." }: LoadingOverlayProps) {
    return (
        // 화면(또는 부모 요소) 전체를 덮고 뒤를 살짝 흐리게 만듭니다.
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/60 backdrop-blur-[2px]">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
            <span className="text-sm font-bold text-gray-700">{text}</span>
        </div>
    );
}