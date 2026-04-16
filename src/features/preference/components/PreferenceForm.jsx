import { useState } from 'react';
import { X, CheckSquare, Square } from 'lucide-react';
import { usePreferenceStore } from '../store/usePreferenceStore';

export default function PreferenceForm() {
    const { preferences, updatePreference, toggleArrayItem, addArrayItem, removeArrayItem } = usePreferenceStore();

    const [mustGoInput, setMustGoInput] = useState('');
    const [mustAvoidInput, setMustAvoidInput] = useState('');

    const styleOptions = ['맛집', '카페', '관광', '휴식', '사진스팟', '쇼핑', '액티비티'];
    const timeOptions = ['오전', '오후', '저녁'];

    const handleAddTag = (e, type) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const value = type === 'go' ? mustGoInput.trim() : mustAvoidInput.trim();
            if (!value) return;

            if (type === 'go') {
                addArrayItem('mustGo', value);
                setMustGoInput('');
            } else {
                addArrayItem('mustAvoid', value);
                setMustAvoidInput('');
            }
        }
    };

    return (
        <div className="flex flex-col h-full bg-white relative">
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                <div className="max-w-2xl mx-auto flex flex-col gap-10 pb-8">

                    <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-900 text-base font-bold">예산 범위 (1인 기준)</span>
                            <span className="text-blue-600 text-base font-bold">
                                {preferences.budget >= 1000000 ? '100만원+' : `${(preferences.budget / 10000).toLocaleString()}만원 이하`}
                            </span>
                        </div>
                        <div className="flex flex-col gap-2">
                            <input
                                type="range"
                                min="50000"
                                max="1000000"
                                step="10000"
                                value={preferences.budget}
                                onChange={(e) => updatePreference('budget', Number(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                            <div className="flex justify-between text-gray-400 text-xs font-medium px-1">
                                <span>5만원</span>
                                <span>50만원</span>
                                <span>100만원+</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        <span className="text-gray-900 text-base font-bold">여행 스타일 (다중 선택)</span>
                        <div className="flex flex-wrap gap-2">
                            {styleOptions.map(style => {
                                const isActive = preferences.styles.includes(style);
                                return (
                                    <button
                                        key={style}
                                        onClick={() => toggleArrayItem('styles', style)}
                                        className={`px-5 py-2.5 rounded-full text-sm font-medium transition-colors ${isActive
                                            ? 'bg-gray-900 text-white'
                                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                                            }`}
                                    >
                                        {style}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex gap-6">
                        <div className="flex-1 flex flex-col gap-4">
                            <span className="text-gray-900 text-base font-bold">꼭 가고 싶은 장소/요소</span>
                            <div className="flex flex-col gap-3">
                                <input
                                    type="text"
                                    value={mustGoInput}
                                    onChange={(e) => setMustGoInput(e.target.value)}
                                    onKeyDown={(e) => handleAddTag(e, 'go')}
                                    placeholder="입력 후 Enter를 눌러주세요"
                                    className="w-full px-4 py-3 bg-gray-50 rounded-md border border-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                                <div className="flex flex-wrap gap-2">
                                    {preferences.mustGo.map(tag => (
                                        <div key={tag} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-md border border-blue-100">
                                            <span className="text-xs font-medium">{tag}</span>
                                            <button onClick={() => removeArrayItem('mustGo', tag)} className="hover:text-blue-900">
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 flex flex-col gap-4">
                            <span className="text-gray-900 text-base font-bold">피하고 싶은 장소/요소</span>
                            <div className="flex flex-col gap-3">
                                <input
                                    type="text"
                                    value={mustAvoidInput}
                                    onChange={(e) => setMustAvoidInput(e.target.value)}
                                    onKeyDown={(e) => handleAddTag(e, 'avoid')}
                                    placeholder="입력 후 Enter를 눌러주세요"
                                    className="w-full px-4 py-3 bg-gray-50 rounded-md border border-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
                                />
                                <div className="flex flex-wrap gap-2">
                                    {preferences.mustAvoid.map(tag => (
                                        <div key={tag} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 rounded-md border border-red-100">
                                            <span className="text-xs font-medium">{tag}</span>
                                            <button onClick={() => removeArrayItem('mustAvoid', tag)} className="hover:text-red-900">
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        <span className="text-gray-900 text-base font-bold">주요 활동 시간대</span>
                        <div className="flex gap-6">
                            {timeOptions.map(time => {
                                const isActive = preferences.activeTimes.includes(time);
                                return (
                                    <label key={time} className="flex items-center gap-2 cursor-pointer group">
                                        <button onClick={() => toggleArrayItem('activeTimes', time)} className="focus:outline-none">
                                            {isActive ? (
                                                <CheckSquare size={20} className="text-blue-600" />
                                            ) : (
                                                <Square size={20} className="text-gray-300 group-hover:text-gray-400" />
                                            )}
                                        </button>
                                        <span className="text-gray-700 text-base font-medium">{time}</span>
                                    </label>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        <span className="text-gray-900 text-base font-bold">추가로 자유롭게 적기</span>
                        <textarea
                            value={preferences.freeText}
                            onChange={(e) => updatePreference('freeText', e.target.value)}
                            placeholder="예: 뚜벅이 여행이라 이동 동선이 짧았으면 좋겠어요. 숙소는 꼭 바다가 보이는 곳으로!"
                            className="w-full h-32 p-4 bg-gray-50 rounded-md border border-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300 resize-none placeholder:text-gray-400"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}